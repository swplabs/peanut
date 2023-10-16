const path = require('path');
// const { execSync } = require('node:child_process');
const { bundle } = require('./build/export/index.js');
const envVars = require('./config/envvars.js');
const srcPath = path.resolve(__dirname, './src');
const distPath = path.resolve(__dirname, `./dist/${envVars.get('PEANUT_DIST')}`);

let components;

const compEnvVar = envVars.get('PEANUT_COMPS');
if (compEnvVar) {
  components = compEnvVar.split(',');
}

if (Array.isArray(components)) {
  const exportType = envVars.get('PEANUT_E_TYPE');

  const args = {
    exportType,
    components,
    srcPath,
    distPath,
    disableExtract: envVars.getBoolean('PEANUT_NOCSS')
  };

  switch (exportType) {
    case 'web': {
      // Prepare component in ./dist/export/[component]/ folder
      bundle(args);

      /*
      try {
        console.log(execSync(` `, { shell: '/bin/sh' }).toString());
      } catch(e) {
        console.log('[export]', e?.message);
      }
      */
      break;
    }
  }
} else {
  console.log('[export] No components specified:', components);
}
