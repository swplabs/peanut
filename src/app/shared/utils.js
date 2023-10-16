/* global __DEBUG__ */

const colors = {
  reset: '\u001b[0m',
  red: '\u001b[31m',
  magenta: '\u001b[35m',
  yellow: '\u001b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m'
};

/**
 * @todo Add ability to do console.group where supported
 */
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

module.exports = {
  debug,
  toCamelCase
};
