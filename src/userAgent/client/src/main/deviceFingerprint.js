/**
 * 设备指纹与硬件信息提取模块
 * 用于在用户登录时获取并绑定设备信息
 */

import { ipcMain, BrowserWindow, screen, app } from 'electron'
import os from 'os'
import crypto from 'crypto'

class DeviceFingerprint {
    constructor() {
        this.cachedFingerprint = null
        this.cachedHardwareInfo = null
        this.cachedBrowserInfo = null
    }

    /**
     * 获取完整设备指纹
     * @returns {object} 包含 fingerprint, hardwareInfo, browserInfo
     */
    getFullFingerprint() {
        if (this.cachedFingerprint) {
            return {
                fingerprint: this.cachedFingerprint,
                hardwareInfo: this.cachedHardwareInfo,
                browserInfo: this.cachedBrowserInfo
            }
        }

        const hardwareInfo = this.getHardwareInfo()
        const browserInfo = this.getBrowserInfo()

        // 组合所有信息生成指纹
        const fingerprint = this.generateFingerprint(hardwareInfo, browserInfo)

        // 缓存结果
        this.cachedFingerprint = fingerprint
        this.cachedHardwareInfo = hardwareInfo
        this.cachedBrowserInfo = browserInfo

        return { fingerprint, hardwareInfo, browserInfo }
    }

    /**
     * 获取硬件信息
     */
    getHardwareInfo() {
        const cpus = os.cpus()
        const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown'
        const cpuSpeed = cpus.length > 0 ? cpus[0].speed : 0

        return {
            platform: os.platform(),
            arch: os.arch(),
            osRelease: os.release(),
            osType: os.type(),
            hostname: os.hostname(),
            cpuModel: cpuModel,
            cpuCores: cpus.length,
            cpuSpeed: cpuSpeed,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            memoryInfo: {
                total: this.formatBytes(os.totalmem()),
                free: this.formatBytes(os.freemem()),
                used: this.formatBytes(os.totalmem() - os.freemem())
            },
            screenInfo: this.getScreenInfo(),
            systemUptime: os.uptime(),
            nodeVersion: process.versions.node,
            electronVersion: process.versions.electron,
            chromeVersion: process.versions.chrome
        }
    }

    /**
     * 获取屏幕信息
     */
    getScreenInfo() {
        const displays = screen.getAllDisplays()
        const primaryDisplay = screen.getPrimaryDisplay()

        return {
            displayCount: displays.length,
            primary: {
                width: primaryDisplay.size.width,
                height: primaryDisplay.size.height,
                workArea: primaryDisplay.workArea,
                scaleFactor: primaryDisplay.scaleFactor,
                rotation: primaryDisplay.rotation,
                touchSupport: primaryDisplay.touchSupport
            },
            allDisplays: displays.map(d => ({
                id: d.id,
                bounds: d.bounds,
                workArea: d.workArea,
                scaleFactor: d.scaleFactor,
                rotation: d.rotation,
                touchSupport: d.touchSupport,
                internal: d.internal
            })),
            // 可用几何信息
            totalWidth: Math.max(...displays.map(d => d.bounds.x + d.bounds.width)),
            totalHeight: Math.max(...displays.map(d => d.bounds.y + d.bounds.height))
        }
    }

    /**
     * 获取浏览器/Electron 信息
     */
    getBrowserInfo() {
        return {
            appName: app.getName(),
            appVersion: app.getVersion(),
            appPath: app.getAppPath(),
            userDataPath: app.getPath('userData'),
            locale: app.getLocale(),
            isPackaged: app.isPackaged,
            electronVersion: process.versions.electron,
            chromeVersion: process.versions.chrome,
            nodeVersion: process.versions.node,
            v8Version: process.versions.v8,
            commandLineArgs: this.getSanitizedCommandLine()
        }
    }

    /**
     * 获取清理后的命令行参数（移除敏感信息）
     */
    getSanitizedCommandLine() {
        const sensitiveFlags = [
            '--password', '--pwd', '--secret', '--token', '--key',
            '--auth', '--credential', '--private', '--sandbox'
        ]

        return process.argv
            .filter(arg => !sensitiveFlags.some(flag => arg.toLowerCase().includes(flag)))
            .map(arg => {
                // 隐藏参数值
                if (arg.startsWith('--')) {
                    const equalIndex = arg.indexOf('=')
                    if (equalIndex > 0) {
                        return arg.substring(0, equalIndex + 1) + '***'
                    }
                }
                return arg
            })
    }

    /**
     * 生成设备指纹
     */
    generateFingerprint(hardwareInfo, browserInfo) {
        const components = [
            hardwareInfo.platform,
            hardwareInfo.arch,
            hardwareInfo.hostname,
            hardwareInfo.cpuModel,
            hardwareInfo.cpuCores,
            hardwareInfo.totalMemory,
            hardwareInfo.screenInfo.primary.width,
            hardwareInfo.screenInfo.primary.height,
            hardwareInfo.screenInfo.displayCount,
            browserInfo.appName,
            browserInfo.locale
        ]

        const hash = crypto
            .createHash('sha256')
            .update(components.join('|'))
            .digest('hex')

        return `fp_${hash.substring(0, 16)}`
    }

    /**
     * 获取简短指纹（用于显示）
     */
    getShortFingerprint() {
        const full = this.getFullFingerprint()
        return full.fingerprint.substring(0, 12).toUpperCase()
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cachedFingerprint = null
        this.cachedHardwareInfo = null
        this.cachedBrowserInfo = null
    }

    /**
     * 格式化字节数
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    /**
     * 格式化运行时间
     */
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${days}d ${hours}h ${minutes}m`
    }

    /**
     * 获取设备信息摘要（用于日志显示）
     */
    getSummary() {
        const full = this.getFullFingerprint()
        return {
            fingerprint: this.getShortFingerprint(),
            platform: `${full.hardwareInfo.osType} (${full.hardwareInfo.arch})`,
            hostname: full.hardwareInfo.hostname,
            cpu: `${full.hardwareInfo.cpuModel} x${full.hardwareInfo.cpuCores}`,
            memory: full.hardwareInfo.memoryInfo.total,
            screen: `${full.hardwareInfo.screenInfo.primary.width}x${full.hardwareInfo.screenInfo.primary.height}`,
            displays: full.hardwareInfo.screenInfo.displayCount,
            electron: full.browserInfo.electronVersion,
            locale: full.browserInfo.locale
        }
    }
}

// 浏览器指纹（在渲染进程中提取）
class BrowserFingerprintExtractor {
    constructor() {
        this.ipcChannels = {
            'fingerprint:getHardware': () => this.getHardwareInfoRenderer(),
            'fingerprint:getBrowser': () => this.getBrowserInfoRenderer(),
            'fingerprint:getFull': () => this.getFullFingerprintRenderer(),
            'fingerprint:getCanvas': () => this.getCanvasFingerprint(),
            'fingerprint:getWebgl': () => this.getWebglFingerprint(),
            'fingerprint:getFonts': () => this.getInstalledFonts()
        }
    }

    /**
     * 注册 IPC 处理程序
     */
    registerIpcHandlers() {
        Object.entries(this.ipcChannels).forEach(([channel, handler]) => {
            ipcMain.handle(channel, handler)
        })
    }

    /**
     * 获取渲染进程硬件信息
     */
    getHardwareInfoRenderer() {
        return {
            devicePixelRatio: window.devicePixelRatio,
            maxTouchPoints: navigator.maxTouchPoints,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory || 'unknown',
            screenDetails: this.getScreenDetails(),
            language: navigator.language,
            languages: navigator.languages,
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            batteryStatus: this.getBatteryInfo()
        }
    }

    /**
     * 获取屏幕详情
     */
    getScreenDetails() {
        if (window.screen) {
            return {
                width: window.screen.width,
                height: window.screen.height,
                availWidth: window.screen.availWidth,
                availHeight: window.screen.availHeight,
                colorDepth: window.screen.colorDepth,
                pixelDepth: window.screen.pixelDepth
            }
        }
        return null
    }

    /**
     * 获取电池信息
     */
    async getBatteryInfo() {
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery()
                return {
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime,
                    level: battery.level
                }
            }
        } catch (e) {
            // 电池 API 不可用
        }
        return null
    }

    /**
     * 获取浏览器信息
     */
    getBrowserInfoRenderer() {
        const ua = navigator.userAgent
        const browsers = this.parseUserAgent(ua)

        return {
            userAgent: ua,
            browsers: browsers,
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            plugins: this.getPlugins(),
            mimeTypes: this.getMimeTypes(),
            webdriver: navigator.webdriver || false
        }
    }

    /**
     * 解析 UserAgent
     */
    parseUserAgent(ua) {
        const result = {}

        // Chrome
        const chromeMatch = ua.match(/Chrome\/([\d.]+)/)
        if (chromeMatch) result.chrome = chromeMatch[1]

        // Firefox
        const firefoxMatch = ua.match(/Firefox\/([\d.]+)/)
        if (firefoxMatch) result.firefox = firefoxMatch[1]

        // Safari
        const safariMatch = ua.match(/Version\/([\d.]+).*Safari/)
        if (safariMatch) result.safari = safariMatch[1]

        // Edge
        const edgeMatch = ua.match(/Edg\/([\d.]+)/)
        if (edgeMatch) result.edge = edgeMatch[1]

        // Electron
        const electronMatch = ua.match(/Electron\/([\d.]+)/)
        if (electronMatch) result.electron = electronMatch[1]

        return result
    }

    /**
     * 获取已安装插件
     */
    getPlugins() {
        const plugins = []
        for (let i = 0; i < navigator.plugins.length; i++) {
            const plugin = navigator.plugins[i]
            plugins.push({
                name: plugin.name,
                description: plugin.description,
                filename: plugin.filename,
                version: plugin.version
            })
        }
        return plugins
    }

    /**
     * 获取 MIME 类型
     */
    getMimeTypes() {
        const mimes = []
        for (let i = 0; i < navigator.mimeTypes.length; i++) {
            const mime = navigator.mimeTypes[i]
            mimes.push({
                type: mime.type,
                description: mime.description,
                suffixes: mime.suffixes
            })
        }
        return mimes
    }

    /**
     * 获取完整渲染进程指纹
     */
    getFullFingerprintRenderer() {
        return {
            hardware: this.getHardwareInfoRenderer(),
            browser: this.getBrowserInfoRenderer(),
            canvas: this.getCanvasFingerprint(),
            webgl: this.getWebglFingerprint(),
            fonts: this.getInstalledFonts(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
    }

    /**
     * 获取 Canvas 指纹
     */
    getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas')
            canvas.width = 200
            canvas.height = 50
            const ctx = canvas.getContext('2d')

            // 绘制文字
            ctx.textBaseline = 'top'
            ctx.font = '14px Arial'
            ctx.fillStyle = '#f60'
            ctx.fillRect(125, 1, 62, 20)
            ctx.fillStyle = '#069'
            ctx.fillText('Fingerprint', 2, 15)
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
            ctx.fillText('Canvas', 4, 17)

            // 获取数据 URL
            const dataUrl = canvas.toDataURL()
            const hash = crypto.createHash('md5').update(dataUrl).digest('hex')

            return {
                hash: hash,
                dataUrl: dataUrl.substring(0, 100) + '...'
            }
        } catch (e) {
            return { error: e.message }
        }
    }

    /**
     * 获取 WebGL 指纹
     */
    getWebglFingerprint() {
        try {
            const canvas = document.createElement('canvas')
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

            if (!gl) {
                return { error: 'WebGL not supported' }
            }

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')

            const result = {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
            }

            if (debugInfo) {
                result.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
                result.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            }

            // 生成哈希
            const hash = crypto.createHash('sha256')
                .update(JSON.stringify(result))
                .digest('hex')

            return { ...result, hash: hash.substring(0, 16) }
        } catch (e) {
            return { error: e.message }
        }
    }

    /**
     * 获取已安装字体
     */
    getInstalledFonts() {
        // 常见字体列表
        const testFonts = [
            'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
            'Trebuchet MS', 'Comic Sans MS', 'Impact', 'Lucida Console',
            'Tahoma', 'Helvetica', 'Calibri', 'Cambria', 'Consolas', 'Monaco'
        ]

        const baseFont = 'monospace'
        const testString = 'mmmmmmmmmmlli'
        const testSize = '72px'

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const baseWidth = ctx.measureText(testString).width

        const detected = []
        testFonts.forEach(font => {
            ctx.font = `${testSize} ${font}, ${baseFont}`
            const width = ctx.measureText(testString).width
            if (width !== baseWidth) {
                detected.push(font)
            }
        })

        return detected
    }
}

// 导出
const deviceFingerprint = new DeviceFingerprint()
const browserFingerprintExtractor = new BrowserFingerprintExtractor()

export { DeviceFingerprint, BrowserFingerprintExtractor, deviceFingerprint, browserFingerprintExtractor }
export default DeviceFingerprint
