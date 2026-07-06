use aes_gcm::{
    aead::{Aead, KeyInit, Payload},
    Aes256Gcm, Nonce,
};
use log::info;
use std::net::UdpSocket;
use std::time::SystemTime;

const TOKEN_CODE_CHARS: &str = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
const SALT: &[u8] = b"zerotrust-spa";
const INFO: &[u8] = b"spa-token";

fn decode_base32(code: &str) -> Vec<u8> {
    let mut char_map = std::collections::HashMap::new();
    for (i, c) in TOKEN_CODE_CHARS.chars().enumerate() {
        char_map.insert(c, i as u8);
    }

    let normalized: String = code.replace('-', "").to_uppercase();
    let mut buffer: u64 = 0;
    let mut bits_left: u32 = 0;
    let mut out = Vec::new();

    for c in normalized.chars() {
        if let Some(&v) = char_map.get(&c) {
            buffer = (buffer << 5) | (v as u64);
            bits_left += 5;
            if bits_left >= 8 {
                bits_left -= 8;
                out.push(((buffer >> bits_left) & 0xFF) as u8);
            }
        }
    }

    // 填充到 12 字节（与后端逻辑一致）
    while out.len() < 12 {
        out.push(0);
    }

    out
}

fn hmac_sha256(key: &[u8], msg: &[u8]) -> Vec<u8> {
    let salt_key = ring::hmac::Key::new(ring::hmac::HMAC_SHA256, key);
    ring::hmac::sign(&salt_key, msg).as_ref().to_vec()
}

fn hkdf_sha256(ikm: &[u8], length: usize) -> Vec<u8> {
    let prk = hmac_sha256(SALT, ikm);

    let mut t = Vec::new();
    let mut okm = Vec::new();
    let mut counter: u8 = 1;

    while okm.len() < length {
        let mut data = t.clone();
        data.extend_from_slice(INFO);
        data.push(counter);

        t = hmac_sha256(&prk, &data);
        okm.extend_from_slice(&t);
        counter += 1;
    }

    okm.truncate(length);
    okm
}

fn derive_spa_token(token_code: &str) -> Vec<u8> {
    let ikm = decode_base32(token_code);
    hkdf_sha256(&ikm, 32)
}

fn hex_to_bytes(hex: &str) -> Result<Vec<u8>, String> {
    // 移除所有空白字符
    let hex = hex.trim();
    if hex.is_empty() {
        return Err("Hex string is empty".to_string());
    }
    if hex.len() % 2 != 0 {
        return Err(format!("Hex string has odd length: {}", hex.len()));
    }

    (0..hex.len())
        .step_by(2)
        .map(|i| {
            u8::from_str_radix(&hex[i..i + 2], 16)
                .map_err(|e| format!("Invalid hex at position {}: {}", i, e))
        })
        .collect()
}

/// 发送 SPA 报文到指定地址
///
/// # 参数
/// - `server_address`: 目标服务器地址（域名或IP）
/// - `port`: 目标端口
/// - `token_code`: 用户输入的安全码
/// - `device_id`: 设备ID（64字符hex字符串 = 32字节）
/// - `license_id`: 许可证ID（32字符hex字符串 = 16字节）
pub fn send_spa_packet(
    server_address: &str,
    port: u16,
    token_code: &str,
    device_id: &str,
    license_id: &str,
) -> Result<(), String> {
    // 提取纯主机地址（移除协议和端口）
    let pure_host = server_address
        .trim_start_matches("http://")
        .trim_start_matches("https://")
        .split(':')
        .next()
        .unwrap_or(server_address);

    info!(
        "[SPA] 开始发送 SPA 报文到 {}:{}",
        pure_host, port
    );

    // 派生 SpaKey (32字节)
    let spa_key = derive_spa_token(token_code);
    info!("[SPA] SpaKey 派生完成: {}", hex::encode(&spa_key));

    // 解析 DeviceID (32字节) 和 LicenseID (16字节)
    let device_id_bytes = hex_to_bytes(device_id)
        .map_err(|e| format!("DeviceID 解析失败: {}", e))?;
    let license_id_bytes = hex_to_bytes(license_id)
        .map_err(|e| format!("LicenseID 解析失败: {}", e))?;

    // 验证长度
    if device_id_bytes.len() != 32 {
        return Err(format!("DeviceID 长度错误: 期望 32 字节, 实际 {} 字节", device_id_bytes.len()));
    }
    if license_id_bytes.len() != 16 {
        return Err(format!("LicenseID 长度错误: 期望 16 字节, 实际 {} 字节", license_id_bytes.len()));
    }

    info!("[SPA] DeviceID 长度: {} 字节", device_id_bytes.len());
    info!("[SPA] LicenseID 长度: {} 字节", license_id_bytes.len());

    // 构建 Payload (56字节)
    let mut payload = vec![0u8; 56];

    // [0-7 字节] 写入时间戳 (Big Endian)
    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis() as u64;
    payload[0..8].copy_from_slice(&timestamp.to_be_bytes());

    // [8-39 字节] 写入 DeviceID (32字节)
    payload[8..40].copy_from_slice(&device_id_bytes);

    // [40-55 字节] 写入 LicenseID (16字节)
    payload[40..56].copy_from_slice(&license_id_bytes);

    // 准备 AAD (29字节)
    let version: u8 = 1;
    // userHint：直接取 SpaKey 前 16 字节（与后端逻辑一致）
    let user_hint = &spa_key[0..16];

    let nonce: Vec<u8> = (0..12).map(|_| rand::random::<u8>()).collect();

    // 构建 AAD: [version(1) + userHint(16) + nonce(12)]
    let mut aad = Vec::with_capacity(29);
    aad.push(version);
    aad.extend_from_slice(user_hint);
    aad.extend_from_slice(&nonce);

    // AES-256-GCM 加密
    let cipher = Aes256Gcm::new_from_slice(&spa_key).map_err(|e| e.to_string())?;
    let nonce_array: [u8; 12] = nonce.clone().try_into().map_err(|_| "Nonce length error")?;
    let nonce = Nonce::from_slice(&nonce_array);

    let ciphertext = cipher
        .encrypt(
            nonce,
            Payload {
                msg: &payload,
                aad: &aad,
            },
        )
        .map_err(|e| format!("加密失败: {}", e))?;

    // 获取 auth tag (最后16字节)
    let auth_tag = &ciphertext[ciphertext.len() - 16..];
    let encrypted_data = &ciphertext[..ciphertext.len() - 16];

    // 组装报文: [version(1) + userHint(16) + nonce(12) + ciphertext + authTag(16)]
    let mut packet = Vec::new();
    packet.push(version);
    packet.extend_from_slice(user_hint);
    packet.extend_from_slice(&nonce);
    packet.extend_from_slice(encrypted_data);
    packet.extend_from_slice(auth_tag);

    info!("[SPA] 报文总长度: {} 字节", packet.len());

    // 提取纯主机地址（移除协议和端口）
    let pure_host = server_address
        .trim_start_matches("http://")
        .trim_start_matches("https://")
        .split(':')
        .next()
        .unwrap_or(server_address);

    // 发送 UDP
    let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| e.to_string())?;
    socket
        .set_read_timeout(Some(std::time::Duration::from_secs(3)))
        .ok();

    socket
        .send_to(&packet, format!("{}:{}", pure_host, port))
        .map_err(|e| format!("UDP 发送失败: {}", e))?;

    info!("[SPA] SPA 报文发送成功!");
    Ok(())
}

/// 异步发送 SPA 报文（带超时和重试）
pub fn send_spa_packet_with_retry(
    server_address: &str,
    port: u16,
    token_code: &str,
    device_id: &str,
    license_id: &str,
    max_retries: u32,
) -> Result<(), String> {
    let mut last_error = String::new();

    for attempt in 1..=max_retries {
        info!("[SPA] 尝试发送 (第 {}/{} 次)", attempt, max_retries);

        match send_spa_packet(server_address, port, token_code, device_id, license_id) {
            Ok(()) => return Ok(()),
            Err(e) => {
                last_error = e;
                info!("[SPA] 发送失败: {}", last_error);
                if attempt < max_retries {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                }
            }
        }
    }

    Err(format!("发送失败，已重试 {} 次: {}", max_retries, last_error))
}