// PANTALLA DE HISTORIAL DE PRECIOS - ADMIN

import React, { useState, useEffect } from 'react';
import adminService from '../../services/admin';
import { Card, Button, Loading, Input } from '../../components/ReusableComponents';
import Swal from 'sweetalert2';
import './AdminScreens.css';

interface HistorialPrecio {
  id_historial: number;
  id_producto: number;
  nombre_producto?: string;
  nombre_usuario?: string;
  precio_anterior: number;
  precio_nuevo: number;
  fecha_cambio: string;
}

interface HistorialPreciosScreenProps {
  onNavigate: (view: string) => void;
}

export const HistorialPreciosScreen: React.FC<HistorialPreciosScreenProps> = ({ onNavigate }) => {
  const [historial, setHistorial] = useState<HistorialPrecio[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroProducto, setFiltroProducto] = useState('');

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const id_producto = filtroProducto ? parseInt(filtroProducto) : undefined;
      const response = await adminService.getHistorialPrecios(id_producto);
      if (response.success && response.data) {
        setHistorial(response.data);
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error cargando historial de precios', confirmButtonColor: '#2d5016' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1>Historial de Precios</h1>
          <p>Consulta el historial de cambios de precios</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => onNavigate('overview')}>
            ← Dashboard
          </Button>
          <Button variant="primary" onClick={cargarHistorial}>Actualizar</Button>
        </div>
      </div>

      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label>Filtrar por ID Producto:</label>
          <Input type="number" value={filtroProducto} onChange={(e) => setFiltroProducto(e.target.value)} placeholder="ID Producto" style={{ width: '200px' }} />
          <Button variant="secondary" onClick={cargarHistorial}>Filtrar</Button>
          {filtroProducto && <Button variant="secondary" onClick={() => { setFiltroProducto(''); cargarHistorial(); }}>Limpiar</Button>}
        </div>
      </Card>

      <Card>
        <div className="usuarios-table-container">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Usuario</th>
                <th>Precio Anterior</th>
                <th>Precio Nuevo</th>
                <th>Cambio</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h) => {
                const cambio = h.precio_nuevo - h.precio_anterior;
                const porcentaje = ((cambio / h.precio_anterior) * 100).toFixed(2);
                return (
                  <tr key={h.id_historial}>
                    <td>{h.id_historial}</td>
                    <td>{h.nombre_producto || `ID: ${h.id_producto}`}</td>
                    <td>{h.nombre_usuario || 'N/A'}</td>
                    <td>${h.precio_anterior.toLocaleString()}</td>
                    <td>${h.precio_nuevo.toLocaleString()}</td>
                    <td style={{ color: cambio >= 0 ? '#059669' : '#dc2626' }}>
                      {cambio >= 0 ? '+' : ''}${cambio.toLocaleString()} ({porcentaje}%)
                    </td>
                    <td>{new Date(h.fecha_cambio).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {historial.length === 0 && <div className="empty-state">No hay historial de precios</div>}
        </div>
      </Card>
    </div>
  );
};

