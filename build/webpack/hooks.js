const fs = require('fs');
const envVars = require('../../config/envvars.js');
const pfwpThemePath = envVars.get('PEANUT_THEME_PATH');
const pfwpWpRoot = envVars.get('PEANUT_WP_ROOT');

const pfwpConfig = {
  chunk_groups: {},
  core_block_filters: envVars.get('PFWP_CORE_BLOCK_FILTERS'),
  wp_root: pfwpWpRoot,
  css_inject: envVars.getBoolean('PEANUT_NOCSS') === true,
  public_path: envVars.get('PEANUT_WP_PUBLIC_PATH')
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

        const { name, namedChunkGroups } = stat.toJson();

        pfwpConfig.chunk_groups[name] = namedChunkGroups;
      });
    }

    try {
      fs.writeFileSync(`${pfwpWpRoot}${pfwpThemePath}/pfwp.json`, JSON.stringify(pfwpConfig));
    } catch (e) {
      console.log(e?.message);
    }
  }
};
