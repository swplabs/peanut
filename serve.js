const path = require('path');
const envVars = require('./config/envvars.js');
const distPath = path.join(__dirname, `./dist/${envVars.get('PEANUT_DIST')}`);
const appAssetsPath = distPath + '/static/assets';
const wordpressRoot = envVars.get('PEANUT_WP_ROOT');
const wordpressAssetsPath = `${wordpressRoot}/.assets`;
const serverPath = distPath + '/server';

const clientChunkGroups = {
  app: require(`${appAssetsPath}/app/chunkgroups.json`),
  blocks: require(`${wordpressAssetsPath}/blocks/chunkgroups.json`),
  components: require(`${wordpressAssetsPath}/components/chunkgroups.json`),
  plugins: require(`${wordpressAssetsPath}/plugins/chunkgroups.json`)
};

const { serverStart } = require(serverPath + '/server.js');

(async () => {
  await serverStart(clientChunkGroups);
})();
