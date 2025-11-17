import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pedidosService, carritoService, listaDeseosService, notificacionesService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BiShoppingBag, 
  BiReceipt, 
  BiHeart, 
  BiCart,
  BiHome,
  BiCheckCircle,
  BiTime,
  BiTrendingUp,
  BiLeaf,
  BiStore,
  BiBell,
  BiMessageSquare,
  BiUser,
  BiDollar,
  BiRightArrowAlt
} from 'react-icons/bi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './Dashboard.css';

const ConsumidorDashboard: React.FC = () => {
  const { user } = useAuth();

  // Query para pedidos
  const { data: pedidos } = useQuery({
    queryKey: ['pedidos', 'consumidor', user?.id_usuario],
    queryFn: async () => {
      if (!user?.id_usuario) return [];
      const response = await pedidosService.obtenerMisPedidos('consumidor', user.id_usuario);
      return response.data || [];
    },
    enabled: !!user?.id_usuario,
  });

  // Query para carrito
  const { data: carrito } = useQuery({
    queryKey: ['carrito'],
    queryFn: async () => {
      const response = await carritoService.obtenerCarrito();
      return response.data || null;
    },
  });

  // Query para lista de deseos
  const { data: listaDeseos } = useQuery({
    queryKey: ['lista-deseos'],
    queryFn: async () => {
      const response = await listaDeseosService.obtenerMiListaDeseos();
      return response.data || [];
    },
  });


  // Query para notificaciones
  const { data: notificaciones } = useQuery({
    queryKey: ['notificaciones', 'contar'],
    queryFn: async () => {
      const response = await notificacionesService.contarNoLeidas();
      return response.data || 0;
    },
  });

  // Ordenar pedidos: más recientes primero
  const pedidosList = React.useMemo(() => {
    const lista = (pedidos || []) as any[];
    return [...lista].sort((a, b) => {
      const fechaA = a.fecha_pedido ? new Date(a.fecha_pedido).getTime() : 0;
      const fechaB = b.fecha_pedido ? new Date(b.fecha_pedido).getTime() : 0;
      return fechaB - fechaA; // Orden descendente (más recientes primero)
    });
  }, [pedidos]);
  
  const pedidosPendientes = pedidosList.filter((p: any) => 
    ['pendiente', 'confirmado', 'en_preparacion', 'en_camino'].includes(p.estado)
  ).length;
  const pedidosCompletados = pedidosList.filter((p: any) => 
    p.estado === 'entregado'
  ).length;
  const totalPedidos = pedidosList.length;
  const itemsCarrito = carrito?.items?.length || 0;
  const itemsListaDeseos = (listaDeseos || []).length;
  const totalCarrito = carrito?.total || 0;
  const pedidosRecientes = pedidosList.slice(0, 5);

  return (
    <div className="dashboard-consumidor">
      {/* Header con gradiente agrícola */}
      <div className="dashboard-header-section">
        <div className="container">
          <div className="d-flex align-items-center gap-3 mb-3">
            <BiLeaf style={{ fontSize: '3rem', opacity: 0.9 }} />
            <div>
              <h1>Bienvenido, {user?.nombre || 'Usuario'}</h1>
              <p>Tu panel de control personal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Tarjetas de estadísticas mejoradas */}
        <div className="row g-4 mb-4">
          <div className="col-md-3 col-sm-6">
            <div className="stats-card">
              <div className="stats-card-content">
                <div className="stats-info">
                  <h6>Pedidos Pendientes</h6>
                  <h3>{pedidosPendientes}</h3>
                </div>
                <div className="stats-icon-container stats-icon-pendientes">
                  <BiTime />
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="stats-card">
              <div className="stats-card-content">
                <div className="stats-info">
                  <h6>Pedidos Completados</h6>
                  <h3>{pedidosCompletados}</h3>
                </div>
                <div className="stats-icon-container stats-icon-completados">
                  <BiCheckCircle />
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="stats-card">
              <div className="stats-card-content">
                <div className="stats-info">
                  <h6>Items en Carrito</h6>
                  <h3>{itemsCarrito}</h3>
                </div>
                <div className="stats-icon-container stats-icon-carrito">
                  <BiCart />
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="stats-card">
              <div className="stats-card-content">
                <div className="stats-info">
                  <h6>Lista de Deseos</h6>
                  <h3>{itemsListaDeseos}</h3>
                </div>
                <div className="stats-icon-container stats-icon-deseos">
                  <BiHeart />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas adicionales */}
        <div className="row g-4 mb-4">
          <div className="col-md-4 col-sm-6">
            <div className="stats-card">
              <div className="stats-card-content">
                <div className="stats-info">
                  <h6>Total Pedidos</h6>
                  <h3>{totalPedidos}</h3>
                </div>
                <div className="stats-icon-container stats-icon-completados">
                  <BiShoppingBag />
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 col-sm-6">
            <div className="stats-card">
              <div className="stats-card-content">
                <div className="stats-info">
                  <h6>Total en Carrito</h6>
                  <h3>${totalCarrito.toLocaleString()}</h3>
                </div>
                <div className="stats-icon-container stats-icon-carrito">
                  <BiDollar />
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 col-sm-6">
            <div className="stats-card">
              <div className="stats-card-content">
                <div className="stats-info">
                  <h6>Notificaciones</h6>
                  <h3>{notificaciones || 0}</h3>
                </div>
                <div className="stats-icon-container stats-icon-pendientes">
                  <BiBell />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de actividad */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="actions-section">
              <div className="actions-section-header">
                <BiTrendingUp />
                <h5>Resumen de Actividad</h5>
              </div>
              <div>
                <div className="activity-item">
                  <div className="activity-icon activity-icon-primary">
                    <BiReceipt />
                  </div>
                  <div className="activity-content">
                    <strong>Total de Pedidos</strong>
                    <p>{totalPedidos} pedidos realizados</p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon activity-icon-success">
                    <BiCart />
                  </div>
                  <div className="activity-content">
                    <strong>Carrito de Compras</strong>
                    <p>{itemsCarrito} items • ${totalCarrito.toLocaleString()}</p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon activity-icon-danger">
                    <BiHeart />
                  </div>
                  <div className="activity-content">
                    <strong>Lista de Deseos</strong>
                    <p>{itemsListaDeseos} productos guardados</p>
                  </div>
                </div>
                {notificaciones > 0 && (
                  <div className="activity-item">
                    <div className="activity-icon activity-icon-primary">
                      <BiBell />
                    </div>
                    <div className="activity-content">
                      <strong>Notificaciones</strong>
                      <p>{notificaciones} sin leer</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pedidos Recientes */}
        {pedidosRecientes.length > 0 && (
          <div className="row g-4 mb-4">
            <div className="col-12">
              <div className="actions-section">
                <div className="actions-section-header">
                  <BiReceipt />
                  <h5>Pedidos Recientes</h5>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID Pedido</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Total</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosRecientes.map((pedido: any) => (
                        <tr key={pedido.id_pedido}>
                          <td>#{pedido.id_pedido}</td>
                          <td>
                            {pedido.fecha_pedido 
                              ? format(new Date(pedido.fecha_pedido), 'dd MMM yyyy', { locale: es })
                              : 'N/A'}
                          </td>
                          <td>
                            <span className={`badge ${
                              pedido.estado === 'entregado' ? 'bg-success' :
                              pedido.estado === 'cancelado' ? 'bg-danger' :
                              'bg-warning text-dark'
                            }`}>
                              {pedido.estado || 'Pendiente'}
                            </span>
                          </td>
                          <td className="fw-bold">${(pedido.total || 0).toLocaleString()}</td>
                          <td>
                            <Link 
                              to={`/consumidor/pedidos/${pedido.id_pedido}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              Ver Detalle
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ConsumidorDashboard;

