import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { warmUpApi } from './lib/api';
import './index.css';

warmUpApi();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
