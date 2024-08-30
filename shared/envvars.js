const nconf = require('nconf');
const cwd = process.cwd();
const fs = require('fs');

// Pull in ENV vars
nconf.env([
  'ENVIRONMENT',
  'PORT',
  'NODE_ENV',
  'PFWP_DEBUG',
  'PFWP_COMPONENTS',
  'PFWP_BUILD',
  'PFWP_EXPORT_TYPE',
  'PFWP_DIST',
  'PFWP_WB_PUBLIC_PATH',
  'PFWP_WP_HOST',
  'PFWP_WP_PUBLIC_PATH',
  'PFWP_CSS_IN_JS',
  'PFWP_APP_SRC_PATH',
  'PFWP_WP_ROOT',
  'PFWP_THEME_PATH',
  'PFWP_DIR_ENT_SRC_PATH',
  'PFWP_CORE_BLOCK_FILTERS',
  'PFWP_WB_PORT',
  'PFWP_WB_HTTPS_PORT',
  'PFWP_WB_ENABLE_HTTPS',
  'PFWP_SSE_HOST',
  'PFWP_SSE_PORT',
  'PFWP_SSE_ENABLE_HTTPS',
  'PFWP_SSE_HTTPS_PORT',
  'PFWP_WB_HEAD_COMPONENTS',
  'PFWP_WB_FOOTER_COMPONENTS',
  'PFWP_CORE_DEV',
  'PFWP_IS_CLI',
  'PFWP_CONFIG_HOOKS',
  'PFWP_CONFIG_ESLINT',
  'PFWP_CONFIG_WEBPACK',
  'PFWP_ENABLE_HMR',
  'PFWP_ENABLE_WB'
]);

let config = {};

try {
  const configFile = fs.readFileSync(
    `${nconf.get('PFWP_APP_SRC_PATH') || cwd}/peanut.config.json`,
    'utf8'
  );
  config = JSON.parse(configFile);
} catch (e) {
  if (e?.code === 'ENOENT') {
    throw new Error(
      `A peanut.config.json file was not found.${e?.message ? `\nError Message: ${e?.message}` : ''}`
    );
  } else {
    throw e;
  }
}

const defaultConfig = {
  ENVIRONMENT: 'local',
  NODE_ENV: 'development',
  PFWP_BUILD: 'stack',
  PFWP_DIST: 'develop',
  PFWP_CSS_IN_JS: 'false',
  PFWP_APP_SRC_PATH: cwd,
  PFWP_DIR_ENT_SRC_PATH: '',
  PFWP_WP_PUBLIC_PATH: '/',
  PFWP_COMP_ALLOW_LIST: [],
  PFWP_CORE_BLOCK_FILTERS: {},
  PFWP_ENABLE_WB: false,
  PFWP_WB_PORT: 5000,
  PFWP_WB_HTTPS_PORT: 9000,
  PFWP_WB_ENABLE_HTTPS: false,
  PFWP_ENABLE_HMR: true,
  PFWP_SSE_HOST: 'http://localhost',
  PFWP_SSE_PORT: 5050,
  PFWP_SSE_ENABLE_HTTPS: false,
  PFWP_SSE_HTTPS_PORT: 9090,
  PFWP_WB_HEAD_COMPONENTS: [],
  PFWP_WB_FOOTER_COMPONENTS: [],
  PFWP_CORE_DEV: false,
  PFWP_IS_CLI: '',
  ...config
};

// TODO: add wp.hooks import so that we can override envvars programatically

// Set the defaults for all environments
nconf.defaults(defaultConfig);

// Method to convert env string to booleans
nconf.getBoolean = function (envVarName) {
  const value = nconf.get(envVarName);
  let booleanValue = false;

  if (value === 'true' || value === true) {
    booleanValue = true;
  } else if (value === null) {
    console.log('environment variable ' + envVarName + ' not found');
  }

  return booleanValue;
};

module.exports = nconf;
