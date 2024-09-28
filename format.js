const envVars = require('./shared/envvars.js');

// Validate Config
require('./shared/utils.js').validateEnvVarConfig(envVars);

const { getConfigs } = require('./build/webpack/index.js');
// const { appSrcPath, rootDir } = require('./shared/definitions.js');

const configs = getConfigs();

if (Array.isArray(configs)) {
  // TODO: make synchronous
  // TODO: add root files on isCoreDev
  configs.forEach(async (config = {}) => {
    const { name = '' } = config;

    const [srcType = '', buildType = ''] = name.split('_');

    console.log('[format]', srcType, buildType);
  });
}
