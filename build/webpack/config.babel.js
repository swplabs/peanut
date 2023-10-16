module.exports = ({ buildType, srcType = 'components', modules = 'auto' }) => {
  const presets = [
    [
      '@babel/preset-env',
      {
        modules,
        useBuiltIns: 'entry',
        corejs: 3.33,
        targets: ['ssr', 'server'].includes(buildType)
          ? {
              node: '18.18'
            }
          : {
              browsers: ['last 2 versions, not dead']
            }
      }
    ]
  ];

  if (!['app', 'components'].includes(srcType) && buildType !== 'server') {
    presets.push('@wordpress/babel-preset-default');
  }

  return {
    presets
  };
};
