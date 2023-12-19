const fs = require('fs');

const phpIndexKeyRegex = /^php_index_components_(?<srcElement>.+)$/i;

class ComponentsPlugin {
  constructor({ directory, routes, outputPath }) {
    this.routes = routes;
    this.directory = directory;
    this.outputPath = outputPath;
    this.components = {};
    this.filesToEmit = {};

    const destDir = `${this.directory}/components`;
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true });
    }
  }

  buildJson(key) {
    const { jsonFile, dir } = this.components[key];

    try {
      const metadata = fs.readFileSync(jsonFile, { encoding: 'utf8' });

      const data = {
        ...JSON.parse(metadata)
      };

      this.filesToEmit[key] = {
        filename: `${dir.replace(this.outputPath, '')}/component.json`,
        source: JSON.stringify(data),
        data
      };
    } catch (e) {
      console.log('[build:webpack:plugins:componentsplugin] error', e?.message);
    }
  }

  apply(compiler) {
    const { RawSource } = compiler.webpack.sources;

    compiler.hooks.entryOption.tap('ComponentsPlugin', (_context, entry) => {
      const { routes, directory } = this;

      Object.keys(entry).forEach((key) => {
        const match = phpIndexKeyRegex.exec(key);

        if (match) {
          const {
            groups: { srcElement }
          } = match;

          const dir = `${directory}/components/${srcElement}`;

          try {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
          } catch (e) {
            console.log('[build:webpack:plugins:componentsplugin] error', e?.message);
          }

          const { srcPath } = routes.find(({ path }) => path === srcElement);

          const jsonFile = `${srcPath}/metadata.json`;

          if (fs.existsSync(jsonFile)) {
            const data = {
              dir,
              jsonFile
            };

            this.components[srcElement] = data;

            this.buildJson(srcElement);
          }
        }
      });
    });

    compiler.hooks.watchRun.tap('ComponentsPlugin', (compiler) => {
      if (compiler.modifiedFiles) {
        Object.keys(this.components).forEach((key) => {
          const { jsonFile } = this.components[key];

          if (compiler.modifiedFiles.has(jsonFile)) {
            this.buildJson(key);
          }
        });
      }
    });

    compiler.hooks.thisCompilation.tap('ComponentsPlugin', (compilation) => {
      Object.keys(this.components).forEach((key) => {
        const { jsonFile } = this.components[key];

        compilation.fileDependencies.add(jsonFile);
      });
    });

    compiler.hooks.compilation.tap('ComponentsPlugin', (compilation) => {
      Object.keys(this.filesToEmit).forEach((key) => {
        const { filename, source, data } = this.filesToEmit[key];

        const { show_in_rest = false, data_schema } = data;

        compilation.emitAsset(filename, new RawSource(source), {
          component: key,
          showInRest: show_in_rest,
          hasSchema: typeof data_schema === 'object'
        });

        // TODO: update the compilation hash
      });

      this.filesToEmit = {};
    });

    compiler.hooks.done.tap('ComponentsPlugin', (stats) => {
      // console.log(stats.toJson().assets.filter(({name}) => name.includes('json')));
    });
  }
}

module.exports = {
  ComponentsPlugin
};
