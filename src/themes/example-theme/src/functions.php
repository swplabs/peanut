<?php

$theme_dir = get_stylesheet_directory();

/**
 * Sets up theme defaults and registers support for various WordPress features
 */
function pfwp_theme_support() {
	// Featured Images
	add_theme_support( 'post-thumbnails' );

	// HTML5
	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'script',
			'style',
		)
	);

	// WordPress Titles
	add_theme_support( 'title-tag' );

	// Add support for responsive embeds.
	add_theme_support( 'responsive-embeds' );

	// Add support for block parts
	add_theme_support( 'block-template-parts' );

	// Remove WordPress JS / CSS / SVGs / etc
	if ( ! is_admin() ) {
		remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
		remove_action( 'wp_print_styles', 'print_emoji_styles' );
		remove_action( 'wp_head', 'rsd_link' );
		remove_action( 'wp_head', 'wlwmanifest_link' );
		remove_action( 'wp_head', 'wp_resource_hints', 2, 99 );
		remove_action( 'wp_enqueue_scripts', 'wp_enqueue_global_styles' );
		remove_action( 'wp_body_open', 'wp_global_styles_render_svg_filters' );
	}
}

add_action( 'after_setup_theme', 'pfwp_theme_support' );
