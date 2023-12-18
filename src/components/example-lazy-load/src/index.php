<?php
$data = PFWP_Components::parse_args(
  $args,
  array(
    'attributes' => array(
      'component' => array(
        'name' => null,
        'data' => array()
      ),
      'conditional' => false,
      'observed' => true,
      'lazyId' => null
    )
  )
);
?>
<div class="lazy-load" id="<?php echo $el_uuid = PFWP_Components::get_uuid( __FILE__, $data['attributes']['lazyId'] ); ?>">
  Loading...
</div>
<?php
PFWP_Components::store_instance_js_data(
  __FILE__,
  $el_uuid,
  array(
    'target_id' => $el_uuid,
    'attributes' => $data['attributes']
  )
);
