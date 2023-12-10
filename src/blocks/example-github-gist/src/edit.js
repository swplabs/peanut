import { Panel, PanelBody, TextControl } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { Fragment } from '@wordpress/element';

const placeHolderStyle = {
  backgroundColor: '#ccc',
  padding: '20px',
  margin: '20px 0'
};

import metadata from './metadata.json';

const blockName = metadata.name.split('/')[1];

export default (props) => {
  const {
    attributes: { gist_id },
    setAttributes
  } = props;

  return (
    <Fragment>
      <InspectorControls key={`pfwp-block-${blockName}`}>
        <Panel key="pfwp-panel-section">
          <PanelBody key="pfwp-panelbody-section" initialOpen={true} title="Github Settings">
            <TextControl
              key="select-gist_id"
              label="Gist ID"
              value={gist_id}
              onChange={(newValue) => {
                setAttributes({
                  gist_id: newValue
                });
              }}
            />
          </PanelBody>
        </Panel>
      </InspectorControls>
      <div style={placeHolderStyle} key="display">
        {gist_id ? `${gist_id} (Github Gist)` : 'Placeholder (Content Section)'}
      </div>
    </Fragment>
  );
};
