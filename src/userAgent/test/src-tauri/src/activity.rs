use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityConfig {
    pub sample_rates: SampleRates,
    pub batch: BatchConfig,
    pub inactivity_timeout: u64,
    pub inactivity_check_interval: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SampleRates {
    pub mouse: u64,
    pub keyboard: u64,
    pub scroll: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchConfig {
    pub save_interval: u64,
    pub upload_interval: u64,
    pub max_batch_records: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityStats {
    pub is_running: bool,
    pub is_logged_in: bool,
    pub user_id: Option<String>,
    pub records_count: usize,
    pub uploaded_count: usize,
    pub pending_count: usize,
    pub uptime_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityRecord {
    pub id: String,
    pub batch_id: String,
    pub user_id: String,
    pub record_type: String,
    pub content: serde_json::Value,
    pub timestamp: String,
}

pub struct ActivityMonitor {
    config: ActivityConfig,
    user_id: Option<String>,
    user_name: Option<String>,
    is_running: Arc<AtomicBool>,
    is_logged_in: Arc<AtomicBool>,
    last_activity: std::sync::Mutex<Instant>,
    start_time: Instant,
    records: std::sync::Mutex<Vec<ActivityRecord>>,
}

impl ActivityMonitor {
    pub fn new(config: ActivityConfig) -> Self {
        ActivityMonitor {
            config,
            user_id: None,
            user_name: None,
            is_running: Arc::new(AtomicBool::new(false)),
            is_logged_in: Arc::new(AtomicBool::new(false)),
            last_activity: std::sync::Mutex::new(Instant::now()),
            start_time: Instant::now(),
            records: std::sync::Mutex::new(Vec::new()),
        }
    }
    
    pub fn init(&mut self, user_id: String, user_name: String) {
        self.user_id = Some(user_id);
        self.user_name = Some(user_name);
        info!("[ActivityMonitor] 已初始化，用户: {:?}", self.user_name);
    }
    
    pub fn reset(&mut self, user_id: &str, user_name: &str) {
        // 清空记录
        {
            let mut records = self.records.lock().unwrap();
            records.clear();
        }
        
        self.user_id = Some(user_id.to_string());
        self.user_name = Some(user_name.to_string());
        self.last_activity = std::sync::Mutex::new(Instant::now());
        
        info!("[ActivityMonitor] 已重置，用户: {}", user_name);
    }
    
    pub fn start(&self) {
        if self.is_running.load(Ordering::SeqCst) {
            warn!("[ActivityMonitor] 已经在运行中");
            return;
        }
        
        self.is_running.store(true, Ordering::SeqCst);
        info!("[ActivityMonitor] 已启动");
    }
    
    pub fn stop(&self) {
        self.is_running.store(false, Ordering::SeqCst);
        info!("[ActivityMonitor] 已停止");
    }
    
    pub fn set_login_state(&self, is_logged_in: bool) {
        let was_logged_in = self.is_logged_in.load(Ordering::SeqCst);
        self.is_logged_in.store(is_logged_in, Ordering::SeqCst);
        
        if was_logged_in && !is_logged_in {
            // 用户登出
            self.report_logout("logout");
        } else if !was_logged_in && is_logged_in {
            // 用户登录
            self.record_event("login", serde_json::json!({
                "user_id": self.user_id,
                "user_name": self.user_name,
            }));
        }
        
        info!("[ActivityMonitor] 登录状态: {}", is_logged_in);
    }
    
    pub fn record_event(&self, event_type: &str, data: serde_json::Value) {
        let user_id = self.user_id.clone().unwrap_or_default();
        let batch_id = Uuid::new_v4().to_string();
        
        let record = ActivityRecord {
            id: Uuid::new_v4().to_string(),
            batch_id,
            user_id,
            record_type: event_type.to_string(),
            content: data,
            timestamp: chrono::Utc::now().to_rfc3339(),
        };
        
        let mut records = self.records.lock().unwrap();
        records.push(record);
        
        // 更新最后活动时间
        let mut last = self.last_activity.lock().unwrap();
        *last = Instant::now();
    }
    
    pub fn record_mouse_event(&self, x: i32, y: i32) {
        self.record_event("mouse", serde_json::json!({
            "x": x,
            "y": y,
        }));
    }
    
    pub fn record_keyboard_event(&self, key: &str) {
        self.record_event("keyboard", serde_json::json!({
            "key": key,
        }));
    }
    
    pub fn record_scroll_event(&self, delta_x: i32, delta_y: i32) {
        self.record_event("scroll", serde_json::json!({
            "delta_x": delta_x,
            "delta_y": delta_y,
        }));
    }
    
    pub fn record_page_view(&self, url: &str, title: &str) {
        self.record_event("page_view", serde_json::json!({
            "url": url,
            "title": title,
        }));
    }
    
    pub fn report_logout(&self, logout_type: &str) {
        self.record_event("logout", serde_json::json!({
            "type": logout_type,
            "user_id": self.user_id,
        }));
        
        info!("[ActivityMonitor] 报告注销: {}", logout_type);
    }
    
    pub fn check_inactivity(&self) -> bool {
        if !self.is_logged_in.load(Ordering::SeqCst) {
            return false;
        }
        
        let last = *self.last_activity.lock().unwrap();
        let elapsed = last.elapsed().as_millis() as u64;
        
        elapsed > self.config.inactivity_timeout
    }
    
    pub fn get_stats(&self) -> ActivityStats {
        let records = self.records.lock().unwrap();
        let pending_count = records.len();
        
        ActivityStats {
            is_running: self.is_running.load(Ordering::SeqCst),
            is_logged_in: self.is_logged_in.load(Ordering::SeqCst),
            user_id: self.user_id.clone(),
            records_count: records.len(),
            uploaded_count: 0,
            pending_count,
            uptime_seconds: self.start_time.elapsed().as_secs(),
        }
    }
    
    pub fn get_pending_records(&self) -> Vec<ActivityRecord> {
        let records = self.records.lock().unwrap();
        records.clone()
    }
    
    pub fn clear_uploaded_records(&self, batch_ids: &[String]) {
        let mut records = self.records.lock().unwrap();
        records.retain(|r| !batch_ids.contains(&r.batch_id));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_activity_monitor() {
        let config = ActivityConfig {
            sample_rates: SampleRates {
                mouse: 100,
                keyboard: 100,
                scroll: 100,
            },
            batch: BatchConfig {
                save_interval: 120000,
                upload_interval: 180000,
                max_batch_records: 10000,
            },
            inactivity_timeout: 360000,
            inactivity_check_interval: 1000,
        };
        
        let monitor = ActivityMonitor::new(config);
        assert!(!monitor.is_running.load(Ordering::SeqCst));
        
        monitor.start();
        assert!(monitor.is_running.load(Ordering::SeqCst));
        
        monitor.stop();
        assert!(!monitor.is_running.load(Ordering::SeqCst));
    }
}
