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
    let output = Command::new("netsh")
        .args(["wlan", "show", "networks", "mode=bssid"])
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

    let (_, rest) = line.split_once(':')?;
    Some(rest.trim().to_string())
}

#[cfg(windows)]
fn parse_signal_line(line: &str) -> Option<u8> {
    if !line.starts_with("Signal") {
        return None;
    }

    let (_, rest) = line.split_once(':')?;
    let value = rest.trim().trim_end_matches('%').trim();
    value.parse::<u8>().ok()
}
