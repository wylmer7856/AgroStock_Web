import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import campiAnimation from '../assets/Campi.json';
import logoProyecto from '../assets/logoProyecto.png';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number; // Duración en milisegundos
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Esperar un poco para la animación de salida
      setTimeout(() => {
        onComplete();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className={`splash-screen ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="splash-content">
        <div className="splash-animation">
          <Lottie
            animationData={campiAnimation}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="splash-text">
          <img 
            src={logoProyecto} 
            alt="AgroStock Logo" 
            className="splash-logo"
          />
          <p className="splash-subtitle">Conectando el campo con tu mesa</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

