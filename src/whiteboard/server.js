/* global __ROUTES__ */

const envVars = require('../../shared/envvars.js');
const router = require('../../shared/server/lib/router.js');
const { createServer } = require('../../shared/server/create.js');
const environment = envVars.get('ENVIRONMENT');
const isLocal = environment === 'local';
const minorSeconds = isLocal ? 0 : 60;
const majorSeconds = isLocal ? 0 : 31536000;

// TODO: Do we need this now that routes can be part of pfwp.json file?
const routes = __ROUTES__;

const cntrls = {
  base: require('./controllers/base.js'),
  app: require('./controllers/app.js'),
  utils: require('./controllers/lib/utils.js')
};

const {
  default: defaultRequests,
  health: healthCheck,
  serveStatic
} = require('../../shared/server/middleware/index.js');

// Set up route controllers
const routeController = (route) => {
  const { controller: routeCntrl = 'base' } = route;

  return cntrls[routeCntrl].controller({ route, routes });
};

const serverStart = ({ appConfig, pfwpConfig, rootDir }) => {
  const staticFiles = serveStatic(`${rootDir}/dist/${envVars.get('PFWP_DIST')}/static`, {
    minorSeconds,
    majorSeconds
  });

  const exportFiles = isLocal
    ? serveStatic(`${rootDir}/dist/export`, {
        minorSeconds,
        majorSeconds,
        basePath: '/exports'
      })
    : async (_req, _res, next) => {
        await next();
      };

  cntrls.utils.setConfigs(appConfig, pfwpConfig);

  routes.forEach((route) => router.get(route.url, routeController(route)));

  createServer({
    port: envVars.get('PFWP_WB_PORT') || 5000,
    env: environment,
    httpsPort: envVars.getBoolean('PFWP_WB_ENABLE_HTTPS')
      ? envVars.get('PFWP_WB_HTTPS_PORT') || 9000
      : null,
    requestHandler: (req, res) => {
      req.defaultRouter = router;
      req.cacheTimings = {
        minorSeconds,
        majorSeconds
      };

      staticFiles(req, res, () =>
        exportFiles(req, res, () => healthCheck(req, res, () => defaultRequests(req, res)))
      );
    }
  });
};

module.exports = {
  serverStart
};
