/* global __ROUTES__ */

const envVars = require('../../shared/envvars.js');
const router = require('../../shared/server/lib/router.js');
const { createServer } = require('../../shared/server/lib/servers.js');
const environment = envVars.get('ENVIRONMENT');
const isLocal = environment === 'local';
const minorSeconds = isLocal ? 0 : 60;
const majorSeconds = isLocal ? 0 : 31536000;

const routes = __ROUTES__;

const cntrls = {
  default: require('./controllers/default.js'),
  schema: require('./controllers/schema.js'),
  base: require('./controllers/base.js'),
  app: require('./controllers/app.js'),
  utils: require('./controllers/lib/utils.js')
};

const {
  default: defaultRequests,
  health: healthCheck,
  serveStatic
} = require('../../shared/server/middleware/index.js');

const staticFiles = serveStatic(`./dist/${envVars.get('PFWP_DIST')}/static`, {
  minorSeconds,
  majorSeconds
});

const exportFiles = isLocal
  ? serveStatic(`./dist/export`, {
      minorSeconds,
      majorSeconds,
      basePath: '/exports'
    })
  : async (_req, _res, next) => {
      await next();
    };

// Set up route controllers
const routeController = (route) => {
  const { controller: routeCntrl = 'default' } = route;

  return cntrls[routeCntrl].controller({ route, routes });
};

const useMiddleware = (req, res) => {
  staticFiles(req, res, () =>
    exportFiles(req, res, () => healthCheck(req, res, () => defaultRequests(req, res)))
  );
};

const serverStart = (config) => {
  cntrls.utils.setConfig(config);

  routes.forEach((route) => router.get(route.url, routeController(route)));

  createServer({
    port: envVars.get('PORT') || 8080,
    env: environment,
    httpsPort: envVars.getBoolean('ENABLE_HTTPS') ? envVars.get('HTTPS_PORT') || 9090 : null,
    requestHandler: (req, res) => {
      req.defaultRouter = router;
      req.cacheTimings = {
        minorSeconds,
        majorSeconds
      };
      useMiddleware(req, res);
    }
  });
};

module.exports = {
  serverStart
};
