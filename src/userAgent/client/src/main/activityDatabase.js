/**
 * SQLite 数据库管理模块
 * 用于本地存储用户行为数据，平衡本地存储与服务器上传
 */

import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

class ActivityDatabase {
    constructor(dbPath = null) {
        if (!dbPath) {
            const userDataPath = app.getPath('userData')
            dbPath = path.join(userDataPath, 'activity_monitor.db')
        }

        const dbDir = path.dirname(dbPath)
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true })
        }

        this.db = new Database(dbPath)
        this.db.pragma('journal_mode = WAL')

        this.initTables()
    }

    initTables() {
        // 启用外键支持
        this.db.pragma('foreign_keys = ON')

        // 用户会话表
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                user_id TEXT,
                user_name TEXT,
                device_id TEXT,
                fingerprint TEXT,
                start_time INTEGER NOT NULL,
                end_time INTEGER,
                logout_type TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // 行为批次记录表（每个上报周期存储一条，包含完整的轨迹序列）
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS activity_batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                user_id TEXT,
                device_id TEXT,
                fingerprint TEXT,
                start_time INTEGER NOT NULL,
                end_time INTEGER NOT NULL,
                duration INTEGER NOT NULL,
                stats TEXT NOT NULL,
                frequencies TEXT,
                uploaded INTEGER DEFAULT 0,
                uploaded_at INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // 鼠标轨迹详细表（高频采样数据）
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS mouse_trajectory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                event_id INTEGER,
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                timestamp INTEGER NOT NULL,
                type TEXT DEFAULT 'move',
                interval_ms INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // 按键序列详细表
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS key_sequence (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                event_id INTEGER,
                key_code TEXT,
                key_text TEXT,
                timestamp INTEGER NOT NULL,
                interval_ms INTEGER,
                type TEXT DEFAULT 'keydown',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // 滚动序列表
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS scroll_sequence (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                delta_x REAL,
                delta_y REAL,
                timestamp INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // 设备信息表
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS device_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT UNIQUE NOT NULL,
                user_id TEXT,
                fingerprint TEXT NOT NULL,
                hardware_info TEXT NOT NULL,
                browser_info TEXT NOT NULL,
                first_seen INTEGER NOT NULL,
                last_seen INTEGER NOT NULL,
                login_count INTEGER DEFAULT 1,
                is_trusted INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

        // 待上传队列表
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS upload_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                record_type TEXT NOT NULL,
                record_id INTEGER,
                batch_id TEXT,
                data TEXT NOT NULL,
                retry_count INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                last_retry_at INTEGER,
                status TEXT DEFAULT 'pending'
            )
        `)

        // 创建索引
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_batch_session ON activity_batches(session_id);
            CREATE INDEX IF NOT EXISTS idx_batch_uploaded ON activity_batches(uploaded);
            CREATE INDEX IF NOT EXISTS idx_trajectory_batch ON mouse_trajectory(batch_id);
            CREATE INDEX IF NOT EXISTS idx_trajectory_session ON mouse_trajectory(session_id);
            CREATE INDEX IF NOT EXISTS idx_key_batch ON key_sequence(batch_id);
            CREATE INDEX IF NOT EXISTS idx_key_session ON key_sequence(session_id);
            CREATE INDEX IF NOT EXISTS idx_device_id ON device_info(device_id);
            CREATE INDEX IF NOT EXISTS idx_device_user ON device_info(user_id);
            CREATE INDEX IF NOT EXISTS idx_upload_status ON upload_queue(status);
        `)

        console.log('[ActivityDatabase] 数据库表初始化完成')
    }

    // ==================== 会话管理 ====================

    createSession(sessionInfo) {
        const stmt = this.db.prepare(`
            INSERT INTO user_sessions (session_id, user_id, user_name, device_id, fingerprint, start_time)
            VALUES (?, ?, ?, ?, ?, ?)
        `)

        const result = stmt.run(
            sessionInfo.sessionId,
            sessionInfo.userId,
            sessionInfo.userName,
            sessionInfo.deviceId,
            sessionInfo.fingerprint,
            sessionInfo.startTime
        )

        console.log('[ActivityDatabase] 创建会话:', sessionInfo.sessionId)
        return result.lastInsertRowid
    }

    endSession(sessionId, logoutType = 'manual') {
        const stmt = this.db.prepare(`
            UPDATE user_sessions SET end_time = ?, logout_type = ? WHERE session_id = ?
        `)
        stmt.run(Date.now(), logoutType, sessionId)
        console.log('[ActivityDatabase] 结束会话:', sessionId)
    }

    getActiveSession(userId) {
        const stmt = this.db.prepare(`
            SELECT * FROM user_sessions WHERE user_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1
        `)
        return stmt.get(userId) || null
    }

    // ==================== 批次记录管理 ====================

    /**
     * 保存批次记录及详细数据
     */
    saveBatchRecord(record) {
        const batchId = `batch_${record.sessionId}_${record.startTime}`

        // 开启事务
        const transaction = this.db.transaction(() => {
            // 保存批次记录
            const batchStmt = this.db.prepare(`
                INSERT INTO activity_batches (
                    batch_id, session_id, user_id, device_id, fingerprint,
                    start_time, end_time, duration, stats, frequencies, uploaded
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)

            const batchResult = batchStmt.run(
                batchId,
                record.sessionId,
                record.userId,
                record.deviceId,
                record.fingerprint,
                record.startTime,
                record.endTime,
                record.duration,
                JSON.stringify(record.stats),
                JSON.stringify(record.frequencies),
                record.uploaded ? 1 : 0
            )

            // 保存鼠标轨迹
            if (record.mouseTrajectory && record.mouseTrajectory.length > 0) {
                const mouseStmt = this.db.prepare(`
                    INSERT INTO mouse_trajectory (batch_id, session_id, event_id, x, y, timestamp, type, interval_ms)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `)

                for (const event of record.mouseTrajectory) {
                    mouseStmt.run(
                        batchId,
                        record.sessionId,
                        event.i || null,
                        event.x,
                        event.y,
                        event.t,
                        event.ty || 'move',
                        event.interval || null
                    )
                }
            }

            // 保存按键序列
            if (record.keySequence && record.keySequence.length > 0) {
                const keyStmt = this.db.prepare(`
                    INSERT INTO key_sequence (batch_id, session_id, event_id, key_code, key_text, timestamp, interval_ms)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `)

                for (const event of record.keySequence) {
                    keyStmt.run(
                        batchId,
                        record.sessionId,
                        event.id || null,
                        event.c || null,
                        event.k || null,
                        event.t,
                        event.iv || null
                    )
                }
            }

            // 保存滚动序列
            if (record.scrollSequence && record.scrollSequence.length > 0) {
                const scrollStmt = this.db.prepare(`
                    INSERT INTO scroll_sequence (batch_id, session_id, delta_x, delta_y, timestamp)
                    VALUES (?, ?, ?, ?, ?)
                `)

                for (const event of record.scrollSequence) {
                    scrollStmt.run(
                        batchId,
                        record.sessionId,
                        event.dX || 0,
                        event.dY || 0,
                        event.t
                    )
                }
            }

            // 如果未上传，添加到上传队列
            if (!record.uploaded) {
                const uploadStmt = this.db.prepare(`
                    INSERT INTO upload_queue (record_type, batch_id, data, created_at)
                    VALUES (?, ?, ?, ?)
                `)

                uploadStmt.run('batch', batchId, JSON.stringify(record), Date.now())
            }

            return batchResult.lastInsertRowid
        })

        const result = transaction()
        console.log('[ActivityDatabase] 保存批次记录:', batchId, '鼠标事件:', record.mouseTrajectory?.length || 0)
        return result
    }

    /**
     * 获取未上传的批次记录
     */
    getUnuploadedRecords(limit = 50) {
        const stmt = this.db.prepare(`
            SELECT ab.*,
                   (SELECT COUNT(*) FROM mouse_trajectory mt WHERE mt.batch_id = ab.batch_id) as mouse_count,
                   (SELECT COUNT(*) FROM key_sequence ks WHERE ks.batch_id = ab.batch_id) as key_count
            FROM activity_batches ab
            WHERE ab.uploaded = 0
            ORDER BY ab.created_at ASC
            LIMIT ?
        `)

        return stmt.all(limit)
    }

    /**
     * 获取批次详细数据
     */
    getBatchDetails(batchId) {
        const batch = this.db.prepare('SELECT * FROM activity_batches WHERE batch_id = ?').get(batchId)
        if (!batch) return null

        batch.stats = JSON.parse(batch.stats || '{}')
        batch.frequencies = JSON.parse(batch.frequencies || '{}')
        batch.mouseTrajectory = this.db.prepare(
            'SELECT * FROM mouse_trajectory WHERE batch_id = ? ORDER BY timestamp'
        ).all(batchId)
        batch.keySequence = this.db.prepare(
            'SELECT * FROM key_sequence WHERE batch_id = ? ORDER BY timestamp'
        ).all(batchId)
        batch.scrollSequence = this.db.prepare(
            'SELECT * FROM scroll_sequence WHERE batch_id = ? ORDER BY timestamp'
        ).all(batchId)

        return batch
    }

    /**
     * 标记批次已上传
     */
    markBatchUploaded(batchId) {
        const stmt = this.db.prepare('UPDATE activity_batches SET uploaded = 1, uploaded_at = ? WHERE batch_id = ?')
        stmt.run(Date.now(), batchId)
    }

    /**
     * 获取会话所有批次
     */
    getSessionBatches(sessionId) {
        return this.db.prepare(
            'SELECT * FROM activity_batches WHERE session_id = ? ORDER BY start_time ASC'
        ).all(sessionId)
    }

    // ==================== 设备信息管理 ====================

    saveDeviceInfo(deviceInfo) {
        const existing = this.getDeviceByFingerprint(deviceInfo.fingerprint)

        if (existing) {
            const stmt = this.db.prepare(`
                UPDATE device_info SET user_id = ?, last_seen = ?, login_count = login_count + 1
                WHERE fingerprint = ?
            `)
            stmt.run(deviceInfo.userId, Date.now(), deviceInfo.fingerprint)
            return { isNew: false, deviceId: existing.device_id }
        } else {
            const deviceId = this.generateDeviceId()
            const stmt = this.db.prepare(`
                INSERT INTO device_info (device_id, user_id, fingerprint, hardware_info, browser_info, first_seen, last_seen)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `)
            stmt.run(
                deviceId,
                deviceInfo.userId,
                deviceInfo.fingerprint,
                JSON.stringify(deviceInfo.hardwareInfo),
                JSON.stringify(deviceInfo.browserInfo),
                Date.now(),
                Date.now()
            )
            return { isNew: true, deviceId }
        }
    }

    getDeviceByFingerprint(fingerprint) {
        return this.db.prepare('SELECT * FROM device_info WHERE fingerprint = ?').get(fingerprint) || null
    }

    getTrustedDevices(userId) {
        return this.db.prepare(
            'SELECT * FROM device_info WHERE user_id = ? ORDER BY last_seen DESC'
        ).all(userId)
    }

    setDeviceTrusted(deviceId, trusted = true) {
        this.db.prepare('UPDATE device_info SET is_trusted = ? WHERE device_id = ?').run(trusted ? 1 : 0, deviceId)
    }

    // ==================== 上传队列管理 ====================

    addToUploadQueue(recordType, recordId, data) {
        const stmt = this.db.prepare(`
            INSERT INTO upload_queue (record_type, record_id, data, created_at)
            VALUES (?, ?, ?, ?)
        `)
        stmt.run(recordType, recordId, JSON.stringify(data), Date.now())
    }

    getPendingUploads(limit = 50) {
        return this.db.prepare(`
            SELECT * FROM upload_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?
        `).all(limit)
    }

    updateUploadStatus(id, status = 'completed', incrementRetry = false) {
        let sql = `UPDATE upload_queue SET status = ?, last_retry_at = ?`
        if (incrementRetry) {
            sql += `, retry_count = retry_count + 1`
        }
        sql += ` WHERE id = ?`
        this.db.prepare(sql).run(status, Date.now(), id)
    }

    // ==================== 数据清理 ====================

    cleanupOldData(days = 30) {
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000)

        // 获取需要清理的批次
        const batches = this.db.prepare(`
            SELECT batch_id FROM activity_batches WHERE end_time < ? AND uploaded = 1
        `).all(cutoffTime)

        const batchIds = batches.map(b => b.batch_id)

        const transaction = this.db.transaction(() => {
            // 清理轨迹数据
            if (batchIds.length > 0) {
                const placeholders = batchIds.map(() => '?').join(',')
                this.db.prepare(`DELETE FROM mouse_trajectory WHERE batch_id IN (${placeholders})`).run(...batchIds)
                this.db.prepare(`DELETE FROM key_sequence WHERE batch_id IN (${placeholders})`).run(...batchIds)
                this.db.prepare(`DELETE FROM scroll_sequence WHERE batch_id IN (${placeholders})`).run(...batchIds)
                this.db.prepare(`DELETE FROM activity_batches WHERE batch_id IN (${placeholders})`).run(...batchIds)
            }

            const sessionResult = this.db.prepare(`
                DELETE FROM user_sessions WHERE end_time < ? AND end_time IS NOT NULL
            `).run(cutoffTime)

            const queueResult = this.db.prepare(`
                DELETE FROM upload_queue WHERE created_at < ? AND status = 'completed'
            `).run(cutoffTime)

            return { batches: batchIds.length, sessions: sessionResult.changes, queues: queueResult.changes }
        })

        const result = transaction()
        console.log(`[ActivityDatabase] 清理完成: ${result.batches} 个批次, ${result.sessions} 个会话`)
        return result
    }

    // ==================== 工具方法 ====================

    generateDeviceId() {
        return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    getStats() {
        return {
            sessions: this.db.prepare('SELECT COUNT(*) as count FROM user_sessions').get().count,
            batches: this.db.prepare('SELECT COUNT(*) as count FROM activity_batches').get().count,
            uploaded: this.db.prepare('SELECT COUNT(*) as count FROM activity_batches WHERE uploaded = 1').get().count,
            mouseEvents: this.db.prepare('SELECT COUNT(*) as count FROM mouse_trajectory').get().count,
            keyEvents: this.db.prepare('SELECT COUNT(*) as count FROM key_sequence').get().count,
            devices: this.db.prepare('SELECT COUNT(*) as count FROM device_info').get().count,
            pending: this.db.prepare("SELECT COUNT(*) as count FROM upload_queue WHERE status = 'pending'").get().count
        }
    }

    clearUserData() {
        const transaction = this.db.transaction(() => {
            // 清除所有用户会话
            this.db.exec("DELETE FROM user_sessions")
            // 清除所有批次记录
            this.db.exec("DELETE FROM activity_batches")
            // 清除鼠标轨迹
            this.db.exec("DELETE FROM mouse_trajectory")
            // 清除按键序列
            this.db.exec("DELETE FROM key_sequence")
            // 清除滚动序列
            this.db.exec("DELETE FROM scroll_sequence")
            // 清除上传队列
            this.db.exec("DELETE FROM upload_queue")
            // 保留 device_info（用于设备信任）
        })
        transaction()
        console.log('[ActivityDatabase] 用户数据已清除（保留设备信息）')
    }

    close() {
        if (this.db) {
            this.db.close()
            console.log('[ActivityDatabase] 数据库连接已关闭')
        }
    }
}

let dbInstance = null

export function initDatabase(dbPath = null) {
    if (!dbInstance) {
        dbInstance = new ActivityDatabase(dbPath)
    }
    return dbInstance
}

export function getDatabase() {
    if (!dbInstance) {
        throw new Error('[ActivityDatabase] 数据库未初始化')
    }
    return dbInstance
}

export default ActivityDatabase
