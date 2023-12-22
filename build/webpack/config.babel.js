const { node, corejs, browsers, hotRefreshEnabled } = require('../../shared/definitions.js');

module.exports = ({
  buildType,
  srcType = 'components',
  modules = 'auto',
  resourceInfo = {},
  enableReactPreset = false
}) => {
  const resource = resourceInfo.realResource || '';

  const presets = [
    [
      '@babel/preset-env',
      {
        modules,
        useBuiltIns: 'entry',
        corejs,
        targets: ['server'].includes(buildType)
          ? {
              node
            }
          : {
              browsers
            }
      }
    ]
  ];

  // TODO: add condition to constants.js
  if (
    enableReactPreset ||
    !['whiteboard', 'components'].includes(srcType) ||
    (srcType === 'whiteboard' &&
      resource.match(/peanut\/src\/whiteboard\/shared\/(routes|components)/))
  ) {
    presets.push('@wordpress/babel-preset-default');
  }

  const plugins = [];

  // TODO: add whiteboard to add react refresh support
  if (hotRefreshEnabled(srcType)) {
    plugins.push('react-refresh/babel');
  }

  return {
    presets
  };
};
