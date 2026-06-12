/**
 * 用户行为监控模块 - 日志流式版
 * 功能：
 * 1. 持续记录鼠标轨迹、击键等行为数据（每秒多次采样）
 * 2. SQLite 本地存储，平衡存储与上传时间
 * 3. 设备硬件信息与浏览器指纹提取
 * 4. 检测用户失活/页面失焦，自动触发注销
 */

import { ipcMain, BrowserWindow, screen, powerMonitor } from 'electron'
import { initDatabase } from './activityDatabase'
import { deviceFingerprint } from './deviceFingerprint'

class ActivityMonitor {
    constructor(config = {}) {
        this.config = {
            // 采样配置
            sampleRates: {
                mouse: 100,           // 鼠标轨迹采样间隔（毫秒），每秒10次
                keyboard: 100,        // 键盘统计采样间隔（毫秒），每秒10次
                scroll: 100,          // 滚动采样间隔（毫秒）
            },
            // 批次配置
            batch: {
                saveInterval: 2 * 60 * 1000,          // 本地存储周期（毫秒），每2分钟存入数据库
                uploadInterval: 3 * 60 * 1000,        // 上传周期（毫秒），每3分钟尝试上传
                maxBatchRecords: 10000,                // 单批次最大记录数
            },
            // 超时配置
            inactivityTimeout: 16 * 60 * 1000,      // 失活超时时间
            inactivityCheckInterval: 1000,          // 失活检测间隔（毫秒）
            // API 配置
            api: {
                reportUrl: '/api/activity/report',
                timeoutUrl: '/api/auth/timeout',
                logoutUrl: '/api/auth/logout',
                deviceBindUrl: '/api/device/bind'
            },
            ...config
        }

        // 会话信息
        this.session = {
            sessionId: null,
            userId: null,
            userName: null,
            deviceId: null,
            fingerprint: null,
            startTime: null,
            lastActivityTime: null,
        }

        // 实时行为缓冲区（用于计算频率）
        this.realtimeBuffer = {
            mouseEvents: [],          // 实时鼠标事件 [{x, y, type, timestamp}]
            keyEvents: [],            // 实时按键事件 [{key, type, timestamp}]
            scrollEvents: [],         // 实时滚动事件 [{deltaY, deltaX, timestamp}]
            clickEvents: [],         // 点击事件 [{x, y, button, timestamp}]
        }

        // 批次行为数据（积累后批量存储/上传）
        this.batchData = {
            records: [],             // 行为记录序列
            currentSequence: 0,      // 当前序列号
            sessionStats: {
                totalMouseMoves: 0,
                totalClicks: 0,
                totalKeyPresses: 0,
                totalScrolls: 0,
                activeTime: 0,
                inactiveTime: 0,
            }
        }

        // 失活检测
        this.activityState = {
            isActive: true,
            inactivityStartTime: null,
            windowFocused: true,
        }

        // 定时器
        this.timers = {
            mouse: null,
            keyboard: null,
            inactivity: null,
            batchReport: null,
            upload: null,
        }

        // 状态
        this.isMonitoring = false
        this.isLoggedIn = false  // 新增：登录状态
        this.mainWindow = null
        this.db = null
        this.eventIdCounter = 0

        // 绑定方法
        this.handleMouseMove = this.handleMouseMove.bind(this)
        this.handleKeyPress = this.handleKeyPress.bind(this)
        this.handleMouseClick = this.handleMouseClick.bind(this)
        this.handleScroll = this.handleScroll.bind(this)
        this.handleWindowFocus = this.handleWindowFocus.bind(this)
        this.handleWindowBlur = this.handleWindowBlur.bind(this)
    }

    /**
     * 初始化监控模块
     */
    async init(window, userInfo = {}) {
        this.mainWindow = window

        // 初始化数据库
        try {
            this.db = initDatabase()
            console.log('[ActivityMonitor] 数据库初始化成功')
        } catch (error) {
            console.error('[ActivityMonitor] 数据库初始化失败:', error)
        }

        // 获取设备指纹
        const deviceInfo = deviceFingerprint.getFullFingerprint()
        this.session.fingerprint = deviceInfo.fingerprint

        // 保存设备信息
        if (this.db) {
            const savedDevice = this.db.saveDeviceInfo({
                userId: userInfo.id,
                fingerprint: deviceInfo.fingerprint,
                hardwareInfo: deviceInfo.hardwareInfo,
                browserInfo: deviceInfo.browserInfo
            })
            this.session.deviceId = savedDevice.deviceId
        }

        // 创建会话
        this.session.sessionId = this.generateSessionId()
        this.session.startTime = Date.now()
        this.session.userId = userInfo.id
        this.session.userName = userInfo.name
        this.session.lastActivityTime = Date.now()

        // 初始化批次数据
        this.initBatchData()

        // 数据库保存会话
        if (this.db) {
            this.db.createSession({
                sessionId: this.session.sessionId,
                userId: userInfo.id,
                userName: userInfo.name,
                deviceId: this.session.deviceId,
                fingerprint: deviceInfo.fingerprint,
                startTime: this.session.startTime
            })
        }

        // 通知渲染进程
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('device:info', {
                deviceId: this.session.deviceId,
                fingerprint: this.session.fingerprint,
                summary: deviceFingerprint.getSummary()
            })
        }

        this.setupWindowListeners()
        this.setupSystemListeners()

        console.log('[ActivityMonitor] 初始化完成，sessionId:', this.session.sessionId)
    }

    /**
     * 启动监控
     */
    start() {
        if (this.isMonitoring) return

        this.isMonitoring = true
        this.startSamplingTimers()
        // 失活检测定时器由 setLoginState 控制，按需启动
        if (this.isLoggedIn && !this.timers.inactivity) {
            this.startInactivityCheck()
        }
        this.startBatchReport()

        console.log('[ActivityMonitor] 监控已启动')
    }

    /**
     * 停止监控
     */
    stop() {
        if (!this.isMonitoring) return

        this.isMonitoring = false
        this.isLoggedIn = false  // 重置登录状态
        this.stopSamplingTimers()
        this.stopInactivityCheck()

        // 保存当前批次数据
        this.flushBatchData()

        console.log('[ActivityMonitor] 监控已停止')
    }

    /**
     * 重置监控
     */
    async reset(userInfo = {}) {
        // 保存当前会话
        if (this.isMonitoring) {
            this.reportLogout('relogin')
        }

        this.stop()

        // 重置会话
        this.session = {
            sessionId: null,
            userId: null,
            userName: null,
            deviceId: null,
            fingerprint: null,
            startTime: null,
            lastActivityTime: null,
        }

        this.resetBuffers()
        this.initBatchData()

        // 重新初始化
        await this.init(this.mainWindow, userInfo)
        this.start()
    }

    // ==================== 采样定时器 ====================

    startSamplingTimers() {
        const rates = this.config.sampleRates

        // 鼠标采样定时器
        this.timers.mouse = setInterval(() => {
            this.sampleMousePosition()
        }, rates.mouse)

        // 键盘采样定时器
        this.timers.keyboard = setInterval(() => {
            this.sampleKeyboardState()
        }, rates.keyboard)

        console.log('[ActivityMonitor] 采样定时器已启动', rates)
    }

    stopSamplingTimers() {
        if (this.timers.mouse) {
            clearInterval(this.timers.mouse)
            this.timers.mouse = null
        }
        if (this.timers.keyboard) {
            clearInterval(this.timers.keyboard)
            this.timers.keyboard = null
        }
    }

    /**
     * 采样鼠标位置
     */
    sampleMousePosition() {
        if (!this.isMonitoring) return

        try {
            const pos = screen.getCursorScreenPoint()
            const now = Date.now()

            const event = {
                id: ++this.eventIdCounter,
                type: 'move',
                x: pos.x,
                y: pos.y,
                timestamp: now
            }

            this.realtimeBuffer.mouseEvents.push(event)
            this.batchData.sessionStats.totalMouseMoves++

            // 限制缓冲区大小
            if (this.realtimeBuffer.mouseEvents.length > 1000) {
                this.realtimeBuffer.mouseEvents = this.realtimeBuffer.mouseEvents.slice(-500)
            }

        } catch (error) {
            console.error('[ActivityMonitor] 采样鼠标位置失败:', error)
        }
    }

    /**
     * 采样键盘状态（记录当前按键序列）
     */
    sampleKeyboardState() {
        if (!this.isMonitoring) return

        const now = Date.now()
        const recentKeys = this.realtimeBuffer.keyEvents.filter(k => now - k.timestamp < 2000)

        // 统计最近2秒内的按键次数
        if (recentKeys.length > 0) {
            this.batchData.sessionStats.totalKeyPresses += recentKeys.length
            this.realtimeBuffer.keyEvents = []
        }
    }

    // ==================== 事件处理 ====================

    handleMouseMove(event) {
        if (!this.isMonitoring) return

        const now = Date.now()
        const pos = screen.getCursorScreenPoint()

        const eventData = {
            id: ++this.eventIdCounter,
            type: 'move',
            x: pos.x,
            y: pos.y,
            timestamp: now,
            interval: this.session.lastActivityTime ? now - this.session.lastActivityTime : 0
        }

        this.realtimeBuffer.mouseEvents.push(eventData)
        this.batchData.sessionStats.totalMouseMoves++
        this.recordActivity(now)
    }

    handleKeyPress(event) {
        if (!this.isMonitoring) return

        const now = Date.now()

        const eventData = {
            id: ++this.eventIdCounter,
            key: event.key || 'unknown',
            code: event.code || '',
            type: event.type || 'keydown',
            timestamp: now,
            // 计算与上次按键的时间间隔
            interval: this.realtimeBuffer.keyEvents.length > 0
                ? now - this.realtimeBuffer.keyEvents[this.realtimeBuffer.keyEvents.length - 1].timestamp
                : 0
        }

        this.realtimeBuffer.keyEvents.push(eventData)
        this.batchData.sessionStats.totalKeyPresses++
        this.recordActivity(now)
    }

    handleMouseClick(event) {
        if (!this.isMonitoring) return

        const now = Date.now()
        const pos = screen.getCursorScreenPoint()

        const eventData = {
            id: ++this.eventIdCounter,
            type: 'click',
            x: pos.x,
            y: pos.y,
            button: event.button || 0,
            timestamp: now
        }

        this.realtimeBuffer.clickEvents.push(eventData)
        this.realtimeBuffer.mouseEvents.push(eventData)
        this.batchData.sessionStats.totalClicks++
        this.recordActivity(now)
    }

    handleScroll(event) {
        if (!this.isMonitoring) return

        const now = Date.now()

        const eventData = {
            id: ++this.eventIdCounter,
            deltaX: event.deltaX || 0,
            deltaY: event.deltaY || 0,
            timestamp: now
        }

        this.realtimeBuffer.scrollEvents.push(eventData)
        this.batchData.sessionStats.totalScrolls++
        this.recordActivity(now)
    }

    handleWindowFocus() {
        if (!this.isMonitoring) return

        this.activityState.windowFocused = true
        this.activityState.isActive = true
        this.activityState.inactivityStartTime = null

        if (this.activityState.lastActiveEnd) {
            this.batchData.sessionStats.inactiveTime += Date.now() - this.activityState.lastActiveEnd
        }

        console.log('[ActivityMonitor] 窗口获得焦点')
    }

    handleWindowBlur() {
        if (!this.isMonitoring) return

        this.activityState.windowFocused = false
        this.activityState.lastActiveEnd = Date.now()

        console.log('[ActivityMonitor] 窗口失去焦点')
    }

    handleSystemIdle(isIdle) {
        if (!this.isMonitoring) return

        if (isIdle) {
            this.activityState.isActive = false
            console.log('[ActivityMonitor] 系统进入空闲状态')
        } else {
            this.activityState.isActive = true
            this.activityState.inactivityStartTime = null
            console.log('[ActivityMonitor] 系统恢复活动')
        }
    }

    // ==================== 失活检测 ====================

    startInactivityCheck() {
        this.timers.inactivity = setInterval(() => {
            this.checkInactivity()
        }, this.config.inactivityCheckInterval)
    }

    stopInactivityCheck() {
        if (this.timers.inactivity) {
            console.log('[ActivityMonitor] 清除失活检测定时器')
            clearInterval(this.timers.inactivity)
            this.timers.inactivity = null
        }
        // 重置失活状态
        this.activityState.inactivityStartTime = null
        console.log('[ActivityMonitor] 失活状态已重置，inactivityStartTime = null')
    }

    /**
     * 设置登录状态
     * @param {boolean} isLoggedIn - 是否已登录
     * @param {object} userInfo - 用户信息（可选）
     */
    setLoginState(isLoggedIn, userInfo = null) {
        const wasLoggedIn = this.isLoggedIn
        this.isLoggedIn = isLoggedIn

        if (isLoggedIn) {
            // 登录时：重置失活状态，开始计时
            this.activityState.inactivityStartTime = null
            this.activityState.isActive = true
            this.activityState.windowFocused = true

            // 如果有新的用户信息，更新会话
            if (userInfo && userInfo.id) {
                this.session.userId = userInfo.id
                this.session.userName = userInfo.name
            }

            // 启动失活检测
            if (!this.timers.inactivity) {
                this.startInactivityCheck()
            }

            console.log('[ActivityMonitor] 登录状态已设置，开始计时')
        } else {
            // 登出时：停止计时
            this.stopInactivityCheck()
            console.log('[ActivityMonitor] 登录状态已重置，停止计时')
        }
    }

    checkInactivity() {
        // 只有在登录状态下才进行失活检测
        if (!this.isMonitoring || !this.isLoggedIn) return

        const now = Date.now()
        const inactiveThreshold = this.config.inactivityTimeout

        if (this.activityState.inactivityStartTime === null) {
            // 检测是否开始失活
            if (!this.activityState.windowFocused || !this.activityState.isActive) {
                this.activityState.inactivityStartTime = now
            }
        } else {
            // 检查失活时长
            const inactiveDuration = now - this.activityState.inactivityStartTime

            if (inactiveDuration >= inactiveThreshold) {
                this.handleInactivityTimeout(inactiveDuration)
            }
        }

        // 窗口失焦时累加失活时间
        if (!this.activityState.windowFocused && this.session.lastActivityTime) {
            // 已在 handleWindowBlur 中统计
        }
    }

    handleInactivityTimeout(duration) {
        if (!this.isMonitoring) return

        console.log('[ActivityMonitor] 检测到用户失活超时:', duration, 'ms')

        this.isMonitoring = false
        this.isLoggedIn = false  // 重置登录状态
        this.stopSamplingTimers()
        this.stopInactivityCheck()  // 停止失活检测定时器

        // 保存会话结束
        if (this.db && this.session.sessionId) {
            this.db.endSession(this.session.sessionId, 'inactivity')
        }

        // 发送超时事件
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('auth:timeout', {
                sessionId: this.session.sessionId,
                inactivityDuration: duration,
                lastActivityTime: this.session.lastActivityTime
            })
        }

        console.log('[ActivityMonitor] 超时处理完成')
    }

    recordActivity(timestamp) {
        this.session.lastActivityTime = timestamp
        this.activityState.inactivityStartTime = null

        if (!this.activityState.windowFocused) {
            this.batchData.sessionStats.inactiveTime += timestamp - (this.activityState.lastActiveEnd || timestamp)
            this.activityState.lastActiveEnd = null
        }

        this.batchData.sessionStats.activeTime +=
            timestamp - (this.session.lastActivityTime || timestamp)
    }

    // ==================== 批次处理 ====================

    startBatchReport() {
        // 定时保存批次数据到数据库（每2分钟）
        this.timers.batchSave = setInterval(() => {
            this.saveBatchData()
        }, this.config.batch.saveInterval)

        // 定时上传待处理数据（每6分钟）
        this.timers.batchUpload = setInterval(() => {
            this.uploadPendingData()
        }, this.config.batch.uploadInterval)
    }

    initBatchData() {
        this.batchData = {
            records: [],
            currentSequence: 0,
            lastSaveTime: Date.now(),
            sessionStats: {
                totalMouseMoves: 0,
                totalClicks: 0,
                totalKeyPresses: 0,
                totalScrolls: 0,
                activeTime: 0,
                inactiveTime: 0,
            }
        }
    }

    resetBuffers() {
        this.realtimeBuffer = {
            mouseEvents: [],
            keyEvents: [],
            scrollEvents: [],
            clickEvents: [],
        }
    }

    /**
     * 保存批次数据到数据库
     */
    saveBatchData() {
        if (!this.db || !this.isMonitoring) return

        const now = Date.now()
        // 计算这个批次的时间范围（从上次保存到现在，或从会话开始到现在）
        const batchStartTime = this.batchData.lastSaveTime || this.session.startTime || now
        const duration = now - batchStartTime

        // 如果这批次没有活动数据，跳过保存
        const totalEvents = this.batchData.sessionStats.totalMouseMoves +
            this.batchData.sessionStats.totalKeyPresses +
            this.batchData.sessionStats.totalScrolls

        if (totalEvents === 0) {
            this.batchData.lastSaveTime = now
            return
        }

        // 创建批次记录
        const batchRecord = {
            id: ++this.batchData.currentSequence,
            sessionId: this.session.sessionId,
            userId: this.session.userId,
            deviceId: this.session.deviceId,
            fingerprint: this.session.fingerprint,
            startTime: batchStartTime,
            endTime: now,
            duration: duration,
            // 统计数据
            stats: { ...this.batchData.sessionStats },
            // 轨迹序列（压缩存储）
            mouseTrajectory: this.compressTrajectory(this.realtimeBuffer.mouseEvents),
            keySequence: this.compressKeySequence(this.realtimeBuffer.keyEvents),
            scrollSequence: this.realtimeBuffer.scrollEvents.map(e => ({
                dY: e.deltaY,
                dX: e.deltaX,
                t: e.timestamp
            })),
            // 频率统计（每秒）
            frequencies: this.calculateFrequencies(),
            // 状态
            windowFocused: this.activityState.windowFocused,
            uploaded: false,
            createdAt: now
        }

        // 限制序列长度
        if (batchRecord.mouseTrajectory.length > this.config.batch.maxBatchRecords) {
            batchRecord.mouseTrajectory = batchRecord.mouseTrajectory.slice(-this.config.batch.maxBatchRecords)
        }

        try {
            // 保存到数据库
            const recordId = this.db.saveBatchRecord(batchRecord)

            console.log('[ActivityMonitor] 保存批次数据:', {
                recordId,
                sequence: batchRecord.id,
                mouseEvents: batchRecord.mouseTrajectory.length,
                keyEvents: batchRecord.keySequence.length,
                activeTime: batchRecord.stats.activeTime
            })

            // 重置缓冲区统计
            this.batchData.sessionStats = {
                totalMouseMoves: 0,
                totalClicks: 0,
                totalKeyPresses: 0,
                totalScrolls: 0,
                activeTime: 0,
                inactiveTime: 0,
            }
            // 更新最后保存时间
            this.batchData.lastSaveTime = now
            this.resetBuffers()

            // 通知渲染进程
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('activity:batch-saved', {
                    recordId,
                    stats: batchRecord.stats
                })
            }

        } catch (error) {
            console.error('[ActivityMonitor] 保存批次数据失败:', error)
        }
    }

    /**
     * 压缩鼠标轨迹
     */
    compressTrajectory(events) {
        if (!events || events.length === 0) return []

        return events.map(e => ({
            i: e.id,
            x: e.x,
            y: e.y,
            t: e.timestamp,
            ty: e.type || 'move'
        }))
    }

    /**
     * 压缩按键序列
     */
    compressKeySequence(events) {
        if (!events || events.length === 0) return []

        return events.map(e => ({
            k: e.key,
            c: e.code,
            t: e.timestamp,
            iv: e.interval
        }))
    }

    /**
     * 计算频率统计
     */
    calculateFrequencies() {
        const duration = this.batchData.sessionStats.activeTime +
            this.batchData.sessionStats.inactiveTime

        if (duration <= 0) return { mousePerSec: 0, keyPerSec: 0, clickPerSec: 0 }

        const durationSec = duration / 1000

        return {
            mousePerSec: (this.batchData.sessionStats.totalMouseMoves / durationSec).toFixed(2),
            keyPerSec: (this.batchData.sessionStats.totalKeyPresses / durationSec).toFixed(2),
            clickPerSec: (this.batchData.sessionStats.totalClicks / durationSec).toFixed(2),
            scrollPerSec: (this.batchData.sessionStats.totalScrolls / durationSec).toFixed(2)
        }
    }

    /**
     * 刷新当前批次数据
     */
    flushBatchData() {
        this.saveBatchData()
    }

    /**
     * 上传待处理数据
     */
    async uploadPendingData() {
        if (!this.db) return

        try {
            const pending = this.db.getUnuploadedRecords(50)

            if (pending.length === 0) return

            console.log(`[ActivityMonitor] 开始上传 ${pending.length} 条待处理记录`)

            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                // 将数据转换为后端期望的格式 { data: [...] }
                const uploadPayload = {
                    data: pending.map(record => ({
                        type: 'activity_batch',
                        content: {
                            batchId: record.batch_id,
                            sessionId: record.session_id,
                            userId: record.user_id,
                            deviceId: record.device_id,
                            stats: record.stats ? JSON.parse(record.stats) : {},
                            frequencies: record.frequencies ? JSON.parse(record.frequencies) : {},
                            mouseCount: record.mouse_count || 0,
                            keyCount: record.key_count || 0
                        },
                        metadata: {
                            createdAt: record.created_at,
                            duration: record.duration,
                            startTime: record.start_time,
                            endTime: record.end_time
                        }
                    }))
                }
                this.mainWindow.webContents.send('activity:upload-batch', uploadPayload)
            }

        } catch (error) {
            console.error('[ActivityMonitor] 上传待处理数据失败:', error)
        }
    }

    /**
     * 上报注销
     */
    reportLogout(type = 'manual') {
        if (!this.db || !this.session.sessionId) return

        try {
            this.db.endSession(this.session.sessionId, type)

            const logoutData = {
                sessionId: this.session.sessionId,
                userId: this.session.userId,
                deviceId: this.session.deviceId,
                fingerprint: this.session.fingerprint,
                logoutType: type,
                sessionDuration: Date.now() - this.session.startTime,
                stats: this.batchData.sessionStats,
                reportType: 'logout'
            }

            this.db.addToUploadQueue('logout', 0, logoutData)

        } catch (error) {
            console.error('[ActivityMonitor] 保存注销记录失败:', error)
        }
    }

    // ==================== 事件监听 ====================

    setupWindowListeners() {
        if (!this.mainWindow) return

        this.mainWindow.on('focus', this.handleWindowFocus)
        this.mainWindow.on('blur', this.handleWindowBlur)

        this.mainWindow.webContents.on('input-event', (event, type, details) => {
            if (!this.isMonitoring) return

            switch (type) {
                case 'keyDown':
                    this.handleKeyPress(details)
                    break
                case 'mouseMoved':
                    this.handleMouseMove(details)
                    break
                case 'mouseClicked':
                    this.handleMouseClick(details)
                    break
                case 'scroll':
                    this.handleScroll(details)
                    break
            }
        })
    }

    setupSystemListeners() {
        powerMonitor.on('active', () => this.handleSystemIdle(false))
        powerMonitor.on('idle', () => this.handleSystemIdle(true))
        powerMonitor.on('lock-screen', () => this.handleWindowBlur())
        powerMonitor.on('unlock-screen', () => this.handleWindowFocus())
    }

    // ==================== 工具方法 ====================

    generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig }
    }

    getStats() {
        return {
            session: this.session,
            realtime: {
                mouseEvents: this.realtimeBuffer.mouseEvents.length,
                keyEvents: this.realtimeBuffer.keyEvents.length,
                scrollEvents: this.realtimeBuffer.scrollEvents.length,
            },
            batch: {
                records: this.batchData.records.length,
                stats: this.batchData.sessionStats,
            },
            activity: this.activityState,
            database: this.db ? this.db.getStats() : null
        }
    }

    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            sessionId: this.session.sessionId,
            deviceId: this.session.deviceId,
            fingerprint: this.session.fingerprint,
            lastActivityTime: this.session.lastActivityTime,
            windowFocused: this.activityState.windowFocused,
            isActive: this.activityState.isActive,
            realtimeStats: {
                mouseEvents: this.realtimeBuffer.mouseEvents.length,
                keyEvents: this.realtimeBuffer.keyEvents.length
            }
        }
    }

    getDeviceInfo() {
        return {
            deviceId: this.session.deviceId,
            fingerprint: this.session.fingerprint
        }
    }
}

// 导出单例
let monitorInstance = null

export function createActivityMonitor(config = {}) {
    monitorInstance = new ActivityMonitor(config)
    return monitorInstance
}

export function getActivityMonitor() {
    return monitorInstance
}

export default ActivityMonitor
