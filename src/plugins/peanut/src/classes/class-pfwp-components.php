<?php

if ( ! defined( 'PFWP_VERSION' ) ) {
	header( 'Status: 403 Forbidden' );
	header( 'HTTP/1.1 403 Forbidden' );
	exit();
}

/**
 * @todo disable print out of component during wp-cli import
 */
class PFWP_Components {
	public static $components;
	public static $js_data;

	private static function get_key( $slug, $name ) {
		$matches = self::match_file_name( $slug );

		if ( isset( $matches['element'] ) ) {
			$key = $matches['element'];

			if ( isset( $name ) && strlen( $name ) > 0 ) {
				return $key . '-' . $name;
			} else {
				return $key;
			}
		} else {
			return false;
		}
	}

	public static function initialize() {
		self::$components = (object) array();
		self::$js_data    = (object) array();
	}

	// TODO: can we define defaults for a components parse_args in JSON metadata schema and use here if available?
	public static function parse_args( $array1, $array2 ) {
		$merged = $array2;

		foreach ( $array1 as $key => &$value ) {
			if ( is_array( $value ) && isset( $merged [ $key ] ) && is_array( $merged [ $key ] ) ) {
				$merged [ $key ] = self::parse_args( $value, $merged [ $key ] );
			} else {
				$merged [ $key ] = $value;
			}
		}

		return $merged;
	}


	/**
	 * Returns component as executed php stored in a variable
	 */
	public static function get_template_part( $slug, $name = null, $args = array() ) {
		ob_start();

		if ( false !== get_template_part( $slug, $name, $args ) ) {
			return ob_get_clean();
		} else {
			ob_get_clean();
			return '';
		}
	}

	public static function process_assets( $component_assets ) {
		global $pfwp_global_config;

		$assets = (object) array(
			'js'  => array(),
			'css' => array(),
		);

		// TODO: add option to serve css from link src'd files OR style tags
		if ( property_exists( $component_assets, 'css' ) ) {
			foreach ( $component_assets->css as $key => $value ) {
				// array_push( $assets->css, '<style>' . PFWP_Assets::get_content( $value ) . '</style>' . PHP_EOL );
				array_push( $assets->css, $pfwp_global_config->public_path . $value );
			}
		}

		if ( property_exists( $component_assets, 'js' ) ) {
			foreach ( $component_assets->js as $key => $value ) {
				array_push( $assets->js, $pfwp_global_config->public_path . $value );
			}
		}

		return $assets;
	}

	public static function process_template_part( $slug, $name = null ) {
		global $pfwp_global_config;

		// Execute on theme presentation only
		if ( is_admin() || is_feed() ) {
			return;
		} elseif ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			if ( !str_starts_with( home_url( $_SERVER['REQUEST_URI'] ),  get_rest_url( null, '/pfwp/v1/components/' ) ) ) {
				return;
			}
		}

		$matches = self::match_file_name( '/' . $slug . '.php' );

		if ( ! array_key_exists( 'element', $matches ) ) {
			return;
		}

		$key = self::get_key( $slug, $name );

		if ( $key && ! property_exists( self::$components, $key ) ) {
			$assets = (object) array(
				'js'  => array(),
				'css' => array(),
			);

			// JS Instance Initialization
			self::$js_data->$key = (object) array();

			if ( PFWP_Assets::has_asset( 'components', $key, 'style' ) ) {
				$style_assets = self::process_assets( PFWP_Assets::get_key_assets( 'components', $key, 'style' ) );

				if ( $pfwp_global_config->css_inject ) {
					$assets->js = array_merge( $assets->js, $style_assets->js );
				} else {
					$assets->css = array_merge( $assets->css, $style_assets->css );
				}
			}

			if ( PFWP_Assets::has_asset( 'components', $key, 'view' ) ) {
				$client_assets = self::process_assets( PFWP_Assets::get_key_assets( 'components', $key, 'view' ) );
				$assets->js    = array_merge( $assets->js, $client_assets->js );
				$assets->css   = array_merge( $assets->css, $client_assets->css );
			}

			// Store Data
			self::$components->$key = (object) array(
				'key'    => $key,
				'slug'   => $slug,
				'name'   => $name,
				'assets' => $assets,
			);
		}
	}

	private static function match_file_name( $file_name ) {
		preg_match( '/\/?components\/(?P<element>[^\/]+)\/index(\.php)?$/', $file_name, $matches );
		return $matches;
	}

	public static function store_instance_js_data( $file_name, $uuid, $data ) {
		/*
		if ( is_admin() || is_feed() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return '';
		}
		*/

		$matches = self::match_file_name( $file_name );
		$key     = $matches['element'];

		if ( ! property_exists( self::$js_data, $key ) ) {
			self::$js_data->$key = (object) array();
		}

		self::$js_data->$key->$uuid = $data;
	}

	public static function get_uuid( $file_name, $uuid = null ) {
		global $wpdb;

		$matches = self::match_file_name( $file_name );

		$prefix = '';

		if ( isset( $matches['element'] ) ) {
			$prefix .= $matches['element'] . '-';
		}

		if ( !isset( $uuid ) ) {
			$uuid = uniqid();
		}

		$uuid = $prefix . $uuid;

		if ( isset( $matches['element'] ) ) {
			// Initialize data if we ask for a uuid
			$key = $matches['element'];

			if ( ! property_exists( self::$js_data, $key ) ) {
				self::$js_data->$key = (object) array();
			}

			self::$js_data->$key->$uuid = null;
		}

		return $uuid;
	}

	public static function inline_instance_js_data() {
		echo '<script>' . PHP_EOL;
		echo '  window.pfwp_comp_instances = ' . json_encode( self::$js_data ) . ';' . PHP_EOL;
		echo '</script>' . PHP_EOL;
	}

	public static function inject_footer() {
		// TODO: keep running list of files already injected
		// TODO: ONLY cachegroup dependencies get loaded non-async

		foreach ( self::$components as $key => $value ) {
			if ( property_exists( $value->assets, 'js' ) ) {
				foreach ( $value->assets->js as $asset_key => $asset_value ) {
					echo '<script src="' . $asset_value . '" id="pfwp_js_' . $key . '_' . $asset_key . '"></script>' . PHP_EOL;
				}
			}
		}

		// TODO: once we add back async, trigger these on each asset libraries load using <script onload=...
		// TODO: add async await to clientJs function call
		// TODO: Should this be moved to src/plugins/peanut/src/view.js file?
		$js_trigger = <<<TRIGGER
      <script>
        Object.keys(window.pfwp_comp_instances).forEach((comp) => {
          var compName = 'view_components_' + comp;
          if (window.peanutSrcClientJs) {
            var clientJs = window.peanutSrcClientJs[compName];
            if (clientJs) {
              Object.keys(window.pfwp_comp_instances[comp]).forEach((instance) => {
                var element = document.getElementById(instance);
                if (typeof clientJs === 'function') {
                  clientJs(element, window.pfwp_comp_instances[comp][instance]);
                } else if (clientJs.hasOwnProperty('default') && typeof clientJs.default === 'function') {
                  clientJs.default(element, window.pfwp_comp_instances[comp][instance]);
                }
              });
            }
          }
        });
      </script>
    TRIGGER;

		echo $js_trigger;
	}

	public static function capture_ob() {
		ob_start();
	}

	public static function process_ob() {
		$styles = '';

		foreach ( self::$components as $key => $value ) {
			if ( property_exists( $value->assets, 'css' ) ) {
				foreach ( $value->assets->css as $asset_key => $asset_value ) {
					$styles .= '<link rel="stylesheet" href="' . $asset_value . '" id="pfwp_css_' . $key . '_' . $asset_key . '"/>' . PHP_EOL;
				}
			}
		}

		$html = ob_get_clean();
		echo str_replace( '<!-- PFWP:head:styles -->', $styles, $html );
	}

	public static function mark_head() {
		echo "\n<!-- PFWP:head:styles -->\n";
	}
}

add_action( 'after_setup_theme', array( 'PFWP_Components', 'initialize' ), 2 );

add_action( 'get_template_part', array( 'PFWP_Components', 'process_template_part' ), 10, 3 );

add_action( 'template_redirect', array( 'PFWP_Components', 'capture_ob' ) );

add_action( 'wp_footer', array( 'PFWP_Components', 'inline_instance_js_data' ), 998 );

add_action( 'wp_footer', array( 'PFWP_Components', 'inject_footer' ), 1000 );

add_action( 'wp_footer', array( 'PFWP_Components', 'process_ob' ), 2000 );

add_action( 'wp_head', array( 'PFWP_Components', 'mark_head' ), 1000 );
