import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { pedidosService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  BiReceipt, 
  BiPackage, 
  BiCheckCircle, 
  BiXCircle, 
  BiTime, 
  BiMapPin,
  BiCreditCard,
  BiCalendar,
  BiFile,
  BiRightArrowAlt
} from 'react-icons/bi';
import type { Pedido } from '../../types';
import './PedidosPage.css';

const PedidosPage: React.FC = () => {
  const { user } = useAuth();

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['pedidos', 'consumidor'],
    queryFn: async () => {
      if (!user?.id_usuario) return [];
      const response = await pedidosService.obtenerMisPedidos('consumidor', user.id_usuario);
      return response.data || [];
    },
    enabled: !!user?.id_usuario,
  });

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { class: string; icon: JSX.Element; label: string }> = {
      pendiente: { 
        class: 'badge-estado-pendiente', 
        icon: <BiTime />, 
        label: 'Pendiente' 
      },
      confirmado: { 
        class: 'badge-estado-confirmado', 
        icon: <BiCheckCircle />, 
        label: 'Confirmado' 
      },
      en_preparacion: { 
        class: 'badge-estado-preparacion', 
        icon: <BiPackage />, 
        label: 'En Preparación' 
      },
      en_camino: { 
        class: 'badge-estado-camino', 
        icon: <BiPackage />, 
        label: 'En Camino' 
      },
      entregado: { 
        class: 'badge-estado-entregado', 
        icon: <BiCheckCircle />, 
        label: 'Entregado' 
      },
      cancelado: { 
        class: 'badge-estado-cancelado', 
        icon: <BiXCircle />, 
        label: 'Cancelado' 
      },
    };
    return badges[estado] || badges.pendiente;
  };

  // Ordenar pedidos: más recientes primero (debe estar antes de cualquier return)
  const pedidosList = React.useMemo(() => {
    const lista = (pedidos || []) as Pedido[];
    return [...lista].sort((a, b) => {
      const fechaA = a.fecha_pedido ? new Date(a.fecha_pedido).getTime() : 0;
      const fechaB = b.fecha_pedido ? new Date(b.fecha_pedido).getTime() : 0;
      return fechaB - fechaA; // Orden descendente (más recientes primero)
    });
  }, [pedidos]);

  if (isLoading) {
    return (
      <div className="pedidos-page-wrapper">
        <div className="pedidos-container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando pedidos...</span>
            </div>
            <p className="mt-3 text-muted">Cargando tus pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (pedidosList.length === 0) {
    return (
      <div className="pedidos-page-wrapper">
        <div className="pedidos-container">
          <div className="pedidos-empty-state">
            <div className="empty-state-icon">
              <BiReceipt />
            </div>
            <h2 className="empty-state-title">No tienes pedidos aún</h2>
            <p className="empty-state-description">
              Realiza tu primer pedido para comenzar a disfrutar de productos frescos y de calidad
            </p>
            <Link to="/productos" className="btn btn-primary btn-lg empty-state-button">
              <BiPackage className="me-2" />
              Explorar Productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pedidos-page-wrapper">
      <div className="pedidos-container">
        {/* Header Section */}
        <div className="pedidos-header">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h1 className="pedidos-title">
                <BiReceipt className="me-2" />
                Mis Pedidos
              </h1>
              <p className="pedidos-subtitle">
                Gestiona y realiza seguimiento de todos tus pedidos
              </p>
            </div>
          </div>
        </div>

        {/* Pedidos List */}
        <div className="pedidos-list">
          {pedidosList.map((pedido) => {
            const estadoBadge = getEstadoBadge(pedido.estado);
            return (
              <div key={pedido.id_pedido} className="pedido-card">
                <div className="pedido-card-header">
                  <div className="pedido-header-info">
                    <div className="pedido-number">
                      <BiFile className="me-2" />
                      Pedido #{pedido.id_pedido}
                    </div>
                    <div className="pedido-date">
                      <BiCalendar className="me-1" />
                      {pedido.fecha_pedido && format(new Date(pedido.fecha_pedido), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                    </div>
                  </div>
                  <span className={`badge ${estadoBadge.class}`}>
                    {estadoBadge.icon}
                    <span className="ms-2">{estadoBadge.label}</span>
                  </span>
                </div>
                
                <div className="pedido-card-body">
                  <div className="row g-4">
                    {/* Información de Pago */}
                    <div className="col-md-6">
                      <div className="pedido-info-section">
                        <h6 className="pedido-section-title">
                          <BiCreditCard className="me-2" />
                          Información de Pago
                        </h6>
                        <div className="pedido-info-item">
                          <span className="pedido-info-label">Total:</span>
                          <span className="pedido-total">
                            ${pedido.total.toLocaleString('es-CO')}
                          </span>
                        </div>
                        <div className="pedido-info-item">
                          <span className="pedido-info-label">Método de Pago:</span>
                          <span className="text-capitalize">{pedido.metodo_pago || 'No especificado'}</span>
                        </div>
                        <div className="pedido-info-item">
                          <span className="pedido-info-label">Estado de Pago:</span>
                          <span className={`badge ${pedido.estado_pago === 'pagado' ? 'bg-success' : 'bg-warning'}`}>
                            {pedido.estado_pago?.toUpperCase() || 'PENDIENTE'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Información de Entrega */}
                    <div className="col-md-6">
                      <div className="pedido-info-section">
                        <h6 className="pedido-section-title">
                          <BiMapPin className="me-2" />
                          Información de Entrega
                        </h6>
                        <div className="pedido-info-item">
                          <span className="pedido-info-label">Dirección:</span>
                          <span className="pedido-address">{pedido.direccion_entrega || 'No especificada'}</span>
                        </div>
                        {pedido.fecha_entrega && (
                          <div className="pedido-info-item">
                            <span className="pedido-info-label">Fecha de Entrega:</span>
                            <span>{format(new Date(pedido.fecha_entrega), "d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notas */}
                  {pedido.notas && (
                    <div className="pedido-notes">
                      <h6 className="pedido-section-title">Notas Adicionales</h6>
                      <p className="pedido-notes-text">{pedido.notas}</p>
                    </div>
                  )}

                  {/* Botón Ver Detalles */}
                  <div className="pedido-actions">
                    <Link
                      to={`/consumidor/pedidos/${pedido.id_pedido}`}
                      className="btn btn-outline-primary pedido-details-btn"
                    >
                      Ver Detalles Completos
                      <BiRightArrowAlt className="ms-2" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PedidosPage;
