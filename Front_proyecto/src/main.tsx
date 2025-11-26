import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { initSmallTooltips, observeTooltips } from './utils/tooltip'

// Verificar que el root existe
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento root');
}

// Configurar React Query con opciones más estrictas para prevenir recargas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 10 * 60 * 1000, // 10 minutos - aumentar tiempo de stale
      gcTime: 30 * 60 * 1000, // 30 minutos - tiempo de garbage collection
    },
  },
});

// Renderizar la app
// Deshabilitar StrictMode temporalmente para evitar doble render en desarrollo
createRoot(rootElement).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
)

// Inicializar tooltips pequeños personalizados - EJECUTAR INMEDIATAMENTE
// Ejecutar múltiples veces para asegurar que se aplique
const initTooltips = () => {
  initSmallTooltips();
  // Ejecutar de nuevo después de un pequeño delay
  setTimeout(initSmallTooltips, 100);
  setTimeout(initSmallTooltips, 500);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
    observeTooltips();
  });
} else {
  initTooltips();
  observeTooltips();
}

// También ejecutar cuando React renderice
setTimeout(() => {
  initSmallTooltips();
}, 1000);
setTimeout(() => {
  initSmallTooltips();
}, 2000);

// Log para debug
console.log('✅ AgroStock Frontend iniciado');
console.log('🌐 Backend API:', import.meta.env.VITE_API_URL || '/api');
console.log('🔧 Modo:', import.meta.env.MODE || 'development');

// Manejar errores no capturados
window.addEventListener('error', (event) => {
  console.error('🚨 Error global no capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Promise rechazada no manejada:', event.reason);
});
