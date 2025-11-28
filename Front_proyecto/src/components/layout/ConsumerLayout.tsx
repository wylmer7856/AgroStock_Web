import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ReusableComponents';
import { notificacionesService, carritoService, listaDeseosService } from '../../services';
import { BiBell, BiHome, BiPackage, BiCart, BiHeart } from 'react-icons/bi';
import logoProyecto from '../../assets/logoProyecto.png';
import type { Notification } from '../../types';
import '../../Screens/ADMIN/AdminScreens.css';
import '../../Screens/CONSUMIDOR/ConsumidorScreens.css';

const ConsumerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<string>('overview');
  const [showNotifications, setShowNotifications] = useState(false);

  // Detectar ruta y actualizar vista
  useEffect(() => {
    const path = location.pathname;
    const viewMap: Record<string, string> = {
      '/consumidor/dashboard': 'overview',
      '/consumidor': 'overview',
      '/consumidor/pedidos': 'pedidos',
      '/consumidor/mensajes': 'mensajes',
      '/consumidor/perfil': 'perfil',
      '/notificaciones': 'notificaciones',
    };
    
    setCurrentView(viewMap[path] || 'overview');
  }, [location.pathname]);

  const handleNavigate = (view: string) => {
    const routeMap: Record<string, string> = {
      'overview': '/consumidor/dashboard',
      'carrito': '/consumidor/carrito',
      'lista-deseos': '/consumidor/lista-deseos',
      'pedidos': '/consumidor/pedidos',
      'mensajes': '/consumidor/mensajes',
      'perfil': '/consumidor/perfil',
    };
    
    const route = routeMap[view] || '/consumidor/dashboard';
    navigate(route, { replace: true });
  };

  // Query para notificaciones
  const { data: notificacionesNoLeidas = 0 } = useQuery({
    queryKey: ['notificaciones', 'contar'],
    queryFn: async () => {
      const response = await notificacionesService.contarNoLeidas();
      return response.data || 0;
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  const { data: notificacionesRecientes = [] } = useQuery({
    queryKey: ['notificaciones', 'recientes'],
    queryFn: async () => {
      const response = await notificacionesService.obtenerMisNotificaciones(5);
      return response.data || [];
    },
    enabled: showNotifications,
    refetchOnWindowFocus: false,
  });

  // Query para carrito
  const { data: carrito } = useQuery({
    queryKey: ['carrito'],
    queryFn: async () => {
      const response = await carritoService.obtenerCarrito();
      return response.data || null;
    },
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  // Query para lista de deseos
  const { data: listaDeseos } = useQuery({
    queryKey: ['lista-deseos'],
    queryFn: async () => {
      const response = await listaDeseosService.obtenerMiListaDeseos();
      return response.data || [];
    },
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const itemsCarrito = carrito?.items?.length || 0;
  const itemsListaDeseos = listaDeseos?.length || 0;

  const handleNotificationClick = async (notificacion: Notification) => {
    setShowNotifications(false);
    if (!notificacion.leida) {
      try {
        await notificacionesService.marcarComoLeida(notificacion.id_notificacion);
      } catch (error) {
        console.error('Error marcando notificación como leída:', error);
      }
    }
    navigate('/notificaciones');
  };

  return (
    <div className="admin-dashboard consumidor-dashboard">
      <div className="admin-sidebar consumidor-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img 
              src={logoProyecto} 
              alt="AgroStock Logo" 
              className="sidebar-logo-img"
            />
          </div>
          <span className="panel-text">Panel Consumidor</span>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentView === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavigate('overview')}
          >
            📊 Resumen
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
            className={`nav-item ${currentView === 'notificaciones' ? 'active' : ''}`}
            onClick={() => navigate('/notificaciones')}
          >
            🔔 Notificaciones
            {notificacionesNoLeidas > 0 && (
              <span className="badge bg-danger ms-2" style={{ fontSize: '0.7rem' }}>
                {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
              </span>
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
          <Button variant="danger" onClick={async () => {
            try {
              await logout();
              navigate('/');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
            }
          }}>
            🚪 Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="admin-main consumidor-main">
        <div className="main-header">
          <div className="d-flex justify-content-between align-items-center w-100">
            <h1 style={{ margin: 0 }}>Bienvenido, {user?.nombre || 'Usuario'}</h1>
            <div className="d-flex gap-2 align-items-center">
              {/* Botón para ir a productos */}
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
                <span className="d-none d-md-inline">Ver Productos</span>
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

              {/* Lista de Deseos - Icono */}
              <div className="position-relative">
                <button
                  className="btn btn-link position-relative p-2"
                  onClick={() => navigate('/consumidor/lista-deseos')}
                  style={{ 
                    color: '#111827',
                    textDecoration: 'none',
                    border: 'none',
                    background: 'transparent'
                  }}
                  title="Lista de Deseos"
                >
                  <BiHeart style={{ fontSize: '1.5rem', color: '#dc3545' }} />
                  {itemsListaDeseos > 0 && (
                    <span 
                      className="badge bg-danger rounded-pill position-absolute"
                      style={{
                        top: '2px',
                        right: '2px',
                        fontSize: '0.7rem',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white'
                      }}
                    >
                      {itemsListaDeseos > 9 ? '9+' : itemsListaDeseos}
                    </span>
                  )}
                </button>
              </div>

              {/* Carrito - Icono */}
              <div className="position-relative">
                <button
                  className="btn btn-link position-relative p-2"
                  onClick={() => navigate('/consumidor/carrito')}
                  style={{ 
                    color: '#111827',
                    textDecoration: 'none',
                    border: 'none',
                    background: 'transparent'
                  }}
                  title="Carrito de Compras"
                >
                  <BiCart style={{ fontSize: '1.5rem' }} />
                  {itemsCarrito > 0 && (
                    <span 
                      className="badge bg-danger rounded-pill position-absolute"
                      style={{
                        top: '2px',
                        right: '2px',
                        fontSize: '0.7rem',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white'
                      }}
                    >
                      {itemsCarrito > 9 ? '9+' : itemsCarrito}
                    </span>
                  )}
                </button>
              </div>

              {/* Notificaciones */}
              <div className="position-relative">
                <button
                  className="btn btn-link position-relative p-2"
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ 
                    color: '#111827',
                    textDecoration: 'none',
                    border: 'none',
                    background: 'transparent'
                  }}
                >
                  <BiBell style={{ fontSize: '1.5rem' }} />
                  {notificacionesNoLeidas > 0 && (
                    <span 
                      className="badge bg-danger rounded-pill position-absolute"
                      style={{
                        top: '2px',
                        right: '2px',
                        fontSize: '0.7rem',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white'
                      }}
                    >
                      {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
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
                      onClick={() => setShowNotifications(false)}
                    />
                    <div
                      className="dropdown-menu show"
          style={{ 
                        position: 'absolute',
                        top: 'calc(100% + 0.5rem)',
                        right: 0,
                        zIndex: 1055,
                        minWidth: '320px',
                        maxWidth: '400px',
                        boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(0, 0, 0, 0.15)',
                        borderRadius: '0.5rem',
                        padding: 0,
                        maxHeight: '500px',
                        overflowY: 'auto'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-primary text-white" style={{ borderRadius: '0.5rem 0.5rem 0 0' }}>
                        <strong>Notificaciones</strong>
                        <button
                          className="btn btn-link btn-sm p-0 text-white text-decoration-none"
                          onClick={() => {
                            setShowNotifications(false);
                            navigate('/notificaciones');
                          }}
                        >
                          Ver todas
                        </button>
                      </div>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notificacionesRecientes.length === 0 ? (
                          <div className="text-center text-muted small py-4 px-3">
                            No tienes notificaciones recientes
                          </div>
                        ) : (
                          notificacionesRecientes.map((notificacion: Notification) => (
                            <button
                              key={notificacion.id_notificacion}
                              className={`dropdown-item text-wrap ${notificacion.leida ? '' : 'fw-semibold bg-light'}`}
                              style={{ 
                                whiteSpace: 'normal',
                                borderLeft: !notificacion.leida ? '3px solid #0d6efd' : 'none',
                                padding: '0.75rem 1rem'
                              }}
                              onClick={() => handleNotificationClick(notificacion)}
                            >
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <div className="flex-grow-1">
                                  <div className="fw-semibold">{notificacion.titulo}</div>
                                  <div className="small text-muted mt-1">{notificacion.mensaje}</div>
                                </div>
                                {!notificacion.leida && (
                                  <span className="badge bg-primary rounded-pill ms-2">Nueva</span>
                                )}
                              </div>
                              <div className="small text-muted mt-1">
                                {new Date(notificacion.fecha_creacion).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
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

export default ConsumerLayout;
