const { browsers, rootDir, appSrcPath } = require('../../shared/definitions.js');

module.exports = {
  sourceMap: false,
  plugins: [
    require('postcss-preset-env')({
      stage: 3,
      browsers
    }),
    require('postcss-import')({
      addModulesDirectories: [`${rootDir}/node_modules`, `${appSrcPath}/node_modules`]
    }),
    require('autoprefixer')
  ]
};
