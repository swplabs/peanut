const nodePath = require('path');
const envVars = require('./envvars.js');
const {
  engines: { node: nodeVersion },
  dependencies,
  version
} = require('../package.json');

const nodeEnv = envVars.get('NODE_ENV') || 'production';
const rootDir = nodePath.resolve(__dirname, '../');
const serverSideEventHost = `${envVars.get('PFWP_SSE_HOST')}:${envVars.get('PFWP_SSE_PORT')}`;
const serverSideEventTimeout = 10000;
const debugModeInterval = 2000;
const appSrcPath = envVars.get('PFWP_APP_SRC_PATH');
const directoryEntrySrcPath = envVars.get('PFWP_DIR_ENT_SRC_PATH');

// TODO: define env var for this
const isDebugMode = () => false;

const enableWhiteboard = () => envVars.getBoolean('PFWP_ENABLE_WB') === true;
const enableHMR = () =>
  envVars.getBoolean('PFWP_ENABLE_HMR') === true && envVars.getBoolean('PFWP_SECONDARY') !== true;

const hotRefreshEnabled = (srcType) =>
  enableHMR() && nodeEnv === 'development' && ['blocks', 'plugins'].includes(srcType);

const isWebTarget = ({ buildType }) => !['server'].includes(buildType);

const isHotRefreshEntry = ({ srcType, entryKey }) =>
  enableHMR() &&
  nodeEnv === 'development' &&
  ['blocks', 'plugins'].includes(srcType) &&
  ['editor'].includes(entryKey);

const getHotMiddlewareEntry = ({ srcType, buildType }) =>
  `webpack-hot-middleware/client?name=${srcType}_${buildType}&timeout=${serverSideEventTimeout}&path=${encodeURIComponent(
    `${serverSideEventHost}/__webpack_hmr`
  )}`;

const getAppSrcPath = (srcType) => {
  return srcType === 'whiteboard' ? `${rootDir}/src` : appSrcPath;
};

const getDirectoryEntrySrcPath = (srcType) =>
  srcType === 'whiteboard' ? '' : directoryEntrySrcPath;

const isCoreDev = () => envVars.getBoolean('PFWP_CORE_DEV') === true;

const isCLI = () => envVars.getBoolean('PFWP_IS_CLI') === true;

module.exports = {
  hotRefreshEnabled,
  isWebTarget,
  isHotRefreshEntry,
  getHotMiddlewareEntry,
  getAppSrcPath,
  getDirectoryEntrySrcPath,
  isCoreDev,
  isCLI,
  isDebugMode,
  enableWhiteboard,
  enableHMR,
  corejs: parseFloat(dependencies['core-js']),
  node: process.version
    ? `${parseFloat(process.version.replace('v', ''))}`
    : parseFloat(nodeVersion.replace(/[\=\>\<]/g, '')),
  browsers: ['last 2 versions, not dead'],
  version,
  appSrcPath,
  directoryEntrySrcPath,
  rootDir,
  debugModeInterval
};
