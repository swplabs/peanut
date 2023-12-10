<?php

function pfwp_add_block_category( $categories, $post ) {
  $categories[] = array(
    'slug'  => 'pfwp',
    'title' => 'Peanut For Wordpress'
  );

  return $categories;
}

add_filter( 'block_categories_all', 'pfwp_add_block_category', 10, 2 );
