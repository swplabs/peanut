const { debug: log } = require('../../src/whiteboard/shared/utils.js');
const parseUrl = require('../lib/parse-url.js');
const { getGzipData } = require('../lib/gzip.js');
const { resolve, extname } = require('path');
const fs = require('fs');

const allowedMimes = {
  woff: 'application/font-woff',
  woff2: 'application/font-woff2',
  js: 'application/javascript',
  json: 'application/json',
  map: 'application/json',
  xml: 'application/xml',
  otf: 'font/otf',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  css: 'text/css',
  html: 'text/html',
  txt: 'text/plain',
  eot: 'application/vnd.ms-fontobject"',
  ttf: 'application/x-font-ttf',
  ico: 'image/x-icon',
  xsl: 'text/xsl'
};

const serveStatic = (root, options) => {
  if (!root) {
    throw new TypeError('root path required');
  }

  if (typeof root !== 'string') {
    throw new TypeError('root path must be a string');
  }

  // copy options object
  let opts = {
    ...options
  };

  // setup options for send
  opts.root = resolve(root);

  return async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // method not allowed
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, HEAD');
      res.setHeader('Content-Length', '0');
      res.end();
      return;
    }

    const originalUrl = parseUrl.original(req),
      acceptEncoding =
        req && req.headers && typeof req.headers['accept-encoding'] === 'string'
          ? req.headers['accept-encoding']
          : '';

    let path = parseUrl(req).pathname;

    const { basePath } = opts;

    if (basePath) path = path.replace(basePath, '');

    // make sure redirect occurs at mount
    if (path === '/' && originalUrl.pathname.substr(-1) !== '/') {
      path = '';
    }

    const file = opts.root + collapseLeadingSlashes(path);

    try {
      const ext = extname(file);

      if (!(typeof ext === 'string' && ext.length > 0)) {
        throw new TypeError('Static request is a directory and not a file');
      }

      const mime =
        typeof allowedMimes[ext.substring(1)] !== 'undefined'
          ? allowedMimes[ext.substring(1)]
          : null;

      if (mime === null) {
        // throw new Error('File not supported: ' + path);
        log(`[server:static:${opts.root}] File not supported:`, path);

        await next();

        return;
      } else {
        const stat = fs.statSync(file);

        if (stat.isDirectory()) {
          throw new TypeError('Static request is a directory and not a file');
        }

        let data = fs.readFileSync(file);

        let headers = {
          'content-length': stat.size,
          'last-modified': stat.mtime.toUTCString(),
          'access-control-allow-origin': '*',
          'content-type': mime,
          'cache-control': 'max-age=' + opts.majorSeconds
        };

        // if css or js compress
        if (['application/javascript', 'text/css'].includes(mime)) {
          const { headers: gzHeaders = {}, content = '' } = getGzipData({
            acceptEncoding,
            content: data
          });

          data = content;

          headers = {
            ...headers,
            ...gzHeaders,
            'content-length': Buffer.byteLength(data)
          };
        }

        res.writeHead(200, headers);
        res.end(data);
      }
    } catch (e) {
      if (e.code && e.code === 'ENOENT') {
        if (typeof next !== 'function') log('[server:static]', opts.root, 'File not found', path);
      } else if (!(e instanceof TypeError)) {
        log('[server:static]', opts.root, 'Error caught:', e.message);
      }

      await next();
      return;
    }
  };
};

const collapseLeadingSlashes = (str) => {
  let i;

  for (i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) !== 0x2f) {
      break;
    }
  }

  return i > 1 ? '/' + str.substr(i) : str;
};

module.exports = serveStatic;
