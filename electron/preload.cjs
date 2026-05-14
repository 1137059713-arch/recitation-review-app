const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('recitationStorage', {
  load: () => ipcRenderer.invoke('recitation-storage:load'),
  save: (state) => ipcRenderer.invoke('recitation-storage:save', state),
})
