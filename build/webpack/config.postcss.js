const { browsers } = require('../../shared/definitions.js');

module.exports = {
  sourceMap: false,
  plugins: [
    require('postcss-preset-env')({
      stage: 3,
      browsers
    }),
    require('postcss-import'),
    require('autoprefixer')
  ]
};
