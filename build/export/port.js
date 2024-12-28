const fs = require('fs');
const { srcDirectoryEntryMap } = require('../../shared/src.dir.map.js');

// TODO: Pull in WordPress path
module.exports = ({ exportType, components, srcPath, wpPath }) => {
  if (!wpPath) {
    console.log(`[build:export:port] No WordPress export path defined.`);
    return;
  }

  console.log(`[build:export:port] Porting components to ${exportType}:`, components);

  components.map((component) => {
    const portPath = `${wpPath}/components/${component}`;
    const compSrcDir = `${srcPath}/components/${component}`;

    try {
      fs.mkdirSync(portPath, { recursive: true });
    } catch (e) {
      console.log('[build:export:port] error:', e?.message);
      return;
    }

    Object.keys(srcDirectoryEntryMap).map((key) => {
      const { exportConfig } = srcDirectoryEntryMap[key];

      const fileName = key;

      const cfg = exportConfig?.[exportType];
      const portCfg = cfg?.port;
      const file = `${compSrcDir}/${fileName}`;

      if (!portCfg?.enabled || !fs.existsSync(file)) return;

      console.log('[build:export:port] Porting:', component, '/', fileName);

      // TODO: Check if file arlready exists and if so prompt to overwrite
      // TODO: Replace require statements in model.js and view.js for component NPM package

      try {
        fs.copyFileSync(file, `${portPath}/${fileName}`);
      } catch (e) {
        console.log('[build:export:port] error:', e?.message);
      }
    });

    console.log(`[build:export:port] WordPress files ported to: ${portPath}`);
  });
};
