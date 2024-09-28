// Validate Config
require('./shared/utils.js').validateEnvVarConfig(require('./shared/envvars.js'));

const { ESLint } = require('eslint');
const esLintConfig = require('./.eslint.config.js');
const {
  getConfigs
} = require('./build/webpack/index.js');
const { appSrcPath, rootDir } = require('./shared/definitions.js');

const configs = getConfigs();


const lint = async ({ files = [], buildType = '', srcType = '', }) => {
  const eslint = new ESLint({
    useEslintrc: false,
    resolvePluginsRelativeTo: rootDir,
    overrideConfig: esLintConfig({ buildType, srcType })
  });

  console.log('files', files);
  
  const results = await eslint.lintFiles([
    // 'build/**/*.js',
    './components/**/*.js',
    '*.js',
    ...files
  ]);

  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);

  console.log(resultText);
};

  console.log(appSrcPath);
  
if (Array.isArray(configs)) {
  // TODO: make synchronous
  configs.forEach(async (config) => {
    try {
      await lint({
        buildType: '',
        srcType: ''
      })
    } catch (error) {
      console.error(error);
    }
  });
}
