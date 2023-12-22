const envVars = require('./envvars.js');
const nodeEnv = envVars.get('NODE_ENV') || 'production';
const {
  engines: { node },
  devDependencies
} = require('../package.json');

const hotRefreshEnabled = (srcType) =>
  nodeEnv === 'development' && ['blocks', 'plugins'].includes(srcType);

const isWebTarget = ({ buildType }) => !['server'].includes(buildType);

module.exports = {
  hotRefreshEnabled,
  isWebTarget,
  corejs: parseFloat(devDependencies['core-js']),
  node,
  browsers: ['last 2 versions, not dead']
};
