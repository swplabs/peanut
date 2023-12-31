const http = require('http');
const https = require('https');
const { readFileSync } = require('fs');

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
    console.log(`[server] App runing on http://localhost:${port}`);
    console.log('[server]', 'Environment set to: ' + env);
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
      console.log('[server]', 'HTTPS is enabled and running on https://localhost:' + httpsPort);
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
