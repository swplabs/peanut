# Introducing "Peanut" for Wordpress

Build your wordpress themes and blocks with component-like elements.

## Alpha Release

Alpha release and proper documentation are all coming soon.

## Requirements

Peanut For Wordpress requires an environment running both [Node.js](https://nodejs.org/en/about) and, of course, [Wordpress](https://wordpress.org/about/).

## Quickstart

### Wordpress Environment Settings


#### Enable Permalinks

Permalinks are the permanent URLs of your Wordpress content. At the moment, Peanut For Wordpress requires that Permalinks to set to something other than the default "Plain". See "[Choosing your permalink structure](https://wordpress.org/documentation/article/customize-permalinks/)" for instructions on how to change your permalink settings.

#### Enable Debugging

Script Debugging must be set to true when in development mode for Peanut editor scripts to function. See [Wordpress debugging mode](https://wordpress.org/documentation/article/debugging-in-wordpress/#script_debug) for instructions on how to turn on in your Wordpress development environment.

### Peanut configuration

Update ./extend/config.json with your Wordpress settings (example shown below)

```
{
  "PFWP_DIR_ENT_ALLOW_LIST": [],
  "PFWP_WP_ROOT": "/var/www/html",
  "PFWP_THEME_PATH": "/wp-content/themes/twentytwentyfour",
  "PFWP_WP_PUBLIC_PATH": "http://localhost/",
  "PFWP_WB_SSE_HOST": "http://localhost:9090",
  "PFWP_WB_SSE_PORT": 9090,
  "PFWP_CORE_BLOCK_FILTERS": {
    "on_pre_render": {},
    "on_render": {}
  }
}
```

**Note:** Ensure that the directories you specify have the proper write permissions.

### Start the App

```
nvm install
make install
make develop
```

### Enable the Peanut WP Plugin

Once you start the Peanut app, the peanut plugin will auto compile into your Wordpress plugins folder. You'll need to then go into your Wordpress Admin and enable the plugin.

### Start building...

You should be good to go. Try out the examples in the ./src/ folder or create your own!

### Components and Blocks Examples

Coming soon.

## Documentation

Alpha release and proper documentation are all coming soon.

## Support Us

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/I2I5O8MYB)
