import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { mirrorRouteToContainer } from './lib/flextudio-bridge';
import App from './App';
import './index.css';

mirrorRouteToContainer();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
