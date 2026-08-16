import { useEffect, useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@leio-ai/leio-client-ui-slots'
import type { DesktopUpdateBridge, DesktopUpdateState } from './bridge.ts'
import css from './UpdateRow.module.css'

/** Private bridge share injected by the desktop update plugin. */
export interface UpdateRowInjected {
  bridge: DesktopUpdateBridge
}

/** Full settings-row props. */
export type UpdateRowProps =
  PropsRuntime<'settings.general.item'>
  & PropsLocale<'settings.update'>
  & InjectFace<UpdateRowInjected>

function format(template: string, value: string): string {
  return template.replace('{version}', value).replace('{progress}', value).replace('{error}', value)
}

/** Render the desktop update status and manual actions. */
export function UpdateRow({ bridge, t }: UpdateRowProps) {
  const [state, setState] = useState<DesktopUpdateState | undefined>(undefined)

  useEffect(() => {
    let active = true
    void bridge.getState().then((next) => { if (active) setState(next) })
    const dispose = bridge.subscribe((next) => { if (active) setState(next) })
    return () => {
      active = false
      dispose()
    }
  }, [bridge])

  if (state === undefined || state.status === 'unsupported') return null
  const busy = state.status === 'checking' || state.status === 'downloading' || state.status === 'installing'
  const action = state.status === 'available'
    ? () => { void bridge.download() }
    : state.status === 'downloaded'
      ? () => { void bridge.install() }
      : () => { void bridge.check(true) }
  const label = state.status === 'checking'
    ? t('checking')
    : state.status === 'downloading'
      ? format(t('downloading'), String(Math.round(state.progress * 100)))
      : state.status === 'installing'
        ? t('installing')
        : state.status === 'available'
          ? t('download')
          : state.status === 'downloaded'
            ? t('install')
            : t('check')
  const description = state.status === 'available'
    ? format(t('available'), state.availableVersion ?? '')
    : state.status === 'downloaded'
      ? t('downloaded')
      : state.lastError === null
        ? state.status === 'idle' ? t('currentLatest') : t('description')
        : format(t('error'), state.lastError)

  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('title')}</div>
        <div className={`${css.description} ${state.lastError === null ? '' : css.error}`}>
          {format(t('current'), state.currentVersion)} · {description}
        </div>
        {state.notes !== '' && state.status === 'available' && <div className={css.notes}>{state.notes}</div>}
      </div>
      <button type="button" className={css.action} disabled={busy} onClick={action}>{label}</button>
    </div>
  )
}
