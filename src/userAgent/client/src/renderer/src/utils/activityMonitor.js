/**
 * Electron 行为监控封装模块 - 增强版
 * 提供给渲染进程（Vue）使用的 API
 * 支持 SQLite 本地存储、批量上传
 */

import request from '@/utils/request'

class ActivityMonitorClient {
    constructor() {
        this.initialized = false
        this.deviceInfo = null
        this.reportHandlers = []
        this.timeoutHandlers = []
        this.logoutHandlers = []
        this.deviceHandlers = []

        this.setupListeners()
    }

    setupListeners() {
        if (typeof window.electronAPI === 'undefined') {
            console.warn('[ActivityMonitorClient] electronAPI 未定义，跳过监听设置')
            return
        }

        // 监听超时事件
        window.electronAPI.onTimeout((data) => {
            console.log('[ActivityMonitorClient] 收到超时事件:', data)
            this.handleTimeout(data)
        })

        // 监听行为数据上报
        window.electronAPI.onActivityReport((data) => {
            console.log('[ActivityMonitorClient] 收到行为记录:', data)
            this.handleReport(data)
        })

        // 监听批量上传请求
        window.electronAPI.onActivityUploadBatch((records) => {
            console.log('[ActivityMonitorClient] 收到批量上传请求:', records.length, '条')
            console.log('[ActivityMonitorClient] 记录详情:', JSON.stringify(records).substring(0, 500))
            this.handleBatchUpload(records)
        })

        // 监听设备信息
        window.electronAPI.onDeviceInfo((data) => {
            console.log('[ActivityMonitorClient] 收到设备信息:', data)
            this.deviceInfo = data
            this.handleDeviceInfo(data)
        })
    }

    init(userInfo) {
        if (typeof window.electronAPI === 'undefined') {
            console.warn('[ActivityMonitorClient] electronAPI 未定义')
            return
        }

        window.electronAPI.initActivityMonitor(userInfo)
        this.initialized = true
        console.log('[ActivityMonitorClient] 监控已初始化')
    }

    start() {
        if (typeof window.electronAPI === 'undefined') return
        window.electronAPI.startActivityMonitor()
        console.log('[ActivityMonitorClient] 监控已启动')
    }

    stop() {
        if (typeof window.electronAPI === 'undefined') return
        window.electronAPI.stopActivityMonitor()
        console.log('[ActivityMonitorClient] 监控已停止')
    }

    // 设置登录状态（控制失活计时）
    setLoginState(isLoggedIn, userInfo) {
        if (typeof window.electronAPI === 'undefined') return
        window.electronAPI.setLoginState(isLoggedIn, userInfo)
        console.log('[ActivityMonitorClient] 登录状态已设置:', isLoggedIn)
    }

    reset(userInfo) {
        if (typeof window.electronAPI === 'undefined') return
        window.electronAPI.resetActivityMonitor(userInfo)
        console.log('[ActivityMonitorClient] 监控已重置')
    }

    updateConfig(config) {
        if (typeof window.electronAPI === 'undefined') return
        window.electronAPI.updateActivityConfig(config)
        console.log('[ActivityMonitorClient] 配置已更新')
    }

    async getStatus() {
        if (typeof window.electronAPI === 'undefined') return null
        return await window.electronAPI.getActivityStatus()
    }

    async getStats() {
        if (typeof window.electronAPI === 'undefined') return null
        return await window.electronAPI.getActivityStats()
    }

    async getDeviceInfo() {
        if (typeof window.electronAPI === 'undefined') return null
        return await window.electronAPI.getDeviceInfo()
    }

    // ==================== 数据处理 ====================

    handleTimeout(data) {
        this.timeoutHandlers.forEach(handler => handler(data))
        // 不自动执行 performLogout，由 Vue 组件调用 timeoutLogout action 处理
        // 以避免 window.location.href 与 Vue Router 冲突
    }

    handleReport(data) {
        this.reportHandlers.forEach(handler => handler(data))
    }

    handleDeviceInfo(data) {
        this.deviceHandlers.forEach(handler => handler(data))
    }

    /**
     * 处理批量上传（打包一次上传）
     * @param {Object} payload - 主进程传来的数据，格式为 { data: [...] }
     */
    async handleBatchUpload(payload) {
        console.log('[ActivityMonitorClient] handleBatchUpload 被调用')
        console.log('[ActivityMonitorClient] 收到的 payload:', JSON.stringify(payload).substring(0, 500))

        // 支持新旧两种格式兼容
        const records = payload?.data || payload
        if (!records || records.length === 0) {
            console.log('[ActivityMonitorClient] 记录为空，跳过上传')
            return
        }

        try {
            console.log('[ActivityMonitorClient] 开始调用 uploadBatch，records 数量:', records.length)
            const result = await this.uploadBatch(records)
            console.log('[ActivityMonitorClient] uploadBatch 完成，结果:', result)
            // 上传成功后提取 batch_id 列表，通知主进程标记已上传
            const batchIds = records
                .map(record => record.content?.batchId || record.batch_id)
                .filter(Boolean)
            if (batchIds.length > 0) {
                window.electronAPI.notifyBatchUploaded(batchIds)
                console.log(`[ActivityMonitorClient] 已通知主进程标记 ${batchIds.length} 条记录为已上传`)
            }
        } catch (error) {
            console.error('[ActivityMonitorClient] 批量上传失败:', error)
        }
    }

    /**
     * 打包上传多条记录
     */
    async uploadBatch(records) {
        console.log('[ActivityMonitorClient] uploadBatch 开始，URL: /context/process')
        console.log('[ActivityMonitorClient] 请求数据条数:', records.length)
        try {
            const response = await request.post('/context/process', { data: records })
            console.log(`[ActivityMonitorClient] 批量上传成功，响应:`, response)
            return response.data
        } catch (error) {
            console.error(`[ActivityMonitorClient] 批量上传失败:`, error)
            console.error('[ActivityMonitorClient] 错误详情:', error.response?.data, error.message)
            throw error
        }
    }

    /**
     * 上报设备绑定信息
     */
    async bindDevice(deviceInfo) {
        try {
            const response = await request.post('/api/device/bind', {
                deviceId: deviceInfo.deviceId,
                fingerprint: deviceInfo.fingerprint,
                userId: deviceInfo.userId,
                platform: deviceInfo.platform,
                hostname: deviceInfo.hostname,
                cpu: deviceInfo.cpu,
                memory: deviceInfo.memory,
                screen: deviceInfo.screen,
                electronVersion: deviceInfo.electron
            })

            console.log('[ActivityMonitorClient] 设备绑定成功:', response.data)
            return response.data
        } catch (error) {
            console.error('[ActivityMonitorClient] 设备绑定失败:', error)
            throw error
        }
    }

    /**
     * 执行注销
     */
    performLogout(type) {
        if (typeof window.electronAPI !== 'undefined') {
            window.electronAPI.logoutWithReport(type)
        }

        // 保留 companyAddress，清除其他 localStorage 数据
        const savedAddress = localStorage.getItem('companyAddress')
        localStorage.clear()
        if (savedAddress) {
            localStorage.setItem('companyAddress', savedAddress)
        }

        window.location.href = '/login'
    }

    // ==================== 回调注册 ====================

    onTimeout(handler) {
        this.timeoutHandlers.push(handler)
    }

    onReport(handler) {
        this.reportHandlers.push(handler)
    }

    onLogout(handler) {
        this.logoutHandlers.push(handler)
    }

    onDeviceInfo(handler) {
        this.deviceHandlers.push(handler)
    }

    removeAllListeners() {
        if (typeof window.electronAPI !== 'undefined') {
            window.electronAPI.removeAllListeners('auth:timeout')
            window.electronAPI.removeAllListeners('activity:report')
            window.electronAPI.removeAllListeners('activity:upload-batch')
            window.electronAPI.removeAllListeners('device:info')
        }
        this.reportHandlers = []
        this.timeoutHandlers = []
        this.logoutHandlers = []
        this.deviceHandlers = []
    }
}

// 单例
const activityMonitor = new ActivityMonitorClient()

export default activityMonitor
export { ActivityMonitorClient }
