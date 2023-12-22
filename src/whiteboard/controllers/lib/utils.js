const { debug: log } = require('../../shared/utils.js');
const { extname } = require('path');
const envVars = require('../../../../shared/envvars.js');
const wbPublicPath = envVars.get('PFWP_WB_PUBLIC_PATH') || '/';
const wordpressPublicPath = envVars.get('PFWP_WP_PUBLIC_PATH');

const serverImports = {};
let buildAssets = {};

let pfwpConfig;

const setConfig = (config) => {
  pfwpConfig = config;
};

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

const buildClientAssets = ({ srcType, id }) => {
  const assetIndex = `${srcType}_elements`;

  if (!buildAssets[assetIndex]) buildAssets[assetIndex] = {};
  if (!buildAssets[assetIndex][id]) buildAssets[assetIndex][id] = {};

  const publicPath = srcType === 'whiteboard' ? wbPublicPath : wordpressPublicPath;

  // TODO: change to use arrays/join
  let jsString = '';
  let cssString = '';

  const clientAssets = pfwpConfig.chunk_groups[assetIndex][id];

  if (clientAssets.main_assets?.length) {
    clientAssets.main_assets.forEach(({ name }) => {
      const type = extname(name)?.substring(1);

      if (!buildAssets[assetIndex][id][type]) {
        buildAssets[assetIndex][id][type] = {};
      }

      if (typeof buildAssets[assetIndex][id][type][name] === 'undefined') {
        buildAssets[assetIndex][id][type][name] = true;

        if (type === 'js') {
          jsString += `<script src="${publicPath}${name}"></script>`;
        } else if (type === 'css') {
          cssString += `<link rel="stylesheet" type="text/css" href="${publicPath}${name}" />`;
        }

        log(`[server] Generated ${type} client asset:`, assetIndex, id, name);
      } else {
        log('[server] Already generated client asset:', assetIndex, id, name);
      }
    });
  } else {
    log('[server] Requested empty client asset:', assetIndex, id);
  }
  return {
    js: jsString,
    css: cssString
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

module.exports = {
  setConfig,
  buildClientAssets,
  resetAssets,
  getServerFile,
  addParamsToData
};
