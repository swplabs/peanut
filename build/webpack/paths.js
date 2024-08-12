const path = require('path');
const fs = require('fs');
const { toCamelCase, debug: log } = require('../../src/whiteboard/shared/utils.js');
const { srcDirectoryEntryMap } = require('../../shared/src.directory.entry.map.js');
const { baseRoutes, baseEntries } = require('../../shared/base.paths.js');
const {
  getHotMiddlewareEntry,
  isHotRefreshEntry,
  getAppSrcPath
} = require('../../shared/definitions.js');

let entries = {};
let routes;

const getBaseEntries = ({ buildType, srcType, exportType }) =>
  exportType
    ? { ...baseEntries[buildType]?.export[exportType] }
    : { ...baseEntries[buildType]?.build[srcType] };

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
      ]
    };
  } else if (buildType === 'server') {
    cacheGroupsCfg = {};
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

const findRoutes = ({
  srcTypeDirectoryEntries,
  forceBase,
  srcType,
  srcTypeSubDirectory = '',
  buildType,
  directoryEntrySrcPath = ''
}) => {
  let srcTypePaths;
  const srcTypeDirectory = `${getAppSrcPath(srcType)}/${srcType}/${srcTypeSubDirectory}`;

  try {
    srcTypePaths = fs.readdirSync(srcTypeDirectory, { withFileTypes: true });
  } catch (e) {
    log('[build:webpack:paths] error:', e?.message);
    srcTypePaths = [];
  }

  return srcTypePaths.reduce(
    (srcRoutes, srcTypePathDirEnt) => {
      try {
        const { name: srcTypePath } = srcTypePathDirEnt;

        const srcPath = srcTypeDirectory + srcTypePath + directoryEntrySrcPath;

        if (srcTypePathDirEnt.isDirectory() && fs.existsSync(srcPath)) {
          const compDirEnts = fs.readdirSync(srcPath, {
            withFileTypes: true
          });

          const tempRoute = {
            // TODO: url will need to point to wordpress custom route
            url: `/elements/${srcType}/${srcTypePath}`,
            title: toCamelCase(srcTypePath),
            id: `${srcType}_${srcTypePath}`,
            srcPath,
            path: srcTypePath,
            type: 'element',
            srcType,
            buildType,
            initialData: {}
          };

          const routeFlags = compDirEnts.reduce((flags, dirEnt) => {
            if (dirEnt.isFile()) {
              const map = srcDirectoryEntryMap[dirEnt.name];
              if (map && map.excludeSrcTypes?.includes(srcType) !== true) flags[map.flag] = true;
            }

            return flags;
          }, {});

          const existingRouteIndex = srcRoutes.findIndex(
            ({ path: srcRoutePath }) => srcRoutePath === srcTypePath
          );

          if (existingRouteIndex >= 0) {
            srcRoutes[existingRouteIndex] = {
              ...tempRoute,
              ...srcRoutes[existingRouteIndex],
              ...routeFlags
            };
          } else {
            srcRoutes.push({
              ...tempRoute,
              ...routeFlags
            });
          }
        }
      } catch (e) {
        log('[build:webpack:paths] error:', e?.message);
      }

      return srcRoutes;
    },
    !forceBase && Array.isArray(srcTypeDirectoryEntries)
      ? []
      : baseRoutes?.[buildType]?.[srcType]
        ? [...baseRoutes[buildType][srcType]]
        : []
  );
};

const getRoutes = ({
  buildType,
  srcType,
  srcTypeSubDirectory,
  forceBase = false,
  directoryEntrySrcPath
}) => {
  routes = findRoutes({
    srcType,
    srcTypeSubDirectory,
    buildType,
    forceBase,
    directoryEntrySrcPath
  });

  return routes;
};

const addSrcDirectoryEntry = (
  newEntries,
  { buildType, srcType, srcPath, id, entryKey, file, library }
) => {
  const key = entryKey ? `${entryKey}_${id}` : id;

  const entries = [`${srcPath}/${file}`];

  if (isHotRefreshEntry({ srcType, entryKey })) {
    entries.push(getHotMiddlewareEntry({ srcType, buildType }));
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
    const { path, id, srcPath } = route;

    // Handle component source files
    Object.keys(srcDirectoryEntryMap).map((key) => {
      const { flag, entryKey, buildConfig, exportConfig } = srcDirectoryEntryMap[key];

      const buildConfigEntry = buildConfig?.[buildType]?.entry;
      const exportConfigEntry = exportConfig?.[exportType]?.entry;

      if (
        route[flag] &&
        ((buildConfigEntry?.enabled && !exportType) ||
          (exportType &&
            exportConfigEntry?.enabled &&
            exportConfigEntry?.buildTypes?.includes(buildType)))
      ) {
        const library = exportType ? exportConfigEntry?.library : buildConfigEntry?.library;

        addSrcDirectoryEntry(newEntries, {
          srcPath,
          buildType,
          srcType,
          id,
          path,
          entryKey,
          file: key,
          library
        });
      }
    });
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
