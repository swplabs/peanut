const whm = require('webpack-hot-middleware');
const wdm = require('webpack-dev-middleware');
const envVars = require('../../shared/envvars.js');
const router = require('../../shared/server/lib/router.js');
const { createServer } = require('../../shared/server/create.js');
const environment = envVars.get('ENVIRONMENT');
const isLocal = environment === 'local';
const minorSeconds = isLocal ? 0 : 60;
const majorSeconds = isLocal ? 0 : 31536000;

const routes = [];

const cntrls = {
  default: ({ _route, _routes }) => {
    return async ({ req }) => {
      return req.url || '';
    };
  }
};

const {
  sse: defaultRequests,
  health: healthCheck
} = require('../../shared/server/middleware/index.js');

// Set up route controllers
const routeController = (route) => {
  const { controller: routeCntrl = 'default' } = route;

  return cntrls[routeCntrl].controller({ route, routes });
};

const useMiddleware = (req, res) => {
  healthCheck(req, res, () => defaultRequests(req, res));
};

const serverStart = (webpackCompiler) => {
  routes.forEach((route) => router.get(route.url, routeController(route)));

  const webpackDevMiddleware = wdm(webpackCompiler, {
    writeToDisk: true,
    stats: {
      all: false,
      colors: true,
      assets: true,
      warnings: true,
      errors: true,
      logging: 'info',
      groupAssetsByExtension: true,
      groupAssetsByEmitStatus: true
    }
  });

  const webpackHotMiddleware = whm(webpackCompiler, {
    path: '/__webpack_hmr',
    log: false
  });

  const servers = createServer({
    port: envVars.get('PFWP_SSE_PORT') || 5050,
    env: environment,
    httpsPort: envVars.getBoolean('PFWP_SSE_ENABLE_HTTPS')
      ? envVars.get('PFWP_SSE_HTTPS_PORT') || 9090
      : null,
    requestHandler: async (req, res) => {
      req.defaultRouter = router;
      req.cacheTimings = {
        minorSeconds,
        majorSeconds
      };

      webpackDevMiddleware(req, res, () =>
        webpackHotMiddleware(req, res, () => useMiddleware(req, res))
      );
    }
  });

  return {
    ...servers,
    webpackDevMiddleware
  };
};

module.exports = {
  serverStart
};
