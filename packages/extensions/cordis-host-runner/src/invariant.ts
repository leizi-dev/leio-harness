/**
 * Package-owned invariant companion for `@leio-ai/leio-cordis-host-runner`.
 * @module @leio-ai/leio-cordis-host-runner/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@leio-ai/leio-invariants'

const PACKAGE_NAME = '@leio-ai/leio-cordis-host-runner'

/** Cordis companion plugin name. */
export const name = 'cordis-host-runner-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the definition registry is process memory with no event
 * stream to observe, and its one owned relation (a running definition owns a
 * settled host-half fiber and its handler table) is established and unwound
 * inside single awaited verbs, so package tests assert it directly.
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
