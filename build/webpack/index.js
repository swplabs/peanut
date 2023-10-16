const path = require('path');
const nodeExternals = require('webpack-node-externals');
const paths = require('./paths.js');
const { webpackPreProcess, webpackPostProcess: webpackPostProcessHook } = require('./hooks.js');
const loaders = require('./loaders.js');
const plugins = require('./plugins.js');
const envVars = require('../../config/envvars.js');
const { srcDirEntMap } = require('../../config/src.dir.map.js');
const environment = envVars.get('ENVIRONMENT') || 'prod';
const nodeEnv = envVars.get('NODE_ENV') || 'production';
const distDir = path.join(__dirname, `../../dist/${envVars.get('PEANUT_DIST')}`);
const staticDir = distDir + '/static';
const appPublicPath = envVars.get('PEANUT_APP_PUBLIC_PATH') || '/';
const rootDir = path.resolve(__dirname, '../../');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const appSrcPath = envVars.get('PEANUT_APP_SRC_PATH');
const dirEntAllowList = envVars.get('PEANUT_DIR_ENT_ALLOW_LIST');
const wordpressRoot = envVars.get('PEANUT_WP_ROOT');
const wordpressPublicPath = envVars.get('PEANUT_WP_PUBLIC_PATH');
const peanutThemePath = envVars.get('PEANUT_THEME_PATH');

const { getRoutes, getEntries, getCacheGroups } = paths;

const { handlebars: hbsLoader, style: styleLoader, js: jsLoader, php: phpLoader } = loaders;

const {
  eslint: eslintPlugin,
  nameChunkGroups: nameChunkGroupsPlugin,
  webpackDefine: webpackDefinePlugin,
  webpackCopy: webpackCopyPlugin,
  extractCss: extractCssPlugin,
  blocks: blocksPlugin,
  copy: copyPlugin,
  wpDepExtract: wpDepExtractPlugin
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
  const entryFile = Object.keys(srcDirEntMap).find((key) => entryId.startsWith(`${srcDirEntMap[key].entryKey}_${srcType}`));

  return {
    pathName: (entryFile ? entryId.replace(`${srcDirEntMap[entryFile].entryKey}_`, '') : entryId).replace(`${srcType}_`, ''),
    entryKey: entryFile ? srcDirEntMap[entryFile].entryKey : 'client',
    entryFile: entryFile.replace(path.extname(entryFile), '')
  };
};

const setFileName = (fileName, srcType) => (pathData) => {
  if (['plugins', 'themes'].includes(srcType)) {
    const { pathName, entryFile } = getEntryInfo(srcType, pathData.chunk.id);
    fileName = `wp-content/${srcType}/${pathName}/assets/${entryFile}.js`;
  }

  return fileName;
};

const getOutput = ({ buildType, srcType, exportType }) => {
  let outputs = {};

  const outputPath = srcType === 'app' ? staticDir : wordpressRoot;
  const filePath = srcType === 'app' ? `assets/${srcType}` : `.assets/${srcType}`;

  const filename =
    environment === 'local' || exportType || srcType !== 'components'
      ? `${filePath}/[name].js`
      : `${filePath}/[name].[chunkhash:20].js`;

  switch (buildType) {
    case 'elements': {
      outputs = {
        filename: setFileName(filename, srcType),
        path: outputPath,
        publicPath: srcType === 'app' ? appPublicPath : wordpressPublicPath,
        chunkFilename: setFileName(filename, srcType),
        assetModuleFilename: `${filePath}/[hash][ext][query]`
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
  const rules = srcType === 'app' ? [hbsLoader({ isWeb })] : [];

  switch (buildType) {
    // case 'ssr':
    // TODO: add 'client' case that doesn't use php loader for 'app'
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

  const outputPath = srcType === 'app' ? staticDir : wordpressRoot;
  const filePath = srcType === 'app' ? `assets/${srcType}` : `.assets/${srcType}`;

  if (buildType === 'elements') {
    // TODO: use webpackPostProcess to build this as one file
    plugins.push(
      nameChunkGroupsPlugin({
        chunkGroupsFile: `${outputPath}/${filePath}/chunkgroups.json`,
        srcType
      })
    );

    if (!exportType && srcType === 'app') plugins.push(webpackCopyPlugin({ srcType }));
  }

  if (!disableExtract && exportType !== 'web' && buildType !== 'server')
    plugins.push(extractCssPlugin({ MiniCssExtractPlugin, exportType, filePath }));

  if (srcType === 'blocks') {
    plugins.push(blocksPlugin({ directory: `${wordpressRoot}${peanutThemePath}`, routes }));
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

    target: isWeb ? 'web' : 'node18.18',

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
  const exportType = eType || envVars.get('PEANUT_E_TYPE');
  const disableExtract = dExtract || envVars.getBoolean('PEANUT_NOCSS') === true;

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
