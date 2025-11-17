// PANTALLA DE GESTIÓN DE RESEÑAS - ADMIN

import React, { useState, useEffect } from 'react';
import adminService from '../../services/admin';
import { Card, Button, Loading, Badge } from '../../components/ReusableComponents';
import Swal from 'sweetalert2';
import './AdminScreens.css';

interface Resena {
  id_resena: number;
  id_pedido: number;
  id_producto: number;
  id_consumidor: number;
  id_productor: number;
  nombre_consumidor?: string;
  nombre_productor?: string;
  nombre_producto?: string;
  calificacion: number;
  comentario?: string;
  fecha_resena: string;
}

interface ResenasScreenProps {
  onNavigate: (view: string) => void;
}

export const ResenasScreen: React.FC<ResenasScreenProps> = ({ onNavigate }) => {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarResenas();
    
    // Actualización automática cada 30 segundos
    const interval = setInterval(() => {
      cargarResenas();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const cargarResenas = async () => {
    try {
      setLoading(true);
      const response = await adminService.getResenas();
      if (response.success && response.data) {
        setResenas(response.data);
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error cargando reseñas', confirmButtonColor: '#2d5016' });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id_resena: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar reseña?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        const response = await adminService.eliminarResena(id_resena);
        if (response.success) {
          setResenas(prev => prev.filter(r => r.id_resena !== id_resena));
          Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Reseña eliminada', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error eliminando reseña', confirmButtonColor: '#2d5016' });
      }
    }
  };

  const renderStars = (calificacion: number) => {
    return '⭐'.repeat(calificacion) + '☆'.repeat(5 - calificacion);
  };

  if (loading) return <Loading />;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1>Gestión de Reseñas</h1>
          <p>Administra todas las reseñas del sistema</p>
        </div>
      </div>

      <Card>
        <div className="usuarios-table-container">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Consumidor</th>
                <th>Productor</th>
                <th>Producto</th>
                <th>Calificación</th>
                <th>Comentario</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {resenas.map((resena) => (
                <tr key={resena.id_resena}>
                  <td>{resena.id_resena}</td>
                  <td>{resena.nombre_consumidor || 'N/A'}</td>
                  <td>{resena.nombre_productor || 'N/A'}</td>
                  <td>{resena.nombre_producto || 'N/A'}</td>
                  <td>{renderStars(resena.calificacion)}</td>
                  <td>{resena.comentario || 'Sin comentario'}</td>
                  <td>{new Date(resena.fecha_resena).toLocaleDateString()}</td>
                  <td>
                    <Button size="small" variant="danger" onClick={() => handleEliminar(resena.id_resena)}>🗑️</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resenas.length === 0 && <div className="empty-state">No hay reseñas</div>}
        </div>
      </Card>
    </div>
  );
};

