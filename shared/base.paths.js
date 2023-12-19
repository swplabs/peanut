const baseRoutes = {
  server: {
    whiteboard: [
      {
        url: '/',
        title: 'Whiteboard',
        type: 'base',
        controller: 'app',
        path: 'app'
      },
      {
        url: '/schema/(?<id>[^/]+)?/?',
        title: 'Schema Control',
        type: 'base',
        controller: 'schema',
        path: 'schema'
      },
      {
        url: '/page/home/',
        title: 'Home',
        type: 'base',
        controller: 'base',
        path: 'home'
      }
    ]
  }
};

const baseEntries = {
  elements: {
    export: {
      /*
      wordpress: {
        import: `./src/whiteboard/base/exports/wordpress.js`
      }
      */
    },
    build: {}
  },
  server: {
    build: {
      whiteboard: {
        server: {
          import: './src/whiteboard/server.js'
        }
      }
    }
  }
};

module.exports = {
  baseRoutes,
  baseEntries
};
