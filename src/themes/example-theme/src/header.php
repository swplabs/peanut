<!DOCTYPE html>

<html class="no-js" <?php language_attributes(); ?>>
	<head>
		<meta charset="<?php bloginfo( 'charset' ); ?>">

	<link rel="profile" href="https://gmpg.org/xfn/11">

		<?php
		wp_head();

		get_template_part( 'components/example-head/index' );
		?>
	</head>

<body>
<?php
wp_body_open();

get_template_part( 'components/example-main-sidenav/index' );
?>
<div class="main-content">
