<?php
$data = PFWP_Components::parse_args(
	$args,
	array(
    'attributes' => array(
      'comments' => [],
      'post_id' => null
    )
  )
);

$attributes = $data['attributes'];

$comments = $attributes['comments'];
?>
<div class="card card--pad">
  <div class="card-body">

    <div class="card-head">
      <h6 class="card-title">Comments</h6>
    </div>

    <div class="card-content">
		  <?php
      if ( is_array( $comments ) && count( $comments ) > 0 ) {
				?>
				<div class="comment-list">
				<?php
        wp_list_comments(
          array(
            'walker'      => new PFWP_Walker_Comment(),
            'avatar_size' => 175,
            'style'       => 'div',
          )
        );
				?>
				</div>
				<?php
			}
      ?>
    </div>
  </div>
</div>
