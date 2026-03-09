const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro') // make sure this import exists
const fs = require('fs')
const path = require('path')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)
const pnpmStorePath = path.join(__dirname, 'node_modules/.pnpm')
const solanaBufferLayoutDir = fs
  .readdirSync(pnpmStorePath)
  .find((entry) => entry.startsWith('@solana+buffer-layout@'))
const anchorDir = fs.readdirSync(pnpmStorePath).find((entry) => entry.startsWith('@coral-xyz+anchor@'))

if (!solanaBufferLayoutDir) {
  throw new Error('Unable to locate @solana/buffer-layout in node_modules/.pnpm')
}

if (!anchorDir) {
  throw new Error('Unable to locate @coral-xyz/anchor in node_modules/.pnpm')
}

const solanaBufferLayoutEntry = path.join(
  pnpmStorePath,
  solanaBufferLayoutDir,
  'node_modules/@solana/buffer-layout/lib/Layout.js',
)
const anchorEntry = path.join(pnpmStorePath, anchorDir, 'node_modules/@coral-xyz/anchor/dist/cjs/index.js')
const meteoraDlmmEntry = path.resolve(__dirname, 'node_modules/@meteora-ag/dlmm/dist/index.js')

// Prefer CommonJS entry points over browser bundles for Solana/Anchor packages.
// The browser build of @coral-xyz/anchor uses Uint8Array values without Buffer helpers,
// which breaks in React Native during swap/add-liquidity serialization.
config.resolver.resolverMainFields = ['react-native', 'main', 'browser']
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@coral-xyz/anchor': anchorEntry,
  '@meteora-ag/dlmm': meteoraDlmmEntry,
  'buffer-layout': solanaBufferLayoutEntry,
  fs: path.resolve(__dirname, 'src/shims/empty-node-module.js'),
  path: path.resolve(__dirname, 'src/shims/empty-node-module.js'),
}

// Apply uniwind modifications before exporting
const uniwindConfig = withUniwindConfig(config, {
  // relative path to your global.css file
  cssEntryFile: './src/global.css',
  // optional: path to typings
  dtsFile: './src/uniwind-types.d.ts',
})

module.exports = uniwindConfig
