import Nav from '../nav/view.js';
import Schema from '../schema/view.js';
import styles from './style.scss';

const App = () => {
  return (
    <div className={styles.container}>
      <Nav />
      <Schema />
    </div>
  );
};

export default App;
