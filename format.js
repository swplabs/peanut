process.env.PFWP_CMD = 'format';

const envVars = require('./shared/envvars.js');

// Validate Config
require('./shared/utils.js').validateEnvVarConfig(envVars);

const { extname } = require('path');
const prettier = require('prettier');
const { globSync } = require('glob');
const { readFileSync, existsSync, writeFileSync } = require('fs');

const { getConfigs } = require('./build/webpack/index.js');
const { appSrcPath, isCoreDev, rootDir, enableTS } = require('./shared/definitions.js');
const { config: prettierConfig } = require('./build/lib/prettier.js');

const format = async ({ files = [], ignore = 'node_modules/**', tsEnabled = false }) => {
  const filesToFormat = globSync(files[0], {
    ignore,
    nodir: true,
    dot: true
  });

  if (Array.isArray(filesToFormat)) {
    filesToFormat.forEach(async (file) => {
      if (existsSync(file)) {
        try {
          const source = readFileSync(file, 'utf8');

          const formatConfig = {
            filepath: file,
            ...prettierConfig
          };

          if (tsEnabled && /\.m?[jt]s$/.test(extname(file))) {
            formatConfig.parser = 'typescript';
          }

          const formatted = await prettier.format(source, formatConfig);

          if (formatted && source && source !== formatted) {
            writeFileSync(file, formatted, 'utf-8');
            console.log('[format] updated:', file);
          }
        } catch (error) {
          console.error(error);
        }
      }
    });
  }
};

const configs = getConfigs();

if (Array.isArray(configs)) {
  const tsEnabled = enableTS();

  console.log('[format] formatting files...');

  if (isCoreDev()) {
    format({
      files: [`${rootDir}/**/*.+(js|ts|json|md)`],
      ignore: [`${rootDir}/node_modules/**`, `${rootDir}/dist/**`, `${rootDir}/certs/**`],
      tsEnabled
    });
  }

  configs.forEach((config = {}) => {
    const { name = '' } = config;

    const [srcType = ''] = name.split('_');

    format({
      files: [`${appSrcPath}/${srcType}/**/*.+(js|ts|json|md)`],
      tsEnabled
    });
  });
}
