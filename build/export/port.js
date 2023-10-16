const fs = require('fs');
const { srcDirEntMap } = require('../../config/src.dir.map.js');

// TODO: Pull in Wordpress path
module.exports = ({ exportType, components, srcPath, wpPath }) => {
  if (!wpPath) {
    console.log(`[build:export:port] No Wordpress export path defined.`);
    return;
  }

  console.log(`[build:export:port] Porting components to ${exportType}:`, components);

  components.map((component) => {
    const portPath = `${wpPath}/app/components/${component}`;
    const compSrcDir = `${srcPath}/components/${component}/src`;

    try {
      fs.mkdirSync(portPath, { recursive: true });
    } catch (e) {
      console.log('[build:export:port] error:', e?.message);
      return;
    }

    Object.keys(srcDirEntMap).map((key) => {
      const { exportCfg } = srcDirEntMap[key];

      const fileName = key;

      const cfg = exportCfg?.[exportType];
      const portCfg = cfg?.port;
      const file = `${compSrcDir}/${fileName}`;

      if (!portCfg?.enabled || !fs.existsSync(file)) return;

      console.log('[build:export:port] Porting:', component, '/', fileName);

      // TODO: Check if file arlready exists and if so prompt to overwrite
      // TODO: Replace require statements in model.js and client.js for component NPM package

      try {
        fs.copyFileSync(file, `${portPath}/${fileName}`);
      } catch (e) {
        console.log('[build:export:port] error:', e?.message);
      }
    });

    console.log(`[build:export:port] Wordpress files ported to: ${portPath}`);
  });
};
