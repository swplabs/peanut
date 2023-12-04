<?php
get_template_part(
  'components/example-comments/index',
  null,
  array(
    'attributes' => array(
      'comments' => $comments,
      'post_id'  => get_the_ID(),
    ),
  )
);
