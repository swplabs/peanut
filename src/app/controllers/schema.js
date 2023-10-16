const { debug: log } = require('../shared/utils.js');
const {
  buildClientAssets,
  getServerFile,
  resetAssets,
  addParamsToData
} = require('./lib/utils.js');
const { baseIdPrefix } = require('../../../config/src.dir.map.js');

const controller = ({ route, routes }) => {
  return async ({ req }) => {
    const { id, title, srcType } = route;

    const component = req?.locals?.route?.match?.id || '';
    let compSchema;
    let bsData;
    const key = component || id;
    let compRoute;

    // TODO: add back response caching using some sort of hash of url
    log('[server] Getting schema response:', key);

    resetAssets({ srcType });

    const template = await getServerFile(`hbs_${id}.js`);

    const { js = '', css = '' } = buildClientAssets({ srcType, id }) || {};

    if (component) {
      const compId = `${baseIdPrefix}${component}`;

      compRoute = routes.find(({ id: tempRouteId }) => {
        return tempRouteId === compId;
      });

      if (compRoute?.hasBS) {
        const bootstrap =
          (await getServerFile(`bootstrap_${compId}.js`))?.default?._components?.[component] || {};
        bsData = {
          ...bootstrap
        };
      }

      if (compRoute?.hasSchema) {
        const schema = await getServerFile(`schema_${compId}.js`);
        compSchema = schema?.default;

        addParamsToData(bsData, {
          schema: compSchema,
          params: new URL(req.url, `http://${req.headers?.host}`)?.searchParams
        });
      }
    }

    return typeof template === 'function'
      ? template({
          title,
          header: title,
          compTitle: compRoute?.title,
          component,
          compSchema,
          compBootstrap: bsData,
          js,
          css
        })
      : '<html><head></head><body>No Template Found for Page</body></html>';
  };
};

module.exports = {
  controller
};
