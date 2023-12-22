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
