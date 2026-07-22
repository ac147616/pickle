// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @react-native-firebase's package.json "exports" map has a wildcard bug:
// "./dist/module/common/*" maps to "./dist/module/common/*.js", which
// double-appends .js when the internal import specifier already ends in
// .js (e.g. "../../common/index.js" -> "common/index.js.js", which doesn't
// exist). Metro's default SDK 57 package-exports resolution hits this and
// fails to bundle. Falling back to "main"-field resolution avoids it.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
