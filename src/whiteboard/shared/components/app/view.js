import Schema from '../schema/view.js';
import styles from './style.scss';

const App = () => {
  return (
    <div className={styles.schema}>
      <Schema />
    </div>
  );
};

export default App;
