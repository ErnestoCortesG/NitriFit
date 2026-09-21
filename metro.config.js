// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web build imports a .wasm file (wa-sqlite) — Metro needs to
// treat it as a resolvable asset, otherwise bundling the app for web fails.
config.resolver.assetExts.push('wasm');

module.exports = config;
