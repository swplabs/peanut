const fs = require('fs');
const { extname } = require('path');
const { srcDirEntMap, baseIdPrefix } = require('../../config/src.dir.map.js');

module.exports = ({ exportType, components, srcPath, distPath, disableExtract }) => {
  console.log('[build:export:pack] Creating NPM package component folders for:', exportType);

  const buildTypePaths = {
    client: `${distPath}/static/assets`,
    ssr: `${distPath}/server`,
    server: `${distPath}/server`
  };

  components.map((component) => {
    const packPath = `${distPath}/packed/${component}`;
    const compDir = `${srcPath}/components/${component}`;
    const pkgFile = `${compDir}/package.json`;
    const packModules = [];

    try {
      fs.mkdirSync(packPath, { recursive: true });
      fs.copyFileSync(pkgFile, `${packPath}/package.json`);
    } catch (e) {
      console.log('[build:export:pack] error:', e?.message);
      return;
    }

    const id = `${baseIdPrefix}${component}`;

    Object.keys(srcDirEntMap).map((key) => {
      const { entryKey, exportCfg } = srcDirEntMap[key];

      const filePreName = entryKey ? `${entryKey}_${id}` : id;

      const fileName = `${filePreName}.js`;

      const cfg = exportCfg?.[exportType];
      const packCfg = cfg?.pack;

      if (!packCfg?.enabled) return;

      const exportBuildTypes = cfg?.entry?.buildTypes;

      if (Array.isArray(exportBuildTypes)) {
        exportBuildTypes.forEach((type) => {
          const file = `${buildTypePaths[type]}/${fileName}`;
          const cssFile = `${buildTypePaths[type]}/${filePreName}.css`;
          const {
            destFileName = `${type}.js`,
            moduleNamePrefix = `${entryKey}`,
            css = false
          } = packCfg;

          if (!fs.existsSync(file)) return;

          console.log('[build:export:pack] Packaging:', component, '/', type, '/', fileName);

          try {
            const packFile = `${type}/${destFileName || fileName}`;

            fs.mkdirSync(`${packPath}/${type}`, { recursive: true });
            fs.copyFileSync(file, `${packPath}/${packFile}`);

            if (css && !disableExtract && fs.existsSync(cssFile)) {
              fs.copyFileSync(
                cssFile,
                `${packPath}/${packFile.replace(extname(packFile), '.css')}`
              );
            }

            packModules.push({ id: `${moduleNamePrefix}_${type}`, file: `./${packFile}` });
          } catch (e) {
            console.log('[build:export:pack] error:', e?.message);
          }
        });
      }
    });

    try {
      const indexJs = `module.exports = {\n${packModules
        .reduce((modules, { id, file }) => {
          modules.push(`  ${id}: require('${file}').default`);
          return modules;
        }, [])
        .join(`,\n`)}\n};\n`;

      fs.writeFileSync(`${packPath}/index.js`, indexJs);
    } catch (e) {
      console.log('[build:export:bundle] error:', e?.message);
    }
    console.log(
      `[build:export:pack] NPM package folder created for: ${component}\n[build:export:pack] ${packPath}`
    );
  });
};
