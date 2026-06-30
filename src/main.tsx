import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initPwaUpdate } from './utils/pwaUpdate';
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';

initPwaUpdate();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento #root');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
