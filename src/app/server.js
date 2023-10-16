/* global __ROUTES__ */

const envVars = require('../../config/envvars.js');
const router = require('./lib/router.js');
const { createServer } = require('./lib/servers.js');
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
} = require('./middleware/index.js');

const staticFiles = serveStatic(`./dist/${envVars.get('PEANUT_DIST')}/static`, {
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

const serverStart = (chunkgroups) => {
  cntrls.utils.setChunkGroups(chunkgroups);

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
