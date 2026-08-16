/**
 * Package-owned invariant companion for the desktop update settings plugin.
 * @module @leio-ai/leio-client-ui-settings-update/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@leio-ai/leio-invariants'

const PACKAGE_NAME = '@leio-ai/leio-client-ui-settings-update'

/** Cordis companion plugin name. */
export const name = 'client-ui-settings-update-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the package owns a disposable settings slot and a
 * renderer bridge, but no model-visible or durable Cordis relation.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
