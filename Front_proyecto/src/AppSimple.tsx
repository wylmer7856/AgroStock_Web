// 🐛 VERSIÓN SIMPLIFICADA PARA DEBUG
// Usa esta versión temporalmente para identificar el problema

import { Routes, Route } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';

// Componente de prueba muy simple
const TestPage = () => {
  console.log('✅ TestPage renderizando');
  
  return (
    <div style={{ 
      padding: '50px', 
      backgroundColor: '#e8f5e9', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#2D5016', fontSize: '48px', marginBottom: '20px' }}>
        ✅ FRONTEND FUNCIONANDO
      </h1>
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#2D5016' }}>Estado del Sistema:</h2>
        <ul style={{ fontSize: '18px', lineHeight: '2' }}>
          <li>✅ React está funcionando</li>
          <li>✅ Vite está funcionando</li>
          <li>✅ Routing está funcionando</li>
          <li>✅ Este componente se renderizó correctamente</li>
        </ul>
        <p style={{ marginTop: '20px', fontSize: '16px', color: '#666' }}>
          Si ves este mensaje, React y Vite están funcionando correctamente.
        </p>
        <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
          Fecha: {new Date().toLocaleString('es-ES')}
        </p>
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>Próximo paso:</strong> Si esto funciona, el problema está en App.tsx o AuthContext.
            Vuelve a cambiar a App.tsx normal.
          </p>
        </div>
      </div>
    </div>
  );
};

const AppSimple = () => {
  console.log('🚀 AppSimple iniciando...');
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TestPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="*" element={<TestPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppSimple;
