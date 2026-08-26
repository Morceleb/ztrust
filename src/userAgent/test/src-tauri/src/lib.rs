mod database;
mod device;
mod activity;
mod wifi;
mod bluetooth;
mod spa;

use activity::{ActivityConfig, ActivityMonitor};
use bluetooth::BluetoothDevice;
use database::Database;
use device::DeviceInfo;
use log::{info, LevelFilter};
use serde::{Deserialize, Serialize};
use std::sync::{Mutex, MutexGuard};
use tauri::{AppHandle, Manager, State};
use wifi::WifiNetwork;

// 应用状态
pub struct AppState {
    pub db: Mutex<Option<Database>>,
    pub activity_monitor: Mutex<Option<ActivityMonitor>>,
    pub device_info: Mutex<Option<DeviceInfo>>,
    pub is_logged_in: Mutex<bool>,
    pub user_info: Mutex<Option<UserInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: String,
    pub name: String,
}

fn get_or_init_db<'a>(db_guard: &'a mut MutexGuard<'_, Option<Database>>) -> Result<&'a Database, String> {
    if db_guard.is_none() {
        info!("数据库延迟初始化开始");
        **db_guard = Some(Database::new()?);
        info!("数据库延迟初始化完成");
    }

    db_guard
        .as_ref()
        .ok_or_else(|| "数据库未初始化".to_string())
}

fn get_or_init_device_info<'a>(device_guard: &'a mut MutexGuard<'_, Option<DeviceInfo>>) -> Result<&'a DeviceInfo, String> {
    if device_guard.is_none() {
        info!("设备信息延迟初始化开始");
        **device_guard = Some(device::generate_device_info()?);
        info!("设备信息延迟初始化完成");
    }

    device_guard
        .as_ref()
        .ok_or_else(|| "设备信息未初始化".to_string())
}

// ==================== 窗口控制命令 ====================

#[tauri::command]
fn window_control(action: &str, window_label: Option<&str>, app: AppHandle) -> Result<(), String> {
    let label = window_label.unwrap_or("main");
    let window = if label == "main" {
        app.get_webview_window("main").ok_or("主窗口未找到")?
    } else {
        app.get_webview_window(label).ok_or_else(|| format!("窗口 {} 未找到", label))?
    };

    match action {
        "minimize" => window.minimize().map_err(|e| e.to_string()),
        "maximize" => {
            if window.is_maximized().unwrap_or(false) {
                window.unmaximize().map_err(|e| e.to_string())
            } else {
                window.maximize().map_err(|e| e.to_string())
            }
        },
        "close" => window.close().map_err(|e| e.to_string()),
        "hide" => window.hide().map_err(|e| e.to_string()),
        "show" => window.show().map_err(|e| e.to_string()),
        "is_maximized" => {
            let _maximized = window.is_maximized().unwrap_or(false);
            Ok(())
        },
        _ => Err(format!("未知的窗口操作: {}", action)),
    }
}

#[tauri::command]
fn window_start_dragging(window_label: Option<&str>, app: AppHandle) -> Result<(), String> {
    let label = window_label.unwrap_or("main");
    let window = if label == "main" {
        app.get_webview_window("main").ok_or("主窗口未找到")?
    } else {
        app.get_webview_window(label).ok_or_else(|| format!("窗口 {} 未找到", label))?
    };
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
async fn open_resource_window(
    app: AppHandle,
    resource_id: String,
    title: String,
    base_url: Option<String>,
) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;

    info!(
        "[Window] 打开资源窗口: id={}, title={}",
        resource_id, title
    );

    let raw_base = base_url.unwrap_or_else(|| {
        let store = app.store("settings.json").ok();
        store
            .and_then(|s| s.get("companyAddress").and_then(|v| v.as_str().map(|s| s.to_string())))
            .unwrap_or_else(|| "http://localhost:1420".to_string())
    });

    let store = app.store("settings.json")
        .map_err(|e| format!("读取 store 失败: {}", e))?;

    let token = store.get("access_token")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_default();

    // 获取其他认证信息
    let security_code = store.get("securityCode")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_default();
    // 读到的历史 store 数据可能仍含 UUID 连字符或短长度（16 字节），
    // 这里规范化并升级到 32 字节 hex（防御性，确保 SPA 能拿到正确长度）
    let device_id_raw = store.get("deviceFingerprint")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_default();
    let device_id = upgrade_to_64_hex(&normalize_hex_value(&device_id_raw));
    let license_id_raw = store.get("licenseId")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_default();
    let license_id = normalize_hex_value(&license_id_raw);

    // 资源访问时不再发送 SPA 报文（SPA 仅在登录时发送一次，端口开放后持续有效）
    // 保留读取 security_code/device_id/license_id 是因为 resource-proxy.html 仍需要这些参数

    use tauri::WebviewUrl;

    let proxy_url = if cfg!(debug_assertions) {
        format!(
            "http://localhost:5173/resource-proxy.html?baseUrl={}&resourceId={}&authToken={}&securityCode={}&deviceId={}&licenseId={}",
            urlencoding::encode(&raw_base),
            urlencoding::encode(&resource_id),
            urlencoding::encode(&token),
            urlencoding::encode(&security_code),
            urlencoding::encode(&device_id),
            urlencoding::encode(&license_id),
        )
    } else {
        format!(
            "resource:///resource-proxy.html?baseUrl={}&resourceId={}&authToken={}&securityCode={}&deviceId={}&licenseId={}",
            urlencoding::encode(&raw_base),
            urlencoding::encode(&resource_id),
            urlencoding::encode(&token),
            urlencoding::encode(&security_code),
            urlencoding::encode(&device_id),
            urlencoding::encode(&license_id),
        )
    };

    info!(
        "[Window] 创建资源窗口: baseUrl={}, resourceId={}",
        raw_base,
        resource_id,
    );

    let label = format!("resource_{}", uuid::Uuid::new_v4().to_string().replace("-", ""));

    tauri::WebviewWindowBuilder::new(
        &app,
        &label,
        WebviewUrl::External(proxy_url.parse().map_err(|e| format!("URL 解析失败: {}", e))?),
    )
    .title(&title)
    .inner_size(1024.0, 700.0)
    .resizable(true)
    .center()
    .build()
    .map_err(|e| format!("创建资源窗口失败: {}", e))?;

    info!("[Window] 资源窗口已创建: resourceId={}", resource_id);
    Ok(())
}

// ==================== 活动监控命令 ====================

#[tauri::command]
async fn activity_init(
    user_info: UserInfo,
    state: State<'_, AppState>,
) -> Result<(), String> {
    info!("[Activity] 初始化监控，用户: {:?}", user_info);
    
    let mut monitor = state.activity_monitor.lock().map_err(|e| e.to_string())?;
    
    let config = ActivityConfig {
        sample_rates: activity::SampleRates {
            mouse: 100,
            keyboard: 100,
            scroll: 100,
        },
        batch: activity::BatchConfig {
            save_interval: 2 * 60 * 1000,
            upload_interval: 3 * 60 * 1000,
            max_batch_records: 10000,
        },
        inactivity_timeout: 6 * 60 * 1000,
        inactivity_check_interval: 1000,
    };
    
    *monitor = Some(ActivityMonitor::new(config));
    
    if let Some(ref mut m) = *monitor {
        m.init(user_info.id.clone(), user_info.name.clone());
    }
    
    Ok(())
}

#[tauri::command]
async fn activity_start(state: State<'_, AppState>) -> Result<(), String> {
    info!("[Activity] 启动监控");
    let mut monitor = state.activity_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut m) = *monitor {
        m.start();
    }
    Ok(())
}

#[tauri::command]
async fn activity_stop(state: State<'_, AppState>) -> Result<(), String> {
    info!("[Activity] 停止监控");
    let monitor = state.activity_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(ref m) = *monitor {
        m.stop();
    }
    Ok(())
}

#[tauri::command]
async fn activity_reset(user_info: UserInfo, state: State<'_, AppState>) -> Result<(), String> {
    info!("[Activity] 重置监控");
    let mut monitor = state.activity_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut m) = *monitor {
        m.reset(&user_info.id, &user_info.name);
    }
    Ok(())
}

#[tauri::command]
async fn activity_set_login_state(
    is_logged_in: bool,
    user_info: Option<UserInfo>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    info!("[Activity] 设置登录状态: {}", is_logged_in);
    
    {
        let mut login_state = state.is_logged_in.lock().map_err(|e| e.to_string())?;
        *login_state = is_logged_in;
    }
    
    {
        let mut user = state.user_info.lock().map_err(|e| e.to_string())?;
        *user = user_info;
    }
    
    let monitor = state.activity_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(ref m) = *monitor {
        m.set_login_state(is_logged_in);
    }
    
    Ok(())
}

#[tauri::command]
async fn activity_logout(
    logout_type: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    info!("[Activity] 注销: {}", logout_type);
    
    let monitor = state.activity_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(ref m) = *monitor {
        m.report_logout(&logout_type);
    }
    
    // 清除登录状态
    {
        let mut login_state = state.is_logged_in.lock().map_err(|e| e.to_string())?;
        *login_state = false;
    }
    
    {
        let mut user = state.user_info.lock().map_err(|e| e.to_string())?;
        *user = None;
    }
    
    Ok(())
}

#[tauri::command]
async fn activity_get_stats(state: State<'_, AppState>) -> Result<Option<activity::ActivityStats>, String> {
    let monitor = state.activity_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(ref m) = *monitor {
        Ok(Some(m.get_stats()))
    } else {
        Ok(None)
    }
}

// ==================== 设备信息命令 ====================

#[tauri::command]
async fn get_device_info(state: State<'_, AppState>) -> Result<DeviceInfo, String> {
    let mut device = state.device_info.lock().map_err(|e| e.to_string())?;
    let info = get_or_init_device_info(&mut device)?;
    info!("[DeviceFingerprint] Tauri 设备信息: {:?}", info);
    Ok(info.clone())
}

/// 获取实时登录会话信息（IP、登录时间等）
#[tauri::command]
async fn get_login_session_info() -> Result<serde_json::Value, String> {
    // 获取真实公网 IP
    let ip = get_public_ip().await.unwrap_or_else(|_| "未知".to_string());
    // 获取本地 IP
    let local_ip = get_local_ip();
    // 根据 IP 查询地理位置
    let location = get_ip_location(&ip).await;
    // 当前时间
    let login_time = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    Ok(serde_json::json!({
        "ip": ip,
        "localIp": local_ip,
        "location": location,
        "loginTime": login_time,
    }))
}

async fn get_public_ip() -> Result<String, String> {
    use tauri_plugin_http::reqwest::Client;
    let client = Client::new();
    // 尝试主 endpoint（支持系统代理）
    if let Ok(resp) = client.get("https://api.ipify.org?format=text").send().await {
        if let Ok(text) = resp.text().await {
            let ip = text.trim();
            if !ip.is_empty() && ip.len() <= 45 {
                return Ok(ip.to_string());
            }
        }
    }
    // fallback：备用服务
    if let Ok(resp) = client.get("https://ifconfig.me/ip").send().await {
        if let Ok(text) = resp.text().await {
            let ip = text.trim();
            if !ip.is_empty() && ip.len() <= 45 {
                return Ok(ip.to_string());
            }
        }
    }
    Err("无法获取公网IP".to_string())
}

/// 拼音 → 中文 映射（常见省份 + 城市）
fn pinyin_to_chinese(pinyin: &str) -> Option<&'static str> {
    match pinyin.to_lowercase().as_str() {
        // 省份
        "beijing" => Some("北京"),
        "tianjin" => Some("天津"),
        "hebei" => Some("河北"),
        "shanxi" => Some("山西"),
        "neimenggu" | "inner mongolia" => Some("内蒙古"),
        "liaoning" => Some("辽宁"),
        "jilin" => Some("吉林"),
        "heilongjiang" => Some("黑龙江"),
        "shanghai" => Some("上海"),
        "jiangsu" => Some("江苏"),
        "zhejiang" => Some("浙江"),
        "anhui" => Some("安徽"),
        "fujian" => Some("福建"),
        "jiangxi" => Some("江西"),
        "shandong" => Some("山东"),
        "henan" => Some("河南"),
        "hubei" => Some("湖北"),
        "hunan" => Some("湖南"),
        "guangdong" => Some("广东"),
        "guangxi" => Some("广西"),
        "hainan" => Some("海南"),
        "chongqing" => Some("重庆"),
        "sichuan" => Some("四川"),
        "guizhou" => Some("贵州"),
        "yunnan" => Some("云南"),
        "xizang" | "tibet" => Some("西藏"),
        "shanxi" | "shaanxi" => Some("陕西"),
        "gansu" => Some("甘肃"),
        "qinghai" => Some("青海"),
        "ningxia" => Some("宁夏"),
        "xinjiang" => Some("新疆"),
        "hong kong" | "hongkong" | "xianggang" => Some("香港"),
        "taiwan" | "taiwan province" => Some("台湾"),
        "macau" | "aomen" => Some("澳门"),
        // 城市
        "nanjing" => Some("南京"),
        "wuxi" => Some("无锡"),
        "suzhou" => Some("苏州"),
        "hangzhou" => Some("杭州"),
        "ningbo" => Some("宁波"),
        "shenzhen" => Some("深圳"),
        "guangzhou" => Some("广州"),
        "chengdu" => Some("成都"),
        "xian" | "xi'an" => Some("西安"),
        "wuhan" => Some("武汉"),
        "changsha" => Some("长沙"),
        "zhengzhou" => Some("郑州"),
        "nanchang" => Some("南昌"),
        "hefei" => Some("合肥"),
        "nanchong" => Some("南充"),
        "nanchansi" => Some("南充"),
        "jinan" => Some("济南"),
        "qingdao" => Some("青岛"),
        "taiyuan" => Some("太原"),
        "shijiazhuang" => Some("石家庄"),
        "tangshan" => Some("唐山"),
        "dalian" => Some("大连"),
        "shenyang" => Some("沈阳"),
        "changchun" => Some("长春"),
        "harbin" => Some("哈尔滨"),
        "fuzhou" => Some("福州"),
        "xiamen" => Some("厦门"),
        "guiyang" => Some("贵阳"),
        "kunming" => Some("昆明"),
        "lanzhou" => Some("兰州"),
        "xining" => Some("西宁"),
        "yinchuan" => Some("银川"),
        "urumqi" | "wulumuqi" => Some("乌鲁木齐"),
        "lasa" | "lhasa" => Some("拉萨"),
        "baoding" => Some("保定"),
        "langfang" => Some("廊坊"),
        "baotou" => Some("包头"),
        "huhehaote" => Some("呼和浩特"),
        "sipailie" | "sipailieer" => Some("四排篱笆"),
        "nanshi" => Some("南市"),
        _ => None,
    }
}

fn cn_location_name(region: &str, city: &str) -> String {
    let r = pinyin_to_chinese(region).unwrap_or(region);
    let c = pinyin_to_chinese(city).unwrap_or(city);
    format!("{}{}", r, c)
}

/// 通过公网 IP 查询地理位置
async fn get_ip_location(ip: &str) -> String {
    use tauri_plugin_http::reqwest::Client;
    let client = Client::new();
    let url = format!("http://ip-api.com/json/{}", ip);
    match client.get(&url).send().await {
        Ok(resp) => {
            if let Ok(text) = resp.text().await {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                    let country = json.get("countryCode").and_then(|v| v.as_str()).unwrap_or("");
                    let region = json.get("regionName").and_then(|v| v.as_str()).unwrap_or("");
                    let city = json.get("city").and_then(|v| v.as_str()).unwrap_or("");
                    if country == "CN" && !region.is_empty() && !city.is_empty() {
                        return cn_location_name(region, city);
                    }
                    if !region.is_empty() && !city.is_empty() {
                        let r = pinyin_to_chinese(region).unwrap_or(region);
                        let c = pinyin_to_chinese(city).unwrap_or(city);
                        return format!("{}-{}", r, c);
                    }
                    if !country.is_empty() {
                        return country.to_string();
                    }
                }
            }
        }
        Err(_) => {}
    }
    // fallback：尝试 ip.sb
    match client.get("https://ip.sb/geo").send().await {
        Ok(resp) => {
            if let Ok(text) = resp.text().await {
                let region = text.lines()
                    .find(|l| l.starts_with("region:"))
                    .and_then(|l| l.split(':').nth(1))
                    .map(|v| v.trim().trim_matches('"'))
                    .unwrap_or("");
                let city = text.lines()
                    .find(|l| l.starts_with("city:"))
                    .and_then(|l| l.split(':').nth(1))
                    .map(|v| v.trim().trim_matches('"'))
                    .unwrap_or("");
                if !region.is_empty() && !city.is_empty() {
                    return cn_location_name(region, city);
                }
            }
        }
        Err(_) => {}
    }
    "未知".to_string()
}

fn get_local_ip() -> String {
    // 通过连接外网 Socket 自动获取本机出口 IP
    if let Ok(socket) = std::net::UdpSocket::bind("0.0.0.0:0") {
        if socket.connect("8.8.8.8:53").is_ok() {
            if let Ok(addr) = socket.local_addr() {
                return addr.ip().to_string();
            }
        }
    }
    "127.0.0.1".to_string()
}


#[tauri::command]
async fn scan_wifi_environment() -> Result<Vec<WifiNetwork>, String> {
    let networks = wifi::scan_top_wifi_networks(5)?;
    info!("[WifiEnvironment] 扫描到的前五 Wi‑Fi: {:?}", networks);
    Ok(networks)
}

#[tauri::command]
async fn get_paired_bluetooth_devices() -> Result<Vec<BluetoothDevice>, String> {
    let devices = bluetooth::get_paired_bluetooth_devices()?;
    Ok(devices)
}

// ==================== 数据库命令 ====================

#[tauri::command]
async fn db_query(
    sql: String,
    params: Vec<String>,
    state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    let mut db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let db = get_or_init_db(&mut db_guard)?;
    db.query(&sql, &params).map_err(|e| e.to_string())
}

#[tauri::command]
async fn db_execute(
    sql: String,
    params: Vec<String>,
    state: State<'_, AppState>,
) -> Result<database::ExecuteResult, String> {
    let mut db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let db = get_or_init_db(&mut db_guard)?;
    db.execute(&sql, &params).map_err(|e| e.to_string())
}

#[tauri::command]
async fn db_clear_user_data(state: State<'_, AppState>) -> Result<(), String> {
    let mut db_guard = state.db.lock().map_err(|e| e.to_string())?;
    let db = get_or_init_db(&mut db_guard)?;
    db.clear_user_data().map_err(|e| e.to_string())
}

// ==================== 系统信息命令 ====================

#[tauri::command]
async fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

// ==================== SPA 命令 ====================

#[tauri::command]
async fn send_spa_packet(
    server_address: String,
    port: u16,
    token_code: String,
    device_id: String,
    license_id: String,
) -> Result<(), String> {
    info!("[SPA Command] 收到发送请求: {}:{}", server_address, port);
    spa::send_spa_packet(&server_address, port, &token_code, &device_id, &license_id)
}

#[tauri::command]
async fn get_platform_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "family": std::env::consts::FAMILY,
    }))
}

// ==================== 权限检查命令 ====================

#[tauri::command]
async fn save_access_token(app: AppHandle, token: String) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;

    let store = app.store("settings.json")
        .map_err(|e| format!("读取 store 失败: {}", e))?;

    store.set("access_token", serde_json::json!(token.clone()));
    store.set("auth_token", serde_json::json!(token));

    info!("[Auth] access_token 已同步到 Tauri store");
    Ok(())
}

#[tauri::command]
async fn get_device_id(app: AppHandle) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用数据目录失败: {}", e))?;
    std::fs::create_dir_all(&app_dir).ok();
    Ok(device::get_device_id(&app_dir))
}

#[tauri::command]
async fn get_device_meta(app: AppHandle) -> Result<device::DeviceMeta, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用数据目录失败: {}", e))?;
    std::fs::create_dir_all(&app_dir).ok();
    Ok(device::get_device_meta(&app_dir))
}

/// 规范化 hex 字符串：去除空白、连字符、下划线、冒号等常见分隔符
fn normalize_hex_value(s: &str) -> String {
    s.chars()
        .filter(|c| !c.is_whitespace() && *c != '-' && *c != '_' && *c != ':')
        .collect()
}

/// 把任意长度的 hex 升级到 64 字符（32 字节）
/// - 已经是 64 字符的，返回小写
/// - 32 字符（UUID 去连字符）通过 SHA256 扩展
/// - 其他长度通过 SHA256 派生一个稳定的 32 字节
fn upgrade_to_64_hex(s: &str) -> String {
    if s.len() == 64 {
        return s.to_lowercase();
    }
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(s.as_bytes());
    hex::encode(hasher.finalize())
}

#[tauri::command]
async fn save_auth_info(
    app: AppHandle,
    token: String,
    security_code: String,
    device_id: String,
    license_id: String,
    device_token: Option<String>,
) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;

    let store = app
        .store("settings.json")
        .map_err(|e| format!("读取 store 失败: {}", e))?;

    // 存储时即规范化 hex，并升级 deviceId 到 64 字符 hex（32 字节）
    let device_id = upgrade_to_64_hex(&normalize_hex_value(&device_id));
    let license_id = normalize_hex_value(&license_id);

    store.set("auth_token", serde_json::json!(token.clone()));
    store.set("access_token", serde_json::json!(token));
    store.set("securityCode", serde_json::json!(security_code));
    store.set("deviceFingerprint", serde_json::json!(device_id));
    store.set("licenseId", serde_json::json!(license_id));

    if let Some(dt) = &device_token {
        store.set("deviceToken", serde_json::json!(dt));
        info!("[Auth] deviceToken 已保存到 Tauri store");
    }

    info!(
        "[Auth] 完整认证信息已保存: securityCode长度={}, deviceId长度={}, licenseId长度={}, deviceToken存在={}",
        security_code.len(),
        device_id.len(),
        license_id.len(),
        device_token.is_some()
    );

    Ok(())
}

#[tauri::command]
async fn check_permission(_permission: &str) -> Result<bool, String> {
    // 根据实际业务逻辑检查权限
    // 这里简化为始终返回 true
    Ok(true)
}

#[tauri::command]
async fn check_auth() -> Result<bool, String> {
    // 检查当前认证状态
    // 实际实现应该检查存储的 token 等
    Ok(false)
}

// ==================== 批量上传标记命令 ====================

#[tauri::command]
async fn activity_mark_batch_uploaded(
    batch_ids: Vec<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    info!("[Activity] 标记批量上传完成: {:?}", batch_ids);
    
    let monitor = state.activity_monitor.lock().map_err(|e| e.to_string())?;
    if let Some(ref m) = *monitor {
        m.clear_uploaded_records(&batch_ids);
        info!("[Activity] 已清除 {} 条已上传记录", batch_ids.len());
    }
    
    Ok(())
}

// ==================== 应用启动 ====================

pub fn run() {
    // 初始化日志
    env_logger::Builder::new()
        .filter_level(LevelFilter::Info)
        .format_timestamp_millis()
        .init();
    
    info!("ZTrust Client 启动中...");
    info!("启动阶段跳过设备信息和数据库预初始化，优先创建窗口");
    
    let app_state = AppState {
        db: Mutex::new(None),
        activity_monitor: Mutex::new(None),
        device_info: Mutex::new(None),
        is_logged_in: Mutex::new(false),
        user_info: Mutex::new(None),
    };
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_keyring::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // 窗口控制
            window_control,
            window_start_dragging,
            open_resource_window,
            // 活动监控
            activity_init,
            activity_start,
            activity_stop,
            activity_reset,
            activity_set_login_state,
            activity_logout,
            activity_get_stats,
            activity_mark_batch_uploaded,
            // 设备信息
            get_device_info,
            get_login_session_info,
            scan_wifi_environment,
            get_paired_bluetooth_devices,
            // 数据库
            db_query,
            db_execute,
            db_clear_user_data,
            // 系统信息
            get_app_version,
            get_platform_info,
            // 权限检查
            save_access_token,
            save_auth_info,
            check_permission,
            check_auth,
            // 设备身份
            get_device_id,
            get_device_meta,
            // SPA
            send_spa_packet,
        ])
        .setup(|_app| {
            info!("应用设置完成");

            // 设置定时清理任务
            std::thread::spawn(move || {
                loop {
                    std::thread::sleep(std::time::Duration::from_secs(24 * 60 * 60));
                    info!("执行定时数据库清理");
                    // 清理逻辑会在 activity 模块中处理
                }
            });
            
            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::CloseRequested { api: _, .. } = event {
                info!("窗口关闭请求");
                // 可以在这里添加退出确认逻辑
            }
        })
        .run(tauri::generate_context!())
        .expect("应用启动失败");
}
