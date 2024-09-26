const path = require('path');
const envVars = require('./shared/envvars.js');
const srcPath = path.resolve(__dirname, './src');
const distPath = path.resolve(__dirname, `./dist/${envVars.get('PFWP_DIST')}`);

let components;

const compEnvVar = envVars.get('PFWP_COMPONENTS');
if (compEnvVar) {
  components = compEnvVar.split(',');
}

if (Array.isArray(components)) {
  const exportType = envVars.get('PFWP_EXPORT_TYPE');

  const args = {
    exportType,
    components,
    srcPath,
    distPath,
    enableCssInJs: envVars.getBoolean('PFWP_CSS_IN_JS')
  };

  switch (exportType) {
    case 'port': {
      // port(args);
      break;
    }
  }
} else {
  console.log('[export] No components specified:', components);
}
