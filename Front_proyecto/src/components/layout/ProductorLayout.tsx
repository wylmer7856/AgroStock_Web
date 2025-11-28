import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ReusableComponents';
import logoProyecto from '../../assets/logoProyecto.png';
import '../../Screens/ADMIN/AdminScreens.css';
import { notificacionesService } from '../../services';
import type { Notification } from '../../types';
import { BiBell, BiHome, BiPackage, BiReceipt, BiMessageSquare, BiUser, BiLogOut, BiStore, BiBarChartAlt2 } from 'react-icons/bi';
import imagenesService from '../../services/imagenes';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ProductorLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<string>('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificacionesRecientes, setNotificacionesRecientes] = useState<Notification[]>([]);
  const [notificacionesLoading, setNotificacionesLoading] = useState(false);
  const [notificacionesError, setNotificacionesError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Query para notificaciones no leídas
  const { data: notificacionesNoLeidas = 0, refetch: refetchNotificacionesNoLeidas } = useQuery({
    queryKey: ['notificacionesNoLeidas'],
    queryFn: async () => {
      if (!isAuthenticated || !user) return 0;
      const response = await notificacionesService.contarNoLeidas();
      return response.data || 0;
    },
    enabled: isAuthenticated && !!user,
    refetchInterval: 30000, // Refetch cada 30 segundos
    refetchOnWindowFocus: false,
  });

  // Detectar ruta y actualizar vista
  useEffect(() => {
    const path = location.pathname;
    const viewMap: Record<string, string> = {
      '/productor/dashboard': 'overview',
      '/productor': 'overview',
      '/productor/productos': 'productos',
      '/productor/pedidos': 'pedidos',
      '/productor/mensajes': 'mensajes',
      '/productor/estadisticas': 'estadisticas',
      '/productor/perfil': 'perfil',
      '/notificaciones': 'notificaciones',
    };
    
    setCurrentView(viewMap[path] || 'overview');
  }, [location.pathname]);

  const handleNavigate = (view: string) => {
    const routeMap: Record<string, string> = {
      'overview': '/productor/dashboard',
      'productos': '/productor/productos',
      'pedidos': '/productor/pedidos',
      'mensajes': '/productor/mensajes',
      'estadisticas': '/productor/estadisticas',
      'perfil': '/productor/perfil',
      'notificaciones': '/notificaciones',
    };
    
    const route = routeMap[view] || '/productor/dashboard';
    navigate(route, { replace: true });
  };

  const cargarNotificacionesRecientes = useCallback(async () => {
    try {
      setNotificacionesLoading(true);
      setNotificacionesError(null);
      const response = await notificacionesService.obtenerMisNotificaciones(5);
      if (response.success && Array.isArray(response.data)) {
        setNotificacionesRecientes(response.data);
      } else {
        setNotificacionesRecientes([]);
      }
    } catch (error) {
      console.error('Error cargando notificaciones recientes:', error);
      setNotificacionesError('No se pudo cargar el listado de notificaciones');
      setNotificacionesRecientes([]);
    } finally {
      setNotificacionesLoading(false);
    }
  }, []);

  const handleToggleNotifications = useCallback(() => {
    const nextValue = !showNotifications;
    setShowNotifications(nextValue);
    if (nextValue) {
      setShowUserMenu(false);
      cargarNotificacionesRecientes();
      refetchNotificacionesNoLeidas();
    }
  }, [showNotifications, cargarNotificacionesRecientes, refetchNotificacionesNoLeidas]);

  const handleNotificationClick = useCallback(async (notificacion: Notification) => {
    setShowNotifications(false);
    const navigateTo = '/notificaciones';

    if (!notificacion.leida) {
      try {
        await notificacionesService.marcarComoLeida(notificacion.id_notificacion);
        queryClient.invalidateQueries({ queryKey: ['notificacionesNoLeidas'] });
        setNotificacionesRecientes((prev) =>
          prev.map((n) =>
            n.id_notificacion === notificacion.id_notificacion ? { ...n, leida: true } : n
          )
        );
      } catch (error) {
        console.error('Error marcando notificación como leída:', error);
      }
    }
    navigate(navigateTo);
  }, [navigate, queryClient]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const getRolIcon = () => {
    if (!user) return <BiUser />;
    switch (user.rol) {
      case 'admin':
        return <BiStore />;
      case 'productor':
        return <BiPackage />;
      default:
        return <BiUser />;
    }
  };

  const getRolLabel = () => {
    if (!user) return 'Usuario';
    switch (user.rol) {
      case 'admin':
        return 'Administrador';
      case 'productor':
        return 'Productor';
      default:
        return 'Consumidor';
    }
  };

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        const target = event.target as HTMLElement;
        if (target && !target.closest('.dropdown')) {
          setShowUserMenu(false);
          setShowNotifications(false);
        }
      } catch (error) {
        console.error('Error en handleClickOutside:', error);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        if (typeof document !== 'undefined') {
          document.removeEventListener('mousedown', handleClickOutside);
        }
      };
    }
  }, []);

  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

  return (
    <div className="admin-dashboard productor-dashboard">
      <div className="admin-sidebar productor-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img 
              src={logoProyecto} 
              alt="AgroStock Logo" 
              className="sidebar-logo-img"
            />
          </div>
          <span className="panel-text">Panel Productor</span>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavigate('overview')}
          >
            📊 Resumen
          </button>
          <button
            className={`nav-item ${currentView === 'productos' ? 'active' : ''}`}
            onClick={() => handleNavigate('productos')}
          >
            🛍️ Mis Productos
          </button>
          <button
            className={`nav-item ${currentView === 'pedidos' ? 'active' : ''}`}
            onClick={() => handleNavigate('pedidos')}
          >
            📦 Mis Pedidos
          </button>
          <button
            className={`nav-item ${currentView === 'mensajes' ? 'active' : ''}`}
            onClick={() => handleNavigate('mensajes')}
          >
            💬 Mensajes
          </button>
          <button
            className={`nav-item ${currentView === 'estadisticas' ? 'active' : ''}`}
            onClick={() => handleNavigate('estadisticas')}
          >
            📈 Estadísticas
          </button>
          <button
            className={`nav-item ${currentView === 'notificaciones' ? 'active' : ''}`}
            onClick={() => handleNavigate('notificaciones')}
          >
            🔔 Notificaciones
            {notificacionesNoLeidas > 0 && (
              <span className="badge bg-danger ms-2">{notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}</span>
            )}
          </button>
          <button
            className={`nav-item ${currentView === 'perfil' ? 'active' : ''}`}
            onClick={() => handleNavigate('perfil')}
          >
            👤 Mi Perfil
          </button>
        </nav>

        <div className="sidebar-footer">
          <Button variant="danger" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="admin-main productor-main">
        <div className="main-header">
          <div className="d-flex justify-content-between align-items-center w-100">
            <h1>Bienvenido, {user?.nombre || 'Productor'}</h1>
            <div className="d-flex align-items-center gap-3">
              {/* Botón para ir a productos públicos */}
              <button
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                onClick={() => navigate('/productos')}
                style={{ 
                  borderColor: '#2d5016', 
                  color: '#2d5016',
                  fontWeight: 500
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d5016';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#2d5016';
                }}
              >
                <BiPackage />
                <span className="d-none d-md-inline">Ver Catálogo</span>
              </button>

              {/* Botón para ir al inicio */}
              <button
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                onClick={() => navigate('/')}
                style={{ fontWeight: 500 }}
              >
                <BiHome />
                <span className="d-none d-md-inline">Inicio</span>
              </button>

              {/* Notificaciones */}
              <div className="dropdown" style={{ position: 'relative' }}>
                <button
                  className="btn btn-outline-secondary position-relative d-flex align-items-center justify-content-center"
                  onClick={handleToggleNotifications}
                  type="button"
                  title="Notificaciones"
                  aria-label="Notificaciones"
                  aria-expanded={showNotifications}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    borderColor: 'rgba(0,0,0,0.1)',
                    color: '#333',
                    backgroundColor: '#f0f2f5',
                  }}
                >
                  <BiBell className="fs-5" />
                  {notificacionesNoLeidas > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div
                    className="dropdown-menu dropdown-menu-end show"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.5rem)',
                      right: 0,
                      zIndex: 1050,
                      minWidth: '320px',
                      maxWidth: '360px',
                      boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                      animation: 'fadeInDown 0.2s ease-out'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                      <strong>Notificaciones</strong>
                      <button
                        className="btn btn-link btn-sm p-0 text-decoration-none"
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/notificaciones');
                        }}
                      >
                        Ver todas
                      </button>
                    </div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {notificacionesLoading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                        </div>
                      ) : notificacionesError ? (
                        <div className="text-center text-muted small py-3 px-3">
                          {notificacionesError}
                        </div>
                      ) : notificacionesRecientes.length === 0 ? (
                        <div className="text-center text-muted small py-3 px-3">
                          No tienes notificaciones recientes
                        </div>
                      ) : (
                        notificacionesRecientes.map((notificacion) => (
                          <button
                            key={notificacion.id_notificacion}
                            className={`dropdown-item text-wrap ${notificacion.leida ? '' : 'fw-semibold'}`}
                            style={{ whiteSpace: 'normal' }}
                            onClick={() => handleNotificationClick(notificacion)}
                          >
                            <div className="d-flex justify-content-between">
                              <span>{notificacion.titulo}</span>
                              <small className="text-muted">
                                {new Date(notificacion.fecha_creacion).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </small>
                            </div>
                            <small className="text-muted d-block">
                              {notificacion.mensaje}
                            </small>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de Perfil */}
              <div className="dropdown" style={{ position: 'relative' }}>
                <button
                  className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  type="button"
                  title={`Perfil de ${user?.nombre || 'Usuario'}`}
                  aria-label="Menú de usuario"
                  aria-expanded={showUserMenu}
                  style={{
                    borderColor: 'rgba(0,0,0,0.1)',
                    color: '#333',
                    backgroundColor: '#f0f2f5',
                    borderRadius: '20px',
                    padding: '0.375rem 1rem',
                  }}
                >
                  {user?.foto_perfil ? (
                    <img
                      src={imagenesService.construirUrlImagen(user.foto_perfil) || ''}
                      alt={user.nombre}
                      className="rounded-circle me-2"
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                      {getRolIcon()}
                    </div>
                  )}
                  <span className="d-none d-md-inline">{user?.nombre || 'Usuario'}</span>
                </button>
                {showUserMenu && (
                  <>
                    <div 
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1054,
                        backgroundColor: 'transparent'
                      }}
                      onClick={() => setShowUserMenu(false)}
                    />
                    <ul 
                      className="dropdown-menu dropdown-menu-end show" 
                      style={{ 
                        position: 'absolute', 
                        top: 'calc(100% + 0.5rem)', 
                        right: 0,
                        zIndex: 1055, 
                        minWidth: '220px',
                        boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
                        backgroundColor: '#ffffff',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 0',
                        display: 'block',
                        opacity: 1,
                        visibility: 'visible',
                        animation: 'fadeInDown 0.2s ease-out'
                      }}
                    >
                      <li>
                        <h6 className="dropdown-header">
                          {user?.nombre || 'Usuario'}
                        </h6>
                        <small className="dropdown-header text-muted">
                          {getRolLabel()}
                        </small>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      
                      <li>
                        <Link 
                          className="dropdown-item" 
                          to="/productor/dashboard"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BiHome className="me-2" />
                          Mi Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link 
                          className="dropdown-item" 
                          to="/productor/productos"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BiPackage className="me-2" />
                          Mis Productos
                        </Link>
                      </li>
                      <li>
                        <Link 
                          className="dropdown-item" 
                          to="/productor/pedidos"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BiReceipt className="me-2" />
                          Mis Pedidos
                        </Link>
                      </li>
                      <li>
                        <Link 
                          className="dropdown-item" 
                          to="/productor/mensajes"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BiMessageSquare className="me-2" />
                          Mensajes
                        </Link>
                      </li>
                      <li>
                        <Link 
                          className="dropdown-item" 
                          to="/productor/estadisticas"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BiBarChartAlt2 className="me-2" />
                          Estadísticas
                        </Link>
                      </li>
                      <li>
                        <Link 
                          className="dropdown-item" 
                          to="/productor/perfil"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BiUser className="me-2" />
                          Mi Perfil
                        </Link>
                      </li>
                      
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button 
                          className="dropdown-item text-danger" 
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                        >
                          <BiLogOut className="me-2" />
                          Cerrar Sesión
                        </button>
                      </li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProductorLayout;

