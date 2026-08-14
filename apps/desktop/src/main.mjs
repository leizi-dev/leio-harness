/** Electron shell for the local Leio Harness Web application. */

import { join } from 'node:path'
import { app, BrowserWindow, dialog, shell } from 'electron'
import { loadLayeredEnv } from '@leio-ai/leio-app-boot'
import { runProfile } from '@leio-ai/leio/profile-boot'

let mainWindow
let harnessShutdown
let quitAfterShutdown = false

function describeError(error) {
  const own = error instanceof Error ? error.stack ?? error.message : String(error)
  const details = error instanceof AggregateError ? error.errors.map(describeError) : []
  if (error instanceof Error && error.cause !== undefined) details.push(describeError(error.cause))
  return details.length === 0 ? own : [own, ...details].join('\nCaused by: ')
}

function openExternal(target) {
  const protocol = new URL(target).protocol
  if (protocol === 'http:' || protocol === 'https:') void shell.openExternal(target)
}

function createWindow(url) {
  const origin = new URL(url).origin
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f7f7f8',
    icon: join(app.getAppPath(), 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  window.webContents.setWindowOpenHandler(({ url: target }) => {
    openExternal(target)
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event, target) => {
    if (new URL(target).origin === origin) return
    event.preventDefault()
    openExternal(target)
  })
  window.once('ready-to-show', () => { window.show() })
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = undefined
  })
  void window.loadURL(url)
  mainWindow = window
}

async function startDesktop() {
  const runtime = await runProfile({
    environment: loadLayeredEnv('dsh'),
    profile: 'web',
    patchFiles: [],
    args: ['--host', '127.0.0.1', '--port', '0'],
    watchUserPatches: false,
  })
  harnessShutdown = runtime.shutdown
  const server = runtime.ctx.get('webServer')
  if (server === undefined || typeof server.port !== 'number') {
    throw new Error('Leio Harness Web server did not publish its listening port.')
  }
  createWindow(`http://127.0.0.1:${String(server.port)}`)
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow === undefined) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })
  app.on('before-quit', (event) => {
    if (harnessShutdown === undefined || quitAfterShutdown) return
    event.preventDefault()
    quitAfterShutdown = true
    void harnessShutdown.shutdown(0).finally(() => { app.quit() })
  })
  app.on('window-all-closed', () => { app.quit() })
  void app.whenReady().then(startDesktop).catch((error) => {
    const message = describeError(error)
    console.error(message)
    dialog.showErrorBox('Leio Harness failed to start', message)
    app.quit()
  })
}
