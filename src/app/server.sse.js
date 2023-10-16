const envVars = require('../../config/envvars.js');
const router = require('./lib/router.js');
const { createServer } = require('./lib/servers.js');
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

const { sse: defaultRequests, health: healthCheck } = require('./middleware/index.js');

// Set up route controllers
const routeController = (route) => {
  const { controller: routeCntrl = 'default' } = route;

  return cntrls[routeCntrl].controller({ route, routes });
};

const useMiddleware = (req, res) => {
  healthCheck(req, res, () => defaultRequests(req, res));
};

const serverStart = (_chunkgroups) => {
  // cntrls.utils.setChunkGroups(chunkgroups);

  routes.forEach((route) => router.get(route.url, routeController(route)));

  createServer({
    port: envVars.get('SSE_PORT') || 9090,
    env: environment,
    httpsPort: envVars.getBoolean('SSE_ENABLE_HTTPS')
      ? envVars.get('SSE_HTTPS_PORT') || 9999
      : null,
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
