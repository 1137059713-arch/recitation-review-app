const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('recitationStorage', {
  load: () => ipcRenderer.invoke('recitation-storage:load'),
  save: (state) => ipcRenderer.invoke('recitation-storage:save', state),
})

contextBridge.exposeInMainWorld('sidebarPanel', {
  show: () => ipcRenderer.send('sidebar-panel:show'),
  hide: () => ipcRenderer.send('sidebar-panel:hide'),
  onRefresh: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('sidebar-panel:refresh', listener)
    return () => ipcRenderer.removeListener('sidebar-panel:refresh', listener)
  },
})
