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

  const handleSuccess = () => {
    // Invalidar las queries inmediatamente para recargar los productos
    queryClient.invalidateQueries({ queryKey: ['productos', 'productor'] });
    queryClient.invalidateQueries({ queryKey: ['productos'] });
    
    // Mostrar mensaje de éxito
    toast.success('✅ Producto creado exitosamente');
    
    // Navegar inmediatamente (el mensaje toast se mantiene visible)
    // Si viene del dashboard, regresar al dashboard, sino a la lista de productos
    navigate(fromDashboard ? '/productor/dashboard' : '/productor/productos');
  };

  return (
    <div className="container-fluid py-4">
      <ProductoForm
        productoId={null}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default NuevoProductoPage;

