const fs = require('fs');
const zlib = require('zlib');
const { srcDirectoryEntryMap, baseIdPrefix } = require('../../shared/src.dir.map.js');

const buildIndex = (component) => {
  return `<!doctype html>
    <html>
        <head>
            <title>Peanut Component: ${component}</title>
         </head>
        <body>
            <div id="compTarget"></div>
            <script src="bundled.js"></script>
            <script>
                window.peanutComps.callComponentClientJs('${component}', document.getElementById('compTarget'));
            </script>
        </body>
    </html>`;
};

module.exports = ({ exportType, components, distPath }) => {
  console.log('[build:export:bundle] bundling components for:', exportType);

  let chunkGroups;
  let clientDirEnts;

  const clientPath = `${distPath}/static/assets`;

  try {
    clientDirEnts = fs.readdirSync(clientPath);
  } catch (e) {
    console.log('[build:export:bundle] error:', e?.message);
    clientDirEnts = [];
  }

  try {
    chunkGroups = require(`${clientPath}/chunkgroups.json`);
  } catch (e) {
    console.log('[build:export:bundle] error:', e?.message);
    chunkGroups = {};
  }

  const combinedContents = [];
  const combinedFiles = [];

  components.map((component) => {
    const bundlePath = `${distPath}/bundled/${component}`;
    try {
      fs.mkdirSync(bundlePath, { recursive: true });
    } catch (e) {
      console.log('[build:export:bundle] error:', e?.message);
      return;
    }

    const bundledFiles = [];
    const id = `${baseIdPrefix}${component}`;
    const contents = [];

    Object.keys(srcDirectoryEntryMap).map((key) => {
      const { entryKey, exportConfig } = srcDirectoryEntryMap[key];

      if (!exportConfig?.[exportType]?.entry?.enabled) return;

      const fileName = entryKey ? `${entryKey}_${id}` : `${id}`;

      if (!clientDirEnts.includes(`${fileName}.js`)) {
        return;
      }

      const { assets } = chunkGroups[fileName];

      if (!Array.isArray(assets)) return;

      assets.map((file) => {
        if (bundledFiles.includes(file.name)) return;

        try {
          const fileContent =
            '/** ' +
            file.name +
            ' **/\n' +
            fs.readFileSync(`${distPath}/static/${file.name}`, 'utf8');

          contents.push(fileContent);
          bundledFiles.push(file.name);

          if (!combinedFiles.includes(file.name)) {
            combinedContents.push(fileContent);
            combinedFiles.push(file.name);
          }
        } catch (e) {
          console.log('[build:export:bundle] error:', e?.message);
        }
      });
    });

    try {
      contents.push(
        `/** assets/export_${exportType}.js **/\n` +
          fs.readFileSync(`${clientPath}/export_${exportType}.js`, 'utf8')
      );
    } catch (e) {
      console.log('[build:export:bundle] error:', e?.message);
    }

    const content = contents.join('\n');

    try {
      fs.writeFileSync(`${bundlePath}/bundled.js`, content);
      fs.writeFileSync(`${bundlePath}/bundled.gz.js`, zlib.gzipSync(content));
      fs.writeFileSync(`${bundlePath}/index.html`, buildIndex(component));

      console.log('[build:export:bundle] bundled:', component);
    } catch (e) {
      console.log('[build:export:bundle] error:', e?.message);
    }
  });

  if (components.length > 1) {
    try {
      combinedContents.push(
        `/** assets/export_${exportType}.js **/\n` +
          fs.readFileSync(`${clientPath}/export_${exportType}.js`, 'utf8')
      );

      const combinedContent = combinedContents.join('\n');

      fs.writeFileSync(`${distPath}/bundled/combined.js`, combinedContent);
      fs.writeFileSync(`${distPath}/bundled/combined.gz.js`, zlib.gzipSync(combinedContent));

      console.log(
        `[build:export:bundle] created combined bundle for ${components.length} components at ${distPath}/bundled/combined.js`
      );
    } catch (e) {
      console.log('[build:export:bundle] error:', e?.message);
    }
  }
};
