const { debug: log } = require('../../../../shared/utils.js');
const envVars = require('../../../../shared/envvars.js');
const wbPublicPath = envVars.get('PFWP_WB_PUBLIC_PATH') || '/';
const wordpressPublicPath = envVars.get('PFWP_WP_PUBLIC_PATH');

const serverImports = {};
let buildAssets = {};

let pfwpConfig;

const setConfig = (config) => {
  pfwpConfig = config;
};

const getConfig = () => pfwpConfig;

// TODO: Add max limit to "cached" files
const getServerFile = async (key) => {
  if (typeof serverImports[key] === 'undefined') {
    try {
      log('[server] Importing file:', key);
      serverImports[key] = (await import(/* webpackIgnore: true */ `./${key}`)).default;
    } catch (e) {
      log('[server] Error importing file:', key, e?.message);
    }
  } else {
    log('[server] Already imported:', key);
  }

  return serverImports[key];
};

const resetAssets = ({ srcType }) => {
  buildAssets[`${srcType}_elements`] = {};
};

const addAssetData = ({ id, type, assetIndex, name, publicPath, data }) => {
  if (!buildAssets[assetIndex][id][type]) {
    buildAssets[assetIndex][id][type] = {};
  }

  if (typeof buildAssets[assetIndex][id][type][name] === 'undefined') {
    buildAssets[assetIndex][id][type][name] = true;

    data.push({
      parentId: id,
      url: `${publicPath}${name}`
    });

    log(`[server] Generated ${type} client asset:`, assetIndex, id, name);
  } else {
    log('[server] Already generated client asset:', assetIndex, id, name);
  }
};

const buildClientAssets = ({ srcType, id }) => {
  const assetIndex = `${srcType}_elements`;

  if (!buildAssets[assetIndex]) buildAssets[assetIndex] = {};
  if (!buildAssets[assetIndex][id]) buildAssets[assetIndex][id] = {};

  const publicPath = srcType === 'whiteboard' ? wbPublicPath : wordpressPublicPath;

  const jsData = [];
  const cssData = [];

  const compilation = pfwpConfig.compilations[assetIndex];
  const clientAssets = compilation.chunk_groups[`view_${id}`];

  const eachAsset = ({ name, type }) =>
    addAssetData({
      id,
      type,
      assetIndex,
      name,
      publicPath,
      data: type === 'js' ? jsData : cssData
    });

  if (clientAssets.main_assets?.length) {
    clientAssets.deps?.forEach(eachAsset);
    clientAssets.main_assets.forEach(eachAsset);
  } else {
    log('[server] Requested empty client asset:', assetIndex, id);
  }
  return {
    js: jsData,
    css: cssData
  };
};

const addParamsToData = (compData, { schema, params }) => {
  if (params?.toString()) {
    Object.keys(schema)
      .filter(
        (key) => !key.startsWith('_') && !key.startsWith('peanut_') && schema[key]?._has?.input
      )
      .forEach((key) => {
        const { _has: { input } = {} } = schema[key] || {};
        let value;

        if (['text', 'select'].includes(input)) {
          value = params.get(key);
        } else if (input === 'number') {
          value = Number(params.get(key));
        } else if (input === 'checkbox') {
          const paramVal = params.get(key);
          value = typeof paramVal === 'string' ? paramVal === 'true' : params.get(key);
        } else if (input === 'object') {
          const keyValue = params.has(key) ? params.getAll(key) : null;

          if (Array.isArray(keyValue)) {
            if (keyValue.length === 1 && keyValue[0] === '') {
              value = [];
            } else {
              value = keyValue.map((data) => {
                try {
                  return JSON.parse(data);
                } catch (e) {
                  return {};
                }
              });
            }
          }
        }

        if (value !== undefined && value !== null) {
          compData[key] = value;
        }
      });
  }
};

const htmlTemplate = ({ id, reactHtml, js, css, config }) => {
  const html = `
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Whiteboard (Peanut For Wordpress)</title>
        ${css
          .map((item) => {
            return `<link rel="stylesheet" href="${item.url}" />\n`;
          })
          .join('')}
      </head>
      <body>
        <div id="root">${reactHtml}</div>
        ${js
          .map((item) => {
            return `<script src="${item.url}"></script>\n`;
          })
          .join('')}
        <script>
          window.peanutSrcClientJs['view_${id}'].default({
            config: ${JSON.stringify(config)}
          });
        </script>
      </body>
    </html>
  `;

  return html;
};

module.exports = {
  setConfig,
  getConfig,
  buildClientAssets,
  resetAssets,
  getServerFile,
  addParamsToData,
  htmlTemplate
};
