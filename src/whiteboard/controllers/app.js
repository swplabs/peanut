const { debug: log } = require('../shared/utils.js');
const { buildClientAssets, getServerFile, resetAssets } = require('./lib/utils.js');

const cntrlResponses = {};

const controller = ({ route, routes }) => {
  return async () => {
    const { id, title, srcType, buildType } = route;
    let variations = [];

    if (typeof cntrlResponses[id] !== 'string') {
      log('[server] Getting base response:', id);

      resetAssets({ srcType, buildType });

      const template = await getServerFile(`hbs_${id}.js`);

      const varProms = routes
        .filter(({ hasVars, hasSchema }) => hasVars && hasSchema)
        .map(({ id: routeId, path }) => {
          return (async () => {
            const schema = (await getServerFile(`schema_${routeId}.js`))?.default || {};

            const { instances = {} } =
              (await getServerFile(`variations_${routeId}.js`))?.default?._components?.[path] || {};

            const urlParams = Object.keys(instances || {}).reduce((vars, key) => {
              const instance = instances?.[key] || {};
              const params = new URLSearchParams();

              for (const [prop, value] of Object.entries(instance)) {
                const { _has: { input } = {} } = schema[prop] || {};

                if (['text', 'select', 'checkbox', 'number'].includes(input)) {
                  params.append(prop, value);
                } else if (input === 'complex-list' && Array.isArray(value)) {
                  if (value.length) {
                    value.forEach((val) => {
                      params.append(prop, JSON.stringify(val));
                    });
                  } else {
                    params.append(prop, '');
                  }
                }
              }

              if (params) vars[key] = params.toString();

              return vars;
            }, {});

            return {
              routeId,
              urlParams
            };
          })();
        });

      if (varProms.length) {
        variations = await Promise.all(varProms);
      }

      const { js = '', css = '' } = buildClientAssets({ srcType, buildType, id }) || {};

      cntrlResponses[id] =
        typeof template === 'function'
          ? template({
              title,
              header: title,
              js,
              css,
              variations: variations.reduce((vars, { routeId, urlParams }) => {
                vars[routeId] = urlParams;
                return vars;
              }, {})
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
