const { validate } = require('schema-utils');

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

const getSrcInfo = (path) => {
  const { groups = {} } =
    /src\/(?<srcType>blocks|components|plugins|themes)\/(?<srcElement>[^/]+)\/src\/(?<srcFileName>[^./]+)\.php$/.exec(
      path
    ) || {};
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

  const securityCheck = `<?php
    if ( ! defined( 'PFWP_VERSION' ) ) {
      header( 'Status: 403 Forbidden' );
      header( 'HTTP/1.1 403 Forbidden' );
      exit();
    }
  ?>`;

  const childComponents = new Set();

  const pattern = /pfwp\s*::\s*comp\s*::\s*(?<component>[\w-\s]+)\(/g;

  while (null !== (match = pattern.exec(content))) {
    childComponents.add(match.groups.component);
    content = content.replace(
      match[0],
      `PFWP_Component_Engine::get_template_part( 'components/${match.groups.component}/index', null, `
    );
  }

  // TODO: Is there a way to store this is the compile/compilation object so that we can process later in the build?

  if (srcType && srcElement && srcFileName) {
    this.emitFile(
      `${peanutThemePath}/${srcType}/${srcElement}/${srcFileName}.php`,
      securityCheck + '\n' + content
    );
  }

  return '';
};
