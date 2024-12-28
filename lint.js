process.env.PFWP_CMD = 'lint';

const envVars = require('./shared/envvars.js');

// Validate Config
require('./shared/utils.js').validateEnvVarConfig(envVars);

const { ESLint } = require('eslint');

const { generateConfig } = require('./build/lib/eslint.js');
const { getConfigs } = require('./build/webpack/index.js');
const { appSrcPath, rootDir, isCoreDev } = require('./shared/definitions.js');
const { requireConfigFile } = require('./build/lib/utils.js');

let extendConfig;

if (envVars.get('PFWP_CONFIG_ESLINT')) {
  extendConfig = requireConfigFile(`${appSrcPath}/${envVars.get('PFWP_CONFIG_ESLINT')}`);
}

const lint = async ({ files = [], buildType = '', srcType = '', ignorePatterns = null }) => {
  const eslintConfig = {
    useEslintrc: false,
    // TODO: for eslint 9: overrideConfigFile: true,
    // TODO: migrate to eslint 9 and import plugins
    resolvePluginsRelativeTo: rootDir,
    errorOnUnmatchedPattern: false,
    overrideConfig: generateConfig({ buildType, srcType })
  };

  if (ignorePatterns) {
    eslintConfig.overrideConfig.ignorePatterns ??= [];

    eslintConfig.overrideConfig.ignorePatterns = [
      ...eslintConfig.overrideConfig.ignorePatterns,
      ...ignorePatterns
    ];
  }

  try {
    const eslint = new ESLint(
      typeof extendConfig === 'function'
        ? extendConfig({ eslintConfig, buildType, srcType })
        : eslintConfig
    );

    const results = await eslint.lintFiles(files);

    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);

    if (resultText) {
      console.log(resultText);
    }
  } catch (error) {
    console.error(error);
  }
};

const configs = getConfigs();

if (Array.isArray(configs)) {
  console.log('[lint] linting files...');

  if (isCoreDev()) {
    lint({
      files: [`${rootDir}/**/*.js`],
      ignorePatterns: [`**/dist/**`, `**/node_modules/**`]
    });
  }

  configs.forEach((config = {}) => {
    const { name = '' } = config;

    const [srcType = '', buildType = ''] = name.split('_');

    lint({
      buildType,
      srcType,
      files: [`${appSrcPath}/${srcType}/**/*.js`],
      ignorePatterns: [`${appSrcPath}/${srcType}/node_modules/**`, 'node_modules/**']
    });
  });
}
