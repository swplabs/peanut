const path = require('path');
const nodeExternals = require('webpack-node-externals');
const paths = require('./paths.js');
const { webpackPreProcess, webpackPostProcess: webpackPostProcessHook } = require('./hooks.js');
const loaders = require('./loaders.js');
const plugins = require('./plugins.js');
const envVars = require('../../shared/envvars.js');
const { srcDirEntMap } = require('../../shared/src.dir.map.js');
const environment = envVars.get('ENVIRONMENT') || 'prod';
const nodeEnv = envVars.get('NODE_ENV') || 'production';
const distDir = path.join(__dirname, `../../dist/${envVars.get('PFWP_DIST')}`);
const staticDir = distDir + '/static';
const wbPublicPath = envVars.get('PFWP_WB_PUBLIC_PATH') || '/';
const rootDir = path.resolve(__dirname, '../../');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const appSrcPath = envVars.get('PFWP_APP_SRC_PATH');
const dirEntAllowList = envVars.get('PFWP_DIR_ENT_ALLOW_LIST');
const wordpressRoot = envVars.get('PFWP_WP_ROOT');
const wordpressPublicPath = envVars.get('PFWP_WP_PUBLIC_PATH');
const peanutThemePath = envVars.get('PFWP_THEME_PATH');

const { getRoutes, getEntries, getCacheGroups } = paths;

const { handlebars: hbsLoader, style: styleLoader, js: jsLoader, php: phpLoader } = loaders;

const {
  eslint: eslintPlugin,
  webpackDefine: webpackDefinePlugin,
  extractCss: extractCssPlugin,
  blocks: blocksPlugin,
  components: componentsPlugin,
  copy: copyPlugin,
  wpDepExtract: wpDepExtractPlugin,
  hotModuleReplacement: hotModuleReplacementPlugin,
  reactRefresh: reactRefreshPlugin
} = plugins;

const handler =
  ({ buildType: type, srcType, hashCheck, success, error }) =>
  (err, stats) => {
    if (err) {
      console.log(`[webpack:${type}:${srcType}]`);
      console.log(err);
    }

    if (stats.hasErrors()) {
      console.log(`[webpack:${type}:${srcType}]`);
      console.log(
        stats.toString({
          all: false,
          errors: true
        })
      );

      if (typeof error === 'function') error();
    } else {
      if (typeof hashCheck === 'function') {
        if (hashCheck({ buildType: type, srcType, hash: stats.hash })) return;
      }

      if (stats.hasWarnings()) {
        console.log(
          stats.toString({
            all: false,
            warnings: true
          })
        );
      }

      console.log(`\n[webpack:${type}:${srcType}] Compilation successful.`);
      console.log(
        `${stats.toString({
          all: false,
          colors: true,
          assets: true,
          logging: 'info',
          groupAssetsByExtension: true
        })}\n`
      );

      if (typeof success === 'function') success();
    }
  };

const getEntryInfo = (srcType, entryId) => {
  const entryFile = Object.keys(srcDirEntMap).find((key) =>
    entryId.startsWith(`${srcDirEntMap[key].entryKey}_${srcType}`)
  );

  return {
    pathName: entryFile
      ? entryId.replace(`${srcDirEntMap[entryFile].entryKey}_`, '').replace(`${srcType}_`, '')
      : 'pfwp-shared-assets',
    entryFile: entryFile
      ? entryFile.replace(path.extname(entryFile), '')
      : entryId.replace(path.extname(entryId), '')
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
      const { pathName, entryFile } = getEntryInfo(srcType, entryId);

      name = `wp-content/${srcType}/${pathName}/assets/${entryFile}.js`;
    }

    return name;
  };

const getOutput = ({ buildType, srcType, exportType }) => {
  let outputs = {};

  const outputPath = srcType === 'whiteboard' ? staticDir : wordpressRoot;
  const filePath = srcType === 'whiteboard' ? `assets/${srcType}` : `.assets/${srcType}`;

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
    // case 'ssr':
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

const getModuleRules = ({ isWeb, buildType, exportType, srcType, disableExtract }) => {
  // TODO: remove once we switch to react for whiteboard app
  const rules = srcType === 'whiteboard' ? [hbsLoader({ isWeb })] : [];

  switch (buildType) {
    // case 'ssr':
    // TODO: add 'client' case that doesn't use php loader for 'whiteboard'
    case 'elements': {
      rules.push(
        styleLoader({ MiniCssExtractPlugin, exportType, disableExtract }),
        jsLoader({ buildType, srcType, exportType }),
        phpLoader({ output: { peanutThemePath, wordpressRoot } })
      );
      break;
    }
    case 'server': {
      // rules.push();
      break;
    }
  }

  return rules;
};

const getPlugins = ({ buildType, srcType, routes, exportType, disableExtract = false }) => {
  const plugins = [webpackDefinePlugin(routes), eslintPlugin({ buildType, srcType })];

  const outputPath = srcType === 'whiteboard' ? staticDir : wordpressRoot;
  const filePath = srcType === 'whiteboard' ? `assets/${srcType}` : `.assets/${srcType}`;

  if (!disableExtract && exportType !== 'web' && buildType !== 'server')
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

  if (nodeEnv === 'development' && ['blocks', 'plugins'].includes(srcType)) {
    plugins.push(hotModuleReplacementPlugin(), reactRefreshPlugin());
  }

  return plugins;
};

// TODO: adjust this because we use 'elements' instead of 'client' nomenclature now
const isWebTarget = ({ buildType }) => ![/*'ssr',*/ 'server'].includes(buildType);

const getBaseConfig = ({ isWeb, buildType, srcType, exportType, disableExtract }) => {
  return {
    context: rootDir,

    name: `${srcType}_${buildType}`,

    mode: nodeEnv || 'none',

    output: getOutput({ buildType, srcType, exportType }),

    target: isWeb ? 'web' : 'node20.9',

    // cache: false,

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
      rules: getModuleRules({ isWeb, buildType, srcType, exportType, disableExtract })
    },

    optimization: {
      usedExports: true,
      // TODO: create shared function isHotModuleEnabled
      runtimeChunk:
        nodeEnv === 'development' && ['blocks', 'plugins'].includes(srcType)
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
  srcTypeDirEnts,
  exportType: eType,
  disableExtract: dExtract
}) => {
  const exportType = eType || envVars.get('PFWP_E_TYPE');
  const disableExtract = dExtract || envVars.getBoolean('PFWP_NOCSS') === true;

  const routeArgs = {
    buildType,
    srcType,
    srcTypeDirEnts:
      Array.isArray(dirEntAllowList) && dirEntAllowList.length ? dirEntAllowList : srcTypeDirEnts,
    forceBase: dirEntAllowList?.length > 0
  };

  const isWeb = isWebTarget({ buildType });
  const routes = getRoutes(routeArgs);
  const base = getBaseConfig({ isWeb, buildType, srcType, exportType, disableExtract });

  return {
    ...base,
    ...{
      entry: getEntries({ buildType, srcType, exportType }),
      plugins: getPlugins({ buildType, srcType, routes, exportType, disableExtract })
    }
  };
};

module.exports = {
  paths,
  loaders,
  plugins,
  handler,
  getConfig,
  webpackPreProcess,
  webpackPostProcess: ({ stats }) => {
    webpackPostProcessHook({ stats });
  }
};
