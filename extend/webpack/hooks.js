const fs = require('fs');

module.exports = {
  // TODO: move trigger to "hooks" plugin
  webpackPreProcess: ({ srcDir }) => {
    const fontelloCodeFile =
      srcDir + '/components/example-head/src/fonts/fontello/css/pfwp-codes.css';

    try {
      if (fs.existsSync(fontelloCodeFile)) {
        const css = fs.readFileSync(fontelloCodeFile, { encoding: 'utf8', flag: 'r' });
        const sass = css.replace(
          /\.icon-([\w-]+)[\w-:\s{]+'(\\\w+)'.+/gi,
          "    --icon-code-$1: '$2';"
        );

        fs.writeFileSync(
          srcDir + '/components/example-head/src/scss/pfwp-codes.scss',
          ':root {\n' + sass + '\n\n}\n'
        );
      }
    } catch (e) {
      console.log(e?.message);
    }
  }
};
