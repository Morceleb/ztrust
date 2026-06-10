use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub device_id: String,
    pub fingerprint: String,
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

    // 获取平台信息
    let platform = match std::env::consts::OS {
        "windows" => "Windows",
        "macos" => "macOS",
        "linux" => "Linux",
        _ => "Unknown",
    }.to_string();

    // 获取系统版本（简化版本）
    let os_version = match std::env::consts::OS {
        "windows" => "Windows 10/11".to_string(),
        "macos" => "macOS 13+".to_string(),
        "linux" => "Linux".to_string(),
        _ => "Unknown".to_string(),
    };

    // 获取主机名
    let hostname = get_hostname();

    // 获取 CPU 信息（简化）
    let cpu = get_cpu_info();

    // 获取内存信息（简化）
    let memory = get_memory_info();

    // 获取屏幕信息
    let screen = get_screen_info();

    // 生成设备指纹
    let fingerprint_data = format!(
        "{}-{}-{}-{}-{}",
        device_id, platform, hostname, cpu, screen
    );
    let fingerprint = generate_fingerprint(&fingerprint_data);

    Ok(DeviceInfo {
        device_id,
        fingerprint,
        platform,
        os_version,
        hostname,
        cpu,
        memory,
        screen,
        electron_version: "Tauri 2.0".to_string(),
        generated_at: chrono::Utc::now().to_rfc3339(),
    })
}

fn get_hostname() -> String {
    // 尝试从系统获取主机名
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
    // 简化版本，实际应该使用 system-info 库
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
    // 简化版本
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
    // 简化版本，实际应该使用系统 API
    "1920x1080".to_string()
}

fn generate_fingerprint(data: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

pub fn validate_fingerprint(fingerprint: &str, device_id: &str) -> bool {
    // 验证指纹格式
    fingerprint.len() == 64 && device_id.len() == 36
}
