const path = require('path');
// const { execSync } = require('node:child_process');
const { bundle } = require('./build/export/index.js');
const envVars = require('./shared/envvars.js');
const srcPath = path.resolve(__dirname, './src');
const distPath = path.resolve(__dirname, `./dist/${envVars.get('PFWP_DIST')}`);

let components;

const compEnvVar = envVars.get('PFWP_COMPS');
if (compEnvVar) {
  components = compEnvVar.split(',');
}

if (Array.isArray(components)) {
  const exportType = envVars.get('PFWP_E_TYPE');

  const args = {
    exportType,
    components,
    srcPath,
    distPath,
    disableExtract: envVars.getBoolean('PFWP_NOCSS')
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
