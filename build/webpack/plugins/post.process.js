class PostProcessPlugin {
  constructor({ callback }) {
    this.callback = callback;
  }

  apply(compiler) {
    compiler.hooks.done.tap('PostProcessPlugin', (stats) => {
      const { callback } = this;

      if (typeof callback === 'function') {
        callback({ stats });
      }
    });
  }
}

module.exports = {
  PostProcessPlugin
};
