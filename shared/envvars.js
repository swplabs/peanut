const nconf = require('nconf');
const path = require('path');

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
  'PFWP_SSE_HTTPS_PORT'
]);
// Get environment based overrides
const environment = nconf.get('ENVIRONMENT');

if (!environment) {
  console.log('ENVIRONMENT NOT SET');
}

let config = {};

try {
  config = require('../extend/config.json');
} catch (e) {
  console.log('No user config json file available');
}

const defaultConfig = {
  PFWP_BUILD: 'stack',
  PFWP_DIST: 'serve',
  PFWP_CSS_IN_JS: 'false',
  PFWP_APP_SRC_PATH: path.resolve(__dirname, '../src/'),
  PFWP_DIR_ENT_SRC_PATH: '/src',
  PFWP_COMP_ALLOW_LIST: [],
  PFWP_CORE_BLOCK_FILTERS: {},
  PFWP_WB_PORT: 5000,
  PFWP_WB_HTTPS_PORT: 9000,
  PFWP_WB_ENABLE_HTTPS: false,
  PFWP_SSE_HOST: 'http://localhost',
  PFWP_SSE_PORT: 5050,
  PFWP_SSE_ENABLE_HTTPS: false,
  PFWP_SSE_HTTPS_PORT: 9090,
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
