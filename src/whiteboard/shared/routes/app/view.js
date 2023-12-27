import { hydrateRoot } from 'react-dom/client';
import App from '../../components/app/view.js';

export default ({ root }) => hydrateRoot(root || document.getElementById('root'), <App />);
