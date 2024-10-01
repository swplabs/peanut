module.exports = (path) => {
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
