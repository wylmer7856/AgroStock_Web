// 🐛 VERSIÓN DE DEBUG - Para identificar problemas
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Componente de prueba muy simple
const DebugPage: React.FC = () => {
  console.log('✅ DebugPage renderizando');
  
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
        marginTop: '20px'
      }}>
        <h2 style={{ color: '#2D5016' }}>Estado del Sistema:</h2>
        <ul style={{ fontSize: '18px', lineHeight: '2' }}>
          <li>✅ React está funcionando</li>
          <li>✅ Vite está funcionando</li>
          <li>✅ Routing está funcionando</li>
          <li>✅ Este componente se renderizó correctamente</li>
        </ul>
        <p style={{ marginTop: '20px', fontSize: '16px', color: '#666' }}>
          Si ves este mensaje, el problema está en el componente App.tsx o AuthContext.
        </p>
        <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
          Fecha: {new Date().toLocaleString('es-ES')}
        </p>
      </div>
    </div>
  );
};

const AppDebug: React.FC = () => {
  console.log('🚀 AppDebug iniciando...');
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DebugPage />} />
        <Route path="*" element={<DebugPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppDebug;

