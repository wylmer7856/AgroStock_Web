// ➕ PÁGINA PARA CREAR NUEVO PRODUCTO

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ProductoForm } from '../../Screens/PRODUCTOR/ProductoForm';

const NuevoProductoPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const fromDashboard = searchParams.get('from') === 'dashboard';

  const handleClose = () => {
    // Si viene del dashboard, regresar al dashboard, sino a la lista de productos
    navigate(fromDashboard ? '/productor/dashboard' : '/productor/productos');
  };

  const handleSuccess = async () => {
    // Invalidar y refetch las queries para actualizar la lista inmediatamente
    await queryClient.invalidateQueries({ 
      queryKey: ['productos', 'productor']
    });
    await queryClient.invalidateQueries({ 
      queryKey: ['productos']
    });
    
    // Forzar refetch de las queries para que se actualicen inmediatamente
    await queryClient.refetchQueries({ 
      queryKey: ['productos', 'productor']
    });
    
    // Mostrar mensaje de éxito
    toast.success('✅ Producto creado exitosamente');
    
    // Navegar después de un pequeño delay para asegurar que las queries se actualizaron
    setTimeout(() => {
      navigate(fromDashboard ? '/productor/dashboard' : '/productor/productos');
    }, 100);
  };

  return (
    <div className="container-fluid py-4">
      <ProductoForm
        key="nuevo-producto"
        productoId={null}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default NuevoProductoPage;

