const { getGzipData } = require('../lib/gzip.js');

module.exports = async (req, res) => {
  const {
    defaultRouter,
    cacheTimings: { minorSeconds }
  } = req;
  const route = defaultRouter.match(req);
  const acceptEncoding =
    req && req.headers && typeof req.headers['accept-encoding'] === 'string'
      ? req.headers['accept-encoding']
      : '';
  const status = route !== null && typeof route.handler === 'function' ? 200 : 404;

  // Compressed response
  if (status === 200) {
    const { headers = {}, content = '' } = getGzipData({
      acceptEncoding,
      content: await route.handler({ req })
    });

    res.writeHead(status, {
      'Content-Type': 'text/html',
      'Cache-Control': `max-age=${minorSeconds}`,
      ...headers
    });
    res.end(content);
  } else {
    res.writeHead(404, {
      'Content-Type': 'application/json'
    });

    const response = {
      status: 404
    };

    res.end(JSON.stringify(response));
  }
};
