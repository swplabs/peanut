const fs = require('fs');
const { extname, basename, join } = require('path');
const { createHash } = require('crypto');
const envVars = require('../../shared/envvars.js');
const { entryMapFlagKeys } = require('../../shared/src.directory.entry.map.js');
const { appSrcPath, version, enableWhiteboard, isCoreDev } = require('../../shared/definitions.js');
const { requireConfigFile } = require('../lib/utils.js');
const pfwpThemePath = envVars.get('PFWP_THEME_PATH');
const pfwpWpRoot = envVars.get('PFWP_WP_ROOT');
const distPath = join(__dirname, `../../dist/${envVars.get('PFWP_DIST')}`);

const srcHash = createHash('md5').update(appSrcPath, 'utf8').digest('hex');

const pfwpConfig = {
  mode: envVars.get('NODE_ENV') || 'production',
  srcHash,
  data_mode: envVars.get('PFWP_DATA_MODE') || 'path',
  core_block_filters: envVars.get('PFWP_CORE_BLOCK_FILTERS'),
  wp_host: envVars.get('PFWP_WP_HOST'),
  css_inject: envVars.getBoolean('PFWP_CSS_IN_JS') === true,
  public_path: envVars.get('PFWP_WP_PUBLIC_PATH'),
  compilations: {}
};

if (enableWhiteboard()) {
  pfwpConfig.whiteboard = {
    components: {
      default_head: envVars.get('PFWP_WB_HEAD_COMPONENTS'),
      default_footer: envVars.get('PFWP_WB_FOOTER_COMPONENTS')
    }
  };
}

if (envVars.getBoolean('PFWP_PRIMARY')) {
  pfwpConfig.primary = true;
} else if (envVars.getBoolean('PFWP_SECONDARY')) {
  pfwpConfig.secondary = true;
}

let extendHooks;

if (envVars.get('PFWP_CONFIG_HOOKS')) {
  extendHooks = requireConfigFile(`${appSrcPath}/${envVars.get('PFWP_CONFIG_HOOKS')}`);
}

const processAsset = (asset) => {
  const { name } = asset;

  return {
    ...asset,
    type: extname(name)?.substring(1)
  };
};

module.exports = {
  webpackPreProcess: async ({ srcDir }) => {
    if (typeof extendHooks?.webpackPreProcess === 'function') {
      await extendHooks?.webpackPreProcess({ srcDir });
    }

    return true;
  },
  webpackPostProcess: ({ stats, routeInfo }) => {
    if (Array.isArray(stats?.stats)) {
      stats.stats.forEach((stat) => {
        if (!stat) {
          return;
        }

        const { name: compilationName, namedChunkGroups, assets = [] } = stat.toJson();

        if (pfwpConfig.secondary && compilationName.startsWith('whiteboard_')) {
          return;
        }

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
            info: { component, ...metadata }
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

    let configFilename = 'pfwp.json';

    if (pfwpConfig.secondary) {
      configFilename = `pfwp.${srcHash}.json`;
    }

    // Generate whiteboard configuration
    const wbAppAssets = pfwpConfig.compilations.whiteboard_elements?.chunk_groups;

    if (isCoreDev() && wbAppAssets) {
      const wbAppConfig = {
        compilations: {
          whiteboard_elements: pfwpConfig.compilations.whiteboard_elements,
          whiteboard_server: pfwpConfig.compilations.whiteboard_server
        }
      };

      try {
        const wbServerDir = `${distPath}/server`;

        if (!fs.existsSync(wbServerDir)) {
          fs.mkdirSync(wbServerDir, { recursive: true });
        }

        const webAppConfigFile = `${wbServerDir}/server.json`;

        fs.writeFileSync(webAppConfigFile, JSON.stringify(wbAppConfig), 'utf-8');
      } catch (error) {
        console.error(error);
      }

      delete pfwpConfig.compilations.whiteboard_elements;
      delete pfwpConfig.compilations.whiteboard_server;
    }

    // Write PFWP config to active theme directory
    try {
      fs.writeFileSync(
        `${pfwpWpRoot}${pfwpThemePath}/${configFilename}`,
        JSON.stringify(pfwpConfig),
        'utf-8'
      );
    } catch (e) {
      console.log(e?.message);
    }

    // Replace PFWP Strings
    // TODO: only rewrite if values change
    const pfwpSdkAssets =
      pfwpConfig.compilations.components_elements?.chunk_groups?.pfwp_sdk?.main_assets;

    if (isCoreDev() && pfwpSdkAssets) {
      const pfwpComponentClassFile = `${pfwpWpRoot}/wp-content/plugins/peanut/classes/class-pfwp-components.php`;

      try {
        if (fs.existsSync(pfwpComponentClassFile)) {
          const contents = fs.readFileSync(pfwpComponentClassFile, 'utf-8');
          fs.writeFileSync(
            pfwpComponentClassFile,
            contents.replace(/__PFWP_SDK_FILENAME__/g, basename(pfwpSdkAssets[0].name)),
            'utf-8'
          );
        }

        const pfwpPluginFile = `${pfwpWpRoot}/wp-content/plugins/peanut/peanut.php`;

        if (fs.existsSync(pfwpPluginFile)) {
          const contents = fs.readFileSync(pfwpPluginFile, 'utf-8');
          fs.writeFileSync(pfwpPluginFile, contents.replace(/__APP_VERSION__/g, version), 'utf-8');
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
};
