// TODO: inject app version by passing options in and returning the 'async' function
module.exports = async (req, res, next) => {
  if (req.url === '/_healthcheck') {
    res.writeHead(200, {
      'content-type': 'application/json'
    });

    res.end(
      JSON.stringify({
        version: ''
      })
    );
  } else {
    await next();
  }
};
