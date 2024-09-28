const envVars = require('./shared/envvars.js');
const { appSrcPath } = require('./shared/definitions.js');
const requireConfigFile = require('./build/lib/require.config.js');

let extendEsLint;

if (envVars.get('PFWP_CONFIG_ESLINT')) {
  extendEsLint = requireConfigFile(`${appSrcPath}/${envVars.get('PFWP_CONFIG_ESLINT')}`);
}

const babelConfig = require('./build/webpack/config.babel.js');

const customReactRules = {
  'react/jsx-indent': 'off',
  'react/jsx-indent-props': 'off',
  'react/jsx-curly-spacing': 'off'
};

module.exports = ({ buildType, srcType }) => {
  const lintConfig = {
    root: true,
    globals: {
      System: true
    },
    parser: require.resolve('@babel/eslint-parser'),
    parserOptions: {
      ecmaVersion: 6,
      requireConfigFile: false,
      sourceType: 'module',
      ecmaFeatures: {
        modules: true,
        classes: true
      },
      allowImportExportEverywhere: false,
      codeFrame: false,
      babelOptions: {
        configFile: false,
        ...babelConfig({ buildType, srcType })
      }
    },
    extends: ['components', 'whiteboard'].includes(srcType)
      ? []
      : ['plugin:@wordpress/eslint-plugin/react'],
    rules: {
      ...customReactRules
    },
    env: {
      browser: true,
      es6: true,
      node: true,
      commonjs: true
    },
    overrides:
      srcType === 'whiteboard'
        ? [
            {
              files: [
                './src/whiteboard/shared/routes/**/*.js',
                './src/whiteboard/shared/components/**/*.js'
              ],
              extends: ['plugin:@wordpress/eslint-plugin/react'],
              parserOptions: {
                babelOptions: {
                  configFile: false,
                  ...babelConfig({ buildType, srcType, enableReactPreset: true })
                }
              },
              rules: {
                ...customReactRules
              }
            }
          ]
        : []
  };

  return typeof extendEsLint === 'function' ? extendEsLint(lintConfig) : lintConfig;
};