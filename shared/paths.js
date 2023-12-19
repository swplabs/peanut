const path = require('path');
const baseWbRouteDir = '../src/whiteboard/base/routes/';
const baseWbRoutePath = path.join(__dirname, baseWbRouteDir);

const baseRoutes = {
  whiteboard: [
    {
      url: '/',
      title: 'Whiteboard',
      id: 'base_whiteboard',
      srcPath: baseWbRoutePath,
      path: 'app',
      type: 'base',
      srcType: 'whiteboard',
      buildType: 'elements',
      controller: 'app'
    },
    {
      url: '/schema/(?<id>[^/]+)?/?',
      title: 'Schema Control',
      id: 'base_schema',
      srcPath: baseWbRoutePath,
      path: 'schema',
      type: 'base',
      srcType: 'whiteboard',
      buildType: 'elements',
      controller: 'schema'
    },
    {
      url: '/page/home/',
      title: 'Home',
      id: 'base_home',
      srcPath: baseWbRoutePath,
      path: 'home',
      type: 'base',
      srcType: 'whiteboard',
      buildType: 'elements',
      controller: 'base'
    }
  ]
};

// TODO: remove HBS files and replace with whiteboard react files
const baseEntries = {
  elements: {
    export: {
      wordpress: {
        import: `./src/whiteboard/base/exports/wordpress.js`
      }
    },
    build: {
      whiteboard: {
        hbs_prototype: {
          import: './src/whiteboard/base/routes/prototype/view.js',
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
      whiteboard: {
        server: {
          import: './src/whiteboard/server.js'
        },
        hbs_prototype: {
          import: './src/whiteboard/base/routes/prototype/index.hbs'
        }
      }
    }
  }
};

module.exports = {
  baseRoutes,
  baseEntries
};
