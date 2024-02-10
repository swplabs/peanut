import { useState } from 'react';

import Nav from '../nav/view.js';
import Schema from '../schema/view.js';
import Screen from '../screen/view.js';
import styles from './style.scss';

const App = ({ config }) => {
  const [screenUrl, setScreenUrl] = useState(null);

  return (
    <div className={styles.container}>
      <Nav pfwpConfig={config} setScreenUrl={setScreenUrl} />
      <Screen screenUrl={screenUrl} />
      <Schema />
    </div>
  );
};

export default App;
