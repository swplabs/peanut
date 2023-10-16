const nconf = require('nconf');
const path = require('path');

// Pull in ENV vars
nconf.env([
  'ENVIRONMENT',
  'PORT',
  'NODE_ENV',
  'PEANUT_DEBUG',
  'PEANUT_COMPS',
  'PEANUT_BUILD',
  'PEANUT_E_TYPE',
  'PEANUT_DIST',
  'PEANUT_APP_PUBLIC_PATH',
  'PEANUT_WP_PUBLIC_PATH',
  'PEANUT_NOCSS',
  'PEANUT_APP_SRC_PATH',
  'PEANUT_WP_ROOT',
  'PEANUT_THEME_PATH',
  'PEANUT_DIR_ENT_SRC_PATH',
  'PFWP_CORE_BLOCK_FILTERS'
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
  PEANUT_BUILD: 'stack',
  PEANUT_DIST: 'serve',
  PEANUT_APP_PUBLIC_PATH: '/',
  PEANUT_NOCSS: 'false',
  PEANUT_APP_SRC_PATH: path.resolve(__dirname, '../src/'),
  PEANUT_DIR_ENT_SRC_PATH: '/src',
  PEANUT_COMP_ALLOW_LIST: [],
  PFWP_CORE_BLOCK_FILTERS: {},
  ...config
};

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
