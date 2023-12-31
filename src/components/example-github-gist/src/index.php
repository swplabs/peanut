<?php
$data = PFWP_Components::parse_args(
  $args,
  array(
    'attributes' => array(
      'gist_id' => null
    )
  )
);

$gist_id = $data['attributes']['gist_id'];

?>
<div class="card" id="<?php echo $el_uuid = PFWP_Components::get_uuid( __FILE__ ); ?>">
  <div class="card-body">
    <div class="github-gist">
      <div class="card-head card-head--bs card--pad github-gist-header">
        <h6 class="card-title">Github Gist</h6>
        <div class="card-select github-gist-select">
          <span>View</span>
        </div>
        <div class="github-gist-buttons">

        </div>	
      </div>
      <div class="github-gist-code-wrap">
        <div class="github-gist-code">

        </div>
      </div>
      <div class="card--pad github-gist-footer"></div>
    </div>
  </div>
</div>

<?php
PFWP_Components::store_instance_js_data(
	__FILE__,
	$el_uuid,
	array(
		'gist_id' => $gist_id
	)
);
