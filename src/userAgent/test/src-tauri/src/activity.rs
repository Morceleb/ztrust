use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use uuid::Uuid;

/// ==================== 配置结构 ====================

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

/// ==================== 操作类型枚举（采集端语义映射） ====================

/// 用户操作类型 - 由采集端根据底层事件映射
/// 控制器根据此类型进行风险评分
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum OperationType {
    Read,   // 读取操作（滚动浏览、查看等）
    Write,  // 写入操作（键盘输入、编辑等）
    Delete, // 删除操作（删除文件、Ctrl+D等）
    Execute, // 执行操作（运行命令、快捷键等）
}

impl std::fmt::Display for OperationType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OperationType::Read => write!(f, "read"),
            OperationType::Write => write!(f, "write"),
            OperationType::Delete => write!(f, "delete"),
            OperationType::Execute => write!(f, "execute"),
        }
    }
}

/// ==================== 用户行为上下文数据结构 ====================

/// 登录上下文 - 原始数据，交给控制器判断
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginContext {
    pub user_id: String,
    pub user_name: String,
    pub login_at: String,          // ISO 8601 时间戳
    pub timezone: String,          // 时区，如 "Asia/Shanghai"
    pub weekday: String,           // 星期几，如 "Tuesday"
    pub session_id: String,        // 会话ID
}

/// 登出上下文 - 原始数据，交给控制器判断
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogoutContext {
    pub user_id: String,
    pub logout_at: String,         // ISO 8601 时间戳
    pub logout_type: String,       // 登出类型：logout / timeout / force
    pub session_id: String,        // 会话ID
    pub session_duration_ms: u64,   // 会话持续时间（毫秒）
    pub session_start: String,    // 会话开始时间
}

/// 资源访问上下文 - 采集端做 resource_category 分类
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceAccess {
    pub resource_id: String,
    pub resource_title: Option<String>,
    pub resource_url: Option<String>,
    pub action: String,            // open / view / edit / delete
    pub resource_category: String,  // document / admin / config / data_export / report / other
    pub accessed_at: String,       // ISO 8601 时间戳
    pub closed_at: Option<String>, // ISO 8601 时间戳（关闭时补充）
    pub duration_ms: Option<u64>,  // 访问持续时间（毫秒，关闭时计算）
}

/// 操作频率统计 - 滑动窗口聚合
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FrequencyStats {
    pub last_1min: HashMap<String, u64>,
    pub last_5min: HashMap<String, u64>,
    pub last_1hour: HashMap<String, u64>,
    pub last_24h: HashMap<String, u64>,
}

/// 基线对比数据 - 用于控制器判断是否异常
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BaselineComparison {
    pub user_id: String,
    pub session_id: String,
    pub vs_daily_avg_1hour: f64,  // 当前1h操作数 / 7天同时段均值
    pub vs_same_day_last_week: f64,
    pub computed_at: String,
}

/// ==================== 活动记录 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityRecord {
    pub id: String,
    pub batch_id: String,
    pub user_id: String,
    pub record_type: String,
    pub content: serde_json::Value,
    pub timestamp: String,
}

/// ==================== 活动统计 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityStats {
    pub is_running: bool,
    pub is_logged_in: bool,
    pub user_id: Option<String>,
    pub records_count: usize,
    pub uploaded_count: usize,
    pub pending_count: usize,
    pub uptime_seconds: u64,
    pub current_session: Option<SessionInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    pub session_id: String,
    pub login_at: String,
    pub duration_ms: u64,
    pub op_counts: HashMap<String, u64>,
}

/// ==================== 滑动窗口计数器 ====================

#[derive(Debug, Clone)]
struct SlidingWindow {
    window_size: Duration,
    events: Vec<(Instant, OperationType)>,
}

impl SlidingWindow {
    fn new(window_size: Duration) -> Self {
        SlidingWindow {
            window_size,
            events: Vec::new(),
        }
    }

    fn add(&mut self, op_type: OperationType) {
        let now = Instant::now();
        self.events.push((now, op_type));
        self.prune(now);
    }

    fn prune(&mut self, now: Instant) {
        let cutoff = now - self.window_size;
        self.events.retain(|(t, _)| *t > cutoff);
    }

    fn count(&self, op_type: &OperationType) -> usize {
        self.events.iter().filter(|(_, op)| *op == *op_type).count()
    }

    fn total(&self) -> usize {
        self.events.len()
    }

    fn breakdown(&self) -> HashMap<String, u64> {
        let mut counts = HashMap::new();
        for op in &[OperationType::Read, OperationType::Write, OperationType::Delete, OperationType::Execute] {
            counts.insert(op.to_string(), self.count(op) as u64);
        }
        counts
    }
}

/// ==================== 键盘输入检测器 ====================

/// 用于检测键盘输入模式，判断是否为写入操作
#[derive(Debug, Clone)]
struct KeystrokeDetector {
    recent_events: Vec<(Instant, usize)>,  // (时间, 字符数)
    window: Duration,
}

impl KeystrokeDetector {
    fn new(window_secs: u64) -> Self {
        KeystrokeDetector {
            recent_events: Vec::new(),
            window: Duration::from_secs(window_secs),
        }
    }

    /// 记录一次键盘输入
    fn record(&mut self, char_count: usize) {
        let now = Instant::now();
        self.recent_events.push((now, char_count));
        self.prune(now);
    }

    fn prune(&mut self, now: Instant) {
        let cutoff = now - self.window;
        self.recent_events.retain(|(t, _)| *t > cutoff);
    }

    /// 判断是否为写入操作：窗口内平均每秒超过阈值字符
    fn is_writing(&self, chars_per_sec_threshold: usize) -> bool {
        if self.recent_events.is_empty() {
            return false;
        }
        let total_chars: usize = self.recent_events.iter().map(|(_, c)| c).sum();
        let duration_secs = self.window.as_secs().max(1) as usize;
        total_chars / duration_secs > chars_per_sec_threshold
    }
}

/// ==================== 资源访问追踪器 ====================

#[derive(Debug, Clone)]
struct ResourceTracker {
    open_resources: HashMap<String, (String, Instant)>,  // resource_id -> (title, opened_at)
}

impl ResourceTracker {
    fn new() -> Self {
        ResourceTracker {
            open_resources: HashMap::new(),
        }
    }

    fn resource_open(&mut self, resource_id: String, title: String) {
        self.open_resources.insert(
            resource_id.clone(),
            (title, Instant::now()),
        );
    }

    fn resource_close(&mut self, resource_id: &str) -> Option<(String, u64)> {
        if let Some((title, opened_at)) = self.open_resources.remove(resource_id) {
            let duration_ms = opened_at.elapsed().as_millis() as u64;
            Some((title, duration_ms))
        } else {
            None
        }
    }

    fn get_open_count(&self) -> usize {
        self.open_resources.len()
    }
}

/// ==================== 活动监控器 ====================

pub struct ActivityMonitor {
    config: ActivityConfig,
    user_id: Option<String>,
    user_name: Option<String>,
    session_id: Option<String>,
    login_time: Option<Instant>,
    is_running: Arc<AtomicBool>,
    is_logged_in: Arc<AtomicBool>,
    last_activity: Mutex<Instant>,
    start_time: Instant,
    records: Mutex<Vec<ActivityRecord>>,

    // 滑动窗口计数器
    window_1min: Arc<Mutex<SlidingWindow>>,
    window_5min: Arc<Mutex<SlidingWindow>>,
    window_1hour: Arc<Mutex<SlidingWindow>>,
    window_24h: Arc<Mutex<SlidingWindow>>,

    // 操作计数器（总计数，用于基线计算）
    op_count_1hour: Arc<AtomicU64>,

    // 键盘输入检测器
    keystroke_detector: Mutex<KeystrokeDetector>,

    // 资源访问追踪器
    resource_tracker: Mutex<ResourceTracker>,

    // 基线数据（简化版：最近7天同时段均值）
    baseline_avg_1hour: Mutex<Option<f64>>,
}

impl ActivityMonitor {
    pub fn new(config: ActivityConfig) -> Self {
        ActivityMonitor {
            config,
            user_id: None,
            user_name: None,
            session_id: None,
            login_time: None,
            is_running: Arc::new(AtomicBool::new(false)),
            is_logged_in: Arc::new(AtomicBool::new(false)),
            last_activity: Mutex::new(Instant::now()),
            start_time: Instant::now(),
            records: Mutex::new(Vec::new()),

            // 滑动窗口：1分钟、5分钟、1小时、24小时
            window_1min: Arc::new(Mutex::new(SlidingWindow::new(Duration::from_secs(60)))),
            window_5min: Arc::new(Mutex::new(SlidingWindow::new(Duration::from_secs(300)))),
            window_1hour: Arc::new(Mutex::new(SlidingWindow::new(Duration::from_secs(3600)))),
            window_24h: Arc::new(Mutex::new(SlidingWindow::new(Duration::from_secs(86400)))),

            // 操作计数器
            op_count_1hour: Arc::new(AtomicU64::new(0)),

            // 键盘检测器：1秒窗口，超过5字符/秒判定为写入
            keystroke_detector: Mutex::new(KeystrokeDetector::new(1)),

            // 资源追踪器
            resource_tracker: Mutex::new(ResourceTracker::new()),

            // 基线
            baseline_avg_1hour: Mutex::new(None),
        }
    }

    pub fn init(&mut self, user_id: String, user_name: String) {
        self.user_id = Some(user_id);
        self.user_name = Some(user_name);
        info!("[ActivityMonitor] 已初始化，用户信息存在: {}", self.user_name.is_some());
    }

    pub fn reset(&mut self, user_id: &str, user_name: &str) {
        // 清空记录
        {
            let mut records = self.records.lock().unwrap();
            records.clear();
        }

        // 清空滑动窗口
        {
            self.window_1min.lock().unwrap().events.clear();
            self.window_5min.lock().unwrap().events.clear();
            self.window_1hour.lock().unwrap().events.clear();
            self.window_24h.lock().unwrap().events.clear();
        }

        // 重置计数器和追踪器
        self.op_count_1hour.store(0, Ordering::SeqCst);
        self.keystroke_detector.lock().unwrap().recent_events.clear();
        self.resource_tracker.lock().unwrap().open_resources.clear();

        self.user_id = Some(user_id.to_string());
        self.user_name = Some(user_name.to_string());
        self.last_activity = Mutex::new(Instant::now());

        info!("[ActivityMonitor] 已重置");
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

    pub fn set_login_state(&mut self, is_logged_in: bool) {
        let was_logged_in = self.is_logged_in.load(Ordering::SeqCst);
        self.is_logged_in.store(is_logged_in, Ordering::SeqCst);

        if was_logged_in && !is_logged_in {
            // 用户登出
            self.report_logout("logout");
        } else if !was_logged_in && is_logged_in {
            // 用户登录 - 记录登录时间
            self.login_time = Some(Instant::now());
            self.session_id = Some(Uuid::new_v4().to_string());

            // 记录登录事件（原始数据）
            let login_context = self.build_login_context();
            if let Some(ctx) = login_context {
                self.record_event("login", serde_json::json!(ctx));
            }
        }

        info!("[ActivityMonitor] 登录状态: {}", is_logged_in);
    }

    /// 构建登录上下文（原始数据）
    fn build_login_context(&self) -> Option<LoginContext> {
        let user_id = self.user_id.clone()?;
        let user_name = self.user_name.clone()?;
        let session_id = self.session_id.clone()?;

        let now = chrono::Local::now();
        let timezone = now.format("%Z").to_string();
        let weekday = now.format("%A").to_string();

        Some(LoginContext {
            user_id,
            user_name,
            login_at: chrono::Utc::now().to_rfc3339(),
            timezone,
            weekday,
            session_id,
        })
    }

    /// 记录操作事件（采集端做语义映射）
    pub fn record_operation(&self, op_type: OperationType) {
        let now = Instant::now();

        // 更新所有滑动窗口
        {
            let mut w1 = self.window_1min.lock().unwrap();
            w1.add(op_type.clone());
        }
        {
            let mut w5 = self.window_5min.lock().unwrap();
            w5.add(op_type.clone());
        }
        {
            let mut w60 = self.window_1hour.lock().unwrap();
            w60.add(op_type.clone());
        }
        {
            let mut w24 = self.window_24h.lock().unwrap();
            w24.add(op_type);
        }

        // 更新计数器
        self.op_count_1hour.fetch_add(1, Ordering::SeqCst);

        // 更新最后活动时间
        {
            let mut last = self.last_activity.lock().unwrap();
            *last = now;
        }
    }

    /// 记录鼠标事件 - 映射为 Read 操作（浏览行为）
    pub fn record_mouse_event(&self, x: i32, y: i32) {
        self.record_event("mouse", serde_json::json!({
            "x": x,
            "y": y,
        }));
        // 鼠标点击视为读取操作
        self.record_operation(OperationType::Read);
    }

    /// 记录键盘事件 - 采集端判断是否为写入操作
    pub fn record_keyboard_event(&self, key: &str) {
        // 检测键盘输入模式
        let char_count = key.chars().count();
        let is_write = {
            let mut detector = self.keystroke_detector.lock().unwrap();
            detector.record(char_count);
            detector.is_writing(5)  // 超过5字符/秒判定为写入
        };

        let op_type = if is_write {
            OperationType::Write
        } else {
            // 单字符按键可能是快捷键的一部分或控制键
            OperationType::Read
        };

        self.record_event("keyboard", serde_json::json!({
            "key": key,
            "operation_type": op_type.to_string(),
        }));

        self.record_operation(op_type);
    }

    /// 记录滚动事件 - 映射为 Read 操作（浏览行为）
    pub fn record_scroll_event(&self, delta_x: i32, delta_y: i32) {
        self.record_event("scroll", serde_json::json!({
            "delta_x": delta_x,
            "delta_y": delta_y,
        }));
        // 滚动视为读取操作
        self.record_operation(OperationType::Read);
    }

    /// 记录快捷键事件 - 采集端判断操作类型
    pub fn record_shortcut(&self, key_combo: &str) {
        let op_type = self.map_shortcut_to_operation(key_combo);

        self.record_event("shortcut", serde_json::json!({
            "key_combo": key_combo,
            "operation_type": op_type.to_string(),
        }));

        self.record_operation(op_type);
    }

    /// 快捷键映射为操作类型（采集端语义映射）
    fn map_shortcut_to_operation(&self, key_combo: &str) -> OperationType {
        let combo_lower = key_combo.to_lowercase();

        // 删除操作
        if combo_lower.contains("delete")
            || combo_lower.contains("backspace")
            || combo_lower == "del"
        {
            return OperationType::Delete;
        }

        // 执行操作
        if combo_lower.contains("shift")
            || combo_lower.contains("ctrl+shift")
            || combo_lower == "f5"
            || combo_lower == "f6"
            || combo_lower == "f7"
            || combo_lower == "f8"
            || combo_lower == "f9"
            || combo_lower == "f10"
            || combo_lower == "f11"
            || combo_lower == "f12"
            || combo_lower == "enter"
            || combo_lower == "return"
        {
            return OperationType::Execute;
        }

        // 写入操作（如 Ctrl+S 保存）
        if combo_lower.contains("ctrl+s")
            || combo_lower.contains("ctrl+z")
            || combo_lower.contains("ctrl+y")
        {
            return OperationType::Write;
        }

        // 默认：读取
        OperationType::Read
    }

    /// 记录命令调用 - 映射为 Execute 操作
    pub fn record_command_call(&self, command_name: &str) {
        self.record_event("command", serde_json::json!({
            "command_name": command_name,
            "operation_type": OperationType::Execute.to_string(),
        }));

        self.record_operation(OperationType::Execute);
    }

    /// 记录文件操作 - 采集端判断操作类型
    pub fn record_file_operation(&self, path: &str, operation: &str) {
        let op_type = match operation.to_lowercase().as_str() {
            "delete" | "trash" | "remove" => OperationType::Delete,
            "write" | "create" | "modify" => OperationType::Write,
            "read" | "open" | "view" => OperationType::Read,
            "execute" | "run" => OperationType::Execute,
            _ => OperationType::Read,
        };

        self.record_event("file_operation", serde_json::json!({
            "path": path,
            "operation": operation,
            "operation_type": op_type.to_string(),
        }));

        self.record_operation(op_type);
    }

    /// 记录资源打开事件
    pub fn record_resource_open(&self, resource_id: &str, title: &str) {
        {
            let mut tracker = self.resource_tracker.lock().unwrap();
            tracker.resource_open(resource_id.to_string(), title.to_string());
        }

        // 资源打开视为读取操作
        self.record_operation(OperationType::Read);

        self.record_event("resource_open", serde_json::json!({
            "resource_id": resource_id,
            "resource_title": title,
        }));
    }

    /// 记录资源关闭事件 - 计算访问时长
    pub fn record_resource_close(&self, resource_id: &str) {
        let close_info = {
            let mut tracker = self.resource_tracker.lock().unwrap();
            tracker.resource_close(resource_id)
        };

        if let Some((title, duration_ms)) = close_info {
            let now = chrono::Utc::now().to_rfc3339();

            self.record_event("resource_close", serde_json::json!({
                "resource_id": resource_id,
                "resource_title": title,
                "closed_at": now,
                "duration_ms": duration_ms,
            }));
        }
    }

    /// 记录页面访问
    pub fn record_page_view(&self, url: &str, title: &str) {
        // 根据URL判断资源类别
        let resource_category = self.classify_resource(url);

        self.record_event("page_view", serde_json::json!({
            "url": url,
            "title": title,
            "resource_category": resource_category,
        }));
    }

    /// 资源URL分类（采集端做粗分类）
    fn classify_resource(&self, url: &str) -> String {
        let url_lower = url.to_lowercase();

        if url_lower.contains("/admin/")
            || url_lower.contains("/management/")
            || url_lower.contains("/manage/")
        {
            "admin".to_string()
        } else if url_lower.contains("/config/")
            || url_lower.contains("/settings/")
            || url_lower.contains("/system/")
        {
            "config".to_string()
        } else if url_lower.contains("/export/")
            || url_lower.contains("/download/")
            || url_lower.contains("/api/")
        {
            "data_export".to_string()
        } else if url_lower.contains("/report/")
            || url_lower.contains("/analytics/")
        {
            "report".to_string()
        } else if url_lower.contains("/document/")
            || url_lower.contains("/file/")
            || url_lower.contains("/doc/")
        {
            "document".to_string()
        } else {
            "other".to_string()
        }
    }

    /// 登出报告
    pub fn report_logout(&mut self, logout_type: &str) {
        // 构建登出上下文
        let now = chrono::Utc::now().to_rfc3339();
        let session_duration_ms = self
            .login_time
            .map(|t| t.elapsed().as_millis() as u64)
            .unwrap_or(0);

        let session_start = self.login_time.map(|_| {
            (chrono::Utc::now() - chrono::Duration::milliseconds(session_duration_ms as i64))
                .to_rfc3339()
        });

        let logout_context = LogoutContext {
            user_id: self.user_id.clone().unwrap_or_default(),
            logout_at: now,
            logout_type: logout_type.to_string(),
            session_id: self.session_id.clone().unwrap_or_default(),
            session_duration_ms,
            session_start: session_start.unwrap_or_default(),
        };

        self.record_event("logout", serde_json::json!(logout_context));

        // 清空会话信息
        self.login_time = None;
        self.session_id = None;

        info!("[ActivityMonitor] 报告注销: {}, 时长: {}ms", logout_type, session_duration_ms);
    }

    /// 获取频率统计（滑动窗口聚合）
    pub fn get_frequency_stats(&self) -> FrequencyStats {
        FrequencyStats {
            last_1min: self.window_1min.lock().unwrap().breakdown(),
            last_5min: self.window_5min.lock().unwrap().breakdown(),
            last_1hour: self.window_1hour.lock().unwrap().breakdown(),
            last_24h: self.window_24h.lock().unwrap().breakdown(),
        }
    }

    /// 获取基线对比数据
    pub fn get_baseline_comparison(&self) -> Option<BaselineComparison> {
        let baseline = self.baseline_avg_1hour.lock().unwrap();
        let avg = baseline.as_ref()?;

        let current = self.window_1hour.lock().unwrap().total() as f64;
        let vs_daily = if *avg > 0.0 { current / *avg } else { 1.0 };

        Some(BaselineComparison {
            user_id: self.user_id.clone().unwrap_or_default(),
            session_id: self.session_id.clone().unwrap_or_default(),
            vs_daily_avg_1hour: vs_daily,
            vs_same_day_last_week: 1.0,  // 简化版，暂无上周数据
            computed_at: chrono::Utc::now().to_rfc3339(),
        })
    }

    /// 获取频率聚合报告（定时上报用）
    pub fn get_frequency_report(&self) -> serde_json::Value {
        let stats = self.get_frequency_stats();
        let baseline = self.get_baseline_comparison();

        serde_json::json!({
            "timestamp": chrono::Utc::now().to_rfc3339(),
            "user_id": self.user_id,
            "session_id": self.session_id,
            "frequency_stats": stats,
            "baseline_comparison": baseline,
        })
    }

    /// 不活跃检测
    pub fn check_inactivity(&self) -> bool {
        if !self.is_logged_in.load(Ordering::SeqCst) {
            return false;
        }

        let last = *self.last_activity.lock().unwrap();
        let elapsed = last.elapsed().as_millis() as u64;

        elapsed > self.config.inactivity_timeout
    }

    /// 获取统计信息
    pub fn get_stats(&self) -> ActivityStats {
        let records = self.records.lock().unwrap();
        let pending_count = records.len();

        let current_session = if self.is_logged_in.load(Ordering::SeqCst) {
            let duration_ms = self
                .login_time
                .map(|t| t.elapsed().as_millis() as u64)
                .unwrap_or(0);

            Some(SessionInfo {
                session_id: self.session_id.clone().unwrap_or_default(),
                login_at: chrono::Utc::now().to_rfc3339(),
                duration_ms,
                op_counts: self.window_1hour.lock().unwrap().breakdown(),
            })
        } else {
            None
        };

        ActivityStats {
            is_running: self.is_running.load(Ordering::SeqCst),
            is_logged_in: self.is_logged_in.load(Ordering::SeqCst),
            user_id: self.user_id.clone(),
            records_count: records.len(),
            uploaded_count: 0,
            pending_count,
            uptime_seconds: self.start_time.elapsed().as_secs(),
            current_session,
        }
    }

    /// 获取待上传记录
    pub fn get_pending_records(&self) -> Vec<ActivityRecord> {
        let records = self.records.lock().unwrap();
        records.clone()
    }

    /// 清除已上传记录
    pub fn clear_uploaded_records(&self, batch_ids: &[String]) {
        let mut records = self.records.lock().unwrap();
        records.retain(|r| !batch_ids.contains(&r.batch_id));
    }

    /// 内部方法：记录事件
    fn record_event(&self, event_type: &str, data: serde_json::Value) {
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_operation_type_mapping() {
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

        // 测试快捷键映射
        assert_eq!(
            monitor.map_shortcut_to_operation("Ctrl+D"),
            OperationType::Delete
        );
        assert_eq!(
            monitor.map_shortcut_to_operation("F5"),
            OperationType::Execute
        );
        assert_eq!(
            monitor.map_shortcut_to_operation("Ctrl+S"),
            OperationType::Write
        );
        assert_eq!(
            monitor.map_shortcut_to_operation("Ctrl+C"),
            OperationType::Read
        );

        // 测试资源分类
        assert_eq!(
            monitor.classify_resource("https://example.com/admin/users"),
            "admin"
        );
        assert_eq!(
            monitor.classify_resource("https://example.com/config/settings"),
            "config"
        );
        assert_eq!(
            monitor.classify_resource("https://example.com/document/123"),
            "document"
        );
    }

    #[test]
    fn test_sliding_window() {
        let mut window = SlidingWindow::new(Duration::from_secs(1));

        window.add(OperationType::Read);
        window.add(OperationType::Write);
        window.add(OperationType::Read);

        assert_eq!(window.total(), 3);
        assert_eq!(window.count(&OperationType::Read), 2);
        assert_eq!(window.count(&OperationType::Write), 1);
    }

    #[test]
    fn test_keystroke_detector() {
        let mut detector = KeystrokeDetector::new(1);

        // 模拟慢速输入（不触发写入）
        detector.record(1);
        std::thread::sleep(Duration::from_millis(500));
        detector.record(1);
        assert!(!detector.is_writing(5));

        // 模拟快速输入（触发写入）
        detector.record(10);
        assert!(detector.is_writing(5));
    }
}
