// PANTALLA DE GESTIÓN DE MENSAJES - ADMIN

import React, { useState, useEffect } from 'react';
import adminService from '../../services/admin';
import { Card, Button, Loading, Badge } from '../../components/ReusableComponents';
import Swal from 'sweetalert2';
import './AdminScreens.css';

interface Mensaje {
  id_mensaje: number;
  id_remitente: number;
  id_destinatario: number;
  nombre_remitente?: string;
  nombre_destinatario?: string;
  nombre_producto?: string;
  asunto: string;
  mensaje: string;
  tipo_mensaje: string;
  leido: boolean;
  fecha_envio: string;
}

interface MensajesScreenProps {
  onNavigate: (view: string) => void;
}

export const MensajesScreen: React.FC<MensajesScreenProps> = ({ onNavigate }) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarMensajes();
  }, []);

  const cargarMensajes = async () => {
    try {
      setLoading(true);
      const response = await adminService.getMensajes();
      if (response.success && response.data) {
        setMensajes(response.data);
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error cargando mensajes', confirmButtonColor: '#2d5016' });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id_mensaje: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar mensaje?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        const response = await adminService.eliminarMensaje(id_mensaje);
        if (response.success) {
          setMensajes(prev => prev.filter(m => m.id_mensaje !== id_mensaje));
          Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Mensaje eliminado', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error eliminando mensaje', confirmButtonColor: '#2d5016' });
      }
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1>Gestión de Mensajes</h1>
          <p>Administra todos los mensajes del sistema</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => onNavigate('overview')}>
            ← Dashboard
          </Button>
          <Button variant="primary" onClick={cargarMensajes}>Actualizar</Button>
        </div>
      </div>

      <Card>
        <div className="usuarios-table-container">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Remitente</th>
                <th>Destinatario</th>
                <th>Asunto</th>
                <th>Tipo</th>
                <th>Leído</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mensajes.map((msg) => (
                <tr key={msg.id_mensaje}>
                  <td>{msg.id_mensaje}</td>
                  <td>{msg.nombre_remitente || 'N/A'}</td>
                  <td>{msg.nombre_destinatario || 'N/A'}</td>
                  <td>{msg.asunto}</td>
                  <td><Badge variant="info" size="small">{msg.tipo_mensaje}</Badge></td>
                  <td><Badge variant={msg.leido ? 'success' : 'warning'} size="small">{msg.leido ? 'Sí' : 'No'}</Badge></td>
                  <td>{new Date(msg.fecha_envio).toLocaleDateString()}</td>
                  <td>
                    <Button size="small" variant="danger" onClick={() => handleEliminar(msg.id_mensaje)}>🗑️</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {mensajes.length === 0 && <div className="empty-state">No hay mensajes</div>}
        </div>
      </Card>
    </div>
  );
};

