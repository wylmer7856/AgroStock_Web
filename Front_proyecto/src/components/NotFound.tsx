// 🚫 COMPONENTE DE PÁGINA 404 - NO ENCONTRADO

import React, { useEffect, useState } from 'react';
import { Button } from './ReusableComponents';
import { useAuth } from '../contexts/AuthContext';
import './NotFound.css';

interface NotFoundMessage {
  title: string;
  message: string;
  suggestions: string[];
  buttonText: string;
  image: string;
}

export const NotFound: React.FC = () => {
  const { setCurrentView } = useAuth();
  const [message, setMessage] = useState<NotFoundMessage | null>(null);

  useEffect(() => {
    // Cargar mensaje personalizado desde JSON
    fetch('/assets/json/404-message.json')
      .then(res => res.json())
      .then(data => setMessage(data))
      .catch(() => {
        // Si falla, usar mensaje por defecto
        setMessage({
          title: '¡Ups! Página no encontrada',
          message: 'Lo sentimos, la página que buscas no existe o ha sido movida.',
          suggestions: [
            'Verifica que la URL esté correcta',
            'Regresa a la página principal',
            'Usa el menú de navegación',
            'Busca lo que necesitas en el buscador'
          ],
          buttonText: 'Volver al Inicio',
          image: '/assets/404/404-illustration.svg'
        });
      });
  }, []);

  const handleGoHome = () => {
    setCurrentView('welcome');
    window.history.pushState({}, '', '/');
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        {message && (
          <>
            <div className="not-found-illustration">
              <img 
                src={message.image} 
                alt="404 Not Found" 
                onError={(e) => {
                  // Fallback si la imagen no existe
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNGNUY3RkEiLz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0UwRjJGRSIvPjxwYXRoIGQ9Ik0wLDE1MCBMMTAwLDgwIEwyMDAsMTIwIEwzMDAsNjAgTDQwMCwxMDAgTDQwMCwxNTAgWiIgZmlsbD0iI0NCRDVFMCIvPjxsaW5lIHgxPSI1MCIgeTE9IjIwMCIgeDI9IjM1MCIgeTI9IjIwMCIgc3Ryb2tlPSIjNEE3QzQ3IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjUsNSIvPjx0ZXh0IHg9IjIwMCIgeT0iMTMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMkQ1MDE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj40MDQ8L3RleHQ+PC9zdmc+';
                }}
              />
            </div>

            <h1 className="not-found-title">{message.title}</h1>
            <p className="not-found-message">{message.message}</p>

            {message.suggestions && message.suggestions.length > 0 && (
              <div className="not-found-suggestions">
                <h3>Puedes intentar:</h3>
                <ul>
                  {message.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="not-found-actions">
              <Button 
                variant="primary" 
                size="large"
                onClick={handleGoHome}
              >
                🏠 {message.buttonText}
              </Button>
              <Button 
                variant="secondary" 
                size="large"
                onClick={() => window.history.back()}
              >
                ← Volver Atrás
              </Button>
            </div>
          </>
        )}

        {!message && (
          <div className="not-found-loading">
            <div className="loading-spinner"></div>
            <p>Cargando...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;




