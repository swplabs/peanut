const { spawn } = require('child_process');
const webpack = require('webpack');
const chokidar = require('chokidar');
const path = require('path');
const { srcDirectories } = require('./shared/src.directory.entry.map.js');
const {
  getConfig,
  handler: webpackHandler,
  webpackPreProcess,
  webpackPostProcess,
  plugins: { postprocess: postProcessPlugin },
  routeInfo
} = require('./build/webpack/index.js');
const { serverStart } = require('./build/server/index.js');

let webpackCompiler;
let restartBuildTimeout;
let chokidarReady = false;
let devMiddlewareInstance;
let restartDev = true;
let sseHttpServer;
let sseHttpsServer;

let buildStatus = {};
let buildHashes = {};

let whiteBoardProcess;

// start whiteboard node process
const startWhiteBoardServer = () => {
  console.log('[develop] Starting Whiteboard server...');

  whiteBoardProcess = spawn('node', ['./whiteboard.js']);

  whiteBoardProcess.on('spawn', () => {
    console.log('[develop] Whiteboard server started.', '\n');

    buildStatus['process'] = true;

    if (checkBuildStatus()) {
      chokidarReady = true;
      restartDev = false;
    }
  });

  whiteBoardProcess.stdout.on('data', (data) => {
    console.log(data.toString().trim());
  });

  whiteBoardProcess.stderr.on('data', (data) => {
    console.log(data.toString().trim());
  });

  whiteBoardProcess.on('error', (error) => {
    console.log(`[develop] Server process error: ${error.message}`);
  });
};

const restartBuild = () => {
  buildHashes = {};

  devMiddlewareInstance?.close(async () => {
    whiteBoardProcess?.kill();

    console.log('[chokidar] Development configuration updated. Restarting build process..');

    restartBuildTimeout = setTimeout(async () => {
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
      whiteBoardProcess?.kill();
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

  const config = Object.keys(srcDirectories).reduce((configData, srcType) => {
    const {
      buildTypes,
      webpack: { configPresets }
    } = srcDirectories[srcType];

    buildTypes.forEach((buildType) => {
      configData.push(getConfig({ buildType, srcType, ...configPresets }));
    });

    return configData;
  }, []);

  webpackCompiler = webpack(config);

  postProcessPlugin(({ stats }) => {
    webpackPostProcess({ stats, routeInfo });
    webpackCallback(null, stats);
  }).apply(webpackCompiler);

  await sseHttpServer?.destroy();
  await sseHttpsServer?.destroy();

  console.log(`\n[develop] Starting development SSE server...`);

  const { httpServer, httpsServer, webpackDevMiddleware } = serverStart(webpackCompiler);

  devMiddlewareInstance = webpackDevMiddleware;

  sseHttpServer = httpServer;
  sseHttpsServer = httpsServer;
};

// Monitor development configuration changes
// TODO: Create regex using component cfg file object?
const compsBlocksFileRegEx = new RegExp(
  '^src/(components|blocks)/[a-zA-Z0-9-_]+/src/((variations|metadata).json|(ssr.)?(view|editor).(jsx|js)|(index|render).php|style.s?css)',
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
    console.log(`\n[chokidar] Monitoring development configuration...`);
    await startWebPack();
  });

// Handle termination of process
process.on('SIGINT', async () => {
  console.log('');
  console.log('[develop] Cleaning up before interrupt signal...');

  await sseHttpServer?.destroy();
  await sseHttpsServer?.destroy();

  if (restartBuildTimeout) clearTimeout(restartBuildTimeout);

  if (whiteBoardProcess?.kill()) console.log('[develop] App server process terminated');

  devMiddlewareInstance?.close(function () {
    console.log('[webpack] Stopped.');
    devMonitor?.close().then(() => {
      console.log('[chokidar] Closed.');
      console.log('[develop] Exiting cleanly...');
      process.exit();
    });
  });
});
