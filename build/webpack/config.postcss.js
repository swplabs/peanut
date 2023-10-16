module.exports = {
  sourceMap: false,
  plugins: [
    require('postcss-preset-env')({
      stage: 3,
      browsers: ['last 2 versions, not dead']
    }),
    require('postcss-import'),
    require('autoprefixer')
  ]
};
