const { validate } = require('schema-utils');
const crypto = require('crypto');
const { appSrcPath, directoryEntrySrcPath } = require('../../../shared/definitions.js');

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

  const securityCheck = `
<?php
if ( ! defined( 'PFWP_VERSION' ) ) {
  header( 'Status: 403 Forbidden' );
  header( 'HTTP/1.1 403 Forbidden' );
  exit();
}
?>
`;

  const childComponents = new Set();

  const pattern = /pfwp\s*::\s*comp\s*::\s*(?<component>[\w-\s]+)\(/g;

  while (null !== (match = pattern.exec(content))) {
    childComponents.add(match.groups.component);
    content = content.replace(
      match[0],
      `PFWP_Components::get_template_part( 'components/${match.groups.component}/index', null, `
    );
  }

  // TODO: Is there a way to store this is the compile/compilation object so that we can process later in the build?
  // TODO: Perhaps by updating compilation assets

  let contentHash = '';

  if (srcType && srcElement && srcFileName) {
    const source = securityCheck + '\n' + content;

    this.emitFile(`${peanutThemePath}/${srcType}/${srcElement}/${srcFileName}.php`, source);

    const hash = crypto.createHmac('md5', 'peanut');
    contentHash = hash.update(source).digest('hex');
  }

  return `console.log('hash', '${contentHash}');`;
};
