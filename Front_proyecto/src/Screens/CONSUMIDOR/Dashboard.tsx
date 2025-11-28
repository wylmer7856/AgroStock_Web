// DASHBOARD PRINCIPAL DEL CONSUMIDOR - Solo contenido (el layout maneja el sidebar)

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { BiPackage, BiCart, BiHeart, BiReceipt, BiRightArrowAlt, BiTrendingUp, BiLeaf } from 'react-icons/bi';
import '../../Screens/ADMIN/AdminScreens.css';
import './ConsumidorScreens.css';
import { useAuth } from '../../contexts/AuthContext';
import { pedidosService, carritoService, listaDeseosService } from '../../services';

const ConsumidorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Queries para datos
  const { data: pedidos } = useQuery({
    queryKey: ['pedidos', 'consumidor', user?.id_usuario],
    queryFn: async () => {
      if (!user?.id_usuario) return [];
      const response = await pedidosService.obtenerMisPedidos('consumidor', user.id_usuario);
      return response.data || [];
    },
    enabled: !!user?.id_usuario,
    refetchOnWindowFocus: false,
  });

  const { data: carrito } = useQuery({
    queryKey: ['carrito'],
    queryFn: async () => {
      const response = await carritoService.obtenerCarrito();
      return response.data || null;
    },
    refetchOnWindowFocus: false,
  });

  const { data: listaDeseos } = useQuery({
    queryKey: ['lista-deseos'],
    queryFn: async () => {
      const response = await listaDeseosService.obtenerMiListaDeseos();
      return response.data || [];
    },
    refetchOnWindowFocus: false,
  });

  return (
    <OverviewScreen 
      pedidos={pedidos || []} 
      carrito={carrito} 
      listaDeseos={listaDeseos || []}
      navigate={navigate}
    />
  );
};

export default ConsumidorDashboard;

// ===== PANTALLA DE RESUMEN (OVERVIEW) =====
interface OverviewScreenProps {
  pedidos: any[];
  carrito: any;
  listaDeseos: any[];
  navigate: (path: string) => void;
}

const OverviewScreen: React.FC<OverviewScreenProps> = ({ pedidos, carrito, listaDeseos, navigate }) => {
  const pedidosPendientes = pedidos.filter((p: any) => 
    ['pendiente', 'confirmado', 'en_preparacion', 'en_camino'].includes(p.estado)
  ).length;
  const pedidosCompletados = pedidos.filter((p: any) => p.estado === 'entregado').length;
  const totalPedidos = pedidos.length;
  const itemsCarrito = carrito?.items?.length || 0;
  const itemsListaDeseos = listaDeseos.length;
  const totalCarrito = carrito?.total_precio || 0;
  const pedidosRecientes = pedidos.slice(0, 3);

  return (
    <div className="admin-overview-screen">
      <div className="admin-overview-header">
        <div className="admin-overview-header-content">
          <h1 className="admin-overview-title">📊 Resumen</h1>
          <p className="admin-overview-subtitle">Vista general de tu actividad y acceso rápido</p>
        </div>
        <div className="admin-overview-actions">
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => navigate('/productos')}
          >
            <BiPackage />
            Explorar Productos
          </button>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div 
            className="card h-100 quick-action-card"
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => navigate('/productos')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div className="card-body text-center p-4">
              <BiPackage style={{ fontSize: '2.5rem', color: '#2d5016', marginBottom: '1rem' }} />
              <h5 className="card-title">Ver Productos</h5>
              <p className="card-text text-muted small">Explora nuestra tienda</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div 
            className="card h-100 quick-action-card"
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => navigate('/consumidor/carrito')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div className="card-body text-center p-4">
              <BiCart style={{ fontSize: '2.5rem', color: '#2d5016', marginBottom: '1rem' }} />
              <h5 className="card-title">Mi Carrito</h5>
              <p className="card-text text-muted small">{itemsCarrito} items</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div 
            className="card h-100 quick-action-card"
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => navigate('/consumidor/lista-deseos')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div className="card-body text-center p-4">
              <BiHeart style={{ fontSize: '2.5rem', color: '#dc3545', marginBottom: '1rem' }} />
              <h5 className="card-title">Lista de Deseos</h5>
              <p className="card-text text-muted small">{itemsListaDeseos} productos</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div 
            className="card h-100 quick-action-card"
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => navigate('/consumidor/pedidos')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div className="card-body text-center p-4">
              <BiReceipt style={{ fontSize: '2.5rem', color: '#2d5016', marginBottom: '1rem' }} />
              <h5 className="card-title">Mis Pedidos</h5>
              <p className="card-text text-muted small">{totalPedidos} pedidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="metrics-grid overview-stats">
        <div 
          className="metric-card primary stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/consumidor/pedidos')}
        >
          <div className="metric-content stat-content">
            <div className="metric-icon stat-icon">📦</div>
            <div className="metric-info">
              <div className="metric-number stat-value">{totalPedidos}</div>
              <div className="metric-label stat-label">Total Pedidos</div>
            </div>
          </div>
        </div>

        <div 
          className="metric-card success stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/consumidor/pedidos')}
        >
          <div className="metric-content stat-content">
            <div className="metric-icon stat-icon">⏳</div>
            <div className="metric-info">
              <div className="metric-number stat-value">{pedidosPendientes}</div>
              <div className="metric-label stat-label">Pedidos Pendientes</div>
            </div>
          </div>
        </div>

        <div 
          className="metric-card warning stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/consumidor/pedidos')}
        >
          <div className="metric-content stat-content">
            <div className="metric-icon stat-icon">✓</div>
            <div className="metric-info">
              <div className="metric-number stat-value">{pedidosCompletados}</div>
              <div className="metric-label stat-label">Pedidos Completados</div>
            </div>
          </div>
        </div>

        <div 
          className="metric-card info stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/consumidor/carrito')}
        >
          <div className="metric-content stat-content">
            <div className="metric-icon stat-icon">🛒</div>
            <div className="metric-info">
              <div className="metric-number stat-value">{itemsCarrito}</div>
              <div className="metric-label stat-label">Items en Carrito</div>
            </div>
          </div>
        </div>

        <div 
          className="metric-card primary stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/consumidor/carrito')}
        >
          <div className="metric-content stat-content">
            <div className="metric-icon stat-icon">💰</div>
            <div className="metric-info">
              <div className="metric-number stat-value">${totalCarrito.toLocaleString()}</div>
              <div className="metric-label stat-label">Total en Carrito</div>
            </div>
          </div>
        </div>

        <div 
          className="metric-card success stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/consumidor/lista-deseos')}
        >
          <div className="metric-content stat-content">
            <div className="metric-icon stat-icon">❤️</div>
            <div className="metric-info">
              <div className="metric-number stat-value">{itemsListaDeseos}</div>
              <div className="metric-label stat-label">Lista de Deseos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pedidos recientes */}
      {pedidosRecientes.length > 0 && (
        <div className="mt-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <BiTrendingUp />
                Pedidos Recientes
              </h5>
              <Link to="/consumidor/pedidos" className="btn btn-sm btn-outline-primary">
                Ver todos <BiRightArrowAlt />
              </Link>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {pedidosRecientes.map((pedido: any) => (
                  <div 
                    key={pedido.id_pedido}
                    className="list-group-item d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/consumidor/pedidos/${pedido.id_pedido}`)}
                  >
                    <div>
                      <strong>Pedido #{pedido.id_pedido}</strong>
                      <div className="small text-muted">
                        {new Date(pedido.fecha_pedido).toLocaleDateString('es-CO')} • 
                        <span className={`badge ms-2 ${
                          pedido.estado === 'entregado' ? 'bg-success' :
                          pedido.estado === 'cancelado' ? 'bg-danger' :
                          'bg-warning'
                        }`}>
                          {pedido.estado}
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">${(pedido.total || 0).toLocaleString()}</div>
                      <BiRightArrowAlt style={{ fontSize: '1.5rem', color: '#6c757d' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
