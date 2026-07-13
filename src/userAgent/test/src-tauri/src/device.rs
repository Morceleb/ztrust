use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::PathBuf;

static DEVICE_ID_FILE: &str = "device_id.txt";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayeredFingerprint {
    pub hardware_hash: String,
    pub software_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceMeta {
    pub hostname: String,
    pub cpu: String,
    pub machine_id: String,
}

fn device_id_file_path(app_dir: &PathBuf) -> PathBuf {
    app_dir.join(DEVICE_ID_FILE)
}

fn read_or_create_device_id(app_dir: &PathBuf) -> String {
    let file_path = device_id_file_path(app_dir);
    if let Ok(id) = std::fs::read_to_string(&file_path) {
        let trimmed = id.trim();
        if !trimmed.is_empty() {
            // 如果已存的是 32 字符 UUID，扩展成 64 字符 hex（32 字节）
            return upgrade_device_id_to_32_bytes(trimmed);
        }
    }
    // 新生成：UUID v4 → SHA256 → 64 字符 hex
    let raw = uuid::Uuid::new_v4().to_string();
    let upgraded = upgrade_device_id_to_32_bytes(&raw);
    if let Err(e) = std::fs::write(&file_path, &upgraded) {
        log::warn!("[DeviceID] 写入 device_id 文件失败: {}", e);
    }
    upgraded
}

/// 将任意长度的设备 ID 升级到 64 字符 hex（32 字节）
/// 已经是 64 字符的直接返回；32 字符 UUID 的 SHA256 扩展到 64 字符
fn upgrade_device_id_to_32_bytes(id: &str) -> String {
    let normalized: String = id
        .chars()
        .filter(|c| !c.is_whitespace() && *c != '-')
        .collect();
    if normalized.len() == 64 {
        return normalized.to_lowercase();
    }
    if normalized.len() == 32 {
        // 老版本：UUID 去掉连字符后 32 字符，需要扩展
        let mut hasher = sha2::Sha256::new();
        hasher.update(normalized.as_bytes());
        return hex::encode(hasher.finalize());
    }
    // 其他长度：用 SHA256 派生一个稳定 32 字节
    let mut hasher = sha2::Sha256::new();
    hasher.update(id.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn get_device_id(app_dir: &PathBuf) -> String {
    read_or_create_device_id(app_dir)
}

pub fn get_device_meta(app_dir: &PathBuf) -> DeviceMeta {
    let hostname = hostname::get()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|_| "Unknown".to_string());

    let cpu = get_cpu_info();

    let machine_id = read_or_create_device_id(app_dir);

    DeviceMeta {
        hostname,
        cpu,
        machine_id,
    }
}

pub fn generate_device_info() -> Result<DeviceInfo, String> {
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

    let hardware_data = format!("{}|{}|{}", hostname, cpu, screen);
    let hardware_hash = generate_hash(&hardware_data);

    let software_data = format!("{}|{}|{}", platform, os_version, electron_version);
    let software_hash = generate_hash(&software_data);

    let layered = LayeredFingerprint {
        hardware_hash,
        software_hash: software_hash.clone(),
    };

    Ok(DeviceInfo {
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
        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; (Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version | Format-List | Out-String).Trim()",
            ])
            .output();
        if let Ok(out) = output {
            let s = String::from_utf8_lossy(&out.stdout);
            let caption = s
                .lines()
                .find(|l| l.trim_start().starts_with("Caption"))
                .and_then(|l| l.split(':').nth(1))
                .map(|v| v.trim())
                .unwrap_or("");
            let version = s
                .lines()
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
