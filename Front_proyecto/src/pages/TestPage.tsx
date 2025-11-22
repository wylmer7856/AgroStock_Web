import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'red', fontSize: '32px' }}>✅ PÁGINA DE PRUEBA FUNCIONANDO</h1>
      <p>Si ves este mensaje, React está funcionando correctamente.</p>
      <p>Fecha: {new Date().toLocaleString()}</p>
    </div>
  );
};

export default TestPage;





