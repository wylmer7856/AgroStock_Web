import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'consumidor' | 'productor')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [hasWaited, setHasWaited] = useState(false);

  // Esperar un momento para que el AuthContext termine de verificar la autenticación
  // Esto evita redirecciones innecesarias al login al recargar
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasWaited(true);
    }, 200); // Esperar 200ms para que se complete la verificación inicial

    return () => clearTimeout(timer);
  }, []);

  // Mostrar loading mientras se verifica o mientras esperamos
  if (isLoading || !hasWaited) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // Solo redirigir al login si realmente no está autenticado después de esperar
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;






