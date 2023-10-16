# Introducing "Peanut" for Wordpress

Build your wordpress themes and blocks with components.

## Documenation and Alpha Release

Alpha release and proper documentation are all coming soon.

## Quickstart

### Update the configuration
Update ./extend/config.json with your Wordpress settings (example shown below)

```
{
  "PEANUT_DIR_ENT_ALLOW_LIST": [],
  "PEANUT_WP_ROOT": "/var/www/html",
  "PEANUT_THEME_PATH": "/wp-content/themes/twentytwentythree",
  "PEANUT_WP_PUBLIC_PATH": "http://localhost/",
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

### Components and Blocks Examples

Coming soon.

## Support Us

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/I2I5O8MYB)
