const { debug: log } = require('../../../shared/utils.js');
const { buildClientAssets, getServerFile, resetAssets } = require('./lib/utils.js');

const cntrlResponses = {};

const controller = ({ route }) => {
  return async () => {
    const { id, title, srcType, buildType } = route;

    if (typeof cntrlResponses[id] !== 'string') {
      log('[server] Getting base response:', id);

      resetAssets({ srcType, buildType });

      const template = await getServerFile(`hbs_${id}.js`);

      const { js = '', css = '' } = buildClientAssets({ id, srcType, buildType }) || {};

      cntrlResponses[id] =
        typeof template === 'function'
          ? template({
              title,
              header: title,
              js,
              css
            })
          : '<html><head></head><body>No Template Found for Page</body></html>';
    } else {
      log('[server] Returning cached base response:', id);
    }

    return cntrlResponses[id];
  };
};

module.exports = {
  controller
};
