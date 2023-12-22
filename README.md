<p>
<img alt="Dynamic JSON Badge" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fswplabs%2Fpeanut%2Fraw%2Fmain%2Fpackage.json&query=%24.engines.node&label=node%20version">
</p>

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
  "PFWP_WP_ROOT": "/var/www/html",
  "PFWP_THEME_PATH": "/wp-content/themes/twentytwentyfour",
  "PFWP_WP_PUBLIC_PATH": "http://localhost/",
  "PFWP_SSE_HOST": "http://localhost/"
}
```

**Note:** Ensure that the directories you specify have the proper write permissions.

### Installing and starting the application

#### Installing the minimum required version of Node.js

The minimum version of Node.js required can be found in the package.json of this project under "engines > node" within the file and is listed below using a badge:

<p>
<img alt="Dynamic JSON Badge" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fswplabs%2Fpeanut%2Fraw%2Fmain%2Fpackage.json&query=%24.engines.node&label=node%20version">
</p>

You will need to install and use this version when using our application. We recommend using [NVM](https://github.com/nvm-sh/nvm) or [Volta](https://docs.volta.sh/guide/getting-started) to manage your Node.js versions.

#### Install the Node NPM package dependencies

Run the following commands in the root directory to install the necessary npm packages.

```
make install
```

#### Start up the application

```
make develop
```

### Enable the Peanut WP Plugin

Once you start the Peanut app, the Peanut plugin will auto compile into your Wordpress plugins folder. You'll need to then go into your Wordpress Admin and [enable the plugin](https://wordpress.org/documentation/article/manage-plugins/).

### Start building...

Now you're ready to go. Try out the examples in the ./src/ folder or create your own!

### Components and Blocks Examples

This repo comes with an example theme and example components that auto compile to your Wordpress themes folder. To get a demo of some of the ways to use Peanut For Wordpress, [enable that example theme](https://wordpress.org/documentation/article/work-with-themes/#activating-the-theme) in your Wordpress Admin.

## Documentation

Alpha release and proper documentation are all coming soon.

## Support Us

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/I2I5O8MYB)
