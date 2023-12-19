const path = require('path');
const envVars = require('./shared/envvars.js');
const distPath = path.join(__dirname, `./dist/${envVars.get('PFWP_DIST')}`);
const pfwpThemePath = envVars.get('PFWP_THEME_PATH');
const pfwpWpRoot = envVars.get('PFWP_WP_ROOT');
const serverPath = distPath + '/server';

const config = require(`${pfwpWpRoot}${pfwpThemePath}/pfwp.json`);

const { serverStart } = require(serverPath + '/server.js');

(async () => {
  await serverStart(config);
})();
