const nodePath = require('path');
const nodeExternals = require('webpack-node-externals');
const paths = require('./paths.js');
const { webpackPreProcess, webpackPostProcess } = require('./hooks.js');
const webpackLoaders = require('./loaders.js');
const webpackPlugins = require('./plugins.js');
const envVars = require('../../shared/envvars.js');
const { srcDirectoryEntryMap } = require('../../shared/src.directory.entry.map.js');
const environment = envVars.get('ENVIRONMENT') || 'prod';
const nodeEnv = envVars.get('NODE_ENV') || 'production';
const distDir = nodePath.join(__dirname, `../../dist/${envVars.get('PFWP_DIST')}`);
const staticDir = distDir + '/static';
const wbPublicPath = envVars.get('PFWP_WB_PUBLIC_PATH') || '/';
const rootDir = nodePath.resolve(__dirname, '../../');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const appSrcPath = envVars.get('PFWP_APP_SRC_PATH');
const directoryEntryAllowList = envVars.get('PFWP_DIR_ENT_ALLOW_LIST');
const wordpressRoot = envVars.get('PFWP_WP_ROOT');
const wordpressPublicPath = envVars.get('PFWP_WP_PUBLIC_PATH');
const peanutThemePath = envVars.get('PFWP_THEME_PATH');
const directoryEntrySrcPath = envVars.get('PFWP_DIR_ENT_SRC_PATH');
const {
  node: nodeVersion,
  hotRefreshEnabled,
  isWebTarget,
  version: appVersion
} = require('../../shared/definitions.js');

const routeInfo = {};

const { getRoutes, getEntries, getCacheGroups } = paths;

const webpackHandler =
  ({ buildType: type, compileType = 'develop', srcType, hashCheck, success, error }) =>
  (_err, stats) => {
    if (stats.hasErrors()) {
      if (typeof error === 'function') error();
    } else {
      if (typeof hashCheck === 'function') {
        if (hashCheck({ buildType: type, srcType, hash: stats.hash })) return;
      }

      console.log(`\n[webpack:${compileType}] Compilation successful.\n`);

      if (compileType === 'build') {
        // TODO: show stats for build
      }

      if (typeof success === 'function') success();
    }
  };

// TODO: Move getEntryInfo an setFilename to paths.js
const getEntryInfo = (srcType, entryId) => {
  const entryFile = Object.keys(srcDirectoryEntryMap).find((key) =>
    entryId.startsWith(`${srcDirectoryEntryMap[key].entryKey}_${srcType}`)
  );

  return {
    pathName: entryFile
      ? entryId
          .replace(`${srcDirectoryEntryMap[entryFile].entryKey}_`, '')
          .replace(`${srcType}_`, '')
      : 'pfwp-shared-assets',
    entryFile: entryFile
      ? entryFile.replace(nodePath.extname(entryFile), '')
      : entryId.replace(nodePath.extname(entryId), '')
  };
};

const setFileName =
  (fileName, srcType, buildType) =>
  (pathData = {}) => {
    const entryId = pathData.chunk?.name || pathData.chunk?.id;

    let name = `${fileName}`;

    if (entryId === `${srcType}_${buildType}_webpack_runtime`) {
      name = `wp-content/plugins/peanut/assets/[name].[chunkhash:20].js`;
    } else if (['plugins', 'themes'].includes(srcType)) {
      const { pathName } = getEntryInfo(srcType, entryId);

      name = `wp-content/${srcType}/${pathName}/assets/${
        environment === 'local' ? '[name].js' : '[name].[chunkhash:20].js'
      }`;
    }

    return name;
  };

const getOutput = ({ buildType, srcType, exportType }) => {
  let outputs = {};

  const outputPath = srcType === 'whiteboard' ? staticDir : wordpressRoot;
  const filePath = srcType === 'whiteboard' ? `assets/${srcType}` : `.assets/${srcType}`;

  // TODO into setFileName function
  const filename =
    environment === 'local' || exportType || srcType !== 'components'
      ? `${filePath}/[name].js`
      : `${filePath}/[name].[chunkhash:20].js`;

  switch (buildType) {
    case 'elements': {
      outputs = {
        filename: setFileName(filename, srcType, buildType),
        path: outputPath,
        publicPath: srcType === 'whiteboard' ? wbPublicPath : wordpressPublicPath,
        chunkFilename: setFileName(filename, srcType, buildType),
        assetModuleFilename: `${filePath}/[hash][ext][query]`,
        hotUpdateChunkFilename: `${filePath}/[id].[fullhash].hot-update.js`,
        hotUpdateMainFilename: `${filePath}/[runtime].[fullhash].hot-update.json`,
        uniqueName: `${srcType}_${buildType}`
      };
      break;
    }
    case 'server': {
      outputs = {
        filename: '[name].js',
        chunkLoading: 'require',
        path: `${distDir}/server`,
        chunkFilename: '[name].js',
        library: {
          type: 'commonjs2'
        }
      };
      break;
    }
  }

  return outputs;
};

const { style: styleLoader, js: jsLoader, php: phpLoader } = webpackLoaders;

const getModuleRules = ({ buildType, exportType, srcType, enableCssInJs }) => {
  const rules = [
    jsLoader({ buildType, srcType, exportType }),
    styleLoader({
      MiniCssExtractPlugin,
      buildType,
      srcType,
      exportType,
      enableCssInJs,
      environment
    })
  ];

  switch (buildType) {
    case 'elements': {
      if (srcType !== 'whiteboard') {
        rules.push(phpLoader({ output: { peanutThemePath, wordpressRoot } }));
      }
      break;
    }
    case 'server': {
      rules.push({
        test: /\.(png|woff2|woff|ttf|jpg)$/i,
        type: 'asset/resource',
        generator: {
          emit: false
        }
      });

      break;
    }
  }

  return rules;
};

const {
  eslint: eslintPlugin,
  webpackDefine: webpackDefinePlugin,
  extractCss: extractCssPlugin,
  blocks: blocksPlugin,
  components: componentsPlugin,
  copy: copyPlugin,
  wpDepExtract: wpDepExtractPlugin,
  hotModuleReplacement: hotModuleReplacementPlugin,
  reactRefresh: reactRefreshPlugin,
  normalModuleReplacement: normalModuleReplacementPlugin
} = webpackPlugins;

const getPlugins = ({ buildType, srcType, routes, exportType, enableCssInJs = false }) => {
  const plugins = [
    webpackDefinePlugin({ routes, appVersion }),
    eslintPlugin({ buildType, srcType })
  ];

  const outputPath = srcType === 'whiteboard' ? staticDir : wordpressRoot;
  const filePath = srcType === 'whiteboard' ? `assets/${srcType}` : `.assets/${srcType}`;

  // TODO: add to definitions.js
  if (!enableCssInJs && exportType !== 'web' && srcType !== 'whiteboard')
    plugins.push(extractCssPlugin({ MiniCssExtractPlugin, exportType, filePath }));

  if (srcType === 'blocks') {
    plugins.push(
      blocksPlugin({ directory: `${wordpressRoot}${peanutThemePath}`, routes, outputPath })
    );
  }

  if (srcType === 'components') {
    plugins.push(
      componentsPlugin({ directory: `${wordpressRoot}${peanutThemePath}`, routes, outputPath })
    );
  }

  if (['blocks', 'plugins', 'themes'].includes(srcType)) {
    plugins.push(wpDepExtractPlugin({ directory: `${wordpressRoot}${peanutThemePath}`, srcType }));
  }

  if (['themes', 'plugins'].includes(srcType)) {
    plugins.push(
      copyPlugin({
        directory: `${wordpressRoot}/wp-content/${srcType}`,
        routes,
        srcType,
        appSrcPath
      })
    );
  }

  if (hotRefreshEnabled(srcType)) {
    plugins.push(
      hotModuleReplacementPlugin(),
      reactRefreshPlugin(),
      normalModuleReplacementPlugin(
        /react-refresh-webpack-plugin\/overlay\/containers\/RuntimeErrorContainer/,
        `${rootDir}/src/whiteboard/shared/runtime-error-container.js`
      )
    );
  }

  return plugins;
};

const getBaseConfig = ({ isWeb, buildType, srcType, exportType, enableCssInJs }) => {
  return {
    context: rootDir,

    name: `${srcType}_${buildType}`,

    mode: nodeEnv || 'none',

    output: getOutput({ buildType, srcType, exportType }),

    target: isWeb ? 'web' : `node${nodeVersion}`,

    node: !isWeb
      ? {
          __dirname: false,
          __filename: false
        }
      : {},

    resolve: {
      alias: {
        src: `${appSrcPath}/${srcType}`
      },
      extensions: ['...'],
      mainFields: isWeb ? ['browser', 'module', 'main'] : ['module', 'main']
    },

    module: {
      rules: getModuleRules({ isWeb, buildType, srcType, exportType, enableCssInJs })
    },

    optimization: {
      usedExports: true,
      runtimeChunk: hotRefreshEnabled(srcType)
        ? {
            name: `${srcType}_${buildType}_webpack_runtime`
          }
        : false,
      splitChunks: {
        chunks: 'all',
        cacheGroups: getCacheGroups({ isWeb, buildType })
      },
      minimize: isWeb && nodeEnv === 'production' ? true : false
    },

    externals: !isWeb && !exportType ? [nodeExternals({})] : []
  };
};

const getConfig = ({
  buildType,
  srcType,
  srcTypeDirectoryEntries,
  exportType: exportTypeArg,
  enableCssInJs: enableCssInJsArg
}) => {
  const exportType = exportTypeArg || envVars.get('PFWP_EXPORT_TYPE');
  const enableCssInJs = enableCssInJsArg || envVars.getBoolean('PFWP_CSS_IN_JS') === true;

  const routeArgs = {
    buildType,
    srcType,
    srcTypeSubDirectory: srcType === 'whiteboard' ? 'shared/routes/' : '',
    srcTypeDirectoryEntries:
      Array.isArray(directoryEntryAllowList) && directoryEntryAllowList.length
        ? directoryEntryAllowList
        : srcTypeDirectoryEntries,
    forceBase: directoryEntryAllowList?.length > 0,
    directoryEntrySrcPath: srcType === 'whiteboard' ? '' : directoryEntrySrcPath
  };

  const isWeb = isWebTarget({ buildType });
  const routes = getRoutes(routeArgs);
  const base = getBaseConfig({ isWeb, buildType, srcType, exportType, enableCssInJs });

  routeInfo[`${srcType}_${buildType}`] = routes;

  return {
    ...base,
    ...{
      entry: getEntries({ buildType, srcType, exportType }),
      plugins: getPlugins({ buildType, srcType, routes, exportType, enableCssInJs })
    }
  };
};

module.exports = {
  paths,
  routeInfo,
  loaders: webpackLoaders,
  plugins: webpackPlugins,
  handler: webpackHandler,
  getConfig,
  webpackPreProcess,
  webpackPostProcess
};
