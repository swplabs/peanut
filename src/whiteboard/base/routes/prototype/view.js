const { debug: log } = require('../../../shared/utils.js');

require('./style.scss');

const callComponentClientJs = (clientJs, componentId) => {
  if (typeof clientJs === 'function' && componentId) {
    clientJs(document.querySelector(`[data-comp-ref="${componentId}"]`));
  } else {
    log('[hbs:prototype:clientjs]', 'error calling component js:', typeof clientJs, componentId);
  }
};

module.exports = {
  callComponentClientJs
};
