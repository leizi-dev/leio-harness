/** Renderer-side contract exposed by the Electron preload script. */

export type DesktopUpdateStatus = 'unsupported' | 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'installing'

export interface DesktopUpdateState {
  status: DesktopUpdateStatus
  currentVersion: string
  availableVersion: string | null
  notes: string
  mandatory: boolean
  progress: number
  lastError: string | null
}

export interface DesktopUpdateBridge {
  getState: () => Promise<DesktopUpdateState>
  check: (force?: boolean) => Promise<DesktopUpdateState>
  download: () => Promise<DesktopUpdateState>
  install: () => Promise<DesktopUpdateState>
  subscribe: (listener: (state: DesktopUpdateState) => void) => () => void
}

declare global {
  interface Window {
    leioDesktopUpdate?: DesktopUpdateBridge
  }
}
