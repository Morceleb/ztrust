import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    minWidth: 1024,
    minHeight: 600,
    frame: false,
    titleBarOverlay: process.platform === 'win32',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, // electron-vite 默认推荐
      contextIsolation: true
    }
  })

  const { ipcMain } = require('electron')

  ipcMain.on('window-control', (event, action) => {
    switch (action) {
      case 'minimize': mainWindow.minimize(); break;
      case 'maximize':
        mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
        break;
      case 'close': mainWindow.close(); break;
    }
  })


  // 核心：优先使用 electron-vite 注入的环境变量
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    app.commandLine.appendSwitch('ignore-certificate-errors')
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})