<?php

if ( ! defined( 'PFWP_VERSION' ) ) {
    header( 'Status: 403 Forbidden' );
    header( 'HTTP/1.1 403 Forbidden' );
    exit();
}

class PFWP_Assets_Engine {
    private static $assets;

    public static function get_key( $group, $key ) {
        return $key;
    }
    
    public static function get_base_key( $group, $chunkGroupKey, $entryKeyPrefix = null ) {
        $repl = $group . '_';

        if ( $entryKeyPrefix ) {
            $repl = $entryKeyPrefix . '_' . $repl;
        }

        return str_replace($repl, '', $chunkGroupKey);
    }

    public static function initialize() {
        global $pfwp_global_config;
        
        self::$assets = (object) [
            'blocks' => $pfwp_global_config->chunk_groups->blocks_elements,
            'components' => $pfwp_global_config->chunk_groups->components_elements,
            'plugins' => $pfwp_global_config->chunk_groups->plugins_elements
        ];
    }

    public static function get_assets( $group = null ) {
        if ( isset ( $group ) ) {
            return self::$assets->$group;
        } else {
            return self::$assets;
        }
    }

    public static function has_php( $group = 'components', $realKey = '' ) {
        return property_exists( self::$assets->$group, $realKey ) && property_exists( self::$assets->$group->$realKey, 'php' ) && self::$assets->$group->$realKey->php === true;
    }

    public static function has_asset( $group = 'components', $key = '', $entryKey = '' ) {
        $realKey = ($entryKey ? $entryKey . '_' : '') . $group . '_' . $key;

        return property_exists( self::$assets->$group, $realKey ) && property_exists( self::$assets->$group->$realKey, 'assets' );
    }

    public static function get_asset( $group = 'components', $key = '', $entryKey = '' ) {
        $realKey = ($entryKey ? $entryKey . '_' : '') . $group . '_' . $key;
        return self::$assets->$group->$realKey->$type;
    }

    private static function simple_minify( $content ) {
        $content = preg_replace('/\s{2,}/', ' ', $content);
        $content = preg_replace('/\s*([:;{}])\s*/', '$1', $content);
        $content = preg_replace('/;}/', '}', $content);

        return $content;
    }

    public static function process_assets( $key_assets ) {
        global $pfwp_global_config;
  
        $assets = (object) [
          'js' => [],
          'css' => []
        ];
  
        if ( property_exists( $key_assets, 'css' ) ) {
          foreach ($key_assets->css as $key => $value) {
            array_push( $assets->css, $pfwp_global_config->public_path . $value );
          }
        }
  
        if ( property_exists( $key_assets, 'js' ) ) {
          foreach ($key_assets->js as $key => $value) {
            array_push( $assets->js, $pfwp_global_config->public_path . $value );
          }
        }
  
        return $assets;
    }
  
    // TODO: create get_main_asset function... match url /.assets/entryKey_group_key.js in assets array
    public static function get_key_assets( $group = 'components', $key = '', $entryKey = '' ) {
      $realKey = ($entryKey ? $entryKey . '_' : '') . $group . '_' . $key;
      $assets =  self::$assets->$group->$realKey->assets;

      if ( is_array( $assets ) ) {
        $key_assets = (object) [];

        foreach ($assets as $key => $value) {
          $file = $value->name;
          $ext = pathinfo($file, PATHINFO_EXTENSION);

          if ( !property_exists( $key_assets, $ext ) ) {
              $key_assets->$ext = [];
          }

          array_push($key_assets->$ext, $file);
        }

        return $key_assets;
      }

      return (object) [];
    }


    public static function get_content( $file_path, $minify = false ) {
      global $pfwp_global_config;

      $content = file_get_contents( $pfwp_global_config->wp_root . '/' . $file_path );
      return $minify ? self::simple_minify( $content ) : $content;
    }
}

add_action( 'after_setup_theme', array( 'PFWP_Assets_Engine', 'initialize' ), 1 );

?>