<?php
$data = PFWP_Components::parse_args(
	$args,
	array(
    'title' => 'Default Title',
    'table_head' => 'VOTES',
    'icon' => 'example-icon.jpg'
  )
);

?>

<div class="card" id="<?php echo $el_uuid = PFWP_Components::get_uuid( __FILE__ ); ?>">
  <div class="card-body">
    
    <div class="card-head">
        <h6 class="card-title"><?php echo $data['title']; ?></h6>
        <div class="button">Close <i class="icon icon-close"></i></div>
    </div>

    <div class="card-content">

      <div class="table table-grid">
        <div class="table-head">
          <span>FEATURE</span>
          <span><?php echo $data['table_head']; ?></span>
        </div>
        <div class="table-content">
          <ul class="table-list">
              <li class="table-list-row">
                  <div class="table-list-col">
                    <img src="<?php echo esc_url( get_theme_file_uri( '/assets/images/' . $data['icon'] ) ); ?>" />
                    <div>
                      <div>Fast compilation</div>
                      <span class="text-gray">Super Fast</span>
                    </div>
                  </div>
                  <div class="table-list-col">
                    <span>100</span>
                  </div>
              </li>
              <li class="table-list-row">
                  <div class="table-list-col">
                    <img src="<?php echo esc_url( get_theme_file_uri( '/assets/images/' . $data['icon'] ) ); ?>" />
                    <div>
                      <div>Hot Module Support</div>
                      <span class="text-gray">Super Hot</span>
                    </div>
                  </div>
                  <div class="table-list-col">
                    <span>101</span>
                  </div>
              </li>
              <li class="table-list-row">
                  <div class="table-list-col">
                    <img src="<?php echo esc_url( get_theme_file_uri( '/assets/images/' . $data['icon'] ) ); ?>" />
                    <div>
                      <div>Dynamic Blocks</div>
                      <span class="text-gray">Super Dynamic</span>
                    </div>
                  </div>
                  <div class="table-list-col">
                    <span>102</span>
                  </div>
              </li>
              <li class="table-list-row">
                  <div class="table-list-col">
                    <img src="<?php echo esc_url( get_theme_file_uri( '/assets/images/' . $data['icon'] ) ); ?>" />
                    <div>
                      <div><span>Reusable "components"</span></div>
                      <span class="text-gray">Super Used</span>
                    </div>
                  </div>
                  <div class="table-list-col">
                    <span>103</span>
                  </div>
              </li>
              <li class="table-list-row">
                  <div class="table-list-col">
                    <img src="<?php echo esc_url( get_theme_file_uri( '/assets/images/' . $data['icon'] ) ); ?>" />
                    <div>
                      <div><span>Component Whiteboard</span></div>
                      <span class="text-gray">Super ...?</span>
                    </div>
                  </div>
                  <div class="table-list-col">
                    <span>104</span>
                  </div>
              </li>
          </ul>
        </div>
      </div>
    </div>

  </div>
</div>
