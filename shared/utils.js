/* global __DEBUG__ */

const fs = require('fs');

const colors = {
  reset: '\u001b[0m',
  red: '\u001b[31m',
  magenta: '\u001b[35m',
  yellow: '\u001b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m'
};

const debug = (...messages) => {
  if (typeof __DEBUG__ === 'undefined' || __DEBUG__) {
    const now = colors.green + '[' + new Date().toLocaleTimeString() + ']' + colors.reset;

    console.log(now, ...messages);
  }
};

const toCamelCase = (str = '') => {
  return str
    .replace(/[^a-z0-9]/gi, ' ')
    .toLowerCase()
    .split(' ')
    .map((el, ind) => (ind === 0 ? el : el[0].toUpperCase() + el.substring(1, el.length)))
    .join('');
};

const validateEnvVarConfig = (envVars) => {
  const config = {
    PFWP_WP_ROOT: envVars.get('PFWP_WP_ROOT'),
    PFWP_THEME_PATH: envVars.get('PFWP_THEME_PATH')
  };

  // Check existence of wordpress root and theme paths
  if (!config.PFWP_WP_ROOT) {
    throw new Error(
      `The WordPress root  (PFWP_WP_ROOT) value in your peanut.config.json was not defined.`
    );
  } else if (!fs.existsSync(config.PFWP_WP_ROOT)) {
    throw new Error(
      `The WordPress root directory (PFWP_WP_ROOT) defined in your peanut.config.json does not exist.`
    );
  }

  if (!config.PFWP_THEME_PATH) {
    throw new Error(
      `The WordPress theme path (PFWP_THEME_PATH) value in your peanut.config.json was not defined.`
    );
  } else if (!fs.existsSync(`${config.PFWP_WP_ROOT}${config.PFWP_THEME_PATH}`)) {
    console.warn(
      `The WordPress theme directory (PFWP_THEME_PATH) defined in your peanut.config.json does not exist.`
    );
  }
};

module.exports = {
  debug,
  toCamelCase,
  validateEnvVarConfig
};
