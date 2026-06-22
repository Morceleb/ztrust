/**
 * SPA (Single Packet Authorization) 工具模块
 * 用于在用户输入安全码后，通过 Tauri 命令发送 SPA 报文到服务器
 */

import { invoke } from '@tauri-apps/api/core'

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
        port: 41234,
        tokenCode: tokenCode.substring(0, 4) + '****',
        deviceId: deviceId.substring(0, 8) + '...',
    })

    try {
        await invoke('send_spa_packet', {
            serverAddress: host,
            port: 41234,
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

// 导出默认函数
export default {
    sendSpaPacket,
    sendSpaPacketSafe,
}
