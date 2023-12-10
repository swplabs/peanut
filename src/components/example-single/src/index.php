<?php
$data = PFWP_Components::parse_args(
	$args,
	array(
		'attributes' => array(
			'show_excerpt'  => false,
			'show_taxonomy' => false,
			'show_more'     => false,
			'show_author'   => false,
			'show_avatar'   => false,
			'show_comments' => false,
			'show_date'     => false,
			'show_meta'     => true,
			'order' => null,
			'author'        => null,
			'is_single'     => false,
			'is_singular'   => false
		),
	)
);

$attributes  = $data['attributes'];
$author      = $attributes['author'];
$is_single   = $attributes['is_single'];
$is_singular = $attributes['is_singular'];
$order  = $attributes['order'];

$post_wrap_classes = '';

if ( $order ) {
	$post_wrap_classes .= ' with-order';
}

?>
<div class="card post-wrap<?php echo $post_wrap_classes; ?>">
	<div class="post-main">
	<div class="card--pad post-content">
		<?php
		if ( $attributes['show_taxonomy'] ) {
			if ( $is_single ) {
				$cats = get_the_category();
				?>
				<div class="post-taxonomy">
					<?php
					foreach ( $cats as $key => $value ) {
						echo '<a href="' . get_category_link( $value->term_id ) . '"  class="cat category-' . $value->slug . '">' . $value->name . '</a>';
					}
					?>
				</div>
				<?php
			}
		}
		?>
		<div class="post-title">
			<?php
			if ( $is_singular ) {
				the_title( '<h4 class="entry-title">', '</h4>' );
			} else {
				the_title( '<h4 class="entry-title"><a href="' . esc_url( get_permalink() ) . '">', '</a></h4>' );
			}
			?>
		</div>
		<?php
		if ( $attributes['show_excerpt'] ) {
			?>
			<div class="post-summary">
			<?php
				the_excerpt();
			?>
			</div>
			<?php
		}

		if ( $attributes['show_meta'] ) {
			?>
				<div class="post-meta">
				<?php
				if ( $attributes['show_avatar'] && $author ) {
					$bio = $author['bio'];

					$avatar = ( array_key_exists( 'avatar_size', $bio ) && array_key_exists( $bio['avatar_size'], $bio['avatar_urls'] ) ) ? $bio['avatar_urls'][ $bio['avatar_size'] ] : ( array_key_exists( '96', $bio ) ? $bio['avatar_urls']['96'] : '' );

					if ( $avatar ) {
						echo '<span class="post-avatar"><a href="/author/' . get_the_author_meta( 'user_nicename' ) . '/"><img src="' . $avatar . '" class="avatar" /></a></span>';
					}
				}

				if ( $attributes['show_author'] ) {
					echo '<span class="post-author"><a href="/author/' . get_the_author_meta( 'user_nicename' ) . '/">' . get_the_author_meta( 'user_nicename' ) . '</a></span>';
				}

				if ( $attributes['show_date'] ) {
					echo '<span class="post-date">' . get_the_time( get_option( 'date_format' ) ) . '</span>';
				}

				if ( $attributes['show_comments'] ) {
					$comments_number = absint( get_comments_number() );

					echo '<span class="post-comments"><a href="' . esc_url( get_permalink() ) . '#comments"><i class="icon icon-comment"></i> ' . $comments_number . ' Comments</a></span>';
				}
				?>
				</div>
			<?php
		}
		?>
		</div>
	<?php
	if ( $attributes['show_more'] ) {
		?>
			<div class="post-more"><a href="<?php echo esc_url( get_permalink() ); ?>">Read More</a></div>
			<?php
	}
	?>
	</div>
</div>
