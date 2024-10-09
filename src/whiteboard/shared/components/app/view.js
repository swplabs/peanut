import { useState } from 'react';

import Nav from '../nav/view.js';
import Schema from '../schema/view.js';
import Screen from '../screen/view.js';
import styles from './style.scss';

const App = ({ config }) => {
  const [screen, setScreen] = useState({});

  return (
    <div className={styles.container}>
      <Nav pfwpConfig={config} setScreen={setScreen} />
      <Screen screen={screen} />
      <Schema pfwpConfig={config} screen={screen} setScreen={setScreen} />
    </div>
  );
};

export default App;
