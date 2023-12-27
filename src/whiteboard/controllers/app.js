const { debug: log } = require('../shared/utils.js');
const { buildClientAssets, getServerFile, resetAssets, htmlTemplate } = require('./lib/utils.js');
const { renderToString } = require('react-dom/server');

const cntrlResponses = {};

const controller = ({ route }) => {
  return async () => {
    const { id, srcType, buildType } = route;

    if (typeof cntrlResponses[id] !== 'string') {
      log('[server] Getting base response:', id);

      resetAssets({ srcType, buildType });

      const reactTemplate = (await getServerFile(`js_render_${id}.js`))?.default;

      const { js = [], css = [] } = buildClientAssets({ srcType, buildType, id }) || {};

      /*
      if (route?.hasSchema) {
        const schema = await getServerFile(`schema_${compId}.js`);
        compSchema = schema?.default;

        addParamsToData(bsData, {
          schema: compSchema,
          params: new URL(req.url, `http://${req.headers?.host}`)?.searchParams
        });
      }
      */

      cntrlResponses[id] =
        typeof reactTemplate === 'function'
          ? htmlTemplate({ id, reactHtml: renderToString(reactTemplate()), js, css })
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
