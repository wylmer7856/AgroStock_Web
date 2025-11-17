// PANTALLA DE GESTIÓN DE LISTAS DE DESEOS - ADMIN

import React, { useState, useEffect } from 'react';
import adminService from '../../services/admin';
import { Card, Button, Loading } from '../../components/ReusableComponents';
import Swal from 'sweetalert2';
import './AdminScreens.css';

interface ListaDeseo {
  id_lista: number;
  id_usuario: number;
  nombre_usuario?: string;
  id_producto: number;
  nombre_producto?: string;
  precio?: number;
  fecha_agregado: string;
}

interface ListasDeseosScreenProps {
  onNavigate: (view: string) => void;
}

export const ListasDeseosScreen: React.FC<ListasDeseosScreenProps> = ({ onNavigate }) => {
  const [listas, setListas] = useState<ListaDeseo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarListas();
  }, []);

  const cargarListas = async () => {
    try {
      setLoading(true);
      const response = await adminService.getListasDeseos();
      if (response.success && response.data) {
        setListas(response.data);
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error cargando listas de deseos', confirmButtonColor: '#2d5016' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1>Gestión de Listas de Deseos</h1>
          <p>Administra todas las listas de deseos</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => onNavigate('overview')}>
            ← Dashboard
          </Button>
          <Button variant="primary" onClick={cargarListas}>Actualizar</Button>
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
                <th>Precio</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {listas.map((l) => (
                <tr key={l.id_lista}>
                  <td>{l.id_lista}</td>
                  <td>{l.nombre_usuario || `ID: ${l.id_usuario}`}</td>
                  <td>{l.nombre_producto || `ID: ${l.id_producto}`}</td>
                  <td>${l.precio?.toLocaleString() || 'N/A'}</td>
                  <td>{new Date(l.fecha_agregado).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {listas.length === 0 && <div className="empty-state">No hay listas de deseos</div>}
        </div>
      </Card>
    </div>
  );
};

