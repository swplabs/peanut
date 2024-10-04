const getAppSrcPath = () => process.env.PFWP_APP_SRC_PATH || process.cwd();

const requireConfigFile = (path) => {
  let config;

  try {
    config = require(`${path}`);
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      console.log(e);
    }
  }

  return config;
};

module.exports = {
  getAppSrcPath,
  requireConfigFile
};
