<?php
/*
Plugin Name: Peanut For Wordpress
Plugin URI: https://github.com/swplabs
Description: Peanut for Wordpress!
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

if ( ! defined( 'PFWP_TEMPLATE_DIR' ) ) {
	define( 'PFWP_TEMPLATE_DIR', get_template_directory() );
}

global $pfwp_global_config;
$pfwp_global_config = json_decode( file_get_contents( PFWP_TEMPLATE_DIR . '/pfwp.json' ), false );


// Assets Engine
require PFWP_PLUGIN_DIR . '/classes/class-pfwp-assets-engine.php';

// Component Engine
require PFWP_PLUGIN_DIR . '/classes/class-pfwp-component-engine.php';

// Plugin Engine
// require PFWP_PLUGIN_DIR . '/classes/class-pfwp-plugin-engine.php';

// Block Engine
require PFWP_PLUGIN_DIR . '/classes/class-pfwp-block-engine.php';

?>
