const CopyWebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const WPDepExtractionPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const { DefinePlugin } = require('webpack');
const { BlocksPlugin } = require('./plugins/block.js');
const { NamedChunkGroupsPlugin } = require('./plugins/chunk.groups.js');
const { CopyPlugin } = require('./plugins/copy.js');
const pkgData = require('../../package.json');
const envVars = require('../../config/envvars.js');
const environment = envVars.get('ENVIRONMENT') || 'prod';
const esLintConfig = require('./config.eslint.js');

const nameChunkGroups = ({ chunkGroupsFile, srcType }) => {
  return new NamedChunkGroupsPlugin({
    file: chunkGroupsFile,
    srcType
  });
};

const blocks = ({ directory, routes }) => {
  return new BlocksPlugin({
    directory,
    routes
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
    __DEBUG__: JSON.stringify(envVars.getBoolean('PEANUT_DEBUG') || false)
  });
};

const extractCss = ({ MiniCssExtractPlugin, exportType, filePath }) => {
  return new MiniCssExtractPlugin({
    filename:
      environment === 'local' || exportType
        ? `${filePath}/[name].css`
        : `${filePath}/[name].[chunkhash:20].css`
  });
};

const webpackCopy = ({ srcType }) => {
  return new CopyWebpackPlugin({
    patterns: [{ from: `./src/${srcType}/static`, to: './' }]
  });
};

module.exports = {
  eslint,
  wpDepExtract,
  nameChunkGroups,
  webpackDefine,
  webpackCopy,
  extractCss,
  blocks,
  copy
};
