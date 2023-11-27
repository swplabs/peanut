<?php
get_header();
?>

<div class="page-title">
  <?php the_title( '<h4 class="entry-title">', '</h4>' ); ?>
</div>

<div class="card">
  <div class="card-body">
    <?php
    the_content();
    ?>
  </div>
</div>

<?php
get_footer();
