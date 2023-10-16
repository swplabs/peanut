/* global __APP_VERSION__ */

module.exports = async (req, res, next) => {
  if (req.url === '/_healthcheck') {
    res.writeHead(200, {
      'content-type': 'application/json'
    });

    res.end(
      JSON.stringify({
        version: __APP_VERSION__
      })
    );
  } else {
    await next();
  }
};
