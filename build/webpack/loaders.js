const path = require('path');
const basePostCssConfig = require('./config.postcss.js');
const babelConfig = require('./config.babel.js');

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
    use: (resourceInfo) => [
      {
        loader: 'babel-loader',
        options: babelConfig({ buildType, srcType, exportType, resourceInfo })
      }
    ]
  };
};

/*
TODO: include option for enabling typescript
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
*/

const php = ({ output }) => {
  return {
    test: /\.php$/,
    use: (resourceInfo) => [
      {
        loader: path.resolve(__dirname, './loaders/php.js'),
        options: {
          output,
          resourceInfo
        }
      }
    ]
  };
};

module.exports = {
  js,
  // ts,
  style,
  php
};
