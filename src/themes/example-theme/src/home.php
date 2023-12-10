<?php
get_header();
?>

<div class="card card--pad">
  <div class="card-body">
    <div class="card-content">
      <p>Build your Wordpress themes and blocks with component-like elements.</p>
    </div>
  </div>
</div>

<?php
get_template_part(
  'components/example-github-gist/index',
  null,
  array(
    'attributes' => array(
      'gist_id' => '346184ecfb55e32c8323da2f7bd74397'
    )
  )
);
?>

<?php
global $wp_query;

if ( $wp_query->have_posts() ) {
  while ( $wp_query->have_posts() ) {
    $wp_query->the_post();

    echo PFWP_Components::get_template_part(
      'components/example-single/index',
      null,
      array(
        'attributes' => array(
          'show_taxonomy' => true,
          'show_date'     => true,
          'show_excerpt'  => true,
          'show_author'   => false,
          'show_more'     => true,
        ),
      )
    );
  }
}

get_footer();
