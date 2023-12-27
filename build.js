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

const config = Object.keys(srcDirectories).reduce((configData, srcType) => {
  const {
    buildTypes,
    webpack: { configPresets }
  } = srcDirectories[srcType];

  buildTypes.forEach((buildType) => {
    configData.push(getConfig({ buildType, srcType, srcTypeDirectoryEntries, ...configPresets }));
  });

  return configData;
}, []);

webpackPreProcess({ srcDir: path.resolve(__dirname, './src/') });

webpack(config, (err, stats) => {
  webpackPostProcess({ stats, routeInfo });
  webpackHandler({
    buildType: 'stack',
    srcType: 'all'
  })(err, stats);
});
