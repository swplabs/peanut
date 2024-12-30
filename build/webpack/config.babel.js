const {
  node,
  corejs,
  browsers,
  hotRefreshEnabled,
  enableTS
} = require('../../shared/definitions.js');

module.exports = ({
  buildType,
  srcType = 'components',
  modules = 'auto',
  resourceInfo = {},
  enableReactPreset = false
}) => {
  const tsPresetConfig = {
    allExtensions: true
  };

  const resource = resourceInfo.realResource || '';
  const presets = [
    [
      require.resolve('@babel/preset-env'),
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

  // TODO: add condition to definitions.js
  if (
    enableReactPreset ||
    !['whiteboard', 'components'].includes(srcType) ||
    (srcType === 'whiteboard' &&
      resource.match(/peanut\/src\/whiteboard\/shared\/(routes|components)/))
  ) {
    tsPresetConfig.isTSX = true;
    presets.push(require.resolve('@wordpress/babel-preset-default'));
  }

  if (enableTS()) {
    presets.push([require.resolve('@babel/preset-typescript'), tsPresetConfig]);
  }

  const plugins = [];

  // TODO: add whiteboard to add react refresh support
  if (hotRefreshEnabled(srcType)) {
    // plugins.push(require.resolve('react-refresh/babel'));
  }

  return {
    presets,
    plugins
  };
};
