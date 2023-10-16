const path = require('path');
const baseAppRouteDir = '../src/app/base/routes/';
const baseAppRoutePath = path.join(__dirname, baseAppRouteDir);

const baseRoutes = {
  app: [
    {
      url: '/',
      title: 'App',
      id: 'base_app',
      srcPath: baseAppRoutePath,
      path: 'app',
      type: 'base',
      srcType: 'app',
      controller: 'app'
    },
    {
      url: '/schema/(?<id>[^/]+)?/?',
      title: 'Schema Control',
      id: 'base_schema',
      srcPath: baseAppRoutePath,
      path: 'schema',
      type: 'base',
      srcType: 'app',
      controller: 'schema'
    },
    {
      url: '/page/home/',
      title: 'Home',
      id: 'base_home',
      srcPath: baseAppRoutePath,
      path: 'home',
      type: 'base',
      srcType: 'app',
      controller: 'base'
    }
  ]
};

const baseEntries = {
  elements: {
    export: {
      wordpress: {
        import: `./src/app/base/exports/wordpress.js`
      }
    },
    build: {
      app: {
        hbs_prototype: {
          import: './src/app/base/routes/prototype/client.js',
          library: {
            type: 'window',
            name: 'peanutHbsPrototypeClientJs'
          }
        }
      }
    }
  },
  server: {
    build: {
      app: {
        server: {
          import: './src/app/server.js'
        },
        hbs_prototype: {
          import: './src/app/base/routes/prototype/index.hbs'
        }
      }
    }
  }
};

module.exports = {
  baseRoutes,
  baseEntries
};
