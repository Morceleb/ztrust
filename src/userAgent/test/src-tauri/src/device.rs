use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayeredFingerprint {
    pub hardware_hash: String,
    pub software_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub device_id: String,
    pub layered: LayeredFingerprint,
    pub platform: String,
    pub os_version: String,
    pub hostname: String,
    pub cpu: String,
    pub memory: String,
    pub screen: String,
    pub electron_version: String,
    pub generated_at: String,
}

pub fn generate_device_info() -> Result<DeviceInfo, String> {
    let device_id = Uuid::new_v4().to_string();

    let platform = match std::env::consts::OS {
        "windows" => "Windows",
        "macos" => "macOS",
        "linux" => "Linux",
        _ => "Unknown",
    }
    .to_string();

    let os_version = get_real_os_version();

    let hostname = get_hostname();
    let cpu = get_cpu_info();
    let memory = get_memory_info();
    let screen = get_screen_info();
    let electron_version = "Tauri 2.0".to_string();

    let hardware_data = format!("{}|{}|{}|{}", device_id, hostname, cpu, screen);
    let hardware_hash = generate_hash(&hardware_data);

    let software_data = format!("{}|{}|{}", platform, os_version, electron_version);
    let software_hash = generate_hash(&software_data);

    let layered = LayeredFingerprint {
        hardware_hash,
        software_hash: software_hash.clone(),
    };

    Ok(DeviceInfo {
        device_id,
        layered,
        platform,
        os_version,
        hostname,
        cpu,
        memory,
        screen,
        electron_version,
        generated_at: chrono::Utc::now().to_rfc3339(),
    })
}

fn get_hostname() -> String {
    #[cfg(windows)]
    {
        std::env::var("COMPUTERNAME").unwrap_or_else(|_| "Unknown".to_string())
    }
    #[cfg(target_os = "macos")]
    {
        std::env::var("HOSTNAME").unwrap_or_else(|_| "Unknown".to_string())
    }
    #[cfg(target_os = "linux")]
    {
        std::env::var("HOSTNAME").unwrap_or_else(|_| "Unknown".to_string())
    }
    #[cfg(not(any(windows, target_os = "macos", target_os = "linux")))]
    {
        "Unknown".to_string()
    }
}

fn get_cpu_info() -> String {
    #[cfg(windows)]
    {
        "Intel/AMD Processor".to_string()
    }
    #[cfg(target_os = "macos")]
    {
        "Apple Silicon/Intel".to_string()
    }
    #[cfg(target_os = "linux")]
    {
        "Linux CPU".to_string()
    }
    #[cfg(not(any(windows, target_os = "macos", target_os = "linux")))]
    {
        "Unknown CPU".to_string()
    }
}

fn get_memory_info() -> String {
    #[cfg(windows)]
    {
        "8GB/16GB".to_string()
    }
    #[cfg(target_os = "macos")]
    {
        "8GB/16GB/32GB".to_string()
    }
    #[cfg(target_os = "linux")]
    {
        "4GB/8GB/16GB".to_string()
    }
    #[cfg(not(any(windows, target_os = "macos", target_os = "linux")))]
    {
        "Unknown".to_string()
    }
}

fn get_screen_info() -> String {
    "1920x1080".to_string()
}

fn get_real_os_version() -> String {
    #[cfg(windows)]
    {
        use std::process::Command;
        // 使用 powershell 获取 Windows 完整版本，输出为 UTF-8
        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; (Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version | Format-List | Out-String).Trim()",
            ])
            .output();
        if let Ok(out) = output {
            let s = String::from_utf8_lossy(&out.stdout);
            let caption = s.lines()
                .find(|l| l.trim_start().starts_with("Caption"))
                .and_then(|l| l.split(':').nth(1))
                .map(|v| v.trim())
                .unwrap_or("");
            let version = s.lines()
                .find(|l| l.trim_start().starts_with("Version"))
                .and_then(|l| l.split(':').nth(1))
                .map(|v| v.trim())
                .unwrap_or("");
            if !caption.is_empty() {
                return format!("{} ({})", caption, version);
            }
        }
        "Windows".to_string()
    }
    #[cfg(target_os = "macos")]
    {
        "macOS".to_string()
    }
    #[cfg(target_os = "linux")]
    {
        "Linux".to_string()
    }
    #[cfg(not(any(windows, target_os = "macos", target_os = "linux")))]
    {
        "Unknown".to_string()
    }
}

fn generate_hash(data: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn validate_fingerprint(fingerprint: &str, device_id: &str) -> bool {
    fingerprint.len() == 64 && device_id.len() == 36
}
