import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { notificacionesService, imagenesService } from '../../services';
import { toast } from 'react-toastify';
import logoProyecto from '../../assets/logoProyecto.png';
import type { Notification } from '../../types';
import { 
  BiUser, 
  BiLogOut, 
  BiMenu,
  BiBell,
  BiHome
} from 'react-icons/bi';
import './DashboardHeader.css';

interface DashboardHeaderProps {
  onToggleSidebar?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  // Query para notificaciones
  const { data: notificacionesCount } = useQuery({
    queryKey: ['notificaciones', 'contar'],
    queryFn: async () => {
      try {
        const response = await notificacionesService.contarNoLeidas();
        return response.data || 0;
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
        return 0;
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    // NO refrescar automáticamente - solo cuando el usuario interactúa
  });

  useEffect(() => {
    if (notificacionesCount !== undefined) {
      setNotificacionesNoLeidas(notificacionesCount);
    }
  }, [notificacionesCount]);

  // Query para obtener notificaciones recientes
  const { data: notificaciones, isLoading: loadingNotificaciones } = useQuery({
    queryKey: ['notificaciones', 'recientes'],
    queryFn: async () => {
      try {
        const response = await notificacionesService.obtenerMisNotificaciones(5, false);
        return response.data || [];
      } catch (error) {
        console.error('Error obteniendo notificaciones:', error);
        return [];
      }
    },
    enabled: !!user && showNotifications,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    // NO refrescar automáticamente - solo cuando el usuario abre el menú de notificaciones
  });

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && !target.closest('.dropdown')) {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar notificaciones al cambiar de ruta
  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

  const handleNotificationClick = async (notificacion: Notification) => {
    try {
      if (!notificacion.leida) {
        await notificacionesService.marcarComoLeida(notificacion.id_notificacion);
        setNotificacionesNoLeidas(prev => Math.max(0, prev - 1));
      }
      setShowNotifications(false);
      
      // Navegar según el tipo de referencia
      if (notificacion.tipo_referencia === 'pedido' && notificacion.id_referencia) {
        navigate(`/pedidos/${notificacion.id_referencia}`);
      } else {
        navigate('/notificaciones');
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada correctamente');
      navigate('/');
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };

  const getPerfilPath = () => {
    if (!user) return '/login';
    switch (user.rol) {
      case 'productor':
        return '/productor/perfil';
      case 'admin':
        return '/admin/perfil';
      case 'consumidor':
        return '/consumidor/perfil';
      default:
        return '/login';
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.rol) {
      case 'productor':
        return '/productor/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'consumidor':
        return '/'; // Consumidores van al home
      default:
        return '/';
    }
  };

  const handleGoToHome = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('🚀 [DashboardHeader] Navegando al inicio público');
    // Redirigir al inicio público
    window.location.href = '/';
  };

  return (
    <header className="dashboard-header bg-white shadow-sm border-bottom sticky-top" style={{ zIndex: 1020, height: '60px' }}>
      <div className="d-flex align-items-center h-100 px-3" style={{ justifyContent: 'space-between', width: '100%' }}>
        {/* Logo y botón de menú - Izquierda */}
        <div className="d-flex align-items-center gap-3" style={{ flexShrink: 0 }}>
          {onToggleSidebar && (
            <button
              className="btn btn-link text-dark p-0 d-lg-none"
              onClick={onToggleSidebar}
              style={{ fontSize: '1.5rem' }}
            >
              <BiMenu />
            </button>
          )}
          <button
            onClick={handleGoToHome}
            className="btn btn-link text-dark p-0 d-flex align-items-center text-decoration-none border-0"
            style={{ backgroundColor: 'transparent', cursor: 'pointer' }}
            title="Ir al inicio"
            type="button"
          >
            <img 
              src={logoProyecto} 
              alt="AgroStock" 
              style={{ height: '40px', width: 'auto', pointerEvents: 'none' }}
            />
            <span className="ms-2 fw-bold text-primary d-none d-md-inline">AgroStock</span>
          </button>
          {/* Icono de casita para ir al inicio */}
          <button
            onClick={handleGoToHome}
            className="btn btn-link text-dark p-2 border-0"
            title="Ir al inicio"
            style={{ backgroundColor: 'transparent', textDecoration: 'none', cursor: 'pointer' }}
            type="button"
          >
            <BiHome style={{ fontSize: '1.5rem' }} />
          </button>
        </div>

        {/* Opciones del usuario - Derecha */}
        <div className="d-flex align-items-center gap-2" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          {/* Notificaciones */}
          {user && (
            <div className="dropdown" style={{ position: 'relative' }}>
              <button
                className="btn btn-link text-dark position-relative p-2 border-0"
                onClick={() => setShowNotifications(!showNotifications)}
                type="button"
                title="Notificaciones"
                style={{ backgroundColor: 'transparent' }}
              >
                <BiBell style={{ fontSize: '1.5rem' }} />
                {notificacionesNoLeidas > 0 && (
                  <span 
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.7rem', padding: '2px 5px' }}
                  >
                    {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div 
                  className="dropdown-menu dropdown-menu-end show shadow"
                  style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    right: 0,
                    zIndex: 1050, 
                    minWidth: '320px',
                    maxWidth: '400px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    marginTop: '0.5rem',
                    boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold">Notificaciones</h6>
                    <Link 
                      to="/notificaciones" 
                      className="btn btn-sm btn-link p-0"
                      onClick={() => setShowNotifications(false)}
                    >
                      Ver todas
                    </Link>
                  </div>
                  
                  {loadingNotificaciones ? (
                    <div className="px-3 py-4 text-center">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                    </div>
                  ) : notificaciones && notificaciones.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {notificaciones.map((notif: Notification) => (
                        <button
                          key={notif.id_notificacion}
                          className={`dropdown-item text-start ${!notif.leida ? 'fw-bold bg-light' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                          style={{ 
                            whiteSpace: 'normal',
                            borderLeft: !notif.leida ? '3px solid #0d6efd' : 'none',
                            padding: '0.75rem 1rem'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div className="flex-grow-1">
                              <div className="fw-semibold">{notif.titulo}</div>
                              <div className="small text-muted mt-1">{notif.mensaje}</div>
                            </div>
                            {!notif.leida && (
                              <span className="badge bg-primary rounded-pill ms-2">Nueva</span>
                            )}
                          </div>
                          <div className="small text-muted mt-1">
                            {new Date(notif.fecha_creacion).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-center text-muted">
                      <BiBell className="fs-1 mb-2 opacity-50" />
                      <p className="mb-0">No hay notificaciones</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Menú de usuario */}
          {user && (
            <div className="dropdown">
              <button
                className="btn btn-link text-dark d-flex align-items-center gap-2 p-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                style={{ textDecoration: 'none' }}
              >
                {user.foto_perfil ? (
                  <div className="position-relative" style={{ width: '32px', height: '32px' }}>
                    <img
                      src={imagenesService.construirUrlImagen(user.foto_perfil) || ''}
                      alt={user.nombre}
                      className="rounded-circle"
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        console.error('❌ [DashboardHeader] Error cargando imagen de perfil:', {
                          foto_perfil: user.foto_perfil,
                          url: img.src,
                          user: user.nombre
                        });
                        img.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('✅ [DashboardHeader] Imagen de perfil cargada exitosamente:', {
                          foto_perfil: user.foto_perfil,
                          url: imagenesService.construirUrlImagen(user.foto_perfil)
                        });
                      }}
                    />
                    <div 
                      className="position-absolute rounded-circle bg-primary d-flex align-items-center justify-content-center"
                      style={{ 
                        bottom: '-2px', 
                        right: '-2px', 
                        width: '14px', 
                        height: '14px',
                        border: '2px solid white'
                      }}
                    >
                      <BiUser style={{ fontSize: '8px', color: 'white' }} />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px' }}>
                    <BiUser />
                  </div>
                )}
                <span className="d-none d-md-inline">{user.nombre}</span>
                <span className="d-none d-md-inline">▼</span>
              </button>

              {showUserMenu && (
                <ul 
                  className="dropdown-menu dropdown-menu-end show shadow"
                  style={{ minWidth: '200px' }}
                >
                  <li>
                    <div className="px-3 py-2 border-bottom">
                      <div className="fw-bold">{user.nombre}</div>
                      <small className="text-muted">{user.email}</small>
                      <div>
                        <span className="badge bg-primary mt-1">
                          {user.rol === 'admin' ? 'Administrador' : 
                           user.rol === 'productor' ? 'Productor' : 
                           'Consumidor'}
                        </span>
                      </div>
                    </div>
                  </li>
                  
                  <li>
                    <Link 
                      className="dropdown-item" 
                      to={getDashboardPath()}
                      onClick={() => setShowUserMenu(false)}
                    >
                      <BiHome className="me-2" />
                      Dashboard
                    </Link>
                  </li>

                  <li>
                    <Link 
                      className="dropdown-item" 
                      to={getPerfilPath()}
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
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;


