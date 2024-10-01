const { rootDir, isCoreDev } = require('./definitions.js');

const baseRoutes = isCoreDev()
  ? {
      elements: {
        plugins: [
          {
            url: '/elements/plugins/peanut',
            title: 'peanut',
            id: 'plugins_peanut',
            srcPath: `${rootDir}/src/plugins/peanut`,
            path: 'peanut',
            type: 'element',
            srcType: 'plugins',
            buildType: 'elements',
            initialData: {}
          }
        ]
      },
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
    }
  : {};

const baseEntries = isCoreDev()
  ? {
      elements: {
        export: {},
        build: {
          components: {
            pfwp_sdk: {
              import: `${rootDir}/src/plugins/peanut/sdk.js`,
              library: {
                type: 'window',
                name: ['pfwpInitialize']
              }
            }
          }
        }
      },
      server: {
        build: {
          whiteboard: {
            server: {
              import: `${rootDir}/src/whiteboard/server.js`
            }
          }
        }
      }
    }
  : {};

module.exports = {
  baseRoutes,
  baseEntries
};
