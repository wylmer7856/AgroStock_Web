// DASHBOARD PRINCIPAL DEL ADMIN - PANEL DE CONTROL

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Loading, Toast } from '../../components/ReusableComponents';
import AgroStockLogo from '../../components/AgroStockLogo';
import { UsuariosScreen } from './UsuariosScreen';
import { ProductosScreen } from './ProductosScreen';
import { PedidosScreen } from './PedidosScreen';
import { CategoriasScreen } from './CategoriasScreen';
import { ResenasScreen } from './ResenasScreen';
import { NotificacionesScreen } from './NotificacionesScreen';
import { ConfiguracionScreen } from './ConfiguracionScreen';
import { EstadisticasScreen } from './EstadisticasScreen';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/admin';
import './AdminScreens.css';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<string>('overview');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Detectar ruta y actualizar vista
  useEffect(() => {
    const path = location.pathname;
    const viewMap: Record<string, string> = {
      '/admin/dashboard': 'overview',
      '/admin': 'overview',
      '/admin/usuarios': 'usuarios',
      '/admin/productos': 'productos',
      '/admin/pedidos': 'pedidos',
      '/admin/categorias': 'categorias',
      '/admin/resenas': 'resenas',
      '/admin/notificaciones': 'notificaciones',
      '/admin/estadisticas': 'estadisticas',
      '/admin/configuracion': 'configuracion'
    };
    
    setCurrentView(viewMap[path] || 'overview');
  }, [location.pathname]);

  const handleNavigate = (view: string) => {
    const routeMap: Record<string, string> = {
      'overview': '/admin/dashboard',
      'usuarios': '/admin/usuarios',
      'productos': '/admin/productos',
      'pedidos': '/admin/pedidos',
      'categorias': '/admin/categorias',
      'resenas': '/admin/resenas',
      'notificaciones': '/admin/notificaciones',
      'estadisticas': '/admin/estadisticas',
      'configuracion': '/admin/configuracion'
    };
    
    const route = routeMap[view] || '/admin/dashboard';
    navigate(route, { replace: true });
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'usuarios':
        return <UsuariosScreen onNavigate={handleNavigate} />;
      case 'productos':
        return <ProductosScreen onNavigate={handleNavigate} />;
      case 'pedidos':
        return <PedidosScreen onNavigate={handleNavigate} />;
      case 'categorias':
        return <CategoriasScreen onNavigate={handleNavigate} />;
      case 'resenas':
        return <ResenasScreen onNavigate={handleNavigate} />;
      case 'notificaciones':
        return <NotificacionesScreen onNavigate={handleNavigate} />;
      case 'estadisticas':
        return <EstadisticasScreen onNavigate={handleNavigate} />;
      case 'configuracion':
        return <ConfiguracionScreen onNavigate={handleNavigate} />;
      case 'overview':
      default:
        return <OverviewScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <AgroStockLogo size="small" variant="full" />
          <span className="panel-text">Panel Administrador</span>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavigate('overview')}
          >
            🏠 Dashboard
          </button>
          <button
            className={`nav-item ${currentView === 'usuarios' ? 'active' : ''}`}
            onClick={() => handleNavigate('usuarios')}
          >
            👥 Usuarios
          </button>
          <button
            className={`nav-item ${currentView === 'productos' ? 'active' : ''}`}
            onClick={() => handleNavigate('productos')}
          >
            🛍️ Productos
          </button>
          <button
            className={`nav-item ${currentView === 'pedidos' ? 'active' : ''}`}
            onClick={() => handleNavigate('pedidos')}
          >
            📦 Pedidos
          </button>
          <button
            className={`nav-item ${currentView === 'categorias' ? 'active' : ''}`}
            onClick={() => handleNavigate('categorias')}
          >
            📁 Categorías
          </button>
          <button
            className={`nav-item ${currentView === 'resenas' ? 'active' : ''}`}
            onClick={() => handleNavigate('resenas')}
          >
            ⭐ Reseñas
          </button>
          <button
            className={`nav-item ${currentView === 'notificaciones' ? 'active' : ''}`}
            onClick={() => handleNavigate('notificaciones')}
          >
            🔔 Notificaciones
          </button>
          <button
            className={`nav-item ${currentView === 'estadisticas' ? 'active' : ''}`}
            onClick={() => handleNavigate('estadisticas')}
          >
            📊 Estadísticas
          </button>
          <button
            className={`nav-item ${currentView === 'configuracion' ? 'active' : ''}`}
            onClick={() => handleNavigate('configuracion')}
          >
            ⚙️ Configuración
          </button>
        </nav>

        <div className="sidebar-footer">
          <Button variant="danger" onClick={async () => {
            try {
              await logout();
              navigate('/');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              setToast({ message: 'Error al cerrar sesión', type: 'error' });
            }
          }}>
            🚪 Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="admin-main">
        <div className="main-header">
          <h1>Bienvenido, {user?.nombre || 'Admin'}</h1>
        </div>
        
        <main className="main-content">
          {renderCurrentView()}
        </main>
      </div>

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

// ===== PANTALLA DE RESUMEN (OVERVIEW) =====
interface OverviewScreenProps {
  onNavigate: (view: string) => void;
}

const OverviewScreen: React.FC<OverviewScreenProps> = ({ onNavigate }) => {
  const [resumenData, setResumenData] = useState({
    totalUsuarios: 0,
    totalProductos: 0,
    totalPedidos: 0,
    ingresosTotales: 0,
    pedidosPendientes: 0,
    reportesPendientes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatosResumen();
  }, []);

  const cargarDatosResumen = async () => {
    try {
      setLoading(true);
      const [estadisticas, usuarios, productos, reportes, pedidos] = await Promise.allSettled([
        adminService.getEstadisticasGenerales(),
        adminService.getUsuarios(),
        adminService.getProductos(),
        adminService.getReportes(),
        adminService.getPedidos()
      ]);

      if (estadisticas.status === 'fulfilled' && estadisticas.value.success && estadisticas.value.data) {
        const stats = estadisticas.value.data;
        setResumenData({
          totalUsuarios: stats.total_usuarios || 0,
          totalProductos: stats.total_productos || 0,
          totalPedidos: stats.total_pedidos || 0,
          ingresosTotales: stats.ingresos_totales || 0,
          pedidosPendientes: stats.pedidos_pendientes || 0,
          reportesPendientes: reportes.status === 'fulfilled' && reportes.value.success && reportes.value.data
            ? reportes.value.data.filter((r: any) => r.estado === 'pendiente').length
            : 0
        });
      } else {
        if (usuarios.status === 'fulfilled' && usuarios.value.success && usuarios.value.data) {
          setResumenData(prev => ({ ...prev, totalUsuarios: usuarios.value.data?.length || 0 }));
        }
        if (productos.status === 'fulfilled' && productos.value.success && productos.value.data) {
          setResumenData(prev => ({ ...prev, totalProductos: productos.value.data?.length || 0 }));
        }
        if (pedidos.status === 'fulfilled' && pedidos.value.success && pedidos.value.data) {
          setResumenData(prev => ({ 
            ...prev, 
            totalPedidos: pedidos.value.data?.length || 0,
            pedidosPendientes: pedidos.value.data.filter((p: any) => p.estado === 'pendiente').length
          }));
        }
      }
    } catch (error) {
      console.error('[Dashboard] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (cantidad: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(cantidad);
  };

  const formatearNumero = (numero: number) => {
    return numero.toLocaleString('es-CO');
  };

  if (loading) {
    return (
      <div className="admin-overview-screen">
        <Loading text="Cargando datos del sistema..." />
      </div>
    );
  }

  return (
    <div className="admin-overview-screen">
      <div className="admin-overview-header">
        <div className="admin-overview-header-content">
          <h1 className="admin-overview-title">Panel Principal</h1>
          <p className="admin-overview-subtitle">Resumen del sistema</p>
        </div>
        <div className="admin-overview-actions">
          <Button variant="primary" onClick={cargarDatosResumen} loading={loading}>
            Actualizar Datos
          </Button>
        </div>
      </div>

      <div className="overview-stats">
        <div className="stat-card" onClick={() => onNavigate('usuarios')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">👥 {formatearNumero(resumenData.totalUsuarios)}</div>
          <div className="stat-label">Total Usuarios</div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('productos')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">🛍️ {formatearNumero(resumenData.totalProductos)}</div>
          <div className="stat-label">Total Productos</div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('pedidos')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">📦 {formatearNumero(resumenData.totalPedidos)}</div>
          <div className="stat-label">Total Pedidos</div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('estadisticas')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">💰 {formatearMoneda(resumenData.ingresosTotales)}</div>
          <div className="stat-label">Ingresos Totales</div>
        </div>
      </div>

      {resumenData.reportesPendientes > 0 && (
        <div className="productos-section">
          <div className="section-header">
            <h2 className="section-title">Alertas</h2>
          </div>
          <div className="alerts-list">
            <div className="alert-item warning">
              <div className="alert-content">
                <div className="alert-title">Reportes Pendientes</div>
                <div className="alert-description">
                  Tienes {resumenData.reportesPendientes} reportes pendientes de revisión
                </div>
              </div>
              <Button size="small" variant="warning" onClick={() => onNavigate('reportes')}>
                Revisar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
