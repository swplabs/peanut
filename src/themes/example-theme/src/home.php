<?php
get_header();
?>

<div class="card card--pad">
  <div class="card-body">
    <div class="card-content">
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
get_footer();
