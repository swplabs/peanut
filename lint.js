const envVars = require('./shared/envvars.js');

// Validate Config
require('./shared/utils.js').validateEnvVarConfig(envVars);

const { ESLint } = require('eslint');
const { relative } = require('path');

const { generateConfig } = require('./build/lib/eslint.js');
const {
  getConfigs
} = require('./build/webpack/index.js');
const { appSrcPath, rootDir } = require('./shared/definitions.js');
const requireConfigFile = require('./build/lib/require.config.js');

let extendConfig;

if (envVars.get('PFWP_CONFIG_ESLINT')) {
  extendConfig = requireConfigFile(`${appSrcPath}/${envVars.get('PFWP_CONFIG_ESLINT')}`);
}

const configs = getConfigs();

const lint = async ({ files = [], buildType = '', srcType = '' }) => {
  const eslintConfig = {
    useEslintrc: false,
    resolvePluginsRelativeTo: rootDir,
    errorOnUnmatchedPattern: false,
    overrideConfig: generateConfig({ buildType, srcType })
  };
  
  const eslint = new ESLint((typeof extendConfig === 'function' ? extendConfig({ eslintConfig, buildType, srcType }) : eslintConfig));

  const results = await eslint.lintFiles(files);

  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);

  if (resultText) {
    console.log(resultText);
  }
  
  console.log('[lint] completed:', `${srcType}_${buildType}`);
};
  
if (Array.isArray(configs)) {
  // TODO: make synchronous
  // TODO: add root files on isCoreDev
  configs.forEach(async (config = {}) => {
    const {
      name = ''
    } = config;
    
    const [
      srcType = '',
      buildType = ''
    ] = name.split('_');
    
    try {
      // TODO: do we need this - const relativeDirectory = relative(process.cwd(), `${appSrcPath}/${srcType}/`);
      // TODO: handle if isCoreDev (i.e. add src files)      
      await lint({
        buildType,
        srcType,
        files: [
        `${appSrcPath}/${srcType}/**/*.js` 
        ]
      })
      
    } catch (error) {
      console.error(error);
    }
  });
}
