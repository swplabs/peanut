const fs = require('fs');

const editorKeyRegex = /^editor_blocks_(?<srcElement>.+)$/i;

class BlocksPlugin {
  constructor({ directory, routes, outputPath }) {
    this.routes = routes;
    this.directory = directory;
    this.outputPath = outputPath;
    this.blocks = {};
    this.filesToEmit = {};

    const destDir = `${this.directory}/blocks`;
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true });
    }
  }

  buildJson(key) {
    const { jsonFile, assets, dir } = this.blocks[key];

    try {
      const metadata = fs.readFileSync(jsonFile, { encoding: 'utf8' });

      const data = {
        $schema: 'https://json.schemastore.org/block.json',
        ...JSON.parse(metadata),
        ...assets
      };

      this.filesToEmit[key] = {
        filename: `${dir.replace(this.outputPath, '')}/block.json`,
        source: JSON.stringify(data)
      };
    } catch (e) {
      console.log('[build:webpack:plugins:blocksplugin] error', e?.message);
    }
  }

  apply(compiler) {
    const { RawSource } = compiler.webpack.sources;

    compiler.hooks.entryOption.tap('BlocksPlugin', (_context, entry) => {
      const { routes, directory } = this;

      Object.keys(entry).forEach((key) => {
        const match = editorKeyRegex.exec(key);

        if (match) {
          const {
            groups: { srcElement }
          } = match;

          const dir = `${directory}/blocks/${srcElement}`;

          try {
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
          } catch (e) {
            console.log('[build:webpack:plugins:blocksplugin] error', e?.message);
          }

          const { srcPath, hasEditorStyles, hasSrcClient, hasStyles, hasRenderPhp } = routes.find(
            ({ path }) => path === srcElement
          );

          const jsonFile = `${srcPath}/metadata.json`;

          if (fs.existsSync(jsonFile)) {
            const data = {
              dir,
              jsonFile,
              assets: {
                editorScript: [key]
              }
            };

            if (hasEditorStyles) data.assets.editorStyle = [`editor_styles_blocks_${srcElement}`];

            if (hasSrcClient) data.assets.viewScript = [`blocks_${srcElement}`];

            if (hasStyles) data.assets.style = [`styles_blocks_${srcElement}`];

            if (hasRenderPhp) data.assets.render = 'file:./render.php';

            this.blocks[srcElement] = data;

            this.buildJson(srcElement);
          }
        }
      });
    });

    compiler.hooks.watchRun.tap('BlocksPlugin', (compiler) => {
      if (compiler.modifiedFiles) {
        Object.keys(this.blocks).forEach((key) => {
          const { jsonFile } = this.blocks[key];

          if (compiler.modifiedFiles.has(jsonFile)) {
            this.buildJson(key);
          }
        });
      }
    });

    compiler.hooks.thisCompilation.tap('BlocksPlugin', (compilation) => {
      Object.keys(this.blocks).forEach((key) => {
        const { jsonFile } = this.blocks[key];

        compilation.fileDependencies.add(jsonFile);
      });
    });

    compiler.hooks.compilation.tap('BlocksPlugin', (compilation) => {
      Object.keys(this.filesToEmit).forEach((key) => {
        const { filename, source } = this.filesToEmit[key];

        compilation.emitAsset(filename, new RawSource(source), {
          component: key
        });

        // TODO: update the compilation hash
      });

      this.filesToEmit = {};
    });

    compiler.hooks.done.tap('BlocksPlugin', (stats) => {
      // console.log(stats.toJson().assets.filter(({name}) => name.includes('json')));
    });
  }
}

module.exports = {
  BlocksPlugin
};
