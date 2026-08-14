/**
 * Shared browser platform modules. Seeding, bundling externals, and Vite
 * aliases consume this list so their module identities cannot drift.
 * @module @leio-ai/leio-client-web/src/platform
 */

/** The module specifiers the shell shares into the frozen module table. */
export const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  '@leio-ai/leio-client-ui-slots',
  '@leio-ai/leio-client-web-react',
  '@leio-ai/leio-client-ui-primitives',
  '@leio-ai/leio-client-ui-attachment',
  '@leio-ai/leio-client-schema-form',
] as const

/** One platform module specifier (a seed-table key). */
export type PlatformModule = (typeof PLATFORM_MODULES)[number]
