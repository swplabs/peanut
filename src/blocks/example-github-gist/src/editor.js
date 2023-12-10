import { registerBlockType } from '@wordpress/blocks';

import Edit from './edit.js';
import metadata from './metadata.json';

registerBlockType(metadata.name, {
  title: metadata.title,
  icon: 'list-view',
  category: metadata.category,
  attributes: metadata.attributes,
  edit: Edit
});
