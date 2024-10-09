import style from './style.scss';

const Screen = ({ screen }) => {
  const { url: screenUrl = 'about:blank' } = screen;

  return (
    <div className={style.container}>
      <iframe src={screenUrl} className={style.screen}></iframe>
    </div>
  );
};

export default Screen;
