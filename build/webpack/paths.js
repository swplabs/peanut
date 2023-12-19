const path = require('path');
const fs = require('fs');
const { toCamelCase, debug: log } = require('../../src/whiteboard/shared/utils.js');
const { srcDirEntMap } = require('../../shared/src.dir.map.js');
const { baseRoutes, baseEntries } = require('../../shared/paths.js');
const envVars = require('../../shared/envvars.js');
const appSrcPath = envVars.get('PFWP_APP_SRC_PATH');
const dirEntSrcPath = envVars.get('PFWP_DIR_ENT_SRC_PATH');
const nodeEnv = envVars.get('NODE_ENV') || 'production';

let entries = {};
let routes;

const getBaseEntries = ({ buildType, srcType, exportType }) =>
  exportType
    ? { ...baseEntries[buildType].export[exportType] }
    : { ...baseEntries[buildType].build[srcType] };

const getCacheGroups = ({ buildType }) => {
  let cacheGroupsCfg = {};

  if (buildType === 'elements') {
    // TODO: only use style loader on web export
    cacheGroupsCfg = {
      css_runtimes: [
        'node_modules/style-loader',
        'node_modules/css-loader',
        'node_modules/postcss-loader',
        'node_modules/sass-loader'
      ],
      hbs_runtime: ['node_modules/handlebars', '/build/handlebars/helpers/']
    };
  } else if (buildType === 'server') {
    cacheGroupsCfg = {
      hbs_helpers: ['build/handlebars/helpers']
    };
  }

  // TODO: Needs to be smarter to support hot module files not getting rolled in?
  return Object.keys(cacheGroupsCfg).reduce(
    (groups, key) => {
      groups[key] = {
        name: key,
        test(module) {
          return cacheGroupsCfg[key].some((groupPath) =>
            module?.resource?.includes(groupPath.replace('/', path.sep))
          );
        },
        enforce: true
      };

      return groups;
    },
    {
      default: false,
      defaultVendors: false
    }
  );
};

const findRoutes = ({ srcTypeDirEnts, forceBase, srcType, buildType }) => {
  let srcTypePaths;
  const srcTypeDir = `${appSrcPath}/${srcType}/`;

  try {
    srcTypePaths = fs.readdirSync(srcTypeDir, {});
  } catch (e) {
    log('[build:webpack:paths] error:', e?.message);
    srcTypePaths = [];
  }

  return srcTypePaths.reduce(
    (protoRoutes, path) => {
      try {
        const srcPath = srcTypeDir + path;

        if (fs.existsSync(`${srcPath}${dirEntSrcPath}`)) {
          const compDirEnts = fs.readdirSync(`${srcPath}${dirEntSrcPath}`, {
            withFileTypes: true
          });

          const tempRoute = {
            url: `/prototypes/${srcType}/${path}`,
            title: toCamelCase(path),
            id: `${srcType}_${path}`,
            srcPath,
            path,
            type: 'prototype',
            srcType,
            buildType,
            controllerType: 'default',
            templateType: 'default',
            initialData: {}
          };

          const routeFlags = compDirEnts.reduce((flags, dirEnt) => {
            if (dirEnt.isFile()) {
              const map = srcDirEntMap[dirEnt.name];
              if (map && map.excludeSrcTypes?.includes(srcType) !== true) flags[map.flag] = true;
            }

            return flags;
          }, {});

          protoRoutes.push({
            ...tempRoute,
            ...routeFlags
          });
        }
      } catch (e) {
        log('[build:webpack:paths] error:', e?.message);
      }

      return protoRoutes;
    },
    !forceBase && Array.isArray(srcTypeDirEnts)
      ? []
      : baseRoutes?.[srcType]
        ? [...baseRoutes[srcType]]
        : []
  );
};

const getRoutes = ({ buildType, srcType, forceBase = false }) => {
  if (srcType === 'whiteboard') {
    // TODO: document why we are doing this for whiteboard server
    if (buildType === 'server') {
      routes = [
        ...findRoutes({ srcType: 'whiteboard', buildType, forceBase }),
        ...findRoutes({ srcType: 'blocks', buildType, forceBase }),
        ...findRoutes({ srcType: 'components', buildType, forceBase }),
        ...findRoutes({ srcType: 'plugins', buildType, forceBase }),
        ...findRoutes({ srcType: 'themes', buildType, forceBase })
      ];
    } else {
      routes = baseRoutes?.[srcType] ? [...baseRoutes[srcType]] : [];
    }
  } else {
    routes = findRoutes({ srcType, buildType, forceBase });
  }

  return routes;
};

const addSrcDirEntEntry = (
  newEntries,
  srcPath,
  buildType,
  srcType,
  { id, entryKey, file, library }
) => {
  const key = entryKey ? `${entryKey}_${id}` : id;

  const entries = [`${srcPath}${dirEntSrcPath}/${file}`];

  if (
    nodeEnv === 'development' &&
    ['blocks', 'plugins'].includes(srcType) &&
    ['editor'].includes(entryKey)
  ) {
    entries.push(
      `webpack-hot-middleware/client?name=${srcType}_${buildType}&timeout=10000&path=${encodeURIComponent(
        envVars.get('PFWP_SSE_HOST') + '/__webpack_hmr'
      )}`
    );
  }

  newEntries[key] = {
    import: entries
  };

  if (library?.type) {
    newEntries[key].library = library;
  }
};

const getEntries = ({ buildType, srcType, exportType }) => {
  if (!routes) getRoutes({ buildType, srcType });

  let newEntries = {
    ...getBaseEntries({ buildType, srcType, exportType })
  };

  routes.forEach((route) => {
    const { path, id, type, srcPath } = route;

    // Handle component source files
    Object.keys(srcDirEntMap).map((key) => {
      const { flag, entryKey, buildCfg, exportCfg } = srcDirEntMap[key];

      const buildCfgEntry = buildCfg?.[buildType]?.entry;
      const exportCfgEntry = exportCfg?.[exportType]?.entry;

      if (
        route[flag] &&
        ((buildCfgEntry?.enabled && !exportType) ||
          (exportType &&
            exportCfgEntry?.enabled &&
            exportCfgEntry?.buildTypes?.includes(buildType)))
      ) {
        const library = exportType ? exportCfgEntry?.library : buildCfgEntry?.library;

        addSrcDirEntEntry(newEntries, srcPath, buildType, srcType, {
          id,
          path,
          entryKey,
          file: key,
          library
        });
      }
    });

    // Handle special file cases
    if (!exportType && type === 'base') {
      if (buildType === 'server' && srcType === 'whiteboard') {
        // Get route's main page template
        newEntries[`hbs_${id}`] = {
          import: './src/whiteboard/base/routes/' + path + '/index.hbs'
        };
      } else if (buildType === 'elements') {
        // TODO: this would change back to 'client' once we seperate whiteboard srcType buildType
        newEntries[id] = {
          import: srcPath + path + '/view.js'
        };
      }
    }
  });

  entries[buildType] = newEntries;

  return newEntries;
};

module.exports = {
  routes,
  entries,
  getEntries,
  getRoutes,
  getCacheGroups
};
