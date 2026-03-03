import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './hooks/useAuth';
import { TiposEnsayoProvider } from './hooks/useTiposEnsayoData';
import './styles/variables.css';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <TiposEnsayoProvider>
        <App />
      </TiposEnsayoProvider>
    </AuthProvider>
  </StrictMode>
);
