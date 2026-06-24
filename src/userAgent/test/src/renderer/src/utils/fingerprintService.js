import { getDeviceInfo as getTauriDeviceInfo, scanWifiEnvironment, getPairedBluetoothDevices } from '@/utils/tauriApi'
import activityMonitor from '@/utils/activityMonitorWrapper'

const isTauriRuntime = typeof window !== 'undefined' && window.__TAURI__ !== undefined

const hashString = async (str) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

const hashBrowserField = async (raw) => {
    const str = typeof raw === 'object' ? JSON.stringify(raw) : String(raw ?? '')
    return hashString(str)
}

const generateBrowserLayer = async () => {
    const hardwareFields = {
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        screenColorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
    }

    const softwareFields = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages?.join(','),
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
    }

    let canvasHash = ''
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
        ctx.textBaseline = 'top'
        ctx.font = "14px 'Arial'"
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = '#f60'
        ctx.fillRect(125, 1, 62, 20)
        ctx.fillStyle = '#069'
        ctx.fillText('ZTrust Device', 2, 15)
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
        ctx.fillText('ZTrust Device', 4, 17)
        canvasHash = await hashBrowserField(canvas.toDataURL())
    }

    let webglVendor = '', webglRenderer = ''
    try {
        const gl = document.createElement('canvas').getContext('webgl')
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
            if (debugInfo) {
                webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || ''
                webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''
            }
        }
    } catch (e) {
        console.warn('[FingerprintService] WebGL 指纹不可用:', e)
    }

    const softwareHash = await hashBrowserField({
        ...softwareFields,
        canvas: canvasHash,
        webglVendor,
        webglRenderer,
    })

    const hardwareHash = await hashBrowserField(hardwareFields)

    return {
        hardwareHash,
        softwareHash,
        raw: { hardwareFields, softwareFields, canvasHash, webglVendor, webglRenderer },
    }
}

export const generateBrowserFingerprint = async () => {
    const layer = await generateBrowserLayer()
    return {
        fingerprint: layer.softwareHash,
        deviceInfo: layer.raw,
        layered: {
            hardware_hash: layer.hardwareHash,
            software_hash: layer.softwareHash,
        },
    }
}

export const collectFingerprints = async () => {
    const browserFingerprint = await generateBrowserFingerprint()
    let tauriDeviceInfo = null
    let wifiEnvironment = []
    let bluetoothEnvironment = []

    if (isTauriRuntime) {
        try {
            tauriDeviceInfo = await getTauriDeviceInfo()
        } catch (error) {
            console.error('[FingerprintService] 获取 Tauri 设备信息失败:', error)
        }

        try {
            wifiEnvironment = await scanWifiEnvironment()
            console.log('[FingerprintService] 当前无线网络环境:', wifiEnvironment)
        } catch (error) {
            console.error('[FingerprintService] 获取无线网络环境失败:', error)
        }

        try {
            bluetoothEnvironment = await getPairedBluetoothDevices()
            console.log('[FingerprintService] 当前蓝牙环境:', bluetoothEnvironment)
        } catch (error) {
            console.error('[FingerprintService] 获取蓝牙环境失败:', error)
        }
    }

    if (isTauriRuntime && tauriDeviceInfo) {
        activityMonitor.deviceInfo = tauriDeviceInfo
    }

    const snapshot = {
        tauri: tauriDeviceInfo ?? null,
        browser: browserFingerprint,
        wifiEnvironment,
        bluetoothEnvironment,
        generatedAt: new Date().toISOString(),
    }

    console.log('[FingerprintService] 分层指纹与无线环境采集结果:', snapshot)
    return snapshot
}
