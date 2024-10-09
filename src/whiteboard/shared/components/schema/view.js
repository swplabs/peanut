import { useEffect, useState } from 'react';
import Form from '@rjsf/fluent-ui';
import validator from '@rjsf/validator-ajv8';

import style from './style.scss';

const Schema = ({ pfwpConfig: { wp_host }, screen }) => {
  const { key: screenKey } = screen;

  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState({});

  useEffect(() => {
    if (!screenKey) return;

    setLoading(true);

    const fetchData = async () => {
      try {
        const response = await fetch(`${wp_host}/wp-json/pfwp/v1/metadata/${screenKey}/`);
        const data = await response.json();

        console.log('fetchData', screenKey, data);
        setMetadata(data);
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    };

    fetchData();
  }, [screenKey, wp_host]);

  return loading ? (
    <div className={style.container}>Loading...</div>
  ) : (
    <div className={style.container}>
      <div className={style.header}>
        <div>{screenKey || 'Choose a component'}</div>
        <div className={style.schemaControls}>
          <i className={`${style.icon} bi-layout-sidebar-reverse`}></i>
        </div>
      </div>
      <div className={style.jsonSchemaContainer}>
        {metadata?.data_schema ? (
          <Form schema={metadata.data_schema} validator={validator} />
        ) : null}
      </div>
    </div>
  );
};

export default Schema;
