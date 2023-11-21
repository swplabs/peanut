const path = require('path');
const basePostCssConfig = require('./config.postcss.js');
const babelConfig = require('./config.babel.js');
const envVars = require('../../shared/envvars.js');
const nodeEnv = envVars.get('NODE_ENV') || 'production';

const handlebars = ({ isWeb }) => {
  const hbHelperPath = path.resolve(__dirname, '../handlebars');
  const helperDirs = [`${hbHelperPath}/shared`];

  if (!isWeb) helperDirs.push(`${hbHelperPath}/server`);

  return {
    test: /\.hbs$/,
    loader: 'handlebars-loader',
    options: {
      runtime: 'handlebars/runtime',
      helperDirs,
      precompileOptions: {
        knownHelpersOnly: false
      }
    }
  };
};

const style = ({ MiniCssExtractPlugin, exportType, disableExtract = false }) => {
  return {
    test: /\.s?css$/i,
    use: [
      !disableExtract && exportType !== 'web'
        ? MiniCssExtractPlugin.loader
        : { loader: 'style-loader' },
      {
        loader: 'css-loader',
        options: {
          sourceMap: false,
          importLoaders: 2
        }
      },
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: basePostCssConfig
        }
      },
      {
        loader: 'resolve-url-loader',
        options: {
          sourceMap: false
        }
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: true
        }
      }
    ]
  };
};

const js = ({ buildType, srcType, exportType }) => {
  return {
    test: /\.m?js$/,
    exclude: /node_modules|\.min\.js/,
    use: [
      {
        loader: 'babel-loader',
        options: babelConfig({ buildType, srcType, exportType, nodeEnv })
      }
    ]
  };
};

const ts = ({ buildType, exportType }) => {
  return {
    test: /\.ts$/,
    exclude: /node_modules|\.min\.js/,
    use: [
      {
        loader: 'babel-loader',
        options: babelConfig({ buildType, exportType, fileType: 'ts' })
      }
    ]
  };
};

const php = ({ output }) => {
  return {
    test: /\.php$/,
    use: [
      {
        loader: path.resolve(__dirname, './loaders/php.js'),
        options: {
          output
        }
      }
    ]
  };
};

module.exports = {
  handlebars,
  js,
  ts,
  style,
  php
};
