const fs = require('fs');

class NamedChunkGroupsPlugin {
  constructor({ file }) {
    this.outputFile = file;
    this.chunkGroupsFileName = 'chunkgroups.json';
  }

  apply(compiler) {
    compiler.hooks.done.tap('NamedChunkGroupsPlugin', (stats) => {
      const data = stats.toJson();
      const directory = this.outputFile.replace(this.chunkGroupsFileName, '');

      try {
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }

        fs.writeFileSync(this.outputFile, JSON.stringify(data.namedChunkGroups));
      } catch (e) {
        console.log('[build:webpack:plugins:namedchunkgroups]', e?.message);
      }
    });
  }
}

module.exports = {
  NamedChunkGroupsPlugin
};
