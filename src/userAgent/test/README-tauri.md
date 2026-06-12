# ZTrust Tauri

基于 Tauri 2.0 的零信任访问控制系统客户端。

## 项目简介

本项目是将原有的 Electron 应用重构为 Tauri 2.0，实现更小的体积、更快的启动速度和更好的性能。

## 技术栈

- **后端**: Tauri 2.0 + Rust
- **前端**: Vue 3 + Vite
- **数据库**: SQLite (rusqlite)
- **状态管理**: Pinia
- **路由**: Vue Router

## 项目结构

```
src/
├── main/                    # Rust 主进程代码
│   ├── main.rs             # 应用入口
│   ├── lib.rs              # 核心逻辑
│   ├── database.rs         # SQLite 数据库操作
│   ├── device.rs           # 设备信息采集
│   └── activity.rs         # 行为监控模块
├── renderer/               # 前端代码
│   └── src/
│       ├── assets/         # 静态资源
│       ├── components/      # Vue 组件
│       │   └── CustomUI/   # 自定义 UI 组件
│       ├── composables/    # Vue Composables
│       ├── config/         # 配置文件
│       ├── modules/        # 功能模块
│       │   └── behaviorCollector/  # 行为采集
│       ├── router/         # 路由配置
│       ├── store/          # 状态管理
│       ├── utils/          # 工具函数
│       └── views/          # 页面视图
src-tauri/                  # Tauri 后端配置
├── src/                    # Rust 源码
│   ├── main.rs            # 应用入口
│   ├── lib.rs             # 核心逻辑和命令
│   ├── database.rs        # 数据库操作
│   ├── device.rs          # 设备信息
│   └── activity.rs        # 行为监控
├── Cargo.toml             # Rust 依赖配置
├── tauri.conf.json        # Tauri 配置
└── capabilities/          # 权限配置
```

## 快速开始

### 前置要求

- Node.js 18+
- Rust 1.70+
- Tauri CLI

### 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Tauri CLI（可选，已在 package.json 中配置）
cargo install tauri-cli
```

### 开发模式

```bash
# 启动 Tauri 开发服务器
npm run tauri dev

# 或者只启动前端
npm run dev
```

### 构建发布

```bash
# 构建生产版本
npm run tauri build
```

### Windows 构建

```powershell
# 使用 PowerShell 脚本构建
.\scripts\build-tauri.ps1 -Release
```

## 功能特性

### 1. 用户认证

- Casdoor SSO 集成
- 社交登录支持
- 会话管理

### 2. 行为监控

- 鼠标轨迹采集
- 键盘输入采集
- 页面访问记录
- 设备指纹

### 3. 本地存储

- SQLite 数据库
- 加密存储
- 自动清理

### 4. 窗口管理

- 自定义标题栏
- 窗口拖拽
- 最小化/最大化/关闭

## 配置说明

### 环境变量

```env
# .env.development
VITE_API_BASE_URL=http://localhost:8080
VITE_CASDOOR_SERVER_URL=https://your-casdoor-server.com
VITE_CASDOOR_CLIENT_ID=your-client-id
```

### Tauri 配置

编辑 `src-tauri/tauri.conf.json` 修改：

- 窗口大小和标题
- 应用标识
- 构建目标
- 安全策略

## API 命令

### 窗口控制

```javascript
import { invoke } from '@tauri-apps/api/core';

await invoke('window_control', { action: 'minimize' });
await invoke('window_control', { action: 'maximize' });
await invoke('window_control', { action: 'close' });
```

### 活动监控

```javascript
await invoke('activity_init', { userInfo: { id: '123', name: 'User' } });
await invoke('activity_start');
await invoke('activity_stop');
await invoke('activity_set_login_state', { isLoggedIn: true });
```

### 数据库操作

```javascript
await invoke('db_query', { sql: 'SELECT * FROM config', params: [] });
await invoke('db_execute', { sql: 'INSERT INTO config VALUES (?, ?)', params: ['key', 'value'] });
```

## 开发指南

### 添加新命令

1. 在 `src-tauri/src/lib.rs` 中添加命令函数

```rust
#[tauri::command]
async fn my_command(arg: String) -> Result<String, String> {
    Ok(format!("Received: {}", arg))
}
```

2. 在 `invoke_handler` 中注册

```rust
.invoke_handler(tauri::generate_handler![
    // ...existing commands...
    my_command,
])
```

3. 在前端调用

```javascript
import { invoke } from '@tauri-apps/api/core';
const result = await invoke('my_command', { arg: 'value' });
```

### 添加新插件

1. 在 `Cargo.toml` 中添加依赖

```toml
tauri-plugin-example = "2"
```

2. 在 `lib.rs` 中初始化

```rust
.plugin(tauri_plugin_example::init())
```

3. 在 `tauri.conf.json` 中配置权限

## 故障排除

### 构建失败

```bash
# 清理缓存
cargo clean
rm -rf src-tauri/target
npm run tauri build
```

### Rust 编译错误

```bash
# 更新 Rust
rustup update

# 检查依赖
cargo check
```

### 前端热更新不工作

```bash
# 重启开发服务器
npm run tauri dev
```

## 许可证

MIT License
