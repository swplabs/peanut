<?php
get_header();
?>

<div class="card">
  <div class="card-body">
    <?php
    the_content();
    ?>
  </div>
</div>

<?php

comments_template();

get_footer();
