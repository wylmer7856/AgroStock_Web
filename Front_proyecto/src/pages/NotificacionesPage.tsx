import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificacionesService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { BiBell, BiCheck, BiTrash, BiArrowBack, BiTime, BiPackage, BiDollar, BiMessageSquare, BiInfoCircle } from 'react-icons/bi';

const NotificacionesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'todas' | 'noLeidas'>('todas');

  // Query para obtener notificaciones
  const { data: notificaciones, isLoading } = useQuery({
    queryKey: ['notificaciones', filter],
    queryFn: async () => {
      const response = await notificacionesService.obtenerMisNotificaciones(
        100,
        filter === 'noLeidas'
      );
      return response.data || [];
    },
    enabled: !!user?.id_usuario,
    refetchInterval: 5000, // refrescar cada 5 segundos para simular tiempo real
  });

  // Mutation para marcar como leída
  const markAsReadMutation = useMutation({
    mutationFn: async (id_notificacion: number) => {
      return await notificacionesService.marcarComoLeida(id_notificacion);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones', 'contar'] });
    },
  });

  // Mutation para marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await notificacionesService.marcarTodasComoLeidas();
    },
    onSuccess: (response) => {
      toast.success(`${response.data?.actualizadas || 0} notificaciones marcadas como leídas`);
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones', 'contar'] });
    },
    onError: () => {
      toast.error('Error al marcar todas las notificaciones como leídas');
    },
  });

  // Mutation para eliminar notificación
  const deleteMutation = useMutation({
    mutationFn: async (id_notificacion: number) => {
      return await notificacionesService.eliminarNotificacion(id_notificacion);
    },
    onSuccess: () => {
      toast.success('Notificación eliminada');
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones', 'contar'] });
    },
    onError: () => {
      toast.error('Error al eliminar la notificación');
    },
  });

  const getIconForType = (tipo: string) => {
    switch (tipo) {
      case 'pedido':
        return <BiPackage className="text-primary" />;
      case 'stock':
        return <BiPackage className="text-warning" />;
      case 'precio':
        return <BiDollar className="text-success" />;
      case 'mensaje':
        return <BiMessageSquare className="text-info" />;
      case 'sistema':
        return <BiInfoCircle className="text-secondary" />;
      default:
        return <BiBell className="text-muted" />;
    }
  };

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'pedido':
        return 'bg-primary';
      case 'stock':
        return 'bg-warning';
      case 'precio':
        return 'bg-success';
      case 'mensaje':
        return 'bg-info';
      case 'sistema':
        return 'bg-secondary';
      default:
        return 'bg-dark';
    }
  };

  const notificacionesNoLeidas = (notificaciones || []).filter(n => !n.leida).length;

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center gap-3 mb-3">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
              <BiArrowBack className="me-1" />
              Volver
            </button>
            <h1 className="display-6 fw-bold mb-0">
              <BiBell className="me-2" />
              Notificaciones
            </h1>
          </div>
          <p className="text-muted">Gestiona tus notificaciones y mantente al día</p>
        </div>
      </div>

      {/* Filtros y acciones */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${filter === 'todas' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setFilter('todas')}
                  >
                    Todas ({notificaciones?.length || 0})
                  </button>
                  <button
                    type="button"
                    className={`btn ${filter === 'noLeidas' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setFilter('noLeidas')}
                  >
                    No leídas ({notificacionesNoLeidas})
                  </button>
                </div>
                {notificacionesNoLeidas > 0 && (
                  <button
                    className="btn btn-success"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                  >
                    <BiCheck className="me-1" />
                    Marcar todas como leídas
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : !notificaciones || notificaciones.length === 0 ? (
                <div className="text-center py-5">
                  <BiBell className="display-4 text-muted mb-3" />
                  <p className="text-muted">
                    {filter === 'noLeidas' 
                      ? 'No tienes notificaciones no leídas' 
                      : 'No tienes notificaciones'}
                  </p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {notificaciones.map((notificacion) => (
                    <div
                      key={notificacion.id_notificacion}
                      className={`list-group-item list-group-item-action ${
                        !notificacion.leida ? 'bg-light' : ''
                      }`}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIconForType(notificacion.tipo)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1 d-flex align-items-center gap-2">
                                {notificacion.titulo}
                                {!notificacion.leida && (
                                  <span className="badge bg-danger">Nueva</span>
                                )}
                                <span className={`badge ${getBadgeColor(notificacion.tipo)}`}>
                                  {notificacion.tipo}
                                </span>
                              </h6>
                              <p className="mb-1 text-muted small">
                                {notificacion.mensaje}
                              </p>
                            </div>
                            <div className="d-flex gap-2">
                              {!notificacion.leida && (
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => markAsReadMutation.mutate(notificacion.id_notificacion)}
                                  disabled={markAsReadMutation.isPending}
                                  title="Marcar como leída"
                                >
                                  <BiCheck />
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteMutation.mutate(notificacion.id_notificacion)}
                                disabled={deleteMutation.isPending}
                                title="Eliminar"
                              >
                                <BiTrash />
                              </button>
                            </div>
                          </div>
                          <small className="text-muted d-flex align-items-center gap-2">
                            <BiTime />
                            {new Date(notificacion.fecha_creacion).toLocaleString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificacionesPage;



