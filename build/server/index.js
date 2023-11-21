const webpackHM = require('webpack-hot-middleware');

const envVars = require('../../shared/envvars.js');
const router = require('../../serve/lib/router.js');
const { createServer } = require('../../serve/lib/servers.js');
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

const { sse: defaultRequests, health: healthCheck } = require('../../serve/middleware/index.js');

// Set up route controllers
const routeController = (route) => {
  const { controller: routeCntrl = 'default' } = route;

  return cntrls[routeCntrl].controller({ route, routes });
};

const useMiddleware = (req, res) => {
  healthCheck(req, res, () => defaultRequests(req, res));
};

const serverStart = (compiler) => {
  routes.forEach((route) => router.get(route.url, routeController(route)));

  return createServer({
    port: envVars.get('SSE_PORT') || 9090,
    env: environment,
    httpsPort: envVars.getBoolean('PFWP_SSE_ENABLE_HTTPS')
      ? envVars.get('SSE_HTTPS_PORT') || 9999
      : null,
    requestHandler: async (req, res) => {
      req.defaultRouter = router;
      req.cacheTimings = {
        minorSeconds,
        majorSeconds
      };

      const whm = webpackHM(compiler, {
        path: '/__webpack_hmr',
        log: false
      });

      whm(req, res, () => useMiddleware(req, res));
    }
  });
};

module.exports = {
  serverStart
};
