/**
 * Electron 到 Tauri 迁移指南
 * Electron -> Tauri Migration Guide
 */

# 从 Electron 迁移到 Tauri 指南

本指南帮助将基于 Electron 的 ZTrust 客户端迁移到 Tauri 2.0。

## 主要变更

### 1. 项目结构

**Electron 结构:**
```
electron/
├── main/              # 主进程
│   ├── index.js
│   ├── preload.js
│   └── ...
├── renderer/          # 渲染进程
│   ├── index.html
│   ├── src/
│   └── ...
└── package.json
```

**Tauri 结构:**
```
src-tauri/            # Rust 后端
├── src/
│   ├── main.rs
│   ├── lib.rs
│   └── ...
├── Cargo.toml
└── tauri.conf.json

src/renderer/         # 前端
├── index.html
├── src/
└── ...
```

### 2. 主进程代码

**Electron (main.js):**
```javascript
import { app, BrowserWindow, ipcMain } from 'electron';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    });
}

ipcMain.on('window-control', (event, action) => {
    if (action === 'minimize') mainWindow.minimize();
});

app.whenReady().then(createWindow);
```

**Tauri (lib.rs):**
```rust
use tauri::{AppHandle, Manager};

#[tauri::command]
fn window_control(action: &str, app: AppHandle) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("窗口未找到")?;
    
    match action {
        "minimize" => window.minimize().map_err(|e| e.to_string()),
        "maximize" => window.maximize().map_err(|e| e.to_string()),
        "close" => window.close().map_err(|e| e.to_string()),
        _ => Err(format!("未知操作: {}", action)),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![window_control])
        .run(tauri::generate_context!())
        .expect("应用启动失败");
}
```

### 3. Preload 脚本

**Electron (preload.js):**
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    controlWindow: (action) => ipcRenderer.send('window-control', action),
    onTimeout: (callback) => {
        ipcRenderer.on('auth:timeout', (event, data) => callback(data));
    }
});
```

**Tauri (前端):**
```javascript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// 窗口控制
await invoke('window_control', { action: 'minimize' });

// 事件监听
await listen('auth:timeout', (event) => {
    console.log('收到超时事件:', event.payload);
});
```

### 4. API 调用对比

| 功能 | Electron | Tauri |
|------|----------|-------|
| 同步调用 | `ipcRenderer.sendSync()` | `invoke()` (async) |
| 异步调用 | `ipcRenderer.invoke()` | `invoke()` |
| 发送消息 | `ipcRenderer.send()` | `invoke()` |
| 监听事件 | `ipcRenderer.on()` | `listen()` |
| 移除监听 | `ipcRenderer.removeAllListeners()` | `unlisten()` |

### 5. 数据库

**Electron (better-sqlite3):**
```javascript
const Database = require('better-sqlite3');
const db = new Database('path/to/db.sqlite');
const result = db.prepare('SELECT * FROM users').all();
```

**Tauri (rusqlite):**
```rust
use rusqlite::{Connection, Result};

fn query_db(conn: &Connection) -> Result<()> {
    let mut stmt = conn.prepare("SELECT * FROM users")?;
    let users = stmt.query_map([], |row| {
        Ok(User {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    })?;
    for user in users {
        println!("User: {:?}", user?);
    }
    Ok(())
}
```

### 6. 文件系统

**Electron:**
```javascript
const fs = require('fs');
const content = fs.readFileSync('path/to/file', 'utf-8');
```

**Tauri:**
```rust
use std::fs;
use std::path::Path;

fn read_file(path: &Path) -> std::io::Result<String> {
    fs::read_to_string(path)
}
```

**前端 (使用插件):**
```javascript
import { readTextFile } from '@tauri-apps/plugin-fs';
const content = await readTextFile('path/to/file.txt');
```

### 7. 窗口管理

**Electron:**
```javascript
mainWindow.minimize();
mainWindow.maximize();
mainWindow.close();
mainWindow.setAlwaysOnTop(true);
mainWindow.setSize(800, 600);
```

**Tauri:**
```javascript
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();
await appWindow.minimize();
await appWindow.maximize();
await appWindow.close();
await appWindow.setAlwaysOnTop(true);
await appWindow.setSize(800, 600);
```

### 8. 系统信息

**Electron:**
```javascript
process.platform  // 'win32', 'darwin', 'linux'
process.arch      // 'x64', 'arm64'
```

**Tauri:**
```rust
std::env::consts::OS   // "windows", "macos", "linux"
std::env::consts::ARCH // "x86", "x86_64", "aarch64"
```

### 9. 应用菜单

**Electron:**
```javascript
const { Menu } = require('electron');
const template = [{ role: 'quit' }];
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
```

**Tauri:**
```rust
// 在 tauri.conf.json 中配置或使用 menu 插件
```

### 10. 打包构建

**Electron:**
```bash
npm run build
```

**Tauri:**
```bash
npm run tauri build
```

## 常见问题

### Q: 如何调试 Tauri 应用？
A: 使用 `npm run tauri dev` 启动开发模式，或在 VS Code 中安装 rust-analyzer 扩展。

### Q: Tauri 支持哪些插件？
A: 查看官方插件列表：https://tauri.app/plugin/

### Q: 如何添加自定义命令？
A: 在 lib.rs 中使用 `#[tauri::command]` 标记函数，并在 `invoke_handler` 中注册。

### Q: Tauri 的安全模型是什么？
A: Tauri 使用基于权限的系统，所有 IPC 调用都需要在 capabilities 中声明。

## 资源链接

- [Tauri 官方文档](https://tauri.app/)
- [Tauri 2.0 迁移指南](https://tauri.app/migration/)
- [Tauri 插件列表](https://tauri.app/plugin/)
- [Rust 官方文档](https://doc.rust-lang.org/)
