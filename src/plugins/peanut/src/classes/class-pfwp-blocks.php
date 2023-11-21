<?php

if ( ! defined( 'PFWP_VERSION' ) ) {
	header( 'Status: 403 Forbidden' );
	header( 'HTTP/1.1 403 Forbidden' );
	exit();
}

/**
 * Block engine
 */
class PFWP_Blocks {
	private static $blocks;
	private static $deps;
	private static $render_filters;
	private static $pre_render_filters;

	public static function initialize() {
		global $pfwp_global_config;
		self::$blocks = PFWP_Assets::get_assets( 'blocks' );
		self::$deps   = require get_template_directory() . '/blocks/deps.php';

		// Register block index files
		foreach ( self::$blocks as $key => $value ) {

			if ( str_starts_with( $key, 'php_index' ) ) {
				$baseKey = PFWP_Assets::get_base_key( 'blocks', $key, 'php_index' );
				require_once get_template_directory() . '/blocks/' . $baseKey . '/index.php';
			}
		}

		if ( property_exists( $pfwp_global_config, 'core_block_filters' ) ) {
			self::$render_filters     = property_exists( $pfwp_global_config->core_block_filters, 'on_render' ) ? $pfwp_global_config->core_block_filters->on_render : (object) array();
			self::$pre_render_filters = property_exists( $pfwp_global_config->core_block_filters, 'on_pre_render' ) ? $pfwp_global_config->core_block_filters->on_pre_render : (object) array();
		} else {
			self::$render_filters     = (object) array();
			self::$pre_render_filters = (object) array();
		}
	}

	public static function register() {
		foreach ( self::$blocks as $key => $value ) {

			if ( str_starts_with( $key, 'editor' ) ) {
				$baseKey = PFWP_Assets::get_base_key( 'blocks', $key, 'editor' );
				$assets  = PFWP_Components::process_assets( PFWP_Assets::get_key_assets( 'blocks', $baseKey, 'editor' ) );
				$deps    = self::$deps[ '.assets/blocks/' . $key . '.js' ];

				array_push( $deps['dependencies'], 'blocks_elements_webpack_runtime' );

				// TODO: loop through assets object above so as to support webpack code split deps
				wp_register_script(
					$key,
					$assets->js[0],
					$deps['dependencies'],
					$deps['version']
				);

				$blockFile = get_template_directory() . '/blocks/' . $baseKey . '/block.json';

				if ( is_file( $blockFile ) ) {
						register_block_type_from_metadata( $blockFile );
				}
			}
		}

		// TODO: add do_action for block localize passing in all handles that we registered above
	}

	/**
	 * Render callback helper for block > component one-to-one matches
	 */
	public static function component_render_callback( $attributes, $content, $block ) {
		$assetKey = str_replace( 'pfwp/', '', $block->name );

		// Dynamic blocks use components for rendering. Static blocks are completely javascript driven
		if ( '' !== locate_template( 'components/' . $assetKey . '/index.php', false, false ) ) {
			return PFWP_Components::get_template_part(
				'components/' . $assetKey . '/index',
				null,
				array(
					'attributes' => $attributes,
					'content'    => $content,
				)
			);
		} else {
			return $content;
		}
	}

	/**
	 * Adds ability to manipule whitelisted WordPress core/blocks via custom template parts
	 */
	public static function filter_render( $block_content, $block ) {
		$blockName = $block['blockName'];

		// If component PHP exists, do the thang
		if ( property_exists( self::$render_filters, $blockName ) && '' !== locate_template( self::$render_filters->$blockName . '/index.php' ) ) {
			return PFWP_Components::get_template_part(
				self::$render_filters->$blockName . '/index',
				null,
				array(
					'filter_type' => 'render',
					'attributes'  => $block['attrs'],
					'content'     => $block_content,
				)
			);
		} elseif ( property_exists( self::$render_filters, $blockName ) ) {
			// If no PHP exists for filter, still add component CSS and JS assets if they exists
			PFWP_Components::process_template_part( self::$render_filters->$blockName . '/index' );
		}

		return $block_content;
	}

	public static function filter_data( $parsed_block, $source_block, $parent_block ) {
		return $parsed_block;
	}

	public static function filter_pre_render( $pre_render, $parsed_block, $parent_block ) {
		$block     = $parsed_block;
		$blockName = $block['blockName'];

		// If component PHP exists, do the other thang
		if ( property_exists( self::$pre_render_filters, $blockName ) && '' !== locate_template( self::$pre_render_filters->$blockName . '/index.php' ) ) {
			return PFWP_Components::get_template_part(
				self::$pre_render_filters->$blockName . '/index',
				null,
				array(
					'filter_type'  => 'pre_render',
					'attributes'   => $block['attrs'],
					'inner_blocks' => $block['innerBlocks'],
				)
			);
		} elseif ( property_exists( self::$pre_render_filters, $blockName ) ) {
			// If no PHP exists for filter, still add component CSS and JS assets if they exists
			PFWP_Components::process_template_part( self::$pre_render_filters->$blockName . '/index' );
		}

		return null;
	}
}


add_filter( 'pre_render_block', array( 'PFWP_Blocks', 'filter_pre_render' ), 99999, 3 );

// add_filter( 'render_block_data', array( 'PFWP_Blocks', 'filter_data' ), 99999, 3 );

add_filter( 'render_block', array( 'PFWP_Blocks', 'filter_render' ), 99999, 2 );

add_action( 'after_setup_theme', array( 'PFWP_Blocks', 'initialize' ), 2 );

add_action( 'init', array( 'PFWP_Blocks', 'register' ), 2 );
