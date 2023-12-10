const ESLintPlugin = require('eslint-webpack-plugin');
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
const pkgData = require('../../package.json');
const envVars = require('../../shared/envvars.js');
const environment = envVars.get('ENVIRONMENT') || 'prod';
const esLintConfig = require('./config.eslint.js');

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
  return new CopyPlugin({
    directory,
    srcType,
    routes
  });
};

const eslint = ({ buildType, srcType }) => {
  return new ESLintPlugin({
    extensions: ['js'],
    exclude: ['node_modules'],
    failOnError: true,
    failOnWarning: false,
    emitError: true,
    emitWarning: true,
    overrideConfig: esLintConfig({ buildType, srcType })
  });
};

const wpDepExtract = ({ directory, srcType }) => {
  return new WPDepExtractionPlugin({
    outputFormat: 'php',
    combineAssets: !['themes', 'plugins'].includes(srcType),
    combinedOutputFile: !['themes', 'plugins'].includes(srcType)
      ? `${directory}/${srcType}/deps.php`
      : null,
    // TODO: enable this to be read from /extend/ config file/option
    requestToExternal: (request) => {
      if (
        request ===
        '@wordpress/block-library/build-module/query/edit/inspector-controls/taxonomy-controls'
      ) {
        return false;
      }
    }
  });
};

const webpackDefine = (routes) => {
  return new DefinePlugin({
    __APP_VERSION__: JSON.stringify(pkgData.version),
    __ROUTES__: JSON.stringify(routes),
    'process.env.NODE_ENV': JSON.stringify(envVars.get('NODE_ENV') || 'production'),
    __DEBUG__: JSON.stringify(envVars.getBoolean('PFWP_DEBUG') || false)
  });
};

const hotModuleReplacement = () => {
  return new HotModuleReplacementPlugin();
};

const reactRefresh = () => {
  return new ReactRefreshWebpackPlugin({
    overlay: {
      entry: '@pmmmwh/react-refresh-webpack-plugin/client/ErrorOverlayEntry',
      module: '@pmmmwh/react-refresh-webpack-plugin/overlay',
      sockIntegration: 'wds'
    }
  });
};

const normalModuleReplacement = ({ rootDir }) => {
  return new NormalModuleReplacementPlugin(
    /react-refresh-webpack-plugin\/overlay\/containers\/RuntimeErrorContainer/,
    `${rootDir}/src/whiteboard/shared/runtime-error-container.js`
  );
};

const extractCss = ({ MiniCssExtractPlugin, exportType, filePath }) => {
  return new MiniCssExtractPlugin({
    filename:
      environment === 'local' || exportType
        ? `${filePath}/[name].css`
        : `${filePath}/[name].[chunkhash:20].css`
  });
};

module.exports = {
  eslint,
  wpDepExtract,
  webpackDefine,
  extractCss,
  hotModuleReplacement,
  reactRefresh,
  blocks,
  postprocess,
  components,
  normalModuleReplacement,
  copy
};
