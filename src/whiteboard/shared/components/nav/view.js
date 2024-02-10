import icons from '../app/scss/icons.scss';
import style from './style.scss';

const Nav = ({
  pfwpConfig: {
    wp_host,
    compilations: {
      components_elements: {
        entry_map: entryMap
        // TODO: use metadata for link params
        // metadata
      }
    }
  },
  setScreenUrl
}) => {
  const updateScreen = (e, url) => {
    e.preventDefault();
    setScreenUrl(url);
  };

  return (
    <div className={style.container}>
      <div className={style.logo}>Whiteboard</div>
      <div className={style.menu}>
        <ul>
          {Object.keys(entryMap).map((key) => {
            return (
              <li className={style.navItem} key={key}>
                <a
                  href={`${wp_host}/_pfwp_wb/components/${key}/`}
                  onClick={(e) => updateScreen(e, `${wp_host}/_pfwp_wb/components/${key}/`)}
                >
                  <i className={`${style.icon} ${icons['icon-puzzle']}`}></i>
                  <span>{key}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Nav;
