/**
 * Package-owned invariant companion for `@leio-ai/leio-terminal`.
 * @module @leio-ai/leio-terminal/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@leio-ai/leio-invariants'

const PACKAGE_NAME = '@leio-ai/leio-terminal'

/** Cordis companion plugin name. */
export const name = 'terminal-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: backend and owner-scoped session registries are private mutable state,
 * and the service exposes neither an independent lifecycle stream nor an unscoped snapshot.
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
