// ✏️ PÁGINA PARA EDITAR PRODUCTO

import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ProductoForm } from '../../Screens/PRODUCTOR/ProductoForm';

const EditarProductoPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromDashboard = searchParams.get('from') === 'dashboard';

  const productoId = id ? parseInt(id, 10) : null;

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
    await queryClient.invalidateQueries({ 
      queryKey: ['producto', productoId]
    });
    
    // Forzar refetch de las queries para que se actualicen inmediatamente
    await queryClient.refetchQueries({ 
      queryKey: ['productos', 'productor']
    });
    
    // Mostrar mensaje de éxito
    toast.success('✅ Producto actualizado exitosamente');
    
    // Navegar después de un pequeño delay para asegurar que las queries se actualizaron
    setTimeout(() => {
      navigate(fromDashboard ? '/productor/dashboard' : '/productor/productos');
    }, 100);
  };

  if (!productoId || isNaN(productoId)) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">
          ID de producto inválido
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/productor/productos')}
        >
          Volver a Productos
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <ProductoForm
        productoId={productoId}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default EditarProductoPage;

