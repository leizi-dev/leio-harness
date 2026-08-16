const { contextBridge, ipcRenderer } = require('electron')

const STATE_EVENT = 'leio-updater:state'

contextBridge.exposeInMainWorld('leioDesktopUpdate', {
  getState: () => ipcRenderer.invoke('leio-updater:get-state'),
  check: (force = false) => ipcRenderer.invoke('leio-updater:check', force),
  download: () => ipcRenderer.invoke('leio-updater:download'),
  install: () => ipcRenderer.invoke('leio-updater:install'),
  subscribe: (listener) => {
    const handler = (_event, state) => { listener(state) }
    ipcRenderer.on(STATE_EVENT, handler)
    return () => { ipcRenderer.removeListener(STATE_EVENT, handler) }
  },
})
