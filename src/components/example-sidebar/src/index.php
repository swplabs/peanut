<div class="main-container-sidebar" id="<?php echo $el_uuid = PFWP_Components::get_uuid( __FILE__ ); ?>">
<?php

get_template_part(
  'components/example-lazy-load/index',
  null,
  array(
    'attributes' => array(
      'component' => array(
        'name' => 'example-card-table',
        'data' => array(
          'title' => 'Popular Features',
          'icon' => 'example-icon.jpg'
        )
      ),
      'observed' => true
    )
  )
);
 
get_template_part(
  'components/example-lazy-load/index',
  null,
  array(
    'attributes' => array(
      'component' => array(
        'name' => 'example-card-table',
        'data' => array(
          'title' => 'Ranked Features',
          'table_head' => 'RANK'
        )
      ),
      'observed' => true
    )
  )
);
?>
</div>
