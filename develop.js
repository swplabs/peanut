const { spawn } = require('child_process');
const webpack = require('webpack');
const chokidar = require('chokidar');
const path = require('path');

const {
  getConfig,
  handler: webpackHandler,
  webpackPreProcess,
  plugins: { postprocess: postProcessPlugin }
} = require('./build/webpack/index.js');

const { serverStart } = require('./build/server/index.js');

let webpackCompiler;
let restartTO;
let chokidarReady = false;
let webpackDMInstance;
let restartDev = true;
let sseHttpServer;
let sseHttpsServer;

let buildStatus = {};
let buildHashes = {};

let whiteboardProcess;

// start whiteboard node process
const startWhiteBoardServer = () => {
  console.log('[develop] Starting Whiteboard server...');

  whiteboardProcess = spawn('node', ['./whiteboard.js']);

  whiteboardProcess.on('spawn', () => {
    console.log('[develop] Whiteboard server started.', "\n");

    buildStatus['process'] = true;

    if (checkBuildStatus()) {
      chokidarReady = true;
      restartDev = false;
    }
  });

  whiteboardProcess.stdout.on('data', (data) => {
    console.log(data.toString().trim());
  });

  whiteboardProcess.stderr.on('data', (data) => {
    console.log(data.toString().trim());
  });

  whiteboardProcess.on('error', (error) => {
    console.log(`[develop] Server process error: ${error.message}`);
  });
};

// start sse app node process

const restartBuild = () => {
  buildHashes = {};

  webpackDMInstance?.close(async () => {
    whiteboardProcess?.kill();

    console.log('[chokidar] Development configuration updated. Restarting build process..');

    restartTO = setTimeout(async () => {
      resetBuildStatus();

      await startWebPack();
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

  // TODO: make this smarter so that we only restart server on server file changes
  if (!skipRestart) {
    if (buildStatus['process']) {
      whiteboardProcess?.kill();
      buildStatus['process'] = false;
    }
  }

  if (!buildStatus['process']) {
    startWhiteBoardServer();
  }

  if (checkBuildStatus()) {
    chokidarReady = true;
    restartDev = false;
  }
};

const webpackCallback = (err, stats) => {
  webpackHandler({
    buildType: 'stack',
    srcType: 'all',
    success: () => {
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
};

// Start webpack watch
const startWebPack = async () => {
  console.log('[develop] Starting elements and server compilation and watch...');

  webpackPreProcess({ srcDir: path.resolve(__dirname, './src/') });

  webpackCompiler = webpack([
    // getConfig({ buildType: 'ssr' }),
    getConfig({ buildType: 'elements', srcType: 'whiteboard' }),
    getConfig({ buildType: 'elements', srcType: 'components' }),
    getConfig({ buildType: 'elements', srcType: 'blocks' }),
    getConfig({ buildType: 'elements', srcType: 'plugins' }),
    getConfig({ buildType: 'elements', srcType: 'themes' }),
    getConfig({ buildType: 'server', srcType: 'whiteboard' })
  ]);

  postProcessPlugin(({ stats }) => {
    webpackCallback(null, stats);
  }).apply(webpackCompiler);

  await sseHttpServer?.destroy();
  await sseHttpsServer?.destroy();

  console.log('[develop] Starting development SSE server...');

  const { httpServer, httpsServer, webpackDevMiddleware } = serverStart(webpackCompiler);

  webpackDMInstance = webpackDevMiddleware;

  sseHttpServer = httpServer;
  sseHttpsServer = httpsServer;
};

// Monitor development configuration changes
// TODO: Create regex using component cfg file object?
const compsBlocksFileRegEx = new RegExp(
  '^src/(components|blocks)/[a-zA-Z0-9-_]+/src/((variations|metadata).json|(ssr.)?(view|editor).(jsx|js)|template.hbs|(index|render).php|style.s?css)',
  'i'
);

const themesPluginsFileRegEx = new RegExp(
  '^src/(themes|plugins)/[a-zA-Z0-9-_]+/src/((view|editor).(jsx|js)|style.s?css)',
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
  .on('ready', async () => {
    console.log('[chokidar] Monitoring development configuration...');
    await startWebPack();
  });

// Handle termination of process
process.on('SIGINT', async () => {
  console.log('');
  console.log('[develop] Cleaning up before interrupt signal...');

  await sseHttpServer?.destroy();
  await sseHttpsServer?.destroy();

  if (restartTO) clearTimeout(restartTO);

  if (whiteboardProcess?.kill()) console.log('[develop] App server process terminated');

  webpackDMInstance?.close(function () {
    console.log('[webpack] Stopped.');
    devMonitor?.close().then(() => {
      console.log('[chokidar] Closed.');
      console.log('[develop] Exiting cleanly...');
      process.exit();
    });
  });
});
