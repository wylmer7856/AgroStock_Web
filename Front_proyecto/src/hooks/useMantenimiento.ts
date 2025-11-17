import { useState, useEffect } from 'react';
import adminService from '../services/admin';
import { useAuth } from '../contexts/AuthContext';

export const useMantenimiento = () => {
  const [isMantenimiento, setIsMantenimiento] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const verificarMantenimiento = async () => {
      // Solo verificar si el usuario es admin
      // Para otros usuarios, asumir que no hay mantenimiento
      if (user?.rol !== 'admin') {
        setIsMantenimiento(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await adminService.getSystemConfig();
        if (response.success && response.data) {
          setIsMantenimiento(response.data.mantenimiento === true);
        }
      } catch (error) {
        console.error('Error verificando estado de mantenimiento:', error);
        // En caso de error, no activar mantenimiento
        setIsMantenimiento(false);
      } finally {
        setLoading(false);
      }
    };

    verificarMantenimiento();

    // Verificar cada 30 segundos solo si es admin
    if (user?.rol === 'admin') {
      const interval = setInterval(verificarMantenimiento, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.rol]);

  return { isMantenimiento, loading };
};

