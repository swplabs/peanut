const http = require('http');
const https = require('https');
const { readFileSync } = require('fs');
const { debug: log } = require('../../src/whiteboard/shared/utils.js');

const extendServer = (server) => {
  const connections = {};

  server.on('connection', (conn) => {
    const key = conn.remoteAddress + ':' + conn.remotePort;
    connections[key] = conn;
    conn.on('close', () => {
      delete connections[key];
    });
  });

  server.destroy = () => {
    // server.close(cb);
    Object.keys(connections).forEach((key) => {
      connections[key].destroy();
    });

    return new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };
};

const createServer = ({ env, port, httpsPort, requestHandler }) => {
  let httpsServer;

  const httpServer = http.createServer({}, requestHandler);

  httpServer.listen(port, () => {
    log('[server]', 'App running on http://localhost:' + port);
    log('[server]', 'Environment set to: ' + env);
  });

  extendServer(httpServer);

  if (httpsPort) {
    httpsServer = https.createServer(
      {
        key: readFileSync('./certs/localhost.key.pem'),
        cert: readFileSync('./certs/localhost.cert.pem'),
        allowHTTP1: true
      },
      requestHandler
    );

    httpsServer.listen(httpsPort, () => {
      log('[server]', 'HTTPS is enabled and running on https://localhost:' + httpsPort);
    });

    extendServer(httpsServer);
  }

  return {
    httpServer,
    httpsServer
  };
};

module.exports = {
  createServer
};
