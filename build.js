const envVars = require('./shared/envvars.js');

// Validate Config
require('./shared/utils.js').validateEnvVarConfig(envVars);

const webpack = require('webpack');
const {
  getConfigs,
  handler: webpackHandler,
  webpackPreProcess,
  webpackPostProcess,
  routeInfo
} = require('./build/webpack/index.js');
const { appSrcPath } = require('./shared/definitions.js');

// TODO: Create "merge PFWP.json files" functionality use with production deployments

console.log(`[webpack:build] Starting compilation...`);

webpackPreProcess({ srcDir: appSrcPath });

webpack(getConfigs(), (err, stats) => {
  webpackPostProcess({ stats, routeInfo });
  webpackHandler({
    buildType: 'stack',
    srcType: 'all',
    compileType: 'build',
    showStats: true
  })(err, stats);
});
