// PANTALLA DE GESTIÓN DE NOTIFICACIONES - ADMIN

import React, { useState, useEffect } from 'react';
import adminService from '../../services/admin';
import { Card, Button, Loading, Badge, Modal } from '../../components/ReusableComponents';
import Swal from 'sweetalert2';
import './AdminScreens.css';

interface Notificacion {
  id_notificacion: number;
  id_usuario: number;
  nombre_usuario?: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  fecha_creacion: string;
}

interface NotificacionesScreenProps {
  onNavigate: (view: string) => void;
}

export const NotificacionesScreen: React.FC<NotificacionesScreenProps> = ({ onNavigate }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarNotificaciones();
    
    // Actualización automática cada 30 segundos
    const interval = setInterval(() => {
      cargarNotificaciones();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      const response = await adminService.getNotificaciones();
      if (response.success && response.data) {
        setNotificaciones(response.data);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Crear Nueva Notificación',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 1rem; padding: 1rem; background: #e0f2fe; border-radius: 8px; color: #0369a1;">
            <strong>Notificación masiva:</strong> Esta notificación se enviará a todos los usuarios registrados en el sistema.
          </div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
            <i class="bi bi-tag-fill"></i> Tipo de Notificación <span style="color: red;">*</span>
          </label>
          <select id="swal-tipo" class="swal2-select" style="width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid #ddd; font-size: 1rem;">
            <option value="sistema">🔧 Sistema</option>
            <option value="pedido">🛒 Pedido</option>
            <option value="stock">📦 Stock</option>
            <option value="precio">💰 Precio</option>
            <option value="mensaje">✉️ Mensaje</option>
            <option value="promocion">🎁 Promoción</option>
          </select>
          <label style="display: block; margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 600;">
            <i class="bi bi-type"></i> Título <span style="color: red;">*</span>
          </label>
          <input id="swal-titulo" class="swal2-input" placeholder="Ej: Mantenimiento programado" required style="font-size: 1rem; padding: 0.75rem;">
          <label style="display: block; margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 600;">
            <i class="bi bi-chat-text"></i> Mensaje <span style="color: red;">*</span>
          </label>
          <textarea id="swal-mensaje" class="swal2-textarea" placeholder="Escribe el mensaje que recibirán todos los usuarios..." required style="min-height: 180px; font-size: 1rem; padding: 0.75rem; resize: vertical;"></textarea>
        </div>
      `,
      width: '700px',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear y Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const titulo = (document.getElementById('swal-titulo') as HTMLInputElement)?.value;
        const mensaje = (document.getElementById('swal-mensaje') as HTMLTextAreaElement)?.value;
        const tipo = (document.getElementById('swal-tipo') as HTMLSelectElement)?.value;
        
        if (!titulo || !mensaje) {
          Swal.showValidationMessage('Completa todos los campos requeridos');
          return false;
        }
        
        return { titulo, mensaje, tipo };
      }
    });

    if (!formValues) return;

    Swal.fire({
      title: 'Creando...',
      text: 'Por favor espera mientras se crea la notificación',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await adminService.crearNotificacionMasiva(formValues);
      
      if (response.success) {
        await cargarNotificaciones();
        Swal.fire({
          icon: 'success',
          title: '¡Notificación creada!',
          text: response.message || 'La notificación ha sido enviada a todos los usuarios.',
          confirmButtonColor: '#059669'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Error creando notificación',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error creando notificación: ${errorMsg}`,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleEditar = async (notif: Notificacion) => {
    const { value: formValues } = await Swal.fire({
      title: 'Editar Notificación',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 1rem; padding: 1rem; background: #fef3c7; border-radius: 8px; color: #92400e;">
            <strong>Nota:</strong> Al editar esta notificación, los cambios se aplicarán a todos los usuarios que la reciban.
          </div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
            <i class="bi bi-tag-fill"></i> Tipo de Notificación <span style="color: red;">*</span>
          </label>
          <select id="swal-tipo" class="swal2-select" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid #ddd;">
            <option value="sistema" ${notif.tipo === 'sistema' ? 'selected' : ''}>🔧 Sistema</option>
            <option value="pedido" ${notif.tipo === 'pedido' ? 'selected' : ''}>🛒 Pedido</option>
            <option value="stock" ${notif.tipo === 'stock' ? 'selected' : ''}>📦 Stock</option>
            <option value="precio" ${notif.tipo === 'precio' ? 'selected' : ''}>💰 Precio</option>
            <option value="mensaje" ${notif.tipo === 'mensaje' ? 'selected' : ''}>✉️ Mensaje</option>
            <option value="promocion" ${notif.tipo === 'promocion' ? 'selected' : ''}>🎁 Promoción</option>
          </select>
          <label style="display: block; margin-top: 1rem; margin-bottom: 0.5rem; font-weight: 600;">
            <i class="bi bi-type"></i> Título <span style="color: red;">*</span>
          </label>
          <input id="swal-titulo" class="swal2-input" value="${notif.titulo}" placeholder="Ej: Mantenimiento programado" required>
          <label style="display: block; margin-top: 1rem; margin-bottom: 0.5rem; font-weight: 600;">
            <i class="bi bi-chat-text"></i> Mensaje <span style="color: red;">*</span>
          </label>
          <textarea id="swal-mensaje" class="swal2-textarea" placeholder="Escribe el mensaje que recibirán todos los usuarios..." required style="min-height: 120px;">${notif.mensaje}</textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const titulo = (document.getElementById('swal-titulo') as HTMLInputElement)?.value;
        const mensaje = (document.getElementById('swal-mensaje') as HTMLTextAreaElement)?.value;
        const tipo = (document.getElementById('swal-tipo') as HTMLSelectElement)?.value;
        
        if (!titulo || !mensaje) {
          Swal.showValidationMessage('Completa todos los campos requeridos');
          return false;
        }
        
        return { titulo, mensaje, tipo };
      }
    });

    if (!formValues) return;

    Swal.fire({
      title: 'Actualizando...',
      text: 'Por favor espera mientras se actualiza la notificación',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await adminService.editarNotificacion(notif.id_notificacion, formValues);
      
      if (response.success) {
        await cargarNotificaciones();
        Swal.fire({
          icon: 'success',
          title: '¡Notificación actualizada!',
          text: 'La notificación ha sido actualizada exitosamente.',
          confirmButtonColor: '#059669'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Error actualizando notificación',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error actualizando notificación: ${errorMsg}`,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleEliminar = async (id_notificacion: number) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la notificación. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'Eliminando...',
      text: 'Por favor espera mientras se elimina la notificación',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

      try {
        const response = await adminService.eliminarNotificacion(id_notificacion);
        if (response.success) {
        await cargarNotificaciones();
        Swal.fire({
          icon: 'success',
          title: '¡Notificación eliminada!',
          text: 'La notificación ha sido eliminada exitosamente.',
          confirmButtonColor: '#059669'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Error eliminando notificación',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error eliminando notificación: ${errorMsg}`,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const abrirModalVer = (notif: Notificacion) => {
    const tipoBadge = getTipoBadge(notif.tipo);
    const tipoText = {
      sistema: '🔧 Sistema',
      pedido: '🛒 Pedido',
      stock: '📦 Stock',
      precio: '💰 Precio',
      mensaje: '✉️ Mensaje',
      promocion: '🎁 Promoción'
    }[notif.tipo] || notif.tipo;

    Swal.fire({
      title: 'Detalles de la Notificación',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 1rem;">
            <strong>ID de Notificación:</strong> #${notif.id_notificacion}
          </div>
          <div style="margin-bottom: 1rem;">
            <strong>Usuario:</strong> ${notif.nombre_usuario || `ID: ${notif.id_usuario}`}
          </div>
          <div style="margin-bottom: 1rem;">
            <strong>Tipo:</strong> ${tipoText}
          </div>
          <div style="margin-bottom: 1rem;">
            <strong>Título:</strong> ${notif.titulo}
          </div>
          <div style="margin-bottom: 1rem;">
            <strong>Mensaje:</strong><br>
            <div style="padding: 0.75rem; background: #f9fafb; border-radius: 6px; margin-top: 0.5rem; white-space: pre-wrap;">${notif.mensaje}</div>
          </div>
          <div style="margin-bottom: 1rem;">
            <strong>Estado:</strong> ${notif.leida ? '✅ Leída' : '⏳ No leída'}
          </div>
          <div>
            <strong>Fecha de Creación:</strong> ${new Date(notif.fecha_creacion).toLocaleString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#059669',
      width: '600px'
    });
  };

  const getTipoBadge = (tipo: string) => {
    const tipos: Record<string, { variant: string; icon: string }> = {
      sistema: { variant: 'info', icon: 'bi-gear' },
      pedido: { variant: 'success', icon: 'bi-cart' },
      stock: { variant: 'warning', icon: 'bi-box' },
      precio: { variant: 'error', icon: 'bi-tag' },
      mensaje: { variant: 'info', icon: 'bi-envelope' },
      promocion: { variant: 'success', icon: 'bi-gift' }
    };
    return tipos[tipo] || { variant: 'info', icon: 'bi-bell' };
  };

  if (loading && notificaciones.length === 0) return <Loading />;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1><i className="bi bi-bell me-2"></i>Gestión de Notificaciones</h1>
          <p>Administra todas las notificaciones del sistema</p>
        </div>
        <div className="header-actions">
          <Button
            variant="success"
            onClick={handleCrear}
          >
            <i className="bi bi-plus-circle-fill me-2"></i>
            Nueva Notificación
          </Button>
        </div>
      </div>

      <Card>
        {notificaciones.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#9ca3af', marginBottom: '1rem' }}></i>
            <p>No hay notificaciones</p>
          </div>
        ) : (
          <>
            <div className="notificaciones-table-wrapper">
              <table className="notificaciones-table">
            <thead>
              <tr>
                    <th className="th-id">ID</th>
                    <th className="th-usuario">USUARIO</th>
                    <th className="th-titulo">TÍTULO</th>
                    <th className="th-mensaje">MENSAJE</th>
                    <th className="th-tipo">TIPO</th>
                    <th className="th-leida">ESTADO</th>
                    <th className="th-fecha">FECHA</th>
                    <th className="th-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
                  {notificaciones.map((notif) => {
                    const tipoBadge = getTipoBadge(notif.tipo);
                    return (
                <tr key={notif.id_notificacion}>
                        <td className="td-id">
                          <span className="notificacion-id-text">#{notif.id_notificacion}</span>
                        </td>
                        <td className="td-usuario">
                          <span className="notificacion-usuario-text">
                            {notif.nombre_usuario || `ID: ${notif.id_usuario}`}
                          </span>
                        </td>
                        <td className="td-titulo">
                          <span className="notificacion-titulo-text">{notif.titulo}</span>
                        </td>
                        <td className="td-mensaje">
                          <span className="notificacion-mensaje-text">
                            {notif.mensaje.length > 60 ? `${notif.mensaje.substring(0, 60)}...` : notif.mensaje}
                          </span>
                        </td>
                        <td className="td-tipo">
                          <Badge variant={tipoBadge.variant as any} size="small">
                            <i className={`bi ${tipoBadge.icon} me-1`}></i>
                            {notif.tipo}
                          </Badge>
                        </td>
                        <td className="td-leida">
                          <Badge variant={notif.leida ? 'success' : 'warning'} size="small">
                            <i className={`bi ${notif.leida ? 'bi-check-circle' : 'bi-clock'} me-1`}></i>
                            {notif.leida ? 'Leída' : 'No leída'}
                          </Badge>
                        </td>
                        <td className="td-fecha">
                          <span className="notificacion-fecha-text">
                            {new Date(notif.fecha_creacion).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                        <td className="td-acciones">
                          <div className="notificaciones-acciones-buttons">
                            <button
                              className="btn btn-accion-view"
                              onClick={() => abrirModalVer(notif)}
                              title="Ver detalles"
                            >
                              <i className="bi bi-eye-fill"></i>
                            </button>
                            <button
                              className="btn btn-accion-edit"
                              onClick={() => handleEditar(notif)}
                              title="Editar"
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button
                              className="btn btn-accion-delete"
                              onClick={() => handleEliminar(notif.id_notificacion)}
                              title="Eliminar"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </div>
                  </td>
                </tr>
                    );
                  })}
            </tbody>
          </table>
            </div>

            <div className="table-footer">
              <span>Mostrando 1 - {notificaciones.length} de {notificaciones.length} notificaciones</span>
        </div>
          </>
        )}
      </Card>

    </div>
  );
};

export default NotificacionesScreen;
