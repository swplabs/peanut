const { validate } = require('schema-utils');
const crypto = require('crypto');
const { appSrcPath, directoryEntrySrcPath, getEnv } = require('../../../shared/definitions.js');

const schema = {
  type: 'object',
  properties: {
    output: {
      type: 'object',
      properties: {
        peanutThemePath: {
          type: 'string'
        },
        wordpressRoot: {
          type: 'string'
        }
      }
    }
  }
};

const srcInfoRegEx = new RegExp(
  `${appSrcPath}/(?<srcType>blocks|components|themes)/(?<srcElement>[^/]+)${directoryEntrySrcPath}/(?<srcFileName>[^./]+).php$`
);

// TODO: use resourceInfo.compiler for this
const getSrcInfo = (path) => {
  const { groups = {} } = srcInfoRegEx.exec(path) || {};
  return groups;
};

module.exports = function (content) {
  const options = this.getOptions();

  validate(schema, options, {
    name: 'PFWP PHP Loader',
    baseDataPath: 'options'
  });

  const {
    output: { peanutThemePath }
  } = options;

  const { srcType, srcElement, srcFileName } = getSrcInfo(this.resourcePath);

  const coreCheck = (srcType === 'components' && getEnv() === 'prod') ? `
<?php
if ( !class_exists( 'PFWP_Core' ) ) {
  return;
}
?>\n
` : '';

  let contentHash = '';

  if (srcType && srcElement && srcFileName) {
    const source = coreCheck + content;

    this.emitFile(`${peanutThemePath}/${srcType}/${srcElement}/${srcFileName}.php`, source);

    const hash = crypto.createHmac('md5', 'peanut');
    contentHash = hash.update(source).digest('hex');
  }

  return `console.log('hash', '${contentHash}');`;
};
