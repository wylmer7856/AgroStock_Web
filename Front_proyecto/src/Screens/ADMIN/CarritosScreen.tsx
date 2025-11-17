// PANTALLA DE GESTIÓN DE CARRITOS - ADMIN

import React, { useState, useEffect } from 'react';
import adminService from '../../services/admin';
import { Card, Button, Loading } from '../../components/ReusableComponents';
import Swal from 'sweetalert2';
import './AdminScreens.css';

interface Carrito {
  id_carrito: number;
  id_usuario: number;
  nombre_usuario?: string;
  id_producto: number;
  nombre_producto?: string;
  cantidad: number;
  precio?: number;
  fecha_agregado: string;
}

interface CarritosScreenProps {
  onNavigate: (view: string) => void;
}

export const CarritosScreen: React.FC<CarritosScreenProps> = ({ onNavigate }) => {
  const [carritos, setCarritos] = useState<Carrito[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarCarritos();
  }, []);

  const cargarCarritos = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCarritos();
      if (response.success && response.data) {
        setCarritos(response.data);
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error cargando carritos', confirmButtonColor: '#2d5016' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1>Gestión de Carritos</h1>
          <p>Administra todos los carritos de compra</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => onNavigate('overview')}>
            ← Dashboard
          </Button>
          <Button variant="primary" onClick={cargarCarritos}>Actualizar</Button>
        </div>
      </div>

      <Card>
        <div className="usuarios-table-container">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {carritos.map((c) => (
                <tr key={c.id_carrito}>
                  <td>{c.id_carrito}</td>
                  <td>{c.nombre_usuario || `ID: ${c.id_usuario}`}</td>
                  <td>{c.nombre_producto || `ID: ${c.id_producto}`}</td>
                  <td>{c.cantidad}</td>
                  <td>${c.precio?.toLocaleString() || 'N/A'}</td>
                  <td>${((c.precio || 0) * c.cantidad).toLocaleString()}</td>
                  <td>{new Date(c.fecha_agregado).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {carritos.length === 0 && <div className="empty-state">No hay carritos</div>}
        </div>
      </Card>
    </div>
  );
};

