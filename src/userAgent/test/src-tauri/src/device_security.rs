//! 设备安全上下文采集模块
//!
//! 采集内容：
//!   1. 磁盘加密状态（BitLocker / FileVault / LUKS）
//!   2. 安全状态（UAC / SIP / SafeBoot / 实时保护）
//!   3. 已安装软件清单
//!
//! 对应设备上下文字段：防火墙/磁盘加密状态、Root/越狱状态、已安装软件列表

use serde::{Deserialize, Serialize};
use std::process::Command;

// =============================================================================
// 磁盘加密
// =============================================================================

/// 磁盘加密状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskEncryption {
    /// 加密状态描述，如 "完全加密" / "部分加密" / "未加密" / "N/A"
    pub status: String,
    /// 各卷的详细信息
    pub volumes: Vec<VolumeEncryption>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeEncryption {
    /// 盘符或挂载点
    pub volume: String,
    /// 加密百分比，如 "100%"、"已解锁"
    pub percentage: String,
    /// 加密方法（BitLocker: aes256 / aes256_diffuser，FileVault: XTS-AES-128 等）
    pub method: String,
    /// 保护状态（ON / OFF / Unknown）
    pub protection: String,
}

impl Default for DiskEncryption {
    fn default() -> Self {
        Self {
            status: "未知".to_string(),
            volumes: Vec::new(),
        }
    }
}

/// 采集磁盘加密状态
fn get_disk_encryption() -> DiskEncryption {
    #[cfg(windows)]
    {
        // 使用 Get-BitLockerVolume 获取所有卷的加密状态
        let ps_cmd = r#"
            [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
            Get-BitLockerVolume | ForEach-Object {
                $vol = $_.MountPoint
                $pct = if ($null -ne $_.EncryptionPercentage) { "$($_.EncryptionPercentage)%" } else { "N/A" }
                $method = if ($null -ne $_.EncryptionMethod) { $_.EncryptionMethod.ToString() } else { "N/A" }
                $prot = if ($null -ne $_.ProtectionStatus) { $_.ProtectionStatus.ToString() } else { "Unknown" }
                $locked = $_.VolumeStatus -match 'Locked'
                $status = if ($locked) { "已锁定" } elseif ($pct -eq '100%' -or $pct -eq 'FullyEncrypted') { "完全加密" } elseif ($pct -ne 'N/A' -and $pct -ne '0%') { "加密中" } else { "未加密" }
                "$vol|$pct|$method|$prot|$status"
            }
        "#;

        if let Ok(output) = Command::new("powershell")
            .args(["-NoProfile", "-Command", ps_cmd])
            .output()
        {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let mut volumes: Vec<VolumeEncryption> = Vec::new();
                let mut overall_status = "未加密".to_string();

                for line in stdout.lines() {
                    let line = line.trim();
                    if line.is_empty() {
                        continue;
                    }
                    let parts: Vec<&str> = line.split('|').collect();
                    if parts.len() >= 5 {
                        let vol = parts[0].trim().to_string();
                        let pct = parts[1].trim().to_string();
                        let method = parts[2].trim().to_string();
                        let prot = parts[3].trim().to_string();
                        let status = parts[4].trim().to_string();

                        if !vol.is_empty() {
                            volumes.push(VolumeEncryption {
                                volume: vol,
                                percentage: pct,
                                method,
                                protection: prot,
                            });

                            // 汇总状态
                            if status == "完全加密" && overall_status != "部分加密" {
                                overall_status = "完全加密".to_string();
                            } else if status == "加密中" {
                                overall_status = "部分加密".to_string();
                            } else if status == "已锁定" {
                                overall_status = "已锁定".to_string();
                            } else if overall_status == "未加密" && status != "未加密" {
                                overall_status = "部分加密".to_string();
                            }
                        }
                    }
                }

                if volumes.is_empty() {
                    // BitLocker 未启用，逐卷检测
                    let fallback = get_disk_encryption_fallback();
                    if fallback.volumes.is_empty() {
                        return DiskEncryption {
                            status: "未加密".to_string(),
                            volumes: Vec::new(),
                        };
                    }
                    return fallback;
                }

                return DiskEncryption {
                    status: overall_status,
                    volumes,
                };
            }
        }

        // 兜底：直接用 manage-bde 原始输出
        let fallback = get_disk_encryption_fallback();
        if fallback.volumes.is_empty() {
            return DiskEncryption {
                status: "未加密".to_string(),
                volumes: Vec::new(),
            };
        }
        fallback
    }
    #[cfg(target_os = "macos")]
    {
        get_macos_disk_encryption()
    }
    #[cfg(target_os = "linux")]
    {
        get_linux_disk_encryption()
    }
    #[cfg(not(any(windows, target_os = "macos", target_os = "linux")))]
    {
        DiskEncryption {
            status: "N/A".to_string(),
            volumes: Vec::new(),
        }
    }
}

/// Windows 兜底：用 manage-bde 读取
#[cfg(windows)]
fn get_disk_encryption_fallback() -> DiskEncryption {
    if let Ok(output) = Command::new("cmd")
        .args(["/c", "manage-bde -status"])
        .output()
    {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut volumes: Vec<VolumeEncryption> = Vec::new();
            let mut current_vol = String::new();
            let mut pct = String::new();
            let mut method = String::new();
            let mut prot = String::new();
            let mut overall_status = "未加密".to_string();

            for line in stdout.lines() {
                let line = line.trim();
                if line.starts_with("Volume ") && line.ends_with(":") {
                    if !current_vol.is_empty() {
                        volumes.push(VolumeEncryption {
                            volume: current_vol.clone(),
                            percentage: pct.clone(),
                            method: method.clone(),
                            protection: prot.clone(),
                        });
                    }
                    current_vol = line.trim_end_matches(':').to_string();
                    pct = "N/A".to_string();
                    method = "N/A".to_string();
                    prot = "Unknown".to_string();
                } else if line.starts_with("Conversion Percentage:") {
                    pct = line.replace("Conversion Percentage:", "").trim().to_string();
                } else if line.starts_with("Encryption Method:") {
                    method = line.replace("Encryption Method:", "").trim().to_string();
                } else if line.starts_with("Protection Status:") {
                    prot = line.replace("Protection Status:", "").trim().to_string();
                } else if line.starts_with("Conversion Status:") {
                    let status = line.replace("Conversion Status:", "").trim().to_lowercase();
                    if status.contains("fully") || status.contains("complete") {
                        overall_status = "完全加密".to_string();
                    } else if status.contains("percent") || status.contains("encryption") {
                        overall_status = "部分加密".to_string();
                    }
                }
            }
            if !current_vol.is_empty() {
                volumes.push(VolumeEncryption {
                    volume: current_vol,
                    percentage: pct,
                    method,
                    protection: prot,
                });
            }

            return DiskEncryption {
                status: if volumes.is_empty() { "未加密".to_string() } else { overall_status },
                volumes,
            };
        }
    }
    DiskEncryption {
        status: "未知".to_string(),
        volumes: Vec::new(),
    }
}

#[cfg(target_os = "macos")]
fn get_macos_disk_encryption() -> DiskEncryption {
    // fdesetup status 输出：
    //   FileVault is On.
    //   FileVault is Off.
    //   FileVault is being decrypted.
    //   FileVault is being encrypted.
    let output = Command::new("fdesetup")
        .args(["status"])
        .output();

    let raw = output
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default();

    let status = if raw.contains("FileVault is On") {
        "已开启".to_string()
    } else if raw.contains("FileVault is Off") {
        "未开启".to_string()
    } else if raw.contains("being decrypted") {
        "解密中".to_string()
    } else if raw.contains("being encrypted") {
        "加密中".to_string()
    } else {
        "未知".to_string()
    };

    DiskEncryption {
        status,
        volumes: vec![VolumeEncryption {
            volume: "/".to_string(),
            percentage: if status == "已开启" { "100%".to_string() } else { "0%".to_string() },
            method: "XTS-AES-128".to_string(),
            protection: if status == "已开启" { "ON".to_string() } else { "OFF".to_string() },
        }],
    }
}

#[cfg(target_os = "linux")]
fn get_linux_disk_encryption() -> DiskEncryption {
    // 检测 LUKS：cryptsetup isLuks
    // 也可以检查 /sys/class/block/*/device 或 blkid 输出
    let output = Command::new("lsblk")
        .args(["-o", "NAME,TYPE,FSTYPE,MOUNTPOINT"])
        .output();

    let raw = output
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default();

    let mut volumes: Vec<VolumeEncryption> = Vec::new();
    let mut any_luks = false;

    for line in raw.lines().skip(1) {
        // 跳过标题行
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
            let name = parts[0].to_string();
            let dev_type = parts[1];
            let fstype = parts.get(2).copied().unwrap_or("");

            if dev_type == "crypt" || fstype == "crypto_LUKS" {
                any_luks = true;
                volumes.push(VolumeEncryption {
                    volume: format!("/dev/{}", name),
                    percentage: "100%".to_string(),
                    method: "LUKS2".to_string(),
                    protection: "ON".to_string(),
                });
            } else if dev_type == "part" || dev_type == "disk" {
                // 未加密的普通分区
                volumes.push(VolumeEncryption {
                    volume: format!("/dev/{}", name),
                    percentage: "0%".to_string(),
                    method: "未加密".to_string(),
                    protection: "OFF".to_string(),
                });
            }
        }
    }

    DiskEncryption {
        status: if any_luks { "已加密(LUKS)".to_string() } else { "未检测到加密".to_string() },
        volumes,
    }
}

// =============================================================================
// 安全状态（UAC / SIP / SafeBoot / 实时保护）
// =============================================================================

/// 安全状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityState {
    /// UAC 是否开启（仅 Windows）
    pub uac_enabled: String,
    /// 安全启动状态（仅 Windows/UEFI）
    pub safe_boot: String,
    /// 系统完整性保护（macOS SIP / Windows Defender 实时保护）
    pub system_integrity: String,
    /// 实时保护状态（Windows Defender / macOS XProtect）
    pub realtime_protection: String,
    /// 综合安全评分（高/中/低）
    pub security_level: String,
}

impl Default for SecurityState {
    fn default() -> Self {
        Self {
            uac_enabled: "未知".to_string(),
            safe_boot: "未知".to_string(),
            system_integrity: "未知".to_string(),
            realtime_protection: "未知".to_string(),
            security_level: "未知".to_string(),
        }
    }
}

fn get_security_state() -> SecurityState {
    #[cfg(windows)]
    {
        get_windows_security_state()
    }
    #[cfg(target_os = "macos")]
    {
        get_macos_security_state()
    }
    #[cfg(target_os = "linux")]
    {
        get_linux_security_state()
    }
    #[cfg(not(any(windows, target_os = "macos", target_os = "linux")))]
    {
        SecurityState::default()
    }
}

#[cfg(windows)]
fn get_windows_security_state() -> SecurityState {
    use std::process::Command;

    // 1. UAC：读取注册表 HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\EnableLUA
    let uac_enabled = if let Ok(output) = Command::new("reg")
        .args([
            "query",
            r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System",
            "/v",
            "EnableLUA",
        ])
        .output()
    {
        let s = String::from_utf8_lossy(&output.stdout).to_string();
        if s.contains("0x0") {
            "已禁用 ⚠️".to_string()
        } else if s.contains("0x1") {
            "已启用".to_string()
        } else {
            "未知".to_string()
        }
    } else {
        "未知".to_string()
    };

    // 2. 安全启动：bcdedit /enum all 检查 safeboot
    let safe_boot = if let Ok(output) = Command::new("bcdedit")
        .args(["/enum", "all"])
        .output()
    {
        let s = String::from_utf8_lossy(&output.stdout).to_lowercase();
        if s.contains("safeboot") {
            "启用（安全模式）⚠️".to_string()
        } else {
            "未启用（正常启动）".to_string()
        }
    } else {
        "未知".to_string()
    };

    // 3. Windows Defender 实时保护
    let realtime_protection = if let Ok(output) = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; \
             $r = Get-MpComputerStatus; \
             if ($r.RealTimeProtectionEnabled) { '已启用' } else { '已禁用 ⚠️' }",
        ])
        .output()
    {
        let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if s.is_empty() { "未知".to_string() } else { s }
    } else {
        "未知".to_string()
    };

    // 4. Defender 篡改保护（TamperProtection）
    let tamper_protection = if let Ok(output) = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; \
             $r = Get-MpComputerStatus; \
             if ($r.TamperProtectionEnabled) { '已启用' } else { '已禁用 ⚠️' }",
        ])
        .output()
    {
        let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if s.is_empty() { "未知".to_string() } else { s }
    } else {
        "未知".to_string()
    };

    // 5. 综合安全评分
    let mut score = 0i32;
    if uac_enabled.contains("已启用") { score += 2; }
    if safe_boot.contains("正常启动") { score += 1; }
    if realtime_protection.contains("已启用") { score += 2; }
    if tamper_protection.contains("已启用") { score += 1; }

    let security_level = match score {
        0..=1 => "低 ⚠️",
        2..=3 => "中",
        4..=6 => "高",
        _ => "未知",
    }.to_string();

    SecurityState {
        uac_enabled,
        safe_boot,
        system_integrity: tamper_protection, // 复用字段表示篡改保护
        realtime_protection,
        security_level,
    }
}

#[cfg(target_os = "macos")]
fn get_macos_security_state() -> SecurityState {
    // 1. SIP：csrutil status
    let sip = if let Ok(output) = Command::new("csrutil").arg("status").output() {
        let s = String::from_utf8_lossy(&output.stdout).to_lowercase();
        if s.contains("enabled") {
            "已启用".to_string()
        } else if s.contains("disabled") {
            "已禁用 ⚠️".to_string()
        } else {
            "未知".to_string()
        }
    } else {
        "未知".to_string()
    };

    // 2. 安全启动模式
    let safe_boot = if let Ok(output) = Command::new("nvram")
        .args(["-p"])
        .output()
    {
        let s = String::from_utf8_lossy(&output.stdout);
        if s.contains("boot-args") && s.to_string().contains("safe-mode") {
            "安全模式 ⚠️".to_string()
        } else {
            "正常启动".to_string()
        }
    } else {
        "未知".to_string()
    };

    // 3. XProtect（内置恶意软件防护）
    let xprotect = if let Ok(output) = Command::new("defaults")
        .args(["read", "/Library/Apple/System/Library/CoreServices/XProtect.bundle/Contents/Resources/XProtect.meta.plist", "CFBundleVersion"])
        .output()
    {
        let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !s.starts_with("Could") && !s.is_empty() {
            format!("已启用 (v{})", s)
        } else {
            "未知".to_string()
        }
    } else {
        "未知".to_string()
    };

    // 4. Gatekeeper
    let gatekeeper = if let Ok(output) = Command::new("spctl")
        .args(["--status"])
        .output()
    {
        let s = String::from_utf8_lossy(&output.stdout);
        if s.contains("enabled") {
            "已启用".to_string()
        } else if s.contains("disabled") {
            "已禁用 ⚠️".to_string()
        } else {
            "未知".to_string()
        }
    } else {
        "未知".to_string()
    };

    let mut score = 0i32;
    if sip.contains("已启用") { score += 2; }
    if safe_boot.contains("正常") { score += 1; }
    if xprotect.contains("已启用") { score += 2; }
    if gatekeeper.contains("已启用") { score += 1; }

    let security_level = match score {
        0..=1 => "低 ⚠️",
        2..=3 => "中",
        4..=6 => "高",
        _ => "未知",
    }.to_string();

    SecurityState {
        uac_enabled: gatekeeper, // Gatekeeper 替代 Windows UAC 的概念
        safe_boot,
        system_integrity: sip,
        realtime_protection: xprotect,
        security_level,
    }
}

#[cfg(target_os = "linux")]
fn get_linux_security_state() -> SecurityState {
    // 1. 检查 AppArmor / SELinux 状态
    let apparmor = if let Ok(output) = Command::new("aa-status")
        .output()
    {
        let s = String::from_utf8_lossy(&output.stdout).to_lowercase();
        if s.contains("apparmor is enabled") {
            "已启用".to_string()
        } else if s.contains("apparmor is not loaded") {
            "未加载 ⚠️".to_string()
        } else {
            "未安装".to_string()
        }
    } else if let Ok(output) = Command::new("getenforce").output() {
        let s = String::from_utf8_lossy(&output.stdout).trim().to_lowercase();
        match s.as_str() {
            "enforcing" => "SELinux Enforcing".to_string(),
            "permissive" => "SELinux Permissive".to_string(),
            "disabled" => "SELinux Disabled ⚠️".to_string(),
            _ => "未知".to_string(),
        }
    } else {
        "未知".to_string()
    };

    let score = if apparmor.contains("已启用") || apparmor.contains("Enforcing") { 3 } else { 0 };

    SecurityState {
        uac_enabled: apparmor.clone(),
        safe_boot: "N/A（Linux）".to_string(),
        system_integrity: apparmor,
        realtime_protection: "N/A".to_string(),
        security_level: match score {
            0 => "低 ⚠️",
            1..=2 => "中",
            3 => "高",
            _ => "未知",
        }.to_string(),
    }
}

// =============================================================================
// 已安装软件清单
// =============================================================================

/// 软件清单结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoftwareList {
    /// 软件数量
    pub count: usize,
    /// 软件列表（名称, 版本, 发行者, 安装路径）
    pub packages: Vec<SoftwarePackage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoftwarePackage {
    pub name: String,
    pub version: String,
    pub vendor: String,
    pub install_location: String,
}

impl Default for SoftwareList {
    fn default() -> Self {
        Self {
            count: 0,
            packages: Vec::new(),
        }
    }
}

fn get_installed_software() -> SoftwareList {
    #[cfg(windows)]
    {
        get_windows_software()
    }
    #[cfg(target_os = "macos")]
    {
        get_macos_software()
    }
    #[cfg(target_os = "linux")]
    {
        get_linux_software()
    }
    #[cfg(not(any(windows, target_os = "macos", target_os = "linux")))]
    {
        SoftwareList::default()
    }
}

#[cfg(windows)]
fn get_windows_software() -> SoftwareList {
    // 从注册表 HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall 读取已安装程序
    let ps_cmd = r#"
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
        $keys = @(
            'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
            'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
            'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
        );
        Get-ItemProperty $keys -ErrorAction SilentlyContinue |
            Where-Object { $_.DisplayName -and $_.DisplayName -ne '' } |
            Select-Object DisplayName, DisplayVersion, Publisher, InstallLocation |
            ConvertTo-Json -Compress
    "#;

    if let Ok(output) = Command::new("powershell")
        .args(["-NoProfile", "-Command", ps_cmd])
        .output()
    {
        if output.status.success() {
            let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !s.is_empty() && s != "null" {
                // 解析 JSON 数组
                let packages: Vec<SoftwarePackage> = if s.starts_with('[') {
                    // JSON 数组
                    if let Ok(items) = serde_json::from_str::<Vec<serde_json::Value>>(&s) {
                        items.into_iter()
                            .filter_map(|v| {
                                let name = v["DisplayName"].as_str().unwrap_or("").to_string();
                                if name.is_empty() { return None; }
                                Some(SoftwarePackage {
                                    name,
                                    version: v["DisplayVersion"].as_str().unwrap_or("").to_string(),
                                    vendor: v["Publisher"].as_str().unwrap_or("").to_string(),
                                    install_location: v["InstallLocation"].as_str().unwrap_or("").to_string(),
                                })
                            })
                            .collect()
                    } else {
                        Vec::new()
                    }
                } else if !s.starts_with('{') {
                    // 单个元素，按对象处理
                    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&s) {
                        let name = v["DisplayName"].as_str().unwrap_or("").to_string();
                        if !name.is_empty() {
                            vec![SoftwarePackage {
                                name,
                                version: v["DisplayVersion"].as_str().unwrap_or("").to_string(),
                                vendor: v["Publisher"].as_str().unwrap_or("").to_string(),
                                install_location: v["InstallLocation"].as_str().unwrap_or("").to_string(),
                            }]
                        } else {
                            Vec::new()
                        }
                    } else {
                        Vec::new()
                    }
                } else {
                    Vec::new()
                };

                let count = packages.len();
                return SoftwareList { count, packages };
            }
        }
    }

    SoftwareList::default()
}

#[cfg(target_os = "macos")]
fn get_macos_software() -> SoftwareList {
    // 读取 /Applications 和 brew list
    let mut packages: Vec<SoftwarePackage> = Vec::new();

    // 从 /Applications 读取.app 包
    if let Ok(entries) = std::fs::read_dir("/Applications") {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.extension().map(|e| e == "app").unwrap_or(false) {
                let name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();
                // 尝试从 Info.plist 读取版本
                let version = std::fs::read_to_string(path.join("Contents/Info.plist"))
                    .ok()
                    .and_then(|pl| {
                        pl.lines()
                            .find(|l| l.contains("CFBundleShortVersionString"))
                            .map(|l| l.split('>').nth(1)
                                .map(|v| v.split('<').next().unwrap_or("").to_string())
                                .unwrap_or_default())
                    })
                    .unwrap_or_default();

                packages.push(SoftwarePackage {
                    name,
                    version,
                    vendor: "".to_string(),
                    install_location: path.to_string_lossy().to_string(),
                });
            }
        }
    }

    // brew list
    if let Ok(output) = Command::new("brew").args(["list", "--formula"]).output() {
        if output.status.success() {
            for line in String::from_utf8_lossy(&output.stdout).lines() {
                let name = line.trim().to_string();
                if !name.is_empty() {
                    packages.push(SoftwarePackage {
                        name: name.clone(),
                        version: "".to_string(),
                        vendor: "Homebrew".to_string(),
                        install_location: format!("/usr/local/Cellar/{}", name),
                    });
                }
            }
        }
    }

    let count = packages.len();
    SoftwareList { count, packages }
}

#[cfg(target_os = "linux")]
fn get_linux_software() -> SoftwareList {
    let mut packages: Vec<SoftwarePackage> = Vec::new();

    // dpkg -l (Debian/Ubuntu)
    if let Ok(output) = Command::new("dpkg").args(["-l"]).output() {
        if output.status.success() {
            for line in String::from_utf8_lossy(&output.stdout).lines().skip(5) {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 4 && parts[0] == "ii" {
                    packages.push(SoftwarePackage {
                        name: parts[1].to_string(),
                        version: parts[2].to_string(),
                        vendor: "".to_string(),
                        install_location: "".to_string(),
                    });
                }
            }
        }
    } else if let Ok(output) = Command::new("rpm").args(["-qa", "--queryformat", "%{NAME}|%{VERSION}\n"]).output() {
        // RPM (RHEL/CentOS)
        if output.status.success() {
            for line in String::from_utf8_lossy(&output.stdout).lines() {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 2 {
                    packages.push(SoftwarePackage {
                        name: parts[0].to_string(),
                        version: parts[1].to_string(),
                        vendor: "".to_string(),
                        install_location: "".to_string(),
                    });
                }
            }
        }
    }

    let count = packages.len();
    SoftwareList { count, packages }
}

// =============================================================================
// 设备安全上下文汇总
// =============================================================================

/// 设备安全上下文（设备上下文的一部分）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceSecurity {
    pub disk_encryption: DiskEncryption,
    pub security_state: SecurityState,
    pub software_list: SoftwareList,
    pub firewall: FirewallInfo,
}

/// 采集所有设备安全信息
pub fn collect_device_security() -> DeviceSecurity {
    DeviceSecurity {
        disk_encryption: get_disk_encryption(),
        security_state: get_security_state(),
        software_list: get_installed_software(),
        firewall: get_firewall_info(),
    }
}

// =============================================================================
// 辅助：格式化软件包列表用于终端打印（限制数量避免过长）
// =============================================================================

/// 返回软件清单的终端打印摘要（最多显示 N 条）
pub fn format_software_summary(list: &SoftwareList, max_items: usize) -> String {
    if list.packages.is_empty() {
        return "无".to_string();
    }

    let display: Vec<&SoftwarePackage> = list.packages.iter().take(max_items).collect();
    let names: Vec<String> = display.iter().map(|p| {
        if p.version.is_empty() {
            p.name.clone()
        } else {
            format!("{} (v{})", p.name, p.version)
        }
    }).collect();

    let base = names.join(", ");
    if list.count > max_items {
        format!("{}... 等共 {} 个", base, list.count)
    } else {
        base
    }
}

// =============================================================================
// 防火墙信息
// =============================================================================

/// 防火墙采集结果：
/// - profile_states: 各 Profile（Domain/Private/Public）的启用状态（"开"/"关"）
/// - all_enabled: 三个 Profile 是否全部开启（任一关闭则 false）
/// - raw_summary: 兜底字符串，用于显示防火墙整体概述
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FirewallInfo {
    pub profile_states: Vec<(String, String)>,
    pub all_enabled: bool,
    pub raw_summary: String,
}

/// 读取当前 Windows Defender 防火墙（netsh advfirewall）各 Profile 状态。
/// 非 Windows 平台返回 N/A。
pub fn get_firewall_info() -> FirewallInfo {
    #[cfg(windows)]
    {
        use std::process::Command;

        let ps_cmd = "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; \
            $lines = netsh advfirewall show allprofiles; \
            $current = ''; \
            $map = @{}; \
            foreach ($l in $lines) { \
                $t = $l.Trim(); \
                if ($t -match '^(Domain|Private|Public) Profile Settings:$') { \
                    $current = $Matches[1]; \
                } elseif ($current -and $t -match '^State\\s+(ON|OFF|未配置|Not configured)') { \
                    $map[$current] = $Matches[1]; \
                    $current = ''; \
                } \
            }; \
            ($map.Keys | Sort-Object) | ForEach-Object { \
                $state = $map[$_]; \
                $cn = switch ($_) { 'Domain' {'域'} 'Private' {'专用'} 'Public' {'公用'} default {$_} }; \
                $cnState = switch ($state) { 'ON' {'开'} 'OFF' {'关'} default {'未知'} }; \
                \"{0}={1}({2})\" -f $_, $state, $cnState \
            } | Join-String -Separator ','; \
        ";

        if let Ok(out) = Command::new("powershell")
            .args(["-NoProfile", "-Command", ps_cmd])
            .output()
        {
            if out.status.success() {
                let raw = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !raw.is_empty() {
                    let mut states: Vec<(String, String)> = Vec::new();
                    let mut all_on = true;
                    for part in raw.split(',') {
                        let p = part.trim();
                        if p.is_empty() {
                            continue;
                        }
                        let mut kv = p.splitn(2, '=');
                        let key = kv.next().unwrap_or("").trim();
                        let val = kv.next().unwrap_or("").trim();
                        let on = val.starts_with("ON");
                        let cn = if let Some(idx) = val.find('(') {
                            val[idx + 1..].trim_end_matches(')').to_string()
                        } else {
                            val.to_string()
                        };
                        let label = match key {
                            "Domain" => "域".to_string(),
                            "Private" => "专用".to_string(),
                            "Public" => "公用".to_string(),
                            other => other.to_string(),
                        };
                        if !on {
                            all_on = false;
                        }
                        states.push((label, cn));
                    }
                    if !states.is_empty() {
                        return FirewallInfo {
                            profile_states: states,
                            all_enabled: all_on,
                            raw_summary: raw,
                        };
                    }
                }
            }
        }

        if let Ok(out) = Command::new("netsh")
            .args(["advfirewall", "show", "allprofiles"])
            .output()
        {
            if out.status.success() {
                let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !s.is_empty() {
                    let lowered = s.to_lowercase();
                    let all_on = lowered.contains("state                                 on")
                        && !lowered.contains("state                                 off");
                    return FirewallInfo {
                        profile_states: Vec::new(),
                        all_enabled: all_on,
                        raw_summary: s,
                    };
                }
            }
        }

        FirewallInfo {
            profile_states: Vec::new(),
            all_enabled: false,
            raw_summary: "无法获取防火墙状态".to_string(),
        }
    }
    #[cfg(not(windows))]
    {
        FirewallInfo {
            profile_states: Vec::new(),
            all_enabled: false,
            raw_summary: "N/A".to_string(),
        }
    }
}
