import Nav from '../nav/view.js';
import Schema from '../schema/view.js';
import styles from './style.scss';

const App = ({ config }) => {
  return (
    <div className={styles.container}>
      <Nav pfwpConfig={config} />
      <Schema />
    </div>
  );
};

export default App;
