import { useEffect, useState } from 'react';
import style from './style.scss';

const Screen = ({ screenUrl = 'about:blank' }) => {
  const [url, setUrl] = useState(screenUrl);

  useEffect(() => {
    setUrl(screenUrl);
  }, [screenUrl]);

  return (
    <div className={style.container}>
      <iframe src={url} className={style.screen}></iframe>
    </div>
  );
};

export default Screen;
