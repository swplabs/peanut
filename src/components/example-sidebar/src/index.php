<div class="main-container-sidebar" id="<?php echo $el_uuid = PFWP_Components::get_uuid( __FILE__ ); ?>">
  <?php
  get_template_part(
    'components/example-card-table/index',
    null,
    array(
      'attributes' => array(
        'title' => 'Popular Features',
        'icon' => 'example-icon.jpg'
      )
    )
  );

  get_template_part(
    'components/example-card-table/index',
    null,
    array(
      'attributes' => array(
        'title' => 'Ranked Features',
        'table_head' => 'RANK'
      )
    )
  );
  ?>
</div>

