import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initStartupCacheCheck } from './utils/cacheManager';

// Run immediate cache invalidation check for app updates
initStartupCacheCheck();

createRoot(document.getElementById('root')!).render(<App />);
