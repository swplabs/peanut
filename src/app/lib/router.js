/*
Adapted from: https://raw.githubusercontent.com/creationix/node-router/master/lib/node-router.js
*/
const { debug: log } = require('../shared/utils.js');
const parseUrl = require('./parse-url.js');

let routes = [];

// Adds a route the the current server
const addRoute = (method, pattern, handler, format) => {
  if (typeof pattern === 'string') {
    pattern = new RegExp('^' + pattern + '$', 'i');
  }

  let route = {
    method,
    pattern,
    handler,
    match: {}
  };

  if (format !== undefined) {
    route.format = format;
  }

  routes.push(route);
};

const get = (pattern, handler) => {
  return addRoute('GET', pattern, handler);
};

const post = (pattern, handler, format) => {
  return addRoute('POST', pattern, handler, format);
};

const put = (pattern, handler, format) => {
  return addRoute('PUT', pattern, handler, format);
};

const del = (pattern, handler) => {
  return addRoute('DELETE', pattern, handler);
};

const head = (pattern, handler) => {
  return addRoute('HEAD', pattern, handler);
};

const getRoutes = () => {
  return routes;
};

const match = (req) => {
  const path = parseUrl(req).pathname;

  log('[server:router]', path, req.method);

  let i, l;

  for (i = 0, l = routes.length; i < l; i += 1) {
    let route = routes[i];

    if (req.method === route.method) {
      const match = path.match(route.pattern);

      if (match?.[0]?.length > 0) {
        log('[server:router] Match found:', match[0]);

        if (match[1]) {
          req.locals = req.locals || {};

          req.locals.route = {
            match: match.groups || [...match].splice(-3)
          };
        }

        return route;
      }
    }
  }

  return null;
};

module.exports = {
  get,
  post,
  put,
  del,
  head,
  getRoutes,
  match
};
