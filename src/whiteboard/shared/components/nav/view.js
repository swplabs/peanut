import icons from '../app/scss/icons.scss';
import style from './style.scss';

const Nav = () => {
  return (
    <div className={style.container}>
      <div className={style.logo}>Whiteboard</div>
      <div className={style.menu}>
        <ul>
          <li className={style.navItem}>
            <a href="/">
              <i className={`${style.icon} ${icons['icon-puzzle']}`}></i>
              <span>Example</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Nav;
