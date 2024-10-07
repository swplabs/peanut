const { debug: log } = require('../../../shared/utils.js');
const {
  buildClientAssets,
  getServerFile,
  resetAssets,
  htmlTemplate,
  getConfigs
} = require('./lib/utils.js');
const { renderToString } = require('react-dom/server');

const cntrlResponses = {};

const controller = ({ route }) => {
  const { appConfig, pfwpConfig } = getConfigs();

  return async () => {
    const { id, srcType, buildType } = route;

    if (typeof cntrlResponses[id] !== 'string') {
      log('[server] Getting base response:', id);

      resetAssets({ srcType, buildType });

      const reactTemplate = (await getServerFile(`js_render_${id}.js`))?.default;

      const { js = [], css = [] } = buildClientAssets({ srcType, buildType, id }) || {};

      cntrlResponses[id] =
        typeof reactTemplate === 'function'
          ? htmlTemplate({
              id,
              reactHtml: renderToString(reactTemplate({ config: pfwpConfig })),
              js,
              css,
              config: pfwpConfig
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
