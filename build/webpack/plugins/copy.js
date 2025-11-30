const path = require('path');
const { globSync } = require('glob');
const fs = require('fs');
const { srcDirectoryEntryMap } = require('../../../shared/src.directory.entry.map.js');
const envVars = require('../../../shared/envvars.js');

class CopyPlugin {
  constructor({
    directory,
    srcType,
    routes,
    filter = ['**/.git/**', '**/**.{js,jsx,scss}'],
    emptyDirectoryOnStart = true
  }) {
    this.srcType = srcType;
    this.directory = directory;
    this.routes = routes;
    this.elements = {};
    this.filter = filter;
    this.preCompiledFilter = Object.keys(srcDirectoryEntryMap).filter((key) => {
      const excludes = srcDirectoryEntryMap[key].excludeSrcTypes;
      return !excludes || !excludes.includes(srcType);
    });

    this.messages = [];

    // Clean directories
    this.routes.forEach((route) => {
      const { path: routePath } = route;

      const destDir = `${this.directory}/${routePath}`;
      if (
        emptyDirectoryOnStart &&
        !destDir.endsWith(envVars.get('PFWP_THEME_PATH')) &&
        fs.existsSync(destDir)
      ) {
        fs.rmSync(destDir, { recursive: true });
      }
    });
  }

  copyElement(srcDir, destDir) {
    const files = [];

    try {
      if (!fs.existsSync(srcDir)) return;

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const globFiles = globSync(`${srcDir}/**`, {
        ignore: this.filter,
        nodir: true,
        dot: true
      });

      globFiles.map((filename) => {
        const relative = filename.replace(srcDir, '');

        if (!this.preCompiledFilter.includes(relative)) {
          files.push(filename);
          const relativeFile = `${destDir}/${relative}`;
          const relativeDir = path.dirname(relativeFile);

          // Initial copy
          if (!fs.existsSync(relativeDir)) {
            fs.mkdirSync(relativeDir, { recursive: true });
          }

          // TODO: Implement support for webpack define plugin for .php files to search/replace values
          fs.copyFileSync(filename, relativeFile);
        }
      });

      this.messages.push(`copied ${srcDir}`);
    } catch (e) {
      console.log('[webpack:plugins:copy] error', e?.message);
    }

    return files;
  }

  apply(compiler) {
    compiler.hooks.entryOption.tap('CopyPlugin', () => {
      // set directories to monitor
      this.routes.forEach((route) => {
        const { srcPath, path: routePath } = route;

        const srcDir = `${srcPath}/`;
        const destDir = `${this.directory}/${routePath}`;

        this.elements[routePath] = {
          srcDir,
          destDir,
          files: this.copyElement(srcDir, destDir)
        };
      });
    });

    compiler.hooks.watchRun.tap('CopyPlugin', (compiler) => {
      // TODO: update to manage individual files by using webpack.filesysteminfo.snapshots or builtin hashes, etc
      // TODO: Throttle
      if (compiler.modifiedFiles) {
        this.messages = [];

        Object.keys(this.elements).forEach((key) => {
          const { srcDir, destDir } = this.elements[key];

          if (compiler.modifiedFiles.has(srcDir)) {
            this.elements[key].files = this.copyElement(srcDir, destDir);
          }
        });
      }
    });

    compiler.hooks.thisCompilation.tap('CopyPlugin', (compilation) => {
      // TODO: handle elements folder deletion
      Object.keys(this.elements).forEach((key) => {
        const { srcDir } = this.elements[key];

        compilation.contextDependencies.add(srcDir);
      });
    });

    compiler.hooks.compilation.tap('CopyPlugin', (compilation) => {
      const logger = compilation.getLogger('CopyPlugin');

      this.messages.forEach((msg) => {
        logger.info(msg);
      });
    });
  }
}

module.exports = {
  CopyPlugin
};
