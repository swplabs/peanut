#!/usr/bin/env node

const { isDebugMode, debugModeInterval } = require('./shared/definitions.js');

const args = process.argv.slice(2);

process.env.PFWP_IS_CLI = 'true';

if (isDebugMode()) {
  setInterval(() => {
    console.log(`\nDebug Memory Usage:\n${JSON.stringify(process.memoryUsage())}`);
    console.log(
      `Currently using ${Math.floor(process.memoryUsage().heapUsed / 1024 / 1024)} MB of memory.\n`
    );
  }, debugModeInterval);
}

switch (args[0]) {
  case 'build': {
    require('./build.js');
    break;
  }
  case 'lint': {
    require('./lint.js');
    break;
  }
  case 'export': {
    require('./export.js');
    break;
  }
  case 'develop':
  default: {
    require('./develop.js');
  }
}
