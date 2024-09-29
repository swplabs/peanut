process.env.PFWP_CMD = 'develop';

// Validate Config
require('./shared/utils.js').validateEnvVarConfig(require('./shared/envvars.js'));

const { spawn } = require('child_process');
const fs = require('fs');
const webpack = require('webpack');
const chokidar = require('chokidar');
const {
  handler: webpackHandler,
  webpackPreProcess,
  webpackPostProcess,
  plugins: { postprocess: postProcessPlugin },
  routeInfo,
  getConfigs
} = require('./build/webpack/index.js');
const { serverStart } = require('./build/server/index.js');
const {
  appSrcPath,
  directoryEntrySrcPath,
  rootDir,
  enableWhiteboard,
  enableHMR,
  isDebugMode,
  debugModeInterval
} = require('./shared/definitions.js');
const { srcDirectories } = require('./shared/src.directory.entry.map.js');

if (isDebugMode()) {
  setInterval(() => {
    console.log(`\nDebug Memory Usage:\n${JSON.stringify(process.memoryUsage())}`);
    console.log(
      `Currently using ${Math.floor(process.memoryUsage().heapUsed / 1024 / 1024)} MB of memory.\n`
    );
  }, debugModeInterval);
}

let webpackCompiler;
let webpackWatch;
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
  const setStatus = () => {
    buildStatus['process'] = true;

    if (checkBuildStatus()) {
      chokidarReady = true;
      restartDev = false;
    }
  };

  if (!enableWhiteboard()) {
    setStatus();
    return;
  }

  console.log('[develop] Starting Whiteboard server...');

  whiteBoardProcess = spawn('node', [`${rootDir}/whiteboard.js`]);

  whiteBoardProcess.on('spawn', () => {
    console.log('[develop] Whiteboard server started.', '\n');

    setStatus();
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

  const onWebpackClose = async () => {
    whiteBoardProcess?.kill();

    console.log('[chokidar] Development configuration updated. Restarting build process..');

    restartBuildTimeout = setTimeout(async () => {
      resetBuildStatus();

      await startWebPack();
    }, 1000);
  };

  if (devMiddlewareInstance) {
    devMiddlewareInstance.close(onWebpackClose);
  } else if (webpackWatch) {
    webpackWatch.close(onWebpackClose);
  }
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
    compileType: 'develop',
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
    },
    showStats: !enableHMR()
  })(err, stats);
};

// Start webpack watch
const startWebPack = async () => {
  console.log('[develop] Starting elements and server compilation and watch...');

  webpackPreProcess({ srcDir: appSrcPath });

  webpackCompiler = webpack(getConfigs());

  postProcessPlugin(({ stats }) => {
    webpackPostProcess({ stats, routeInfo });
    webpackCallback(null, stats);
  }).apply(webpackCompiler);

  if (enableHMR()) {
    await sseHttpServer?.destroy();
    await sseHttpsServer?.destroy();

    console.log(`\n[develop] Starting development SSE server...`);

    const { httpServer, httpsServer, webpackDevMiddleware } = serverStart(webpackCompiler);

    devMiddlewareInstance = webpackDevMiddleware;

    sseHttpServer = httpServer;
    sseHttpsServer = httpsServer;
  } else {
    webpackWatch = webpackCompiler.watch({}, () => {});
  }
};

// Monitor development configuration changes
// TODO: Create regex using component cfg file object?
// TODO: add peanut folder paths if core development is enabled
const watchPaths = Object.keys(srcDirectories)
  .filter((key) => fs.existsSync(`${appSrcPath}/${key}`))
  .reduce((paths, currentKey) => {
    paths.push(`${appSrcPath}/${currentKey}`);

    return paths;
  }, []);

if (watchPaths.length <= 0) {
  throw new Error('No element source folders could be found.');
}

const compsBlocksFileRegEx = new RegExp(
  `^${appSrcPath}/(components|blocks)/[a-zA-Z0-9-_]+${directoryEntrySrcPath}/((variations|metadata).json|(ssr.)?(view|editor).(jsx|js)|(index|render).php|style.s?css)`,
  'i'
);

const themesPluginsFileRegEx = new RegExp(
  `^${appSrcPath}/(themes|plugins)/[a-zA-Z0-9-_]+${directoryEntrySrcPath}/((view|editor).(jsx|js)|style.s?css)`,
  'i'
);

const commonDirRegEx = new RegExp(
  `^${appSrcPath}/(components|blocks|plugins|themes)/[a-zA-Z0-9-_]+$`,
  'i'
);

const devMonitor = chokidar
  .watch(watchPaths)
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
  console.log(`\n[develop] Cleaning up before interrupt signal...`);

  if (restartBuildTimeout) clearTimeout(restartBuildTimeout);

  if (whiteBoardProcess?.kill()) console.log('[develop] App server process terminated');

  const onWebpackClose = () => {
    console.log('[webpack] Stopped.');
    devMonitor?.close().then(() => {
      console.log('[chokidar] Closed.');
      console.log('[develop] Exiting cleanly...');
      process.exit();
    });
  };

  if (devMiddlewareInstance) {
    await sseHttpServer?.destroy();
    await sseHttpsServer?.destroy();

    devMiddlewareInstance.close(onWebpackClose);
  } else if (webpackWatch) {
    webpackWatch.close(onWebpackClose);
  }
});
