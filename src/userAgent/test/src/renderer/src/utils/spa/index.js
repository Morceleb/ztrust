/**
 * SPA (Single Packet Authorization) 工具模块
 * 用于在用户输入安全码后，通过 Tauri 命令发送 SPA 报文到服务器
 */

import { invoke } from '@tauri-apps/api/core'
import { getSecurityCode } from '@/utils/keyringService'

/** 硬编码 SPA 端口（与 Rust 端 send_spa_packet 默认值一致） */
const SPA_PORT = 41234

/** 硬编码 LicenseID（与 Login.vue 现有逻辑一致） */
const DEFAULT_LICENSE_ID = '7f8e3d2a1c9b4e6f5a0d8c2b7e4f1a3c'

/**
 * 从地址中提取纯 host（移除协议和端口）
 * @param {string} address
 * @returns {string}
 */
function extractHost(address) {
    if (!address) return ''
    let host = address.replace(/^https?:\/\//, '').replace(/\/$/, '')
    // 移除端口号
    host = host.replace(/:\d+$/, '')
    return host
}

/**
 * 发送 SPA 报文
 * @param {string} serverAddress - 服务器地址（域名或IP，可包含端口）
 * @param {string} tokenCode - 用户输入的安全码（如 "2345-6789-ABCD"）
 * @param {string} deviceId - 设备ID（64字符hex = 32字节）
 * @param {string} licenseId - 许可证ID（32字符hex = 16字节）
 * @returns {Promise<void>}
 */
export async function sendSpaPacket(serverAddress, tokenCode, deviceId, licenseId) {
    // 提取纯 host（确保不包含端口）
    const host = extractHost(serverAddress)

    console.log('[SPA] 准备发送 SPA 报文', {
        serverAddress: host,
        port: SPA_PORT,
        tokenCode: tokenCode.substring(0, 4) + '****',
        deviceId: deviceId.substring(0, 8) + '...',
    })

    try {
        await invoke('send_spa_packet', {
            serverAddress: host,
            port: SPA_PORT,
            tokenCode: tokenCode,
            deviceId: deviceId,
            licenseId: licenseId,
        })
        console.log('[SPA] SPA 报文发送成功')
        return { success: true }
    } catch (error) {
        console.error('[SPA] SPA 报文发送失败:', error)
        throw error
    }
}

/**
 * 发送 SPA 报文（带错误处理和默认值）
 * @param {Object} params - 参数对象
 * @param {string} params.serverAddress - 服务器地址
 * @param {string} params.tokenCode - 安全码
 * @param {string} [params.deviceId] - 设备ID（可选，默认使用后端获取的设备指纹）
 * @param {string} [params.licenseId] - 许可证ID（可选）
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendSpaPacketSafe({ serverAddress, tokenCode, deviceId, licenseId }) {
    try {
        await sendSpaPacket(serverAddress, tokenCode, deviceId, licenseId)
        return { success: true }
    } catch (error) {
        // 捕获并返回更友好的错误信息
        let errorMessage = 'SPA 报文发送失败'

        if (error.message?.includes('network')) {
            errorMessage = '网络连接失败，请检查服务器地址是否正确'
        } else if (error.message?.includes('timeout')) {
            errorMessage = '连接超时，服务器可能不可达'
        } else if (error.message) {
            errorMessage = `发送失败: ${error.message}`
        }

        return { success: false, error: errorMessage }
    }
}

/**
 * 读取持久化的安全码（keyring → localStorage 回退）
 * @returns {Promise<string|null>}
 */
async function readStoredSecurityCode() {
    const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined
    if (isTauri) {
        try {
            const code = await getSecurityCode()
            if (code) return code
        } catch (e) {
            console.warn('[SPA] 从 keyring 读取安全码失败:', e)
        }
    }
    // 回退：浏览器环境或 keyring 不可用时读 localStorage
    return localStorage.getItem('securityCode')
}

/**
 * 解析目标服务器地址：优先使用入参，否则读 localStorage。
 * @param {string} [overrideAddress]
 * @returns {string|null} 纯 host（含端口由 SPA_PORT 控制，不再需要原地址端口）
 */
function resolveServerAddress(overrideAddress) {
    if (overrideAddress) return extractHost(overrideAddress)
    const stored = localStorage.getItem('companyAddress') || import.meta.env?.VITE_API_BASE_URL || ''
    return stored ? extractHost(stored) : null
}

/**
 * 高层封装：根据持久化凭据自动发送 SPA 报文。
 * 适用于「资源点击前」和「后台定时」两种场景。
 *
 * - 自动从 keyring / localStorage 取安全码
 * - 自动从 localStorage 取公司地址
 * - 自动调用 Tauri 命令拿设备指纹
 * - 非 Tauri 环境直接跳过（不做 fetch 探测，避免被网关拦）
 * - 同一时间并发请求会自动合并到同一发送任务上
 *
 * @param {Object} [options]
 * @param {string} [options.serverAddress] - 覆盖默认服务器地址
 * @param {string} [options.reason]       - 调用原因（用于日志：'resource-click' / 'heartbeat' / 'manual'）
 * @returns {Promise<{success: boolean, skipped?: boolean, error?: string}>}
 */
let inflight = null
export async function ensureSpaSent(options = {}) {
    const reason = options.reason || 'manual'
    const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined

    if (!isTauri) {
        console.log(`[SPA] (${reason}) 非 Tauri 环境，跳过 SPA 报文发送`)
        return { success: true, skipped: true }
    }

    // 同一个发送任务并发合并
    if (inflight) {
        console.log(`[SPA] (${reason}) 检测到并发请求，复用已有 SPA 发送任务`)
        return inflight
    }

    inflight = (async () => {
        try {
            const serverAddress = resolveServerAddress(options.serverAddress)
            if (!serverAddress) {
                console.warn(`[SPA] (${reason}) 未配置公司地址，跳过`)
                return { success: false, skipped: true, error: 'no server address' }
            }

            const tokenCode = await readStoredSecurityCode()
            if (!tokenCode) {
                console.warn(`[SPA] (${reason}) 未找到持久化的安全码，跳过`)
                return { success: false, skipped: true, error: 'no security code' }
            }

            let deviceId
            try {
                const deviceInfo = await invoke('get_device_info')
                deviceId = deviceInfo?.layered?.hardware_hash
            } catch (e) {
                console.warn(`[SPA] (${reason}) 获取设备信息失败:`, e)
            }
            if (!deviceId) {
                return { success: false, error: 'no device id' }
            }

            console.log(`[SPA] (${reason}) 准备发送 SPA 报文`, { host: serverAddress })
            const res = await sendSpaPacketSafe({
                serverAddress,
                tokenCode: tokenCode.trim(),
                deviceId,
                licenseId: DEFAULT_LICENSE_ID,
            })
            if (!res.success) {
                console.warn(`[SPA] (${reason}) SPA 报文发送失败:`, res.error)
            }
            return res
        } finally {
            inflight = null
        }
    })()

    return inflight
}

/**
 * 启动「每隔 N 秒自动 SPA」后台定时器。
 * - 默认 3 分钟一次
 * - 必须在已登录且有持久化安全码的环境下运行
 * - 返回一个 stop() 函数用于清理
 *
 * @param {Object} [options]
 * @param {number} [options.intervalMs=180000] - 间隔毫秒（默认 3 分钟）
 * @param {string} [options.serverAddress]     - 覆盖默认服务器地址
 * @returns {{ stop: () => void, intervalMs: number }}
 */
export function startSpaHeartbeat(options = {}) {
    const intervalMs = options.intervalMs || 3 * 60 * 1000
    let stopped = false

    const tick = () => {
        if (stopped) return
        // 静默：失败仅记录日志
        ensureSpaSent({ reason: 'heartbeat', serverAddress: options.serverAddress })
            .catch((e) => console.warn('[SPA] (heartbeat) 异常:', e))
    }

    // 立即先触发一次（资源加载/路由切换前先开门），再按间隔调度
    tick()
    const timer = setInterval(tick, intervalMs)

    return {
        stop: () => {
            stopped = true
            clearInterval(timer)
            console.log('[SPA] 心跳定时器已停止')
        },
        intervalMs,
    }
}

// 导出默认函数
export default {
    sendSpaPacket,
    sendSpaPacketSafe,
    ensureSpaSent,
    startSpaHeartbeat,
}