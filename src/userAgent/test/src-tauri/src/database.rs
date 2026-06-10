use log::info;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use chrono::{Utc, Duration};
use base64;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteResult {
    pub changes: u64,
    pub last_insert_rowid: i64,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self, String> {
        let db_path = Self::get_db_path()?;
        
        // 确保目录存在
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("创建数据库目录失败: {}", e))?;
        }
        
        info!("数据库路径: {:?}", db_path);
        
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("打开数据库失败: {}", e))?;
        
        let db = Database { conn };
        db.init_tables()?;
        
        Ok(db)
    }
    
    fn get_db_path() -> Result<PathBuf, String> {
        let app_data = dirs::data_local_dir()
            .ok_or("无法获取应用数据目录")?;
        
        Ok(app_data.join("ZTrust").join("data").join("ztrust.db"))
    }
    
    fn init_tables(&self) -> Result<(), String> {
        // 活动记录表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS activity_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                record_type TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                uploaded INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )",
            [],
        ).map_err(|e| format!("创建活动记录表失败: {}", e))?;
        
        // 创建索引
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_activity_batch ON activity_records(batch_id)",
            [],
        ).map_err(|e| format!("创建索引失败: {}", e))?;
        
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_records(user_id)",
            [],
        ).map_err(|e| format!("创建索引失败: {}", e))?;
        
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_activity_uploaded ON activity_records(uploaded)",
            [],
        ).map_err(|e| format!("创建索引失败: {}", e))?;
        
        // 设备信息表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS device_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT UNIQUE NOT NULL,
                fingerprint TEXT NOT NULL,
                user_id TEXT,
                last_login TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        ).map_err(|e| format!("创建设备信息表失败: {}", e))?;
        
        // 会话表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                token TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            [],
        ).map_err(|e| format!("创建会话表失败: {}", e))?;
        
        // 配置表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        ).map_err(|e| format!("创建配置表失败: {}", e))?;
        
        info!("数据库表初始化完成");
        Ok(())
    }
    
    pub fn query(&self, sql: &str, params: &[String]) -> Result<Vec<serde_json::Value>, String> {
        let mut stmt = self.conn.prepare(sql)
            .map_err(|e| format!("准备查询失败: {}", e))?;

        let params_refs: Vec<&dyn rusqlite::ToSql> = params
            .iter()
            .map(|p| p as &dyn rusqlite::ToSql)
            .collect();

        let columns: Vec<String> = stmt.column_names()
            .iter()
            .map(|s| s.to_string())
            .collect();

        let mut rows = stmt.query(params_refs.as_slice())
            .map_err(|e| format!("执行查询失败: {}", e))?;

        let mut results = Vec::new();

        while let Some(row) = rows.next().map_err(|e| format!("读取行失败: {}", e))? {
            let mut obj = serde_json::Map::new();
            for (i, col) in columns.iter().enumerate() {
                let value: rusqlite::types::Value = row.get(i)
                    .map_err(|e| format!("获取列值失败: {}", e))?;
                let json_value = match value {
                    rusqlite::types::Value::Null => serde_json::Value::Null,
                    rusqlite::types::Value::Integer(i) => serde_json::json!(i),
                    rusqlite::types::Value::Real(f) => serde_json::json!(f),
                    rusqlite::types::Value::Text(s) => serde_json::json!(s),
                    rusqlite::types::Value::Blob(b) => serde_json::json!(base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &b)),
                };
                obj.insert(col.clone(), json_value);
            }
            results.push(serde_json::Value::Object(obj));
        }

        Ok(results)
    }
    
    pub fn execute(&self, sql: &str, params: &[String]) -> Result<ExecuteResult, String> {
        let params_refs: Vec<&dyn rusqlite::ToSql> = params
            .iter()
            .map(|p| p as &dyn rusqlite::ToSql)
            .collect();
        
        self.conn.execute(sql, params_refs.as_slice())
            .map_err(|e| format!("执行语句失败: {}", e))?;
        
        let changes = self.conn.changes();
        let last_id = self.conn.last_insert_rowid();
        
        Ok(ExecuteResult {
            changes,
            last_insert_rowid: last_id,
        })
    }
    
    pub fn insert_activity(&self, batch_id: &str, user_id: &str, record_type: &str, content: &str) -> Result<i64, String> {
        let now = Utc::now().to_rfc3339();
        
        self.conn.execute(
            "INSERT INTO activity_records (batch_id, user_id, record_type, content, timestamp, uploaded, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6)",
            params![batch_id, user_id, record_type, content, now, now],
        ).map_err(|e| format!("插入活动记录失败: {}", e))?;
        
        Ok(self.conn.last_insert_rowid())
    }
    
    pub fn get_pending_uploads(&self, limit: i64) -> Result<Vec<serde_json::Value>, String> {
        self.query(
            "SELECT * FROM activity_records WHERE uploaded = 0 ORDER BY created_at ASC LIMIT ?1",
            &[limit.to_string()],
        )
    }
    
    pub fn mark_uploaded(&self, batch_id: &str) -> Result<(), String> {
        self.execute(
            "UPDATE activity_records SET uploaded = 1 WHERE batch_id = ?1",
            &[batch_id.to_string()],
        )?;
        Ok(())
    }
    
    pub fn cleanup_old_data(&self, days: i64) -> Result<u64, String> {
        let cutoff = (Utc::now() - Duration::days(days)).to_rfc3339();
        
        let changes = self.conn.execute(
            "DELETE FROM activity_records WHERE created_at < ?1 AND uploaded = 1",
            params![cutoff],
        ).map_err(|e| format!("清理旧数据失败: {}", e))?;
        
        info!("清理了 {} 条过期记录", changes);
        Ok(changes as u64)
    }
    
    pub fn clear_user_data(&self) -> Result<(), String> {
        self.execute("DELETE FROM sessions", &[])?;
        self.execute("DELETE FROM activity_records", &[])?;
        info!("已清除用户数据");
        Ok(())
    }
    
    pub fn save_config(&self, key: &str, value: &str) -> Result<(), String> {
        let now = Utc::now().to_rfc3339();

        self.execute(
            "INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?1, ?2, ?3)",
            &[key.to_string(), value.to_string(), now],
        )?;
        Ok(())
    }
    
    pub fn get_config(&self, key: &str) -> Result<Option<String>, String> {
        let results = self.query(
            "SELECT value FROM config WHERE key = ?1",
            &[key.to_string()],
        )?;
        
        if let Some(obj) = results.first() {
            if let Some(value) = obj.get("value") {
                if let serde_json::Value::String(s) = value {
                    return Ok(Some(s.clone()));
                }
            }
        }
        
        Ok(None)
    }
}
