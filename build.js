const webpack = require('webpack');
const envVars = require('./shared/envvars.js');
const {
  getConfig,
  handler: webpackHandler,
  webpackPreProcess,
  webpackPostProcess
} = require('./build/webpack/index.js');

const buildType = envVars.get('PFWP_BUILD') || 'stack';
const exportType = envVars.get('PFWP_E_TYPE');

let srcTypeDirectoryEntries;

const dirEntEnvVar = envVars.get('PFWP_DIR_ENTS');
if (dirEntEnvVar) {
  srcTypeDirectoryEntries = dirEntEnvVar.split(',');
}

const configs = [];

const addConfig = (bType, sType) => {
  configs.push(
    getConfig({ buildType: bType, srcType: sType, srcTypeDirectoryEntries, exportType })
  );
};

// if (['stack', 'ssr'].includes(buildType)) addConfig('ssr');
if (['stack', 'elements'].includes(buildType)) addConfig('elements', 'whiteboard');
if (['stack', 'elements'].includes(buildType)) addConfig('elements', 'components');
if (['stack', 'elements'].includes(buildType)) addConfig('elements', 'blocks');
if (['stack', 'elements'].includes(buildType)) addConfig('elements', 'plugins');
if (['stack', 'elements'].includes(buildType)) addConfig('elements', 'themes');
if (['stack', 'server'].includes(buildType) && !exportType) addConfig('server', 'whiteboard');

webpackPreProcess({ srcDir: path.resolve(__dirname, './src/') });

webpack(configs, (_err, stats) => {
  webpackHandler({
    buildType,
    srcType: 'all',
    success: () => {
      webpackPostProcess({ stats });
    }
  });
});
