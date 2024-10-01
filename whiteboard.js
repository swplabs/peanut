const path = require('path');
const envVars = require('./shared/envvars.js');
const { existsSync } = require('fs');
const distPath = path.join(__dirname, `./dist/${envVars.get('PFWP_DIST')}`);
const pfwpThemePath = envVars.get('PFWP_THEME_PATH');
const pfwpWpRoot = envVars.get('PFWP_WP_ROOT');
const serverPath = distPath + '/server';

const config = require(`${pfwpWpRoot}${pfwpThemePath}/pfwp.json`);

if (existsSync(serverPath + '/server.js')) {
  const { serverStart } = require(serverPath + '/server.js');

  (async () => {
    await serverStart(config);
  })();
} else {
  console.log('[whiteboard] server files not found');
}
