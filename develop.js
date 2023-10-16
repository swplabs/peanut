const { spawn } = require('child_process');
const webpack = require('webpack');
const chokidar = require('chokidar');
const path = require('path');

const {
  getConfig,
  handler: webpackHandler,
  webpackPreProcess,
  webpackPostProcess
} = require('./build/webpack/index.js');

let webpackCompiler;
let restartTO;
let chokidarReady = false;
let webpackWatch;
let restartDev = true;

let buildStatus = {};
let buildHashes = {};

let serverProcess;

// start app node process
const startNodeProcess = () => {
  console.log('[develop] Starting app server...');

  serverProcess = spawn('node', ['./serve.js']);

  serverProcess.on('spawn', () => {
    console.log('[develop] App server started.');

    buildStatus['process'] = true;

    if (checkBuildStatus()) {
      chokidarReady = true;
      restartDev = false;
    }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(data.toString().trim());
  });

  serverProcess.stderr.on('data', (data) => {
    console.log(data.toString().trim());
  });

  serverProcess.on('error', (error) => {
    console.log(`[develop] Server process error: ${error.message}`);
  });
};

// start sse app node process

const restartBuild = () => {
  buildHashes = {};

  webpackWatch?.close(() => {
    serverProcess?.kill();

    console.log('[chokidar] Development configuration updated. Restarting build process..');

    restartTO = setTimeout(() => {
      resetBuildStatus();

      startWebPack();
    }, 500);
  });
};

const resetBuildStatus = () => {
  buildStatus = {
    webpack: false,
    process: false
  };
};

const checkBuildStatus = () => buildStatus['webpack'] && buildStatus['process'];

const wpHandlerSuccess = ({ skipRestart }) => {
  buildStatus['webpack'] = true;

  if (!skipRestart) {
    if (buildStatus['process']) {
      serverProcess?.kill();
      buildStatus['process'] = false;
    }
  }

  if (!buildStatus['process']) {
    startNodeProcess();
  }

  if (checkBuildStatus()) {
    chokidarReady = true;
    restartDev = false;
  }
};

// Start SSE webpack watch

// Start webpack watch
const startWebPack = async () => {
  console.log('[develop] Starting elements and server compilation and watch...');

  webpackPreProcess({ srcDir: path.resolve(__dirname, './src/') });

  webpackCompiler = webpack([
    // getConfig({ buildType: 'ssr' }),
    getConfig({ buildType: 'elements', srcType: 'app' }),
    getConfig({ buildType: 'elements', srcType: 'components' }),
    getConfig({ buildType: 'elements', srcType: 'blocks' }),
    getConfig({ buildType: 'elements', srcType: 'plugins' }),
    getConfig({ buildType: 'elements', srcType: 'themes' }),
    getConfig({ buildType: 'server', srcType: 'app' })
  ]);

  webpackWatch = webpackCompiler.watch({}, (err, stats) => {
    webpackHandler({
      buildType: 'stack',
      srcType: 'all',
      success: () => {
        webpackPostProcess({ stats });
        wpHandlerSuccess({});
      },
      error: () => {
        buildStatus['webpack'] = false;
        chokidarReady = true;
        restartDev = false;
      },
      hashCheck: ({ hash, buildType, srcType }) => {
        const hashKey = `${buildType}_${srcType}`;

        if (buildHashes[hashKey] === hash) {
          wpHandlerSuccess({ skipRestart: true });
          return true;
        }

        buildHashes[hashKey] = hash + '';
        return false;
      }
    })(err, stats);
  });
};

// Monitor development configuration changes
// TODO: Create regex using component cfg file object?
const compsBlocksFileRegEx = new RegExp(
  '^src/(components|blocks)/[a-zA-Z0-9-_]+/src/((variations|metadata).json|(ssr.)?(client|editor-script).(jsx|js)|template.hbs|(index|render).php|styles.scss)',
  'i'
);

const themesPluginsFileRegEx = new RegExp(
  '^src/(themes|plugins)/[a-zA-Z0-9-_]+/src/((client|editor-script).(jsx|js)|styles.scss)',
  'i'
);

const commonDirRegEx = new RegExp('src/(components|blocks|plugins|themes)/[a-zA-Z0-9-_]+$', 'i');

const devMonitor = chokidar
  .watch(['./src/components', './src/themes', './src/blocks', './src/plugins'])
  .on('all', (fsEvent, fsPath) => {
    if (!chokidarReady || restartDev) return;

    switch (fsEvent) {
      case 'add':
      case 'unlink': {
        if (compsBlocksFileRegEx.test(fsPath) || themesPluginsFileRegEx.test(fsPath)) {
          restartDev = true;
        }
        break;
      }
      case 'addDir':
      case 'unlinkDir': {
        if (commonDirRegEx.test(fsPath)) {
          restartDev = true;
        }
        break;
      }
    }

    if (restartDev) {
      restartBuild();
    }
  })
  .on('ready', () => {
    console.log('[chokidar] Monitoring development configuration...');
    startWebPack();
  });

// Handle termination of process
process.on('SIGINT', () => {
  console.log('');
  console.log('[develop] Cleaning up before interrupt signal...');

  if (restartTO) clearTimeout(restartTO);

  if (serverProcess?.kill()) console.log('[develop] App server process terminated');

  webpackWatch?.close(function () {
    console.log('[webpack] Stopped.');
    devMonitor?.close().then(() => {
      console.log('[chokidar] Closed.');
      console.log('[develop] Exiting cleanly...');
      process.exit();
    });
  });
});
