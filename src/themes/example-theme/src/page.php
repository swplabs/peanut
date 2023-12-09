<?php
get_header();
?>

<div class="card card--pad">
  <div class="card-body">
    <?php
    the_content();
    ?>
  </div>
</div>

<?php
get_template_part(
  'components/example-github-gist/index',
  null,
  array(
    'attributes' => array(
      'gist_id' => '9471f01fcfc698a44f515f26b15fcbe3'
    )
  )
);
?>

<?php
get_footer();
