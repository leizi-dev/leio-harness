import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { SlotRegistry } from '@leio-ai/leio-client-runtime/client'
import { apply, inject } from '@leio-ai/leio-client-ui-settings-update/client'

async function bench() {
  const ctx = new Context()
  const { SlotRegistry } = await import('@leio-ai/leio-client-runtime/client')
  await ctx.plugin(SlotRegistry).await()
  ctx.provide('locale', { register: vi.fn() })
  return { ctx, slots: ctx.get('slots') as SlotRegistry }
}

describe('ui-settings-update apply', () => {
  it('declares the browser-side services', () => {
    expect(inject).toEqual(['slots', 'locale'])
  })

  it('does not register a browser row without the Electron bridge', async () => {
    const before = (globalThis as { window?: unknown }).window
    delete (globalThis as { window?: unknown }).window
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    expect(b.slots.entries('settings.general.item')).toHaveLength(0)
    ;(globalThis as { window?: unknown }).window = before
  })
})
