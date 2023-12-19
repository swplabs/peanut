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
        // TODO: use a CONSTANT here corejs version
        corejs: 3.34,
        targets: [/* 'ssr', */ 'server'].includes(buildType)
          ? {
              // TODO: use a CONSTANT here node version
              node: '20.10'
            }
          : {
              browsers: ['last 2 versions, not dead']
            }
      }
    ]
  ];

  // TODO: remove whiteboard to add react support
  if (!['whiteboard', 'components'].includes(srcType) && buildType !== 'server') {
    presets.push('@wordpress/babel-preset-default');
  }

  const plugins = [];

  // TODO: add whiteboard to add react refresh support
  if (nodeEnv === 'development' && ['plugins', 'blocks'].includes(srcType)) {
    plugins.push('react-refresh/babel');
  }

  return {
    presets
  };
};
