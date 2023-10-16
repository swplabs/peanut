const http = require('http');
const https = require('https');
const { readFileSync } = require('fs');
const { debug: log } = require('../shared/utils.js');

const createServer = ({ env, port, httpsPort, requestHandler }) => {
  const server = http.createServer({}, requestHandler);

  server.listen(port, function () {
    log('[server]', 'App running on http://localhost:' + port);
    log('[server]', 'Environment set to: ' + env);
  });

  if (httpsPort) {
    const httpsServer = https.createServer(
      {
        key: readFileSync('./certs/localhost.key.pem'),
        cert: readFileSync('./certs/localhost.cert.pem'),
        allowHTTP1: true
      },
      requestHandler
    );

    httpsServer.listen(httpsPort, function () {
      log('[server]', 'HTTPS is enabled and running on https://localhost:' + httpsPort);
    });
  }
};

module.exports = {
  createServer
};
