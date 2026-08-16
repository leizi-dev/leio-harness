/** Copy dictionaries for the desktop update row. */

/** English strings (the key-set source of truth for this pair). */
export const en = {
  title: 'Application updates',
  description: 'Check for a newer Leio Harness update.',
  current: 'Current version: {version}',
  check: 'Check for updates',
  checking: 'Checking for updates…',
  available: 'Version {version} is available.',
  download: 'Download update',
  downloading: 'Downloading update… {progress}%',
  downloaded: 'Update downloaded. Restart to install it.',
  install: 'Restart and install',
  installing: 'Restarting to install…',
  currentLatest: 'You are using the latest version.',
  error: 'Update check failed: {error}',
} as const

/** The settings.update namespace key union. */
export type SettingsUpdateKey = keyof typeof en

/** Chinese strings (same keys as {@link en}). */
export const zh: { [Key in keyof typeof en]: string } = {
  title: '应用更新',
  description: '检查是否有新的 Leio Harness 更新。',
  current: '当前版本：{version}',
  check: '检查更新',
  checking: '正在检查更新…',
  available: '发现新版本 {version}。',
  download: '下载更新',
  downloading: '正在下载更新… {progress}%',
  downloaded: '更新已下载，重启后安装。',
  install: '重启并安装',
  installing: '正在重启并安装…',
  currentLatest: '当前已经是最新版本。',
  error: '检查更新失败：{error}',
}
