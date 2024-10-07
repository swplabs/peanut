import { useEffect, useState } from 'react';
import style from './style.scss';

const Schema = ({ pfwpConfig: { wp_host }, screen, setScreen }) => {
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
  }, [screenKey]);

  return loading ? (
    <div className={style.container}>Loading...</div>
  ) : (
    <div className={style.container}>{screenKey || 'Choose a component'}</div>
  );
};

export default Schema;
