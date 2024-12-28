const path = require('path');
const basePostCssConfig = require('./config.postcss.js');
const babelConfig = require('./config.babel.js');

const style = ({ MiniCssExtractPlugin, srcType, enableCssInJs = false, environment }) => {
  return {
    test: /\.s?css$/i,
    use: [
      !enableCssInJs ? MiniCssExtractPlugin.loader : { loader: require.resolve('style-loader') },
      {
        loader: require.resolve('css-loader'),
        options: {
          sourceMap: false,
          importLoaders: 3,
          modules:
            srcType === 'whiteboard'
              ? {
                  namedExport: false,
                  exportLocalsConvention: 'as-is',
                  localIdentName:
                    environment === 'local'
                      ? '[folder]__[name]__[local]-[hash:base64:6]'
                      : '[hash:base64]'
                }
              : false
        }
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: basePostCssConfig
        }
      },
      {
        loader: require.resolve('resolve-url-loader'),
        options: {
          sourceMap: false
        }
      },
      {
        loader: require.resolve('sass-loader'),
        options: {
          sourceMap: true,
          sassOptions: {
            silenceDeprecations: ['import']
          }
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
        loader: require.resolve('babel-loader'),
        options: babelConfig({ buildType, srcType, exportType, resourceInfo })
      }
    ]
  };
};

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
  style,
  php,
  // TODO: add loader modules
  loaders: {}
};
