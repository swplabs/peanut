#!/usr/bin/env node

process.env.PFWP_IS_CLI = 'true';

const { version } = require('./package.json');
const { program } = require('commander');

program
  .name('peanut')
  .description('Peanut for Wordpress. Build your themes and blocks with components.')
  .version(version);

program
  .option('-s, --source <path>', 'path to application source folder')
  .option('--disable-hmr', 'disable Hot Module Reloading')
  .option('-w, --enable-whiteboard', 'enable Whiteboard server/appication')
  .option('-d, --enable-core-dev', 'enable core development');

program.on('option:enable-core-dev', () => {
  process.env.PFWP_CORE_DEV = 'true';
});

program.on('option:enable-whiteboard', () => {
  process.env.PFWP_ENABLE_WB = 'true';
});

program.on('option:disable-hmr', () => {
  process.env.PFWP_ENABLE_HMR = 'false';
});

program.on('option:source', () => {
  const source = program.opts().source;

  if (typeof source === 'string') {
    process.env.PFWP_APP_SRC_PATH = source;
  }
});

program
  .command('develop', { isDefault: true })
  .description('Compile source(s) in development mode and watch for changes')
  .action(() => {
    require('./develop.js');
  });

program
  .command('build')
  .description('Build application source')
  .action(() => {
    require('./build.js');
  });

program
  .command('lint')
  .description('Lint your source code')
  .action(() => {
    require('./lint.js');
  });

program.parse(process.argv);
