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

<div class="page-title">
	<?php
	if ( is_singular() ) {
		the_title();
	} else if ( is_archive() ) {
		echo single_term_title( '', false );
	} else {
		echo 'Peanut For Wordpress';
	}
	?>
</div>

<div class="main-container">

	<div class="main-container-content">

