import { useState, useEffect, useRef } from 'react';
import apiService from '../services/api';

export const useMantenimiento = () => {
  const [isMantenimiento, setIsMantenimiento] = useState(false);
  const [loading, setLoading] = useState(true);
  const isVerificandoRef = useRef(false);

  useEffect(() => {
    const verificarMantenimiento = async () => {
      // Evitar múltiples verificaciones simultáneas
      if (isVerificandoRef.current) {
        return;
      }

      try {
        isVerificandoRef.current = true;
        setLoading(true);
        console.log('🔍 Verificando estado de mantenimiento...');
        // Usar endpoint público para verificar mantenimiento (sin autenticación)
        const response = await apiService.get<any>('/admin/configuracion/mantenimiento', false);
        
        // El endpoint devuelve: { success: true, mantenimiento: boolean, message: string }
        // apiService devuelve la respuesta tal cual del backend
        let mantenimientoValue = false;
        
        if (response) {
          // El backend devuelve directamente { success: true, mantenimiento: boolean }
          // Buscar mantenimiento en diferentes lugares posibles
          const mantenimiento = response.mantenimiento ?? 
                               response.data?.mantenimiento ?? 
                               (response.data && typeof response.data === 'object' && 'mantenimiento' in response.data ? response.data.mantenimiento : undefined);
          
          if (mantenimiento !== undefined) {
            mantenimientoValue = mantenimiento === true || 
                                mantenimiento === 'true' || 
                                mantenimiento === 1 ||
                                mantenimiento === '1';
          }
        }
        
        // Solo actualizar el estado si el valor cambió (evita re-renders innecesarios)
        setIsMantenimiento(prevValue => {
          if (prevValue !== mantenimientoValue) {
            console.log('🔧 Estado de mantenimiento cambió:', prevValue, '->', mantenimientoValue);
            return mantenimientoValue;
          }
          return prevValue;
        });
      } catch (error: any) {
        console.error('❌ Error verificando estado de mantenimiento:', error);
        // En caso de error, no activar mantenimiento
        setIsMantenimiento(false);
      } finally {
        setLoading(false);
        isVerificandoRef.current = false;
      }
    };

    // Verificar inmediatamente al montar
    verificarMantenimiento();

    // Deshabilitar verificación periódica de mantenimiento (funcionalidad eliminada)
    // const interval = setInterval(() => {
    //   if (document.visibilityState === 'visible') {
    //     verificarMantenimiento();
    //   }
    // }, 120000);
    // return () => clearInterval(interval);
  }, []);

  return { isMantenimiento, loading };
};

