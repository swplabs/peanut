import { hydrateRoot } from 'react-dom/client';
import App from '../../components/app/view.js';

export default ({ root, config }) =>
  hydrateRoot(root || document.getElementById('root'), <App config={config} />);
