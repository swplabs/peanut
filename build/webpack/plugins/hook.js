class HooksPlugin {
  constructor({ hooks = [] }) {
    this.hooks = hooks;
  }

  // TODO: add fonts process to use this plugin
  apply(compiler) {
    ['afterEnvironment', 'entryOption', 'done'].forEach((hookType) => {
      compiler.hooks[hookType].tap('HooksPlugin', (...params) => {
        const hookFuncs = this.hooks?.[hookType] || [];
        hookFuncs.forEach((func) => {
          console.log(`executing ${hookType} functions with params`, params);
          if (typeof func === 'function') {
            func(...params);
          }
        });
      });
    });
  }
}

module.exports = {
  HooksPlugin
};
