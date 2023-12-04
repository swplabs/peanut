<?php
class PFWP_Walker_Comment extends Walker_Comment {
	protected function html5_comment( $comment, $depth, $args ) {

		$comment_author_url = get_comment_author_url( $comment );
		$comment_author     = get_comment_author( $comment );
		$avatar             = get_avatar( $comment, $args['avatar_size'] );
		$tag                = ( 'div' === $args['style'] ) ? 'div' : 'li';
		$comment_id         = get_comment_ID();

		?>
		<<?php echo $tag; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static output ?> id="comment-<?php echo $comment_id; ?>" <?php comment_class( $this->has_children ? 'parent' : '', $comment ); ?>>
		<div class="comment-container">
			<div class="comment-avatar">
			<?php
			if ( 0 !== $args['avatar_size'] ) {
				echo wp_kses_post( $avatar );
			}
			?>
			</div><!-- /comment-avatar -->
			<div class="comment-content">
			<div class="comment-meta">
				<?php
				printf(
					'<span class="comment-author">%1$s</span> on <a href="#comment-%2$s" class="comment-time">%3$s %4$s</a>',
					esc_html( $comment_author ),
					$comment_id,
					get_comment_date( '', $comment ),
					get_comment_time()
				);
				?>
			</div><!-- /comment-meta -->

			<div class="comment-text">
				<?php
				comment_text();

				if ( '0' === $comment->comment_approved ) {
					?>
					<p class="comment-awaiting-moderation"><?php _e( 'Your comment is awaiting moderation.', 'swp' ); ?></p>
					<?php
				}
				?>
			</div><!-- /comment-text -->
			<div class="comment-reply">
				<a rel="nofollow" href="#comment-<?php echo $comment_id; ?>" class="comment-reply-link" data-reply-id="<?php echo $comment_id; ?>">Reply</a>							
			</div>
			</div><!-- /comment-content-->
		</div><!-- /comment-container -->

		<?php
	}
}
?>
