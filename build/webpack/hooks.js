const fs = require('fs');
const envVars = require('../../shared/envvars.js');
const pfwpThemePath = envVars.get('PFWP_THEME_PATH');
const pfwpWpRoot = envVars.get('PFWP_WP_ROOT');

const pfwpConfig = {
  chunk_groups: {},
  core_block_filters: envVars.get('PFWP_CORE_BLOCK_FILTERS'),
  wp_root: pfwpWpRoot,
  css_inject: envVars.getBoolean('PFWP_NOCSS') === true,
  public_path: envVars.get('PFWP_WP_PUBLIC_PATH'),
  metadata: {
    components: {}
  },
  runtime: {}
};

let extendHooks;

try {
  extendHooks = require('../../extend/webpack/hooks.js');
} catch (e) {}

module.exports = {
  webpackPreProcess: ({ srcDir }) => {
    if (typeof extendHooks?.webpackPreProcess === 'function') {
      extendHooks?.webpackPreProcess({ srcDir });
    }

    return true;
  },
  webpackPostProcess: ({ stats }) => {
    if (Array.isArray(stats?.stats)) {
      stats.stats.forEach((stat) => {
        if (!stat) return;

        const { name: compilationName, namedChunkGroups, assets = [] } = stat.toJson();

        const chunkGroups = Object.keys(namedChunkGroups).reduce((acc, key) => {
          const { assets } = namedChunkGroups[key];

          const mainAssets = [];
          const deps = [];
          const assetRE = new RegExp(`${key}(\.[a-zA-Z0-9]{20})?\.(js|css)$`, 'i');

          assets.forEach((asset) => {
            if (assetRE.test(asset.name)) {
              mainAssets.push(asset);
            } else {
              deps.push(asset);
            }
          });

          acc[key] = {
            main_assets: mainAssets,
            deps
          };

          return acc;
        }, {});

        assets.forEach((asset) => {
          const {
            name,
            info: { component, size, ...metadata }
          } = asset;

          if (name.endsWith('/component.json'))
            pfwpConfig.metadata.components[component] = metadata;

          if (/elements_webpack_runtime(\.[a-zA-Z0-9]{20})?\.js$/.test(name)) {
            pfwpConfig.runtime[compilationName] = name;
          }
        });

        pfwpConfig.chunk_groups[compilationName] = chunkGroups;
      });
    }

    try {
      fs.writeFileSync(`${pfwpWpRoot}${pfwpThemePath}/pfwp.json`, JSON.stringify(pfwpConfig));
    } catch (e) {
      console.log(e?.message);
    }
  }
};
