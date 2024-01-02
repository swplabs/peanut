const nodePath = require('path');
const webpack = require('webpack');
const envVars = require('./shared/envvars.js');
const { srcDirectories } = require('./shared/src.directory.entry.map.js');
const {
  getConfig,
  handler: webpackHandler,
  webpackPreProcess,
  webpackPostProcess,
  routeInfo
} = require('./build/webpack/index.js');

let srcTypeDirectoryEntries;

const directoryEntryEnvVar = envVars.get('PFWP_DIRECTORY_ENTRIES');
if (directoryEntryEnvVar) {
  srcTypeDirectoryEntries = directoryEntryEnvVar.split(',');
}

const config = [];

for (let [srcType, srcDirectory] of Object.entries(srcDirectories)) {
  const {
    buildTypes,
    webpack: { configPresets }
  } = srcDirectory;

  buildTypes.forEach((buildType) => {
    config.push(getConfig({ buildType, srcType, srcTypeDirectoryEntries, ...configPresets }));
  });
}

console.log(`[webpack:build] Starting compilation...`);

webpackPreProcess({ srcDir: nodePath.resolve(__dirname, './src/') });

webpack(config, (err, stats) => {
  webpackPostProcess({ stats, routeInfo });
  webpackHandler({
    buildType: 'stack',
    srcType: 'all',
    compileType: 'build',
  })(err, stats);
});
