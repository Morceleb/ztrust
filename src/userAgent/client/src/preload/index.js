const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 暴露给渲染进程的 API
  sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  controlWindow: (action) => ipcRenderer.send('window-control', action)
});