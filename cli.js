#!/usr/bin/env node

process.env.PFWP_IS_CLI = 'true';

const { program } = require('commander');

const {
  version,
  config: { published = false }
} = require('./package.json');

program
  .name('peanut')
  .description('Peanut for WordPress. Build your themes and blocks with components.')
  .version(version);

program
  .option('-s, --source <path>', 'path to project  source folder')
  .option('--disable-hmr', 'disable Hot Module Reloading')
  .option('-w, --enable-whiteboard', 'enable Whiteboard server/appication')
  .option('-t, --enable-typescript', 'enable Typescript');

if (published !== true) {
  program.option('-d, --enable-core-dev', 'enable core development');
}

program.on('option:enable-core-dev', () => {
  process.env.PFWP_CORE_DEV = 'true';
});

program.on('option:enable-whiteboard', () => {
  process.env.PFWP_ENABLE_WB = 'true';
});

program.on('option:enable-typescript', () => {
  process.env.PFWP_ENABLE_TS = 'true';
});

program.on('option:disable-hmr', () => {
  process.env.PFWP_ENABLE_HMR = 'false';
});

program.on('option:source', () => {
  const source = program.opts().source;

  if (typeof source === 'string') {
    process.env.PFWP_APP_SRC_PATH = source.replace(/\/$/, '');
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
    process.env.PFWP_DIST ??= 'build';
    require('./build.js');
  });

program
  .command('lint')
  .description('Lint your source code')
  .action(() => {
    require('./lint.js');
  });

program
  .command('format')
  .description('Format your source code')
  .action(() => {
    require('./format.js');
  });

const setupCommand = program
  .command('setup')
  .description('Setup a project')
  .action(() => {
    require('./setup.js')({});
  });

setupCommand
  .command('plugin')
  .description('Install and update the Peanut For Wordpress plugin')
  .action(() => {
    require('./setup.js')({ subcommand: 'plugin' });
  });

program.parse(process.argv);
