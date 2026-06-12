mod database;
mod device;
mod activity;

use activity::{ActivityConfig, ActivityMonitor};
use database::Database;
use device::DeviceInfo;
use log::{info, error, LevelFilter};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

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

// ==================== 窗口控制命令 ====================

#[tauri::command]
fn window_control(action: &str, app: AppHandle) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("窗口未找到")?;

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
fn window_start_dragging(app: AppHandle) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("窗口未找到")?;
    window.start_dragging().map_err(|e| e.to_string())
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
    let device = state.device_info.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref info) = *device {
        Ok(info.clone())
    } else {
        // 首次调用时生成设备信息
        let info = device::generate_device_info()?;
        Ok(info)
    }
}

#[tauri::command]
async fn get_device_fingerprint(state: State<'_, AppState>) -> Result<String, String> {
    let device = state.device_info.lock().map_err(|e| e.to_string())?;
    
    let info = if let Some(ref d) = *device {
        d.clone()
    } else {
        device::generate_device_info()?
    };
    
    Ok(info.fingerprint)
}

// ==================== 数据库命令 ====================

#[tauri::command]
async fn db_query(
    sql: String,
    params: Vec<String>,
    state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref db) = *db_guard {
        db.query(&sql, &params).map_err(|e| e.to_string())
    } else {
        Err("数据库未初始化".to_string())
    }
}

#[tauri::command]
async fn db_execute(
    sql: String,
    params: Vec<String>,
    state: State<'_, AppState>,
) -> Result<database::ExecuteResult, String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref db) = *db_guard {
        db.execute(&sql, &params).map_err(|e| e.to_string())
    } else {
        Err("数据库未初始化".to_string())
    }
}

#[tauri::command]
async fn db_clear_user_data(state: State<'_, AppState>) -> Result<(), String> {
    let db_guard = state.db.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref db) = *db_guard {
        db.clear_user_data().map_err(|e| e.to_string())
    } else {
        Err("数据库未初始化".to_string())
    }
}

// ==================== 系统信息命令 ====================

#[tauri::command]
async fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
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
    
    // 初始化设备信息
    let device_info = match device::generate_device_info() {
        Ok(info) => {
            info!("设备信息生成成功: {}", info.device_id);
            Some(info)
        },
        Err(e) => {
            error!("设备信息生成失败: {}", e);
            None
        }
    };
    
    // 初始化数据库
    let db = match Database::new() {
        Ok(database) => {
            info!("数据库初始化成功");
            Some(database)
        },
        Err(e) => {
            error!("数据库初始化失败: {}", e);
            None
        }
    };
    
    let app_state = AppState {
        db: Mutex::new(db),
        activity_monitor: Mutex::new(None),
        device_info: Mutex::new(device_info),
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
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // 窗口控制
            window_control,
            window_start_dragging,
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
            get_device_fingerprint,
            // 数据库
            db_query,
            db_execute,
            db_clear_user_data,
            // 系统信息
            get_app_version,
            get_platform_info,
            // 权限检查
            check_permission,
            check_auth,
        ])
        .setup(|app| {
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
