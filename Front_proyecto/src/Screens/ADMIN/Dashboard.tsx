// DASHBOARD PRINCIPAL DEL ADMIN - PANEL DE CONTROL

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Loading, Toast, Card, Badge } from '../../components/ReusableComponents';
import { UsuariosScreen } from './UsuariosScreen';
import { ProductosScreen } from './ProductosScreen';
import { PedidosScreen } from './PedidosScreen';
import { CategoriasScreen } from './CategoriasScreen';
import { ResenasScreen } from './ResenasScreen';
import { NotificacionesScreen } from './NotificacionesScreen';
import { ConfiguracionScreen } from './ConfiguracionScreen';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/admin';
import logoProyecto from '../../assets/logoProyecto.png';
import type { EstadisticasGenerales, ActividadReciente } from '../../types';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  ComposedChart
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import pptxgenjs from 'pptxgenjs';
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
          <div className="sidebar-logo-container">
            <img 
              src={logoProyecto} 
              alt="AgroStock Logo" 
              className="sidebar-logo-img"
            />
          </div>
          <span className="panel-text">Panel Administrador</span>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavigate('overview')}
          >
            📊 Resumen
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

// ===== PANTALLA DE RESUMEN (OVERVIEW) CON ESTADÍSTICAS INTEGRADAS =====
interface OverviewScreenProps {
  onNavigate: (view: string) => void;
}

// Paleta de colores variada y atractiva para gráficas
const COLORS = [
  '#3b82f6', // Azul
  '#10b981', // Verde esmeralda
  '#f59e0b', // Ámbar
  '#ef4444', // Rojo
  '#8b5cf6', // Púrpura
  '#06b6d4', // Cian
  '#f97316', // Naranja
  '#ec4899', // Rosa
  '#14b8a6', // Turquesa
  '#6366f1', // Índigo
];

const OverviewScreen: React.FC<OverviewScreenProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'dia' | 'semana' | 'mes' | 'año'>('mes');
  const [descargando, setDescargando] = useState<{ tipo: 'pdf' | 'excel' | 'powerpoint' | null }>({ tipo: null });

  // Query para estadísticas - React Query maneja el cache y actualizaciones
  const { data: estadisticas, isLoading: loading, error } = useQuery({
    queryKey: ['admin', 'estadisticas', periodoSeleccionado],
    queryFn: async () => {
      const response = await adminService.getEstadisticasGenerales(periodoSeleccionado);
      const datos = response.data || response.estadisticas;
      
      if (response.success && datos) {
        return datos;
      } else {
        throw new Error(response.message || 'Error cargando estadísticas');
      }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para actividad reciente
  const { data: actividadReciente = [] } = useQuery({
    queryKey: ['admin', 'actividad-reciente'],
    queryFn: async () => {
      const response = await adminService.getActividadReciente();
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const mostrarToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const formatearNumero = (numero: number) => {
    return numero.toLocaleString('es-CO');
  };

  const formatearMoneda = (cantidad: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(cantidad);
  };

  // Funciones de descarga (simplificadas, se pueden expandir)
  const descargarPDF = async () => {
    if (!estadisticas) {
      mostrarToast('No hay datos para exportar', 'error');
      return;
    }
    mostrarToast('Funcionalidad de PDF en desarrollo', 'error');
  };

  const descargarExcel = () => {
    if (!estadisticas) {
      mostrarToast('No hay datos para exportar', 'error');
      return;
    }
    mostrarToast('Funcionalidad de Excel en desarrollo', 'error');
  };

  const descargarPowerPoint = async () => {
    if (!estadisticas) {
      mostrarToast('No hay datos para exportar', 'error');
      return;
    }
    mostrarToast('Funcionalidad de PowerPoint en desarrollo', 'error');
  };

  // Datos para gráficas
  const datosGraficas = React.useMemo(() => {
    if (!estadisticas) return null;

    return {
      usuariosPorRol: [
        { name: 'Admin', value: estadisticas.usuarios_por_rol?.admin || 0 },
        { name: 'Productores', value: estadisticas.usuarios_por_rol?.productor || 0 },
        { name: 'Consumidores', value: estadisticas.usuarios_por_rol?.consumidor || 0 },
      ],
      productosPorCategoria: estadisticas.productos_por_categoria?.map(cat => ({
        name: cat.nombre || cat.categoria || 'Sin categoría',
        cantidad: cat.total || cat.cantidad || 0
      })) || [],
      pedidosPorEstado: [
        { name: 'Completados', value: estadisticas.pedidos_completados || 0 },
        { name: 'Pendientes', value: estadisticas.pedidos_pendientes || 0 },
        { name: 'Cancelados', value: estadisticas.pedidos_cancelados || 0 },
      ],
      metricasComparativas: [
        { name: 'Usuarios', valor: estadisticas.total_usuarios },
        { name: 'Productos', valor: estadisticas.total_productos },
        { name: 'Pedidos', valor: estadisticas.total_pedidos },
      ]
    };
  }, [estadisticas]);

  if (loading) {
    return (
      <div className="admin-overview-screen">
        <Loading text="Cargando datos del sistema..." />
      </div>
    );
  }

  return (
    <div className="admin-overview-screen estadisticas-screen">
      {/* Header con controles de descarga */}
      <div className="admin-overview-header screen-header">
        <div className="admin-overview-header-content header-content">
          <h1 className="admin-overview-title">📊 Resumen</h1>
          <p className="admin-overview-subtitle">Vista general del sistema y estadísticas completas</p>
        </div>
        <div className="admin-overview-actions header-actions">
          <div className="periodo-selector">
            <label>Período:</label>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value as any)}
            >
              <option value="dia">📅 Hoy</option>
              <option value="semana">📊 Esta semana</option>
              <option value="mes">📈 Este mes</option>
              <option value="año">📆 Este año</option>
            </select>
          </div>
          <div className="download-buttons">
            <Button
              className="download-btn download-btn-pdf"
              variant="primary"
              onClick={descargarPDF}
              disabled={!estadisticas || descargando.tipo !== null}
              loading={descargando.tipo === 'pdf'}
            >
              <span className="download-icon">📄</span>
              <span className="download-text">PDF</span>
            </Button>
            <Button
              className="download-btn download-btn-excel"
              variant="primary"
              onClick={descargarExcel}
              disabled={!estadisticas || descargando.tipo !== null}
              loading={descargando.tipo === 'excel'}
            >
              <span className="download-icon">📊</span>
              <span className="download-text">Excel</span>
            </Button>
            <Button
              className="download-btn download-btn-powerpoint"
              variant="primary"
              onClick={descargarPowerPoint}
              disabled={!estadisticas || descargando.tipo !== null}
              loading={descargando.tipo === 'powerpoint'}
            >
              <span className="download-icon">📽️</span>
              <span className="download-text">PowerPoint</span>
            </Button>
          </div>
          <Button 
            variant="primary" 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['admin', 'estadisticas'] });
              queryClient.invalidateQueries({ queryKey: ['admin', 'actividad-reciente'] });
            }} 
            loading={loading}
          >
            🔄 Actualizar Datos
          </Button>
        </div>
      </div>

      {error ? (
        <div className="error-message" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>❌ {error instanceof Error ? error.message : 'Error cargando estadísticas'}</p>
          <Button 
            variant="primary" 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['admin', 'estadisticas'] });
            }}
          >
            Reintentar
          </Button>
        </div>
      ) : estadisticas ? (
        <>
          {/* Métricas principales */}
          <div className="metrics-grid overview-stats">
            <Card className="metric-card primary stat-card" onClick={() => onNavigate('usuarios')} style={{ cursor: 'pointer' }}>
              <div className="metric-content stat-content">
                <div className="metric-icon stat-icon">👥</div>
                <div className="metric-info">
                  <div className="metric-number stat-value">{formatearNumero(estadisticas.total_usuarios)}</div>
                  <div className="metric-label stat-label">Total Usuarios</div>
                </div>
              </div>
            </Card>

            <Card className="metric-card success stat-card" onClick={() => onNavigate('productos')} style={{ cursor: 'pointer' }}>
              <div className="metric-content stat-content">
                <div className="metric-icon stat-icon">🛍️</div>
                <div className="metric-info">
                  <div className="metric-number stat-value">{formatearNumero(estadisticas.total_productos)}</div>
                  <div className="metric-label stat-label">Total Productos</div>
                </div>
              </div>
            </Card>

            <Card className="metric-card warning stat-card" onClick={() => onNavigate('pedidos')} style={{ cursor: 'pointer' }}>
              <div className="metric-content stat-content">
                <div className="metric-icon stat-icon">📦</div>
                <div className="metric-info">
                  <div className="metric-number stat-value">{formatearNumero(estadisticas.total_pedidos)}</div>
                  <div className="metric-label stat-label">Total Pedidos</div>
                </div>
              </div>
            </Card>

            <Card className="metric-card info stat-card">
              <div className="metric-content stat-content">
                <div className="metric-icon stat-icon">💰</div>
                <div className="metric-info">
                  <div className="metric-number stat-value">{formatearMoneda(estadisticas.ingresos_totales)}</div>
                  <div className="metric-label stat-label">Ingresos Totales</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Gráficas */}
          {datosGraficas && (
            <div className="estadisticas-graficas-container">
              {/* Gráfica de Usuarios por Rol */}
              <Card title="Distribución de Usuarios por Rol" className="grafica-card">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={datosGraficas.usuariosPorRol}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {datosGraficas.usuariosPorRol.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Gráfica de Productos por Categoría */}
              {datosGraficas.productosPorCategoria.length > 0 && (
                <Card title="Productos por Categoría" className="grafica-card">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={datosGraficas.productosPorCategoria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Gráfica de Pedidos por Estado */}
              <Card title="Pedidos por Estado" className="grafica-card">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={datosGraficas.pedidosPorEstado}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {datosGraficas.pedidosPorEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Gráfica Comparativa */}
              <Card title="Comparativa General" className="grafica-card">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosGraficas.metricasComparativas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="valor" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
        </div>
          )}

          {/* Estadísticas detalladas */}
          <div className="detailed-stats-grid">
            {/* Usuarios por rol */}
            <Card title="Usuarios por Rol" className="stats-card">
              <div className="role-stats">
                <div className="role-item">
                  <div className="role-icon">👨‍💼</div>
                  <div className="role-info">
                    <div className="role-name">Administradores</div>
                    <div className="role-count">{formatearNumero(estadisticas.usuarios_por_rol?.admin || 0)}</div>
                  </div>
                  <div className="role-percentage">
                    {estadisticas.total_usuarios > 0 ? 
                      Math.round(((estadisticas.usuarios_por_rol?.admin || 0) / estadisticas.total_usuarios) * 100) : 0}%
          </div>
        </div>

                <div className="role-item">
                  <div className="role-icon">🌱</div>
                  <div className="role-info">
                    <div className="role-name">Productores</div>
                    <div className="role-count">{formatearNumero(estadisticas.usuarios_por_rol?.productor || 0)}</div>
                  </div>
                  <div className="role-percentage">
                    {estadisticas.total_usuarios > 0 ? 
                      Math.round(((estadisticas.usuarios_por_rol?.productor || 0) / estadisticas.total_usuarios) * 100) : 0}%
          </div>
        </div>

                <div className="role-item">
                  <div className="role-icon">🛒</div>
                  <div className="role-info">
                    <div className="role-name">Consumidores</div>
                    <div className="role-count">{formatearNumero(estadisticas.usuarios_por_rol?.consumidor || 0)}</div>
                  </div>
                  <div className="role-percentage">
                    {estadisticas.total_usuarios > 0 ? 
                      Math.round(((estadisticas.usuarios_por_rol?.consumidor || 0) / estadisticas.total_usuarios) * 100) : 0}%
          </div>
                </div>
              </div>
            </Card>

            {/* Productos por categoría */}
            <Card title="Productos por Categoría" className="stats-card">
              <div className="category-stats">
                {estadisticas.productos_por_categoria?.map((categoria, index) => (
                  <div key={index} className="category-item">
                    <div className="category-name">{categoria.nombre || categoria.categoria || 'Sin categoría'}</div>
                    <div className="category-count">{formatearNumero(categoria.total || categoria.cantidad || 0)}</div>
                    <div className="category-bar">
                      <div 
                        className="category-fill" 
                        style={{ 
                          width: `${estadisticas.total_productos > 0 ? ((categoria.total || categoria.cantidad || 0) / estadisticas.total_productos) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )) || (
                  <div className="no-data">No hay datos de categorías disponibles</div>
                )}
              </div>
            </Card>

            {/* Estadísticas de pedidos */}
            <Card title="Estadísticas de Pedidos" className="stats-card">
              <div className="order-stats">
                <div className="order-item">
                  <div className="order-icon">📦</div>
                  <div className="order-info">
                    <div className="order-name">Pedidos Completados</div>
                    <div className="order-count">{formatearNumero(estadisticas.pedidos_completados || 0)}</div>
                  </div>
                </div>
                
                <div className="order-item">
                  <div className="order-icon">⏳</div>
                  <div className="order-info">
                    <div className="order-name">Pedidos Pendientes</div>
                    <div className="order-count">{formatearNumero(estadisticas.pedidos_pendientes || 0)}</div>
        </div>
      </div>

                <div className="order-item">
                  <div className="order-icon">❌</div>
                  <div className="order-info">
                    <div className="order-name">Pedidos Cancelados</div>
                    <div className="order-count">{formatearNumero(estadisticas.pedidos_cancelados || 0)}</div>
          </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Actividad reciente */}
          <Card title="Actividad Reciente" className="activity-card">
            <div className="activity-list">
              {actividadReciente.length === 0 ? (
                <div className="no-activity">
                  <div className="no-activity-icon">📊</div>
                  <h3>No hay actividad reciente</h3>
                  <p>Las actividades aparecerán aquí cuando los usuarios interactúen con la plataforma.</p>
                </div>
              ) : (
                actividadReciente.map((actividad, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {actividad.tipo === 'usuario_registrado' && '👤'}
                      {actividad.tipo === 'producto_creado' && '🛍️'}
                      {actividad.tipo === 'pedido_realizado' && '📦'}
                      {actividad.tipo === 'reporte_creado' && '📋'}
                      {actividad.tipo === 'mensaje_enviado' && '💬'}
                      {actividad.tipo === 'reseña_creada' && '⭐'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-description">{actividad.descripcion}</div>
                      <div className="activity-meta">
                        <span className="activity-user">{actividad.usuario || 'Sistema'}</span>
                        <span className="activity-time">{new Date(actividad.timestamp).toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                    <div className="activity-badge">
                      <Badge variant="info" size="small">
                        {actividad.tipo.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No hay datos de estadísticas disponibles</p>
          <Button 
            variant="primary" 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['admin', 'estadisticas'] });
            }}
          >
            Cargar Estadísticas
          </Button>
        </div>
      )}

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
