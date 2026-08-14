import { defineConfig } from 'tsdown'

/**
 * The dsh CLI ships its `bin` and the profile boot API consumed by the desktop
 * application. The root tsdown builds only `lib/types/index.js`, so this
 * override names both entries explicitly.
 * Declarations come from `tsc -b` (dts: false), matching every package.
 */
export default defineConfig({
  entry: ['lib/types/bin.js', 'lib/types/profile-boot.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
})
