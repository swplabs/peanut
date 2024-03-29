const fs = require('fs');
const { extname } = require('path');
const envVars = require('../../shared/envvars.js');
const { entryMapFlagKeys } = require('../../shared/src.directory.entry.map.js');
const pfwpThemePath = envVars.get('PFWP_THEME_PATH');
const pfwpWpRoot = envVars.get('PFWP_WP_ROOT');

const pfwpConfig = {
  mode: envVars.get('NODE_ENV') || 'production',
  core_block_filters: envVars.get('PFWP_CORE_BLOCK_FILTERS'),
  wp_root: pfwpWpRoot,
  wp_host: envVars.get('PFWP_WP_HOST'),
  css_inject: envVars.getBoolean('PFWP_CSS_IN_JS') === true,
  public_path: envVars.get('PFWP_WP_PUBLIC_PATH'),
  compilations: {},
  whiteboard: {
    components: {
      default_head: envVars.get('PFWP_WB_HEAD_COMPONENTS'),
      default_footer: envVars.get('PFWP_WB_FOOTER_COMPONENTS')
    }
  }
};

let extendHooks;

try {
  extendHooks = require('../../extend/webpack/hooks.js');
} catch (e) {}

const processAsset = (asset) => {
  const { name } = asset;

  return {
    ...asset,
    type: extname(name)?.substring(1)
  };
};

module.exports = {
  webpackPreProcess: ({ srcDir }) => {
    // TODO: add step to clean out assets folders

    if (typeof extendHooks?.webpackPreProcess === 'function') {
      extendHooks?.webpackPreProcess({ srcDir });
    }

    return true;
  },
  webpackPostProcess: ({ stats, routeInfo }) => {
    if (Array.isArray(stats?.stats)) {
      stats.stats.forEach((stat) => {
        if (!stat) return;

        const { name: compilationName, namedChunkGroups, assets = [] } = stat.toJson();

        const namedConfig = {
          entry_map: {},
          runtime: null,
          metadata: {}
        };

        const routes = routeInfo[compilationName];

        routes.forEach((route) => {
          const { path, srcType } = route;

          const entryMap = {};

          entryMapFlagKeys.forEach(({ entryKey, flag }) => {
            if (route[flag]) {
              entryMap[entryKey] = `${entryKey}_${srcType}_${path}`;
            }
          });

          namedConfig.entry_map[path] = entryMap;
        });

        const chunkGroups = Object.keys(namedChunkGroups).reduce((acc, key) => {
          const { assets } = namedChunkGroups[key];

          const mainAssets = [];
          const deps = [];
          const mainAssetRegEx = new RegExp(`${key}(\.[a-zA-Z0-9]{20})?\.(js|css)$`, 'i');
          const wpDepRegEx = new RegExp(`${key}(\.[a-zA-Z0-9]{20})?\.asset.php$`, 'i');

          let wpDependencies;

          assets.forEach((asset) => {
            if (mainAssetRegEx.test(asset.name)) {
              mainAssets.push(processAsset(asset));
            } else if (wpDepRegEx.test(asset.name)) {
              wpDependencies = asset;
            } else {
              deps.push(processAsset(asset));
            }
          });

          acc[key] = {
            main_assets: mainAssets,
            deps
          };

          if (wpDependencies) {
            acc[key].wp_deps = wpDependencies;
          }

          return acc;
        }, {});

        assets.forEach((asset) => {
          const {
            name,
            info: { component, size, ...metadata }
          } = asset;

          if (component && name.endsWith('/component.json')) {
            namedConfig.metadata[component] = metadata;
          }

          if (/elements_webpack_runtime(\.[a-zA-Z0-9]{20})?\.js$/.test(name)) {
            namedConfig.runtime = name;
          }
        });

        namedConfig.chunk_groups = chunkGroups;

        pfwpConfig.compilations[compilationName] = namedConfig;
      });
    }

    try {
      fs.writeFileSync(`${pfwpWpRoot}${pfwpThemePath}/pfwp.json`, JSON.stringify(pfwpConfig));
    } catch (e) {
      console.log(e?.message);
    }
  }
};
