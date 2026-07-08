use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WifiNetwork {
    pub ssid: String,
    pub signal: u8,
}

pub fn scan_top_wifi_networks(limit: usize) -> Result<Vec<WifiNetwork>, String> {
    #[cfg(windows)]
    {
        scan_windows_wifi_networks(limit)
    }

    #[cfg(not(windows))]
    {
        let _ = limit;
        Err("当前仅实现 Windows Wi‑Fi 环境扫描".to_string())
    }
}

#[cfg(windows)]
fn scan_windows_wifi_networks(limit: usize) -> Result<Vec<WifiNetwork>, String> {
    // 注意：早期版本使用 `mode=bssid` 试图获取 BSSID/信号强度，
    // 但在部分 Windows 11（特别是 MediaTek 等网卡 + 用户权限）下，
    // `mode=bssid` 会导致整个 BSSID/Signal 块被省略，
    // 结果只能看到第一个 SSID。改用默认输出可保证拿到全部可见 SSID 名称。
    let output = Command::new("netsh")
        .args(["wlan", "show", "networks"])
        .output()
        .map_err(|e| format!("执行 netsh 失败: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "netsh 扫描失败: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut strongest_by_ssid: HashMap<String, u8> = HashMap::new();
    let mut current_ssid: Option<String> = None;

    for raw_line in stdout.lines() {
        let line = raw_line.trim();

        if let Some(ssid) = parse_ssid_line(line) {
            current_ssid = Some(ssid);
            continue;
        }

        if let Some(signal) = parse_signal_line(line) {
            if let Some(ssid) = current_ssid.clone() {
                if ssid.is_empty() {
                    continue;
                }

                strongest_by_ssid
                    .entry(ssid)
                    .and_modify(|existing| {
                        if signal > *existing {
                            *existing = signal;
                        }
                    })
                    .or_insert(signal);
            }
            continue;
        }

        // 兜底：某些 netsh 输出（尤其是 Windows 11 中文环境且非管理员权限）
        // 会省略 BSSID/Signal 块，但每个 SSID 块仍然会输出。
        // 在遇到新的 SSID 之前，若 current_ssid 还没被加入，至少把已知 SSID 以 signal=0 占位，
        // 避免最终结果为空。
        if let Some(ssid) = current_ssid.clone() {
            if !ssid.is_empty() && !strongest_by_ssid.contains_key(&ssid) {
                // 仅在确实看到 SSID 块（已经有 Network type / 身份验证 / 加密等后续行）时占位
                if line.starts_with("Network type")
                    || line.starts_with("身份验证")
                    || line.starts_with("加密")
                    || line.starts_with("Authentication")
                    || line.starts_with("Encryption")
                {
                    strongest_by_ssid.insert(ssid, 0);
                }
            }
        }
    }

    let mut networks: Vec<WifiNetwork> = strongest_by_ssid
        .into_iter()
        .map(|(ssid, signal)| WifiNetwork { ssid, signal })
        .collect();

    networks.sort_by(|left, right| right.signal.cmp(&left.signal).then_with(|| left.ssid.cmp(&right.ssid)));
    networks.truncate(limit.min(5));

    Ok(networks)
}

#[cfg(windows)]
fn parse_ssid_line(line: &str) -> Option<String> {
    if !line.starts_with("SSID ") {
        return None;
    }

    let (_, rest) = split_on_colon(line)?;
    Some(rest.trim().to_string())
}

#[cfg(windows)]
fn parse_signal_line(line: &str) -> Option<u8> {
    // 适配英文 Signal 与中文"信号"
    if !line.starts_with("Signal") && !line.starts_with("信号") {
        return None;
    }

    let (_, rest) = split_on_colon(line)?;
    let value = rest.trim().trim_end_matches('%').trim();
    value.parse::<u8>().ok()
}

#[cfg(windows)]
fn split_on_colon(line: &str) -> Option<(&str, &str)> {
    // 支持半角冒号 ':' 和全角冒号 '：'
    if let Some(idx) = line.find(':') {
        return Some((&line[..idx], &line[idx + 1..]));
    }
    if let Some(idx) = line.find('：') {
        return Some((&line[..idx], &line[idx + '：'.len_utf8()..]));
    }
    None
}
