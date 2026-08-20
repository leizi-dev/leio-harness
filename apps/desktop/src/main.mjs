/** Electron shell for the local Leio Harness Web application. */

import { dirname, join } from 'node:path'
import { ipcMain, app, BrowserWindow, dialog, shell } from 'electron'
import { RuntimeBootstrapper, assertRuntimeAsset } from './runtime/bootstrap.mjs'
import { DESKTOP_RUNTIME } from './runtime/manifest.mjs'

let mainWindow
let harnessShutdown
let quitAfterShutdown = false
let desktopUpdater
let bootstrapWindow

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

/** Render the dependency bootstrap UI without importing any Leio package. */
function startupPage() {
  const icon = join(app.getAppPath(), 'build', 'icon.png').replaceAll('\\', '/')
  const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Leio Harness</title><style>
body{margin:0;background:#f7f7f8;color:#19191b;font:15px/1.5 system-ui,"Microsoft YaHei",sans-serif;display:grid;place-items:center;height:100vh}.card{width:380px;text-align:center}.brand{width:72px;height:72px;border-radius:50%;margin:0 auto 20px;background:#f0df00 url("${icon}") center/cover}.title{font-size:22px;font-weight:700;margin-bottom:8px}.detail{color:#65656b;min-height:25px}.track{height:8px;background:#e1e1e4;border-radius:8px;overflow:hidden;margin-top:18px}.fill{height:100%;width:2%;background:#e8d500;transition:width .15s ease}</style>
<main class="card"><div class="brand"></div><div class="title">Leio Harness 正在准备</div><div id="detail" class="detail">正在启动…</div><div class="track"><div id="fill" class="fill"></div></div></main><script>window.setBootstrapState=function(s){document.querySelector('#detail').textContent=s.detail;document.querySelector('#fill').style.width=Math.round((s.progress||0)*100)+'%'}</script></html>`
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
}

/** Open the first-launch dependency progress window. */
function createBootstrapWindow() {
  const window = new BrowserWindow({
    width: 500,
    height: 360,
    resizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    backgroundColor: '#f7f7f8',
    icon: join(app.getAppPath(), 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  void window.loadURL(startupPage())
  bootstrapWindow = window
}

/** Push a progress update to the independent startup window. */
function publishBootstrap(state) {
  if (bootstrapWindow === undefined || bootstrapWindow.isDestroyed()) return
  const payload = JSON.stringify(state).replace(/</g, '\\u003c')
  void bootstrapWindow.webContents.executeJavaScript(`window.setBootstrapState(${payload})`, true)
}

/** Close the startup window after the profile publishes its HTTP port. */
function closeBootstrapWindow() {
  if (bootstrapWindow === undefined || bootstrapWindow.isDestroyed()) return
  bootstrapWindow.close()
  bootstrapWindow = undefined
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
      preload: join(app.getAppPath(), 'src', 'preload.cjs'),
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

function setupUpdater(DesktopUpdater, launchNsisInstaller) {
  desktopUpdater = new DesktopUpdater({
    currentVersion: app.getVersion(),
    userDataPath: app.getPath('userData'),
    canUpdate: app.isPackaged,
    launchInstaller: installerPath => {
      launchNsisInstaller(installerPath, dirname(process.execPath), () => { app.quit() })
    },
  })
  ipcMain.handle('leio-updater:get-state', () => desktopUpdater.getState())
  ipcMain.handle('leio-updater:check', (_event, force) => desktopUpdater.check(force === true))
  ipcMain.handle('leio-updater:download', () => desktopUpdater.download())
  ipcMain.handle('leio-updater:install', () => desktopUpdater.install())
  desktopUpdater.subscribe(state => {
    if (mainWindow !== undefined && !mainWindow.isDestroyed()) mainWindow.webContents.send('leio-updater:state', state)
  })
}

async function startDesktop() {
  assertRuntimeAsset(DESKTOP_RUNTIME)
  createBootstrapWindow()
  const runtimeBootstrap = new RuntimeBootstrapper({ userDataPath: app.getPath('userData'), runtime: DESKTOP_RUNTIME })
  await runtimeBootstrap.ensure(publishBootstrap)
  const [{ loadLayeredEnv }, { runProfile }, { DesktopUpdater, launchNsisInstaller }] = await Promise.all([
    runtimeBootstrap.importPackage('@leio-ai/leio-app-boot'),
    runtimeBootstrap.importPackage('@leio-ai/leio/profile-boot'),
    import('./updater/updater.mjs'),
  ])
  setupUpdater(DesktopUpdater, launchNsisInstaller)
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
  closeBootstrapWindow()
  createWindow(`http://127.0.0.1:${String(server.port)}`)
  setTimeout(() => { void desktopUpdater?.check() }, 10_000)
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
  void app.whenReady().then(() => {
    return startDesktop()
  }).catch((error) => {
    const message = describeError(error)
    console.error(message)
    closeBootstrapWindow()
    dialog.showErrorBox('Leio Harness failed to start', message)
    app.quit()
  })
}
