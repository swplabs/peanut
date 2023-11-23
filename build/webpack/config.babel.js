module.exports = ({
  buildType,
  srcType = 'components',
  modules = 'auto',
  nodeEnv = 'production'
}) => {
  const presets = [
    [
      '@babel/preset-env',
      {
        modules,
        useBuiltIns: 'entry',
        corejs: 3.33,
        targets: ['ssr', 'server'].includes(buildType)
          ? {
              node: '20.9'
            }
          : {
              browsers: ['last 2 versions, not dead']
            }
      }
    ]
  ];

  if (!['whiteboard', 'components'].includes(srcType) && buildType !== 'server') {
    presets.push('@wordpress/babel-preset-default');
  }

  const plugins = [];

  if (nodeEnv === 'development' && ['plugins', 'blocks'].includes(srcType)) {
    plugins.push('react-refresh/babel');
  }

  return {
    presets
  };
};
