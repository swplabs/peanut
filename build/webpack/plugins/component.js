const fs = require('fs');

const phpIndexKeyRegex = /^php_index_components_(?<srcElement>.+)$/i;

class ComponentsPlugin {
  constructor({ directory, routes, outputPath, emptyDirectoryOnStart = false }) {
    this.routes = routes;
    this.directory = directory;
    this.outputPath = outputPath;
    this.components = {};
    this.filesToEmit = {};

    const destDir = `${this.directory}/components`;
    if (emptyDirectoryOnStart && fs.existsSync(destDir)) {
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
      console.log('[build:webpack:plugins:components] error', e?.message);
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
            console.log('[build:webpack:plugins:components] error', e?.message);
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

        const { show_in_rest = false, data_schema, javascript, css } = data;

        // TODO: figure out why it's not included in stats everytime and if we can cache somewhere
        // TODO: might need to save it "stats" somewhere which would probably fix compilation hash todo as well
        compilation.emitAsset(filename, new RawSource(source), {
          component: key,
          showInRest: show_in_rest,
          hasSchema: typeof data_schema === 'object',
          javascript,
          css
        });

        // TODO: update the compilation hash
      });

      // TODO: commented this out so that it appears in stats everytime. Revisit
      // this.filesToEmit = {};
    });
  }
}

module.exports = {
  ComponentsPlugin
};
