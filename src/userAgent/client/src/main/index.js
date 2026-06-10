import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { createActivityMonitor, getActivityMonitor } from './activityMonitor'
import { initDatabase, getDatabase } from './activityDatabase'
import { deviceFingerprint } from './deviceFingerprint'

let mainWindow
let activityMonitor = null
let database = null

// 行为监控配置
const activityConfig = {
    sampleRates: {
        mouse: 100,           // 鼠标轨迹采样（毫秒），每秒10次
        keyboard: 100,        // 键盘采样（毫秒）
        scroll: 100,          // 滚动采样（毫秒）
    },
    batch: {
        saveInterval: 2 * 60 * 1000,       // 本地存储：每2分钟存入数据库
        uploadInterval: 3 * 60 * 1000,     // 上传：每3分钟尝试上传
        maxBatchRecords: 10000,
    },
    inactivityTimeout: 6 * 60 * 1000,     // 失活超时：6分钟
    inactivityCheckInterval: 1000,           // 失活检测间隔
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 600,
        resizable: false,
        frame: false,
        titleBarOverlay: process.platform === 'win32',
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true
        }
    })

    // 初始化行为监控
    activityMonitor = createActivityMonitor(activityConfig)

    // 设置窗口控制
    ipcMain.on('window-control', (event, action) => {
        switch (action) {
            case 'minimize': mainWindow.minimize(); break;
            case 'maximize':
                mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
                break;
            case 'close': mainWindow.close(); break;
        }
    })

    // ========== 行为监控 IPC ==========
    ipcMain.on('activity:init', async (event, userInfo) => {
        if (activityMonitor) {
            await activityMonitor.init(mainWindow, userInfo)
        }
    })

    ipcMain.on('activity:start', () => {
        if (activityMonitor) {
            activityMonitor.start()
        }
    })

    ipcMain.on('activity:stop', () => {
        if (activityMonitor) {
            activityMonitor.stop()
        }
    })

    ipcMain.on('activity:reset', async (event, userInfo) => {
        if (activityMonitor) {
            await activityMonitor.reset(userInfo)
        }
    })

    ipcMain.on('activity:config', (event, newConfig) => {
        if (activityMonitor) {
            activityMonitor.updateConfig(newConfig)
        }
    })

    ipcMain.handle('activity:status', () => {
        if (activityMonitor) {
            return activityMonitor.getStatus()
        }
        return null
    })

    ipcMain.handle('activity:stats', () => {
        if (activityMonitor) {
            return activityMonitor.getStats()
        }
        return null
    })

    ipcMain.handle('activity:device-info', () => {
        if (activityMonitor) {
            return activityMonitor.getDeviceInfo()
        }
        return deviceFingerprint.getSummary()
    })

    // 批量上传成功后标记记录已上传
    ipcMain.on('activity:batch-uploaded', (event, batchIds) => {
        if (activityMonitor && activityMonitor.db) {
            batchIds.forEach(batchId => {
                activityMonitor.db.markBatchUploaded(batchId)
            })
            console.log(`[Main] 已标记 ${batchIds.length} 条记录为已上传`)
        }
    })

    ipcMain.on('auth:logout', (event, type = 'manual') => {
        if (activityMonitor) {
            activityMonitor.reportLogout(type)
            activityMonitor.setLoginState(false)  // 重置登录状态，停止计时
        }
        // 清除用户行为数据（保留设备信息和公司接入地址）
        if (database) {
            database.clearUserData()
        }
    })

    // 设置登录状态（用于控制失活计时）
    ipcMain.on('auth:set-login-state', (event, isLoggedIn, userInfo = null) => {
        if (activityMonitor) {
            activityMonitor.setLoginState(isLoggedIn, userInfo)
        }
    })

    // ========== 数据库 IPC ==========
    ipcMain.handle('db:query', (event, sql, params = []) => {
        if (database) {
            try {
                const stmt = database.db.prepare(sql)
                return stmt.all(...params)
            } catch (error) {
                console.error('[Main] 数据库查询失败:', error)
                throw error
            }
        }
        return null
    })

    ipcMain.handle('db:execute', (event, sql, params = []) => {
        if (database) {
            try {
                const stmt = database.db.prepare(sql)
                return stmt.run(...params)
            } catch (error) {
                console.error('[Main] 数据库执行失败:', error)
                throw error
            }
        }
        return null
    })

    // 核心：优先使用 electron-vite 注入的环境变量
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        app.commandLine.appendSwitch('ignore-certificate-errors')
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    mainWindow.on('closed', () => {
        if (activityMonitor) {
            activityMonitor.stop()
        }
        mainWindow = null
    })
}

// 应用启动时初始化数据库
function initAppDatabase() {
    try {
        database = initDatabase()
        console.log('[Main] 数据库初始化成功')

        // 设置定期清理
        setInterval(() => {
            if (database) {
                database.cleanupOldData(30) // 保留30天数据
            }
        }, 24 * 60 * 60 * 1000) // 24小时

    } catch (error) {
        console.error('[Main] 数据库初始化失败:', error)
    }
}

app.whenReady().then(() => {
    // Menu.setApplicationMenu(null)
    initAppDatabase()
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('before-quit', () => {
    if (activityMonitor) {
        activityMonitor.reportLogout('app_quit')
        activityMonitor.stop()
    }
    if (database) {
        database.close()
    }
})
