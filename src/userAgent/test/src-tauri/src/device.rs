use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::PathBuf;

pub use crate::device_security::{collect_device_security, DeviceSecurity, format_software_summary};

static DEVICE_ID_FILE: &str = "device_id.txt";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayeredFingerprint {
    pub hardware_hash: String,
    pub software_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    /// 设备唯一ID（ztrust_device_id）：UUID v4 → SHA256 → 64字符hex（32字节）
    pub device_id: String,
    pub layered: LayeredFingerprint,
    pub platform: String,
    pub os_version: String,
    // 新增：OS 详细信息
    pub display_version: String,   // 功能更新版本，如 "23H2"
    pub ubr: String,               // 补丁修订号，如 "4391"
    pub build_number: String,      // 构建号，如 "22631"
    pub hotfix_list: Vec<String>,  // 已安装的 KB 补丁列表
    pub hostname: String,
    pub cpu: String,
    pub memory: String,
    pub screen: String,
    pub electron_version: String,
    pub generated_at: String,
    // 网络位置信息（本地/公网）
    pub local_ip: String,
    pub public_ip: String,
    // 设备上下文（安全状态 / 磁盘加密 / 软件清单）
    pub security: DeviceSecurity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceMeta {
    pub hostname: String,
    pub cpu: String,
    pub machine_id: String,
}

/// OS 详细信息结构体
#[derive(Debug, Clone)]
pub struct OsDetails {
    pub display_version: String,  // 功能更新版本，如 "23H2"
    pub ubr: String,              // 补丁修订号，如 "4391"
    pub build_number: String,     // 构建号，如 "22631"
    pub hotfix_list: Vec<String>, // 已安装的 KB 补丁列表
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

pub fn generate_device_info(app_dir: &PathBuf) -> Result<DeviceInfo, String> {
    let platform = match std::env::consts::OS {
        "windows" => "Windows",
        "macos" => "macOS",
        "linux" => "Linux",
        _ => "Unknown",
    }
    .to_string();

    // ── 设备唯一 ID：UUID v4 → SHA256 → 64 字符 hex，写到 app_dir/device_id.txt
    let device_id = read_or_create_device_id(app_dir);

    let os_version = get_real_os_version();
    let os_details = get_os_details();
    let hostname = get_hostname();
    let cpu = get_cpu_info();
    let memory = get_memory_info();
    let screen = get_screen_info();
    let ip_info = get_ip_info();
    let electron_version = "Tauri 2.0".to_string();

    // ── 采集设备上下文（安全状态 / 磁盘加密 / 软件清单）──────────────────
    let security = collect_device_security();

    let hardware_data = format!("{}|{}|{}", hostname, cpu, screen);
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
        display_version: os_details.display_version,
        ubr: os_details.ubr,
        build_number: os_details.build_number,
        hotfix_list: os_details.hotfix_list,
        hostname,
        cpu,
        memory,
        screen,
        electron_version,
        generated_at: chrono::Utc::now().to_rfc3339(),
        local_ip: ip_info.local_ip,
        public_ip: ip_info.public_ip,
        security,
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
        use std::process::Command;
        // 通过 WMI 读取 CPU 名称、核心数、逻辑处理器、最大频率
        let ps_cmd = "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; \
            $p = Get-CimInstance Win32_Processor; \
            if ($null -eq $p) { '' } else { \
                $name = $p.Name.Trim(); \
                $cores = $p.NumberOfCores; \
                $logical = $p.NumberOfLogicalProcessors; \
                $ghz = if ($p.MaxClockSpeed) { [math]::Round($p.MaxClockSpeed / 1000.0, 2) } else { 0 }; \
                \"{0} @ {1}GHz ({2}核/{3}线程)\" -f $name, $ghz, $cores, $logical \
            }";
        if let Ok(out) = Command::new("powershell")
            .args(["-NoProfile", "-Command", ps_cmd])
            .output()
        {
            let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !s.is_empty() {
                return s;
            }
        }
        "Unknown CPU".to_string()
    }
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        if let Ok(out) = Command::new("sysctl")
            .args(["-n", "machdep.cpu.brand_string"])
            .output()
        {
            let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !s.is_empty() {
                return s;
            }
        }
        "Unknown CPU".to_string()
    }
    #[cfg(target_os = "linux")]
    {
        if let Ok(content) = std::fs::read_to_string("/proc/cpuinfo") {
            let model = content
                .lines()
                .find(|l| l.starts_with("model name"))
                .and_then(|l| l.split(':').nth(1))
                .map(|s| s.trim())
                .unwrap_or("");
            let count = content.lines().filter(|l| l.starts_with("processor")).count();
            if !model.is_empty() {
                return format!("{} ({} 核)", model, count);
            }
        }
        "Unknown CPU".to_string()
    }
    #[cfg(not(any(windows, target_os = "macos", target_os = "linux")))]
    {
        "Unknown CPU".to_string()
    }
}

fn get_memory_info() -> String {
    #[cfg(windows)]
    {
        use std::process::Command;
        // 通过 WMI 同时拿总物理内存与可用内存，返回 "总 XGB / 可用 YGB"
        let ps_cmd = "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; \
            $cs = Get-CimInstance Win32_ComputerSystem; \
            $os = Get-CimInstance Win32_OperatingSystem; \
            if ($null -eq $cs -or $null -eq $os) { '' } else { \
                $total = [math]::Round($cs.TotalPhysicalMemory / 1GB, 1); \
                $free  = [math]::Round($os.FreePhysicalMemory  / 1MB / 1024.0, 1); \
                \"总 {0}GB / 可用 {1}GB\" -f $total, $free \
            }";
        if let Ok(out) = Command::new("powershell")
            .args(["-NoProfile", "-Command", ps_cmd])
            .output()
        {
            let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !s.is_empty() {
                return s;
            }
        }
        "Unknown".to_string()
    }
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        if let Ok(out) = Command::new("sysctl")
            .args(["-n", "hw.memsize"])
            .output()
        {
            let total_bytes: u64 = String::from_utf8_lossy(&out.stdout)
                .trim()
                .parse()
                .unwrap_or(0);
            if total_bytes > 0 {
                let total_gb = total_bytes as f64 / 1024.0 / 1024.0 / 1024.0;
                return format!("总 {:.1}GB", total_gb);
            }
        }
        "Unknown".to_string()
    }
    #[cfg(target_os = "linux")]
    {
        if let Ok(content) = std::fs::read_to_string("/proc/meminfo") {
            let total_kb = content
                .lines()
                .find(|l| l.starts_with("MemTotal"))
                .and_then(|l| {
                    l.split_whitespace()
                        .nth(1)
                        .and_then(|v| v.parse::<u64>().ok())
                })
                .unwrap_or(0);
            let avail_kb = content
                .lines()
                .find(|l| l.starts_with("MemAvailable"))
                .and_then(|l| {
                    l.split_whitespace()
                        .nth(1)
                        .and_then(|v| v.parse::<u64>().ok())
                })
                .unwrap_or(0);
            if total_kb > 0 {
                return format!(
                    "总 {:.1}GB / 可用 {:.1}GB",
                    total_kb as f64 / 1024.0 / 1024.0,
                    avail_kb as f64 / 1024.0 / 1024.0
                );
            }
        }
        "Unknown".to_string()
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

/// 获取本地首选 IPv4（通过 UDP Socket 探测出口 IP）+ 公网 IP（同步 HTTP 探测）。
/// 公网 IP 获取失败时返回 "N/A"，不影响整体采集。
fn get_ip_info() -> IpInfo {
    let local_ip = get_local_ip();
    let public_ip = get_public_ip_blocking();
    IpInfo { local_ip, public_ip }
}

/// 用 UDP Socket 连 8.8.8.8 拿本机首选出口 IP（不同 Wi‑Fi 时优先返回当前活动网卡）
fn get_local_ip() -> String {
    if let Ok(socket) = std::net::UdpSocket::bind("0.0.0.0:0") {
        if socket.connect("8.8.8.8:53").is_ok() {
            if let Ok(addr) = socket.local_addr() {
                return addr.ip().to_string();
            }
        }
    }
    "N/A".to_string()
}

/// 同步获取公网 IP（短超时，失败时回落到 N/A）。
/// 这里只做"采集结果展示"，不参与网络通讯，避免阻塞采集流程。
fn get_public_ip_blocking() -> String {
    let candidates = [
        ("https://api.ipify.org?format=text", 64),
        ("https://ifconfig.me/ip", 64),
        ("https://ipv4.icanhazip.com", 64),
    ];

    for (url, max_len) in candidates {
        // 走 cmd /c curl，避免在 Tauri 里额外引入 reqwest 阻塞客户端
        if let Ok(out) = std::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                &format!(
                    "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; \
                     try {{ \
                         $ProgressPreference='SilentlyContinue'; \
                         $r = Invoke-WebRequest -Uri '{}' -UseBasicParsing -TimeoutSec 4 -MaximumRedirection 3; \
                         $r.Content.Trim() \
                     }} catch {{ '' }}",
                    url
                ),
            ])
            .output()
        {
            if out.status.success() {
                let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !s.is_empty() && s.len() <= max_len {
                    return s;
                }
            }
        }
    }

    "N/A".to_string()
}

/// 获取 OS 详细信息：DisplayVersion, UBR, BuildNumber, HotFixID 列表
fn get_os_details() -> OsDetails {
    #[cfg(windows)]
    {
        use std::process::Command;

        let mut details = OsDetails {
            display_version: String::new(),
            ubr: String::new(),
            build_number: String::new(),
            hotfix_list: Vec::new(),
        };

        // 1. 从注册表获取 DisplayVersion
        if let Ok(output) = Command::new("reg")
            .args([
                "query",
                r"HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion",
                "/v",
                "DisplayVersion",
            ])
            .output()
        {
            let s = String::from_utf8_lossy(&output.stdout);
            if let Some(line) = s.lines().find(|l| l.contains("DisplayVersion")) {
                if let Some(value) = line.split_whitespace().last() {
                    details.display_version = value.trim().to_string();
                }
            }
        }

        // 2. 从注册表获取 UBR (Update Build Revision)
        if let Ok(output) = Command::new("reg")
            .args([
                "query",
                r"HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion",
                "/v",
                "UBR",
            ])
            .output()
        {
            let s = String::from_utf8_lossy(&output.stdout);
            if let Some(line) = s.lines().find(|l| l.contains("UBR")) {
                if let Some(value) = line.split_whitespace().last() {
                    details.ubr = value.trim().to_string();
                }
            }
        }

        // 3. 从 Win32_OperatingSystem 获取 BuildNumber
        if let Ok(output) = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; (Get-CimInstance Win32_OperatingSystem | Select-Object -ExpandProperty BuildNumber)",
            ])
            .output()
        {
            let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !s.is_empty() {
                details.build_number = s;
            }
        }

        // 4. 获取 HotFixID 列表
        if let Ok(output) = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; (Get-CimInstance Win32_QuickFixEngineering | Select-Object -ExpandProperty HotFixID | ConvertTo-Json -Compress)",
            ])
            .output()
        {
            let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !s.is_empty() {
                // 解析 JSON 数组
                if s.starts_with('[') {
                    if let Ok(list) = serde_json::from_str::<Vec<String>>(&s) {
                        details.hotfix_list = list;
                    }
                } else if !s.starts_with('{') {
                    // 单个元素的情况，JSON 解析会失败，当作字符串处理
                    details.hotfix_list = vec![s.clone()];
                }
            }
        }

        details
    }
    #[cfg(not(windows))]
    {
        OsDetails {
            display_version: "N/A".to_string(),
            ubr: "N/A".to_string(),
            build_number: std::env::consts::OS.to_string(),
            hotfix_list: Vec::new(),
        }
    }
}

/// IP 采集结果：本地首选 + 公网出口 IP
#[derive(Debug, Clone)]
pub struct IpInfo {
    pub local_ip: String,
    pub public_ip: String,
}

fn generate_hash(data: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data.as_bytes());
    hex::encode(hasher.finalize())
}
