const path = require('path');
const fs = require('fs');
const { toCamelCase, debug: log } = require('../../src/app/shared/utils');
const { srcDirEntMap } = require('../../config/src.dir.map.js');
const { baseRoutes, baseEntries } = require('../../config/paths.js');
const envVars = require('../../config/envvars.js');
const appSrcPath = envVars.get('PEANUT_APP_SRC_PATH');
const dirEntSrcPath = envVars.get('PEANUT_DIR_ENT_SRC_PATH');

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

const findRoutes = ({ srcTypeDirEnts, forceBase, srcType }) => {
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
  if (srcType === 'app') {
    if (buildType === 'server') {
      routes = [
        ...findRoutes({ srcType: 'app', forceBase }),
        ...findRoutes({ srcType: 'blocks', forceBase }),
        ...findRoutes({ srcType: 'components', forceBase }),
        ...findRoutes({ srcType: 'plugins', forceBase }),
        ...findRoutes({ srcType: 'themes', forceBase })
      ];
    } else {
      routes = baseRoutes?.[srcType] ? [...baseRoutes[srcType]] : [];
    }
  } else {
    routes = findRoutes({ srcType, forceBase });
  }

  return routes;
};

const addSrcDirEntEntry = (newEntries, srcPath, { id, entryKey, file, path, library }) => {
  const key = entryKey ? `${entryKey}_${id}` : id;
  newEntries[key] = {
    import: `${srcPath}${dirEntSrcPath}/${file}`
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

        addSrcDirEntEntry(newEntries, srcPath, { id, path, entryKey, file: key, library });
      }
    });

    // Handle special file cases
    if (!exportType && type === 'base') {
      if (buildType === 'server' && srcType === 'app') {
        // Get route's main page template
        newEntries[`hbs_${id}`] = {
          import: './src/app/base/routes/' + path + '/index.hbs'
        };
      } else if (buildType === 'elements') {
        // TODO: this would change back to 'client' once we seperate app srcType buildType
        newEntries[id] = {
          import: srcPath + path + '/client.js'
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
