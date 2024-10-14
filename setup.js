process.env.PFWP_CMD = 'setup';

const {
  existsSync,
  writeFileSync,
  mkdirSync,
  createWriteStream,
  unlinkSync,
  rmSync,
  renameSync
} = require('fs');
const { Readable } = require('stream');
const { finished } = require('stream/promises');
const { input, confirm, checkbox } = require('@inquirer/prompts');

const {
  config: { pluginGitUrl }
} = require('./package.json');

const { getAppSrcPath } = require('./build/lib/utils.js');

const appSrcPath = getAppSrcPath();

const downloadFile = async (url, fileName) => {
  try {
    const response = await fetch(url);
    const fileStream = createWriteStream(fileName, { flags: 'wx' });
    await finished(Readable.fromWeb(response.body).pipe(fileStream));
  } catch (error) {
    console.error(error);
  }
};

const extractPlugin = async (wpPluginsFolder) => {
  let success = false;

  try {
    const tempDir = `${appSrcPath}/tmp`;
    const destination = `${appSrcPath}/tmp/peanut-plugin.zip`;

    mkdirSync(`${appSrcPath}/tmp`, { recursive: true });

    if (existsSync(destination)) {
      unlinkSync(destination);
    }

    await downloadFile(pluginGitUrl, destination);

    if (existsSync(destination)) {
      new require('adm-zip')(destination).extractAllTo(`${appSrcPath}/tmp`);

      const pluginFolder = `${appSrcPath}/tmp/peanut-plugin-main`;

      if (existsSync(pluginFolder) && existsSync(wpPluginsFolder)) {
        const peanutPluginDir = `${wpPluginsFolder}/peanut`;

        if (existsSync(peanutPluginDir)) {
          rmSync(peanutPluginDir, { recursive: true });
        }

        renameSync(pluginFolder, peanutPluginDir);

        success = true;
      }
    }

    rmSync(tempDir, { recursive: true });
  } catch (error) {
    console.error(error);
  }

  return success;
};

const setup = async () => {
  let create = true;
  let appSrcPathExists = true;

  if (!existsSync(appSrcPath)) {
    appSrcPathExists = false;
    create = await confirm({
      message: `In order to continue, the project source directory: ${appSrcPath} will be created.\nCreate?`
    });
  }

  if (create) {
    try {
      if (!appSrcPathExists) {
        mkdirSync(appSrcPath, { recursive: true });
      }

      const elements = await checkbox({
        message: 'What type of elements will you be creating with this project?',
        required: true,
        choices: [
          { name: 'Plugins', value: 'plugins' },
          { name: 'Themes', value: 'themes' },
          { name: 'Blocks', value: 'blocks' },
          { name: 'Components', value: 'components' }
        ]
      });

      let PFWP_WP_ROOT = await input({
        message: 'Enter the absolute path to your Wordpress root directory',
        default: '/var/www/html',
        required: true,
        validate: (answer) => {
          if (existsSync(answer)) {
            return true;
          } else {
            return 'The directory you entered does not exist.';
          }
        }
      });

      PFWP_WP_ROOT = PFWP_WP_ROOT.replace(/\/$/, '');

      const config = {
        PFWP_WP_ROOT,
        PFWP_THEME_PATH: await input({
          message: `Enter the path relative to ${PFWP_WP_ROOT} of your active theme directory`,
          required: true,
          default: '/wp-content/themes/example-theme'
        }),
        PFWP_WP_HOST: await input({
          message: 'Enter the url of your Wordpress site',
          required: true,
          default: 'http://localhost.yourdomain.com'
        })
      };

      if (
        await confirm({
          message: `Project source files and directories will be generated inside:\n${appSrcPath}\nContinue?`
        })
      ) {
        writeFileSync(
          `${appSrcPath}/peanut.config.json`,
          `${JSON.stringify(config, null, 2)}\n`,
          'utf-8'
        );

        elements.forEach((element) => {
          mkdirSync(`${appSrcPath}/${element}`, { recursive: true });
        });

        const wpPluginsFolder = `${PFWP_WP_ROOT}/wp-content/plugins`;

        const setupPlugin = await confirm({
          message: `The "Peanut for WP" Wordpress plugin is required for development? We can download this plugin to your plugins directory at:\n${wpPluginsFolder}\nDownload?`
        });

        if (setupPlugin) {
          console.log(`\nDownloading plugin from:\n${pluginGitUrl} ...\n`);

          if (await extractPlugin(wpPluginsFolder)) {
            console.log(
              `Plugin has downloaded and is ready for you to activate via your Wordpress Admin area.`
            );
          } else {
            console.log('Could not complete plugin download.');
          }
        }

        console.log('\nSetup process is complete!');
      } else {
        console.log('No project source files or directory generated.');
      }
    } catch (error) {
      console.error(error);
    }
  } else {
    console.log('No project source directory created.');
  }
};

(async () => {
  await setup();
})();
