/** Desktop update status and manual actions for the General settings section. */
import type { ClientContext } from '@leio-ai/leio-client-runtime/client'
import type {} from '@leio-ai/leio-client-locale/client'
import type {} from '@leio-ai/leio-client-ui-settings/client'
import { UpdateRow } from './UpdateRow.tsx'
import type { UpdateRowInjected } from './UpdateRow.tsx'
import { en, zh, type SettingsUpdateKey } from './locales.ts'
import type { DesktopUpdateBridge } from './bridge.ts'

export type { DesktopUpdateBridge, DesktopUpdateState, DesktopUpdateStatus } from './bridge.ts'
export type { SettingsUpdateKey } from './locales.ts'
export type { UpdateRowInjected, UpdateRowProps } from './UpdateRow.tsx'

declare module '@leio-ai/leio-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Desktop update status and action copy. */
    'settings.update': SettingsUpdateKey
  }
}

const NS = 'settings.update'

/** Services required by the browser-side slot registration. */
export const inject = ['slots', 'locale']

/** Register the update row when Electron exposed the desktop bridge. */
export function apply(ctx: ClientContext): void {
  const bridge = globalThis.window?.leioDesktopUpdate
  if (bridge === undefined) return
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-settings-update: dictionaries')
  const injected = (): UpdateRowInjected => ({ bridge: bridge as DesktopUpdateBridge })
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'desktop-update',
    order: 100,
    locale: NS,
    inject: injected,
  }, UpdateRow))
}
