// DASHBOARD PRINCIPAL DEL ADMIN - PANEL DE CONTROL

import React, { useState, useEffect } from 'react';
import { Card, Button, Loading, Toast } from '../../components/ReusableComponents';
import AgroStockLogo from '../../components/AgroStockLogo';
import { UsuariosScreen } from './UsuariosScreen';
import { ProductosScreen } from './ProductosScreen';
import { ReportesScreen } from './ReportesScreen';
import { EstadisticasScreen } from './EstadisticasScreen';
import { PedidosScreen } from './PedidosScreen';
import { CategoriasScreen } from './CategoriasScreen';
import { AuditoriaScreen } from './AuditoriaScreen';
import { ConfiguracionScreen } from './ConfiguracionScreen';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/admin';
import type { ActividadReciente } from '../../types';
import './AdminScreens.css';

interface AdminDashboardProps {
  onNavigate?: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  // ===== ESTADOS =====
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'overview' | 'usuarios' | 'productos' | 'reportes' | 'estadisticas' | 'pedidos' | 'categorias' | 'auditoria' | 'configuracion'>('overview');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ===== FUNCIONES =====
  // mostrarToast se usa implícitamente a través de setToast en el componente Toast

  const handleNavigate = (view: string) => {
    // Cambiar la vista interna del panel de admin
    setCurrentView(view as 'overview' | 'usuarios' | 'productos' | 'reportes' | 'estadisticas' | 'pedidos' | 'categorias' | 'auditoria' | 'configuracion');
    // Si hay un callback de navegación externa, también llamarlo
    if (onNavigate) {
      onNavigate(view);
    }
  };

  // ===== RENDERIZADO DE VISTAS =====
  const renderCurrentView = () => {
    switch (currentView) {
      case 'usuarios':
        return <UsuariosScreen onNavigate={handleNavigate} />;
      case 'productos':
        return <ProductosScreen onNavigate={handleNavigate} />;
      case 'reportes':
        return <ReportesScreen onNavigate={handleNavigate} />;
      case 'estadisticas':
        return <EstadisticasScreen onNavigate={handleNavigate} />;
      case 'pedidos':
        return <PedidosScreen onNavigate={handleNavigate} />;
      case 'categorias':
        return <CategoriasScreen onNavigate={handleNavigate} />;
      case 'auditoria':
        return <AuditoriaScreen onNavigate={handleNavigate} />;
      case 'configuracion':
        return <ConfiguracionScreen onNavigate={handleNavigate} />;
      case 'overview':
      default:
        return <OverviewScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar de navegación */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <div className="admin-logo">
            <AgroStockLogo size="small" variant="full" />
            <span className="admin-panel-text">Admin Panel</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Panel Principal</div>
            <button
              className={`nav-item ${currentView === 'overview' ? 'active' : ''}`}
              onClick={() => setCurrentView('overview')}
            >
              <span className="nav-text">Resumen</span>
            </button>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Gestión</div>
            <button
              className={`nav-item ${currentView === 'usuarios' ? 'active' : ''}`}
              onClick={() => setCurrentView('usuarios')}
            >
              <span className="nav-text">Usuarios</span>
            </button>
            <button
              className={`nav-item ${currentView === 'productos' ? 'active' : ''}`}
              onClick={() => setCurrentView('productos')}
            >
              <span className="nav-text">Productos</span>
            </button>
            <button
              className={`nav-item ${currentView === 'reportes' ? 'active' : ''}`}
              onClick={() => setCurrentView('reportes')}
            >
              <span className="nav-text">Reportes</span>
            </button>
            <button
              className={`nav-item ${currentView === 'pedidos' ? 'active' : ''}`}
              onClick={() => setCurrentView('pedidos')}
            >
              <span className="nav-text">Pedidos</span>
            </button>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Análisis</div>
            <button
              className={`nav-item ${currentView === 'estadisticas' ? 'active' : ''}`}
              onClick={() => setCurrentView('estadisticas')}
            >
              <span className="nav-text">Estadísticas</span>
            </button>
            <button
              className={`nav-item ${currentView === 'auditoria' ? 'active' : ''}`}
              onClick={() => setCurrentView('auditoria')}
            >
              <span className="nav-text">Auditoría</span>
            </button>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Sistema</div>
            <button
              className={`nav-item ${currentView === 'categorias' ? 'active' : ''}`}
              onClick={() => setCurrentView('categorias')}
            >
              <span className="nav-text">Categorías</span>
            </button>
            <button
              className={`nav-item ${currentView === 'configuracion' ? 'active' : ''}`}
              onClick={() => setCurrentView('configuracion')}
            >
              <span className="nav-text">Configuración</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">A</div>
            <div className="admin-details">
              <div className="admin-name">{user?.nombre || 'Administrador'}</div>
              <div className="admin-role">{user?.rol || 'Admin'}</div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="small"
            onClick={async () => {
              await logout();
              if (onNavigate) {
                onNavigate('welcome');
              }
            }}
            style={{ marginTop: '1rem', width: '100%' }}
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="admin-main">
        <div className="admin-content">
          {renderCurrentView()}
        </div>
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
  // ✅ Estados para cargar datos reales
  const [resumenData, setResumenData] = useState({
    totalUsuarios: 0,
    totalProductos: 0,
    totalPedidos: 0,
    ingresosTotales: 0,
    usuariosNuevos: 0,
    productosNuevos: 0,
    pedidosPendientes: 0,
    reportesPendientes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuariosPorRol, setUsuariosPorRol] = useState({
    admin: 0,
    productor: 0,
    consumidor: 0
  });
  const [actividadReciente, setActividadReciente] = useState<ActividadReciente[]>([]);

  // ✅ Cargar datos reales al montar
  useEffect(() => {
    cargarDatosResumen();
  }, []);

  const cargarDatosResumen = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[Dashboard] Iniciando carga de datos...');
      
      // Cargar estadísticas, usuarios, productos, reportes y actividad en paralelo
      const [estadisticas, usuarios, productos, reportes, actividad] = await Promise.allSettled([
        adminService.getEstadisticasGenerales(),
        adminService.getUsuarios(),
        adminService.getProductos(),
        adminService.getReportes(),
        adminService.getActividadReciente().catch(() => ({ success: false, data: [] }))
      ]);

      console.log('[Dashboard] Respuestas recibidas:', {
        estadisticas: estadisticas.status,
        usuarios: usuarios.status,
        productos: productos.status,
        reportes: reportes.status,
        actividad: actividad.status
      });

      // Procesar estadísticas
      if (estadisticas.status === 'fulfilled' && estadisticas.value.success && estadisticas.value.data) {
        const stats = estadisticas.value.data;
        console.log('[Dashboard] Estadísticas cargadas:', stats);
        
        setResumenData({
          totalUsuarios: stats.total_usuarios || 0,
          totalProductos: stats.total_productos || 0,
          totalPedidos: stats.total_pedidos || 0,
          ingresosTotales: stats.ingresos_totales || 0,
          usuariosNuevos: stats.usuarios_nuevos || 0,
          productosNuevos: stats.productos_nuevos || 0,
          pedidosPendientes: stats.pedidos_pendientes || 0,
          reportesPendientes: reportes.status === 'fulfilled' && reportes.value.success && reportes.value.data ? 
            reportes.value.data.filter((r: { estado: string }) => r.estado === 'pendiente').length : 0
        });

        if (stats.usuarios_por_rol) {
          setUsuariosPorRol(stats.usuarios_por_rol);
        } else if (usuarios.status === 'fulfilled' && usuarios.value.success && usuarios.value.data) {
          // Calcular desde lista de usuarios
          const usuariosList = usuarios.value.data;
          setUsuariosPorRol({
            admin: usuariosList.filter((u: { rol: string }) => u.rol === 'admin').length,
            productor: usuariosList.filter((u: { rol: string }) => u.rol === 'productor').length,
            consumidor: usuariosList.filter((u: { rol: string }) => u.rol === 'consumidor').length
          });
        }
      } else {
        // Si las estadísticas fallan, intentar cargar datos desde usuarios y productos directamente
        let datosCargados = false;
        
        if (usuarios.status === 'fulfilled' && usuarios.value.success && usuarios.value.data) {
          const usuariosList = usuarios.value.data;
          setResumenData(prev => ({
            ...prev,
            totalUsuarios: usuariosList.length
          }));
          setUsuariosPorRol({
            admin: usuariosList.filter((u: { rol: string }) => u.rol === 'admin').length,
            productor: usuariosList.filter((u: { rol: string }) => u.rol === 'productor').length,
            consumidor: usuariosList.filter((u: { rol: string }) => u.rol === 'consumidor').length
          });
          datosCargados = true;
        }
        
        if (productos.status === 'fulfilled' && productos.value.success && productos.value.data) {
          setResumenData(prev => ({
            ...prev,
            totalProductos: productos.value.data?.length || 0
          }));
          datosCargados = true;
        }
        
        // Solo mostrar error si no se pudo cargar ningún dato
        if (!datosCargados) {
          const errorMsg = estadisticas.status === 'fulfilled' 
            ? (estadisticas.value.message || estadisticas.value.error || 'Error cargando estadísticas')
            : estadisticas.reason?.message || 'Error de conexión con el servidor';
          console.error('[Dashboard] Error en estadísticas:', errorMsg);
          setError(errorMsg);
        } else {
          // Si se cargaron datos parciales, limpiar el error
          setError(null);
          console.log('[Dashboard] Datos parciales cargados correctamente');
        }
      }
      
      // Cargar actividad reciente
      if (actividad.status === 'fulfilled' && actividad.value.success && actividad.value.data) {
        setActividadReciente(actividad.value.data.slice(0, 5)); // Solo las 5 más recientes
      }
      
      console.log('[Dashboard] Carga de datos completada');
    } catch (error) {
      console.error('[Dashboard] Error general:', error);
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError('Error desconocido al cargar datos');
      }
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
      <div className="overview-screen">
        <Loading text="Cargando datos del sistema..." />
      </div>
    );
  }

  return (
    <div className="overview-screen">
      {/* Header */}
      <div className="screen-header">
        <div className="header-content">
          <h1>PANEL PRINCIPAL</h1>
          <p>Resumen</p>
        </div>
        <div className="header-actions">
          <Button
            variant="primary"
            onClick={cargarDatosResumen}
            loading={loading}
          >
            Actualizar Datos
          </Button>
        </div>
      </div>

      {/* Mensaje de error si hay */}
      {error && (
        <div className="error-card-dashboard">
          <div className="error-card-content">
            <div className="error-text">
              <strong>Error al cargar datos</strong>
              <p>{error}</p>
              <small>Revisa la consola del navegador (F12) para más detalles.</small>
            </div>
            <Button
              variant="secondary"
              size="small"
              onClick={cargarDatosResumen}
            >
              Reintentar
            </Button>
          </div>
        </div>
      )}

      {/* Mensaje si no hay datos */}
      {!loading && !error && resumenData.totalUsuarios === 0 && resumenData.totalProductos === 0 && (
        <div className="empty-dashboard-state">
          <h3>Bienvenido al Panel de Administración</h3>
          <p>El sistema está listo para comenzar. Los datos aparecerán aquí cuando:</p>
          <ul className="empty-dashboard-list">
            <li>Se registren nuevos usuarios</li>
            <li>Se agreguen productos al catálogo</li>
            <li>Se realicen pedidos</li>
          </ul>
          <div className="empty-dashboard-actions">
            <Button
              variant="primary"
              onClick={() => onNavigate('usuarios')}
            >
              Gestionar Usuarios
            </Button>
            <Button
              variant="success"
              onClick={() => onNavigate('productos')}
            >
              Ver Productos
            </Button>
          </div>
        </div>
      )}

      {/* Métricas principales - Estilo iPhone */}
      <div className="metrics-grid-iphone">
        <div className="metric-card-iphone metric-users">
          <div className="metric-icon-wrapper">
            <div className="metric-icon">👥</div>
          </div>
          <div className="metric-content-iphone">
            <div className="metric-number-iphone">{formatearNumero(resumenData.totalUsuarios)}</div>
            <div className="metric-label-iphone">Total Usuarios</div>
          </div>
          <button 
            className="metric-action-btn"
            onClick={() => onNavigate('usuarios')}
            title="Ver usuarios"
          >
            <span>{resumenData.totalUsuarios}</span>
            <span>→</span>
          </button>
        </div>

        <div className="metric-card-iphone metric-products">
          <div className="metric-icon-wrapper">
            <div className="metric-icon">🛍</div>
          </div>
          <div className="metric-content-iphone">
            <div className="metric-number-iphone">{formatearNumero(resumenData.totalProductos)}</div>
            <div className="metric-label-iphone">Total Productos</div>
          </div>
          <button 
            className="metric-action-btn"
            onClick={() => onNavigate('productos')}
            title="Ver productos"
          >
            <span>{resumenData.totalProductos}</span>
            <span>→</span>
          </button>
        </div>

        <div className="metric-card-iphone metric-orders">
          <div className="metric-icon-wrapper">
            <div className="metric-icon">📦</div>
          </div>
          <div className="metric-content-iphone">
            <div className="metric-number-iphone">{formatearNumero(resumenData.totalPedidos)}</div>
            <div className="metric-label-iphone">Total Pedidos</div>
          </div>
        </div>

        <div className="metric-card-iphone metric-revenue">
          <div className="metric-icon-wrapper">
            <div className="metric-icon">💰</div>
          </div>
          <div className="metric-content-iphone">
            <div className="metric-number-iphone">{formatearMoneda(resumenData.ingresosTotales)}</div>
            <div className="metric-label-iphone">Ingresos Totales</div>
          </div>
          <button 
            className="metric-action-btn"
            onClick={() => onNavigate('estadisticas')}
            title="Ver estadísticas"
          >
            <span>{formatearMoneda(resumenData.ingresosTotales)}</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="quick-actions-grid">
        <Card title="Acciones Rápidas" className="quick-actions-card">
          <div className="quick-actions">
            <Button
              variant="primary"
              onClick={() => onNavigate('usuarios')}
              className="quick-action-btn"
            >
              Gestionar Usuarios
            </Button>
            <Button
              variant="success"
              onClick={() => onNavigate('productos')}
              className="quick-action-btn"
            >
              Gestionar Productos
            </Button>
            <Button
              variant="warning"
              onClick={() => onNavigate('reportes')}
              className="quick-action-btn"
            >
              Ver Reportes
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate('estadisticas')}
              className="quick-action-btn"
            >
              Ver Estadísticas
            </Button>
          </div>
        </Card>

        <Card title="Alertas y Notificaciones" className="alerts-card">
          <div className="alerts-list">
            {resumenData.reportesPendientes > 0 && (
              <div className="alert-item warning">
                <div className="alert-content">
                  <div className="alert-title">Reportes Pendientes</div>
                  <div className="alert-description">
                    Tienes {resumenData.reportesPendientes} reportes pendientes de revisión
                  </div>
                </div>
                <Button
                  size="small"
                  variant="warning"
                  onClick={() => onNavigate('reportes')}
                >
                  Revisar
                </Button>
              </div>
            )}

            {resumenData.pedidosPendientes > 0 && (
              <div className="alert-item info">
                <div className="alert-content">
                  <div className="alert-title">Pedidos Pendientes</div>
                  <div className="alert-description">
                    {resumenData.pedidosPendientes} pedidos esperando procesamiento
                  </div>
                </div>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => onNavigate('pedidos')}
                >
                  Ver
                </Button>
              </div>
            )}

            <div className="alert-item success">
              <div className="alert-content">
                <div className="alert-title">Sistema Operativo</div>
                <div className="alert-description">
                  Todos los servicios funcionando correctamente
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Estadísticas rápidas */}
      <div className="quick-stats-grid">
        <Card title="Usuarios por Rol" className="stats-card">
          <div className="role-stats">
          <div className="role-item">
            <div className="role-info">
              <div className="role-name">Administradores</div>
              <div className="role-count">{usuariosPorRol.admin}</div>
            </div>
          </div>
          <div className="role-item">
            <div className="role-info">
              <div className="role-name">Productores</div>
              <div className="role-count">{usuariosPorRol.productor}</div>
            </div>
          </div>
          <div className="role-item">
            <div className="role-info">
              <div className="role-name">Consumidores</div>
              <div className="role-count">{usuariosPorRol.consumidor}</div>
            </div>
          </div>
          </div>
        </Card>

        <Card title="Actividad Reciente" className="activity-card">
          <div className="activity-list">
            {actividadReciente.length > 0 ? (
              actividadReciente.map((actividad) => {
                const getActivityIcon = (tipo: string) => {
                  switch (tipo) {
                    case 'usuario_registrado': return '👤';
                    case 'producto_creado': return '🛍️';
                    case 'pedido_realizado': return '📦';
                    case 'reporte_creado': return '📋';
                    case 'mensaje_enviado': return '💬';
                    case 'reseña_creada': return '⭐';
                    default: return '📝';
                  }
                };

                const formatTime = (timestamp: string) => {
                  const date = new Date(timestamp);
                  const now = new Date();
                  const diff = now.getTime() - date.getTime();
                  const minutes = Math.floor(diff / 60000);
                  const hours = Math.floor(minutes / 60);
                  const days = Math.floor(hours / 24);

                  if (minutes < 1) return 'Hace un momento';
                  if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
                  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
                  return `Hace ${days} día${days > 1 ? 's' : ''}`;
                };

                return (
                  <div key={actividad.id} className="activity-item">
                    <div className="activity-icon">{getActivityIcon(actividad.tipo)}</div>
                    <div className="activity-content">
                      <div className="activity-description">{actividad.descripcion}</div>
                      <div className="activity-time">
                        {actividad.timestamp ? formatTime(actividad.timestamp) : 'Reciente'}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="activity-item">
                <div className="activity-icon">📝</div>
                <div className="activity-content">
                  <div className="activity-description">No hay actividad reciente</div>
                  <div className="activity-time">El sistema está en calma</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;