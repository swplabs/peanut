import { useEffect, useState } from 'react';
import style from './style.scss';

const Screen = ({ screen }) => {
  const { url: screenUrl = 'about:blank' } = screen;
  // const [url, setUrl] = useState(screenUrl);

  /*
  useEffect(() => {
    console.log('key triggered effect', key);
    // setUrl(screenUrl);
  }, [key]);
  */

  return (
    <div className={style.container}>
      <iframe src={screenUrl} className={style.screen}></iframe>
    </div>
  );
};

export default Screen;
