<?php
/*
Plugin Name: Peanut For WordPress
Plugin URI: https://github.com/swplabs
Description: Peanut for WordPress!
Version: 0.1.0-alpha.1
Author: SWP Labs
Author URI: https://www.sassywackypeanut.com/labs/
License: GPLv2 or later
Text Domain: pfwp
*/

if ( ! function_exists( 'add_filter' ) ) {
	header( 'Status: 403 Forbidden' );
	header( 'HTTP/1.1 403 Forbidden' );
	exit();
}

if ( ! defined( 'PFWP_VERSION' ) ) {
	define( 'PFWP_VERSION', '0.1.0-alpha.1' );
}

if ( ! defined( 'PFWP_PLUGIN_DIR' ) ) {
	define( 'PFWP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}

if ( ! defined( 'PFWP_PLUGIN_URL' ) ) {
	define( 'PFWP_PLUGIN_URL', plugins_url( '', __FILE__ ) );
}

if ( ! defined( 'PFWP_TEMPLATE_DIR' ) ) {
	define( 'PFWP_TEMPLATE_DIR', get_template_directory() );
}

if ( ! defined( 'PFWP_SITE_URL' ) ) {
	define( 'PFWP_SITE_URL', get_site_url() );
}

global $pfwp_global_config;
$pfwp_global_config = json_decode( @file_get_contents( PFWP_TEMPLATE_DIR . '/pfwp.json' ), false );

if ( $pfwp_global_config->mode === 'development' ) {
	add_action( 'admin_notices', function () {
		if  (!defined( 'SCRIPT_DEBUG' ) || !SCRIPT_DEBUG ) {
			$class = 'notice notice-error';
			$message = __( '<strong>Peanut For Wordpress</strong>: Script Debugging must be set to true when in development mode for Peanut editor scripts to function. See <a href="https://wordpress.org/documentation/article/debugging-in-wordpress/#script_debug" target="_blank">Wordpress debugging mode</a> for instructions.', 'pfwp' );
				printf( '<div class="%1$s"><p>%2$s</p></div>', esc_attr( $class ), $message );
		}
	});
}

switch ( wp_get_environment_type() ) {
	case 'local':
	case 'development':
		// TODO: open up rest routes to any data

		// TODO: create custom permalink route for whiteboard
	break;
}

// TODO: define rest route constants (namespace, version, etc)

// Assets Engine
require PFWP_PLUGIN_DIR . '/classes/class-pfwp-assets.php';

// Component Engine
require PFWP_PLUGIN_DIR . '/classes/class-pfwp-components.php';

// Plugin Engine
require PFWP_PLUGIN_DIR . '/classes/class-pfwp-plugins.php';

// Block Engine
require PFWP_PLUGIN_DIR . '/classes/class-pfwp-blocks.php';

// REST Routes
require PFWP_PLUGIN_DIR . '/classes/class-pfwp-rest.php';
