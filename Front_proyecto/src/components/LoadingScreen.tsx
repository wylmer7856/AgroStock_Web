// ⏳ Componente de carga mientras se inicializa la app

import React, { useEffect } from 'react';

const LoadingScreen: React.FC = () => {
  useEffect(() => {
    console.log('⏳ LoadingScreen montado - Esperando verificación de autenticación...');
  }, []);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <h4 className="text-primary mb-2">AgroStock</h4>
        <p className="text-muted">Cargando aplicación...</p>
        <small className="text-muted d-block mt-2">Verificando autenticación...</small>
      </div>
    </div>
  );
};

export default LoadingScreen;

