/**
 * Package-owned invariant companion for `@leio-ai/leio-subprocess-e2b`.
 * @module @leio-ai/leio-subprocess-e2b/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@leio-ai/leio-invariants'

const PACKAGE_NAME = '@leio-ai/leio-subprocess-e2b'

/** Cordis companion plugin name. */
export const name = 'subprocess-e2b-invariant'
/** Service required before reserving package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: live remote handles are private teardown ownership,
 * and the E2B command event stream is the sole outcome authority.
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
