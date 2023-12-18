// TODO: rename this file whiteboard.js

const path = require('path');
const envVars = require('./shared/envvars.js');
const distPath = path.join(__dirname, `./dist/${envVars.get('PFWP_DIST')}`);
const appAssetsPath = distPath + '/static/assets';
const wordpressRoot = envVars.get('PFWP_WP_ROOT');
const wordpressAssetsPath = `${wordpressRoot}/.assets`;
const serverPath = distPath + '/server';

/* TODO: use pfwp.json instead
const clientChunkGroups = {
  app: require(`${appAssetsPath}/app/chunkgroups.json`),
  blocks: require(`${wordpressAssetsPath}/blocks/chunkgroups.json`),
  components: require(`${wordpressAssetsPath}/components/chunkgroups.json`),
  plugins: require(`${wordpressAssetsPath}/plugins/chunkgroups.json`)
};
*/

const { serverStart } = require(serverPath + '/server.js');

(async () => {
  // await serverStart(clientChunkGroups);
})();
