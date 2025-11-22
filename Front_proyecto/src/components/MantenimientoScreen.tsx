import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import mantenimientoAnimation from '../assets/consultoria tecnica.json';
import './MantenimientoScreen.css';

const MantenimientoScreen: React.FC = () => {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // Cargar la animación
    setAnimationData(mantenimientoAnimation);
  }, []);

  return (
    <div className="mantenimiento-container">
      <div className="mantenimiento-content">
        {animationData && (
          <div className="mantenimiento-animation">
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              style={{ width: '100%', maxWidth: '600px', height: 'auto' }}
            />
          </div>
        )}
        <div className="mantenimiento-text">
          <h1>Sistema en Mantenimiento</h1>
          <p>Estamos realizando mejoras en el sistema para brindarte una mejor experiencia.</p>
          <p>Por favor, vuelve a intentar más tarde.</p>
          <div className="mantenimiento-info">
            <p>Si tienes alguna pregunta urgente, contáctanos:</p>
            <p className="contact-info">📧 contacto@agrostock.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MantenimientoScreen;

