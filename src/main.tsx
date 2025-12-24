import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registra Service Worker para PWA (apenas em produção)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registrado com sucesso:', registration.scope);

        // Verifica atualizações periodicamente
        setInterval(() => {
          registration.update();
        }, 60000); // A cada 1 minuto
      })
      .catch((error) => {
        console.log('Erro ao registrar Service Worker:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
