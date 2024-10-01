const WPDepExtractionPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const {
  DefinePlugin,
  HotModuleReplacementPlugin,
  NormalModuleReplacementPlugin
} = require('webpack');
const { BlocksPlugin } = require('./plugins/block.js');
const { PostProcessPlugin } = require('./plugins/post.process.js');
const { ComponentsPlugin } = require('./plugins/component.js');
const { CopyPlugin } = require('./plugins/copy.js');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { getEnv, getCLICommand, getNodeEnv, isDebugMode } = require('../../shared/definitions.js');

const blocks = ({ directory, routes, outputPath }) => {
  return new BlocksPlugin({
    directory,
    routes,
    outputPath
  });
};

const postprocess = (callback) => {
  return new PostProcessPlugin({
    callback
  });
};

const components = ({ directory, routes, outputPath }) => {
  return new ComponentsPlugin({
    directory,
    routes,
    outputPath
  });
};

const copy = ({ directory, srcType, routes }) => {
  const options = {
    directory,
    srcType,
    routes
  };

  if (!['build', 'develop'].includes(getCLICommand())) {
    options.emptyDirectoryOnStart = false;
  }

  return new CopyPlugin(options);
};

const wpDepExtract = ({ directory, srcType }) => {
  return new WPDepExtractionPlugin({
    outputFormat: 'php',
    combineAssets: !['themes', 'plugins'].includes(srcType),
    combinedOutputFile: !['themes', 'plugins'].includes(srcType)
      ? `${directory}/${srcType}/deps.php`
      : null
  });
};

const webpackDefine = ({ routes, appVersion }) => {
  return new DefinePlugin({
    __APP_VERSION__: JSON.stringify(appVersion),
    // TODO: Do we need this now that routes can be part of pfwp.json file?
    __ROUTES__: JSON.stringify(routes),
    'process.env.NODE_ENV': JSON.stringify(getNodeEnv()),
    __DEBUG__: JSON.stringify(isDebugMode())
  });
};

const hotModuleReplacement = () => {
  return new HotModuleReplacementPlugin();
};

const reactRefresh = () => {
  return new ReactRefreshWebpackPlugin({
    overlay: {
      entry: require.resolve('@pmmmwh/react-refresh-webpack-plugin/client/ErrorOverlayEntry'),
      module: require.resolve('@pmmmwh/react-refresh-webpack-plugin/overlay'),
      sockIntegration: 'wds'
    }
  });
};

const normalModuleReplacement = (...args) => {
  return new NormalModuleReplacementPlugin(...args);
};

const extractCss = ({ MiniCssExtractPlugin, exportType, filePath }) => {
  return new MiniCssExtractPlugin({
    filename:
      getEnv() === 'local' || exportType
        ? `${filePath}/[name].css`
        : `${filePath}/[name].[chunkhash:20].css`
  });
};

module.exports = {
  wpDepExtract,
  webpackDefine,
  extractCss,
  hotModuleReplacement,
  reactRefresh,
  blocks,
  postprocess,
  components,
  normalModuleReplacement,
  copy,
  plugins: {
    WPDepExtractionPlugin,
    ReactRefreshWebpackPlugin,
    DefinePlugin,
    HotModuleReplacementPlugin,
    NormalModuleReplacementPlugin
  }
};
