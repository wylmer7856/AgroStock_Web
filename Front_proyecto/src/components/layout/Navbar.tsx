import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { notificacionesService, carritoService, listaDeseosService, imagenesService } from '../../services';
import { carritoLocalService } from '../../services/carritoLocal';
import { listaDeseosLocalService } from '../../services/listaDeseosLocal';
import { toast } from 'react-toastify';
import logoProyecto from '../../assets/logoProyecto.png';
import './Navbar.css';
import type { Notification } from '../../types';
import { 
  BiCart, 
  BiHeart, 
  BiBell, 
  BiUser, 
  BiLogOut, 
  BiMenu,
  BiHome,
  BiPackage,
  BiStore,
  BiCategory,
  BiStar,
} from 'react-icons/bi';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

// Estilos inline para forzar transparencia en navbar
const navLinkStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  background: 'transparent',
};

const handleNavLinkMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.setProperty('background-color', 'transparent', 'important');
  e.currentTarget.style.setProperty('background', 'transparent', 'important');
};

const handleNavLinkMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.setProperty('background-color', 'transparent', 'important');
  e.currentTarget.style.setProperty('background', 'transparent', 'important');
};

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificacionesRecientes, setNotificacionesRecientes] = useState<Notification[]>([]);
  const [notificacionesLoading, setNotificacionesLoading] = useState(false);
  const [notificacionesError, setNotificacionesError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [carritoCount, setCarritoCount] = useState(0);
  const [listaDeseosCount, setListaDeseosCount] = useState(0);

  // Forzar estilos de navbar - aplicar cada vez que cambie algo
  useEffect(() => {
    const forceTransparent = () => {
      document.querySelectorAll('.navbar .nav-link').forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.setProperty('background', 'transparent', 'important');
        htmlEl.style.setProperty('background-color', 'transparent', 'important');
      });
    };
    
    forceTransparent();
    const observer = new MutationObserver(forceTransparent);
    observer.observe(document.body, { childList: true, subtree: true });
    
    const interval = setInterval(forceTransparent, 50);
    
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Query para carrito cuando está autenticado
  const { data: carritoData } = useQuery({
    queryKey: ['carrito'],
    queryFn: async () => {
      try {
        const response = await carritoService.obtenerCarrito();
        return response.data;
      } catch (error) {
        console.error('Error obteniendo carrito:', error);
        return null;
      }
    },
    enabled: isAuthenticated && user?.rol === 'consumidor',
    refetchInterval: 10000, // Actualizar cada 10 segundos (menos frecuente)
    retry: 1,
  });

  // Query para lista de deseos cuando está autenticado
  const { data: listaDeseosData } = useQuery({
    queryKey: ['lista-deseos'],
    queryFn: async () => {
      try {
        const response = await listaDeseosService.obtenerMiListaDeseos();
        return response.data || [];
      } catch (error) {
        console.error('Error obteniendo lista de deseos:', error);
        return [];
      }
    },
    enabled: isAuthenticated && user?.rol === 'consumidor',
    refetchInterval: 10000, // Actualizar cada 10 segundos (menos frecuente)
    retry: 1,
  });

  // Actualizar contador de lista de deseos cuando cambian los datos
  useEffect(() => {
    if (isAuthenticated && user?.rol === 'consumidor') {
      if (Array.isArray(listaDeseosData)) {
        setListaDeseosCount(listaDeseosData.length);
      } else {
        setListaDeseosCount(0);
      }
    } else {
      // Usar datos locales
      const listaDeseos = listaDeseosLocalService.obtenerListaDeseos();
      setListaDeseosCount(listaDeseos?.length || 0);
    }
  }, [listaDeseosData, isAuthenticated, user]);

  // Cargar contadores de carrito
  useEffect(() => {
    const actualizarContadores = () => {
      try {
        if (isAuthenticated && user?.rol === 'consumidor') {
          // Usar datos del servidor
          setCarritoCount(carritoData?.items?.length || 0);
        } else {
          // Usar datos locales
          const carrito = carritoLocalService.obtenerCarrito();
          setCarritoCount(carrito?.items?.length || 0);
        }
      } catch (error) {
        console.error('Error actualizando contadores:', error);
        setCarritoCount(0);
      }
    };

    actualizarContadores();
    // Actualizar cuando cambia la ruta o los datos
    const interval = setInterval(actualizarContadores, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, location.pathname, carritoData]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchNotifications = () => {
      cargarNotificacionesNoLeidas();
      if (showNotifications) {
        cargarNotificacionesRecientes();
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // refrescar cada 5s para una experiencia más cercana a tiempo real
    return () => clearInterval(interval);
  }, [isAuthenticated, user, showNotifications]);

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

  const cargarNotificacionesRecientes = async () => {
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
  };

  const cargarNotificacionesNoLeidas = async () => {
    try {
      const response = await notificacionesService.contarNoLeidas();
      if (response.success && typeof response.data === 'number') {
        setNotificacionesNoLeidas(response.data);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const handleToggleNotifications = () => {
    const nextValue = !showNotifications;
    setShowNotifications(nextValue);
    if (nextValue) {
      setShowUserMenu(false);
      cargarNotificacionesRecientes();
      cargarNotificacionesNoLeidas();
    }
  };

  const handleNotificationClick = async (notificacion: Notification) => {
    setShowNotifications(false);
    const navigateTo = '/notificaciones';

    if (!notificacion.leida) {
      try {
        await notificacionesService.marcarComoLeida(notificacion.id_notificacion);
        setNotificacionesRecientes((prev) =>
          prev.map((n) =>
            n.id_notificacion === notificacion.id_notificacion ? { ...n, leida: true } : n
          )
        );
        setNotificacionesNoLeidas((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marcando notificación como leída:', error);
      }
    }

    navigate(navigateTo);
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

  const handleScrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container-fluid">
        {/* Logo y Toggle */}
        <Link 
          className="navbar-brand d-flex align-items-center fw-bold" 
          to="/"
        >
          <img 
            src={logoProyecto} 
            alt="AgroStock Logo" 
            className="navbar-logo me-2"
            style={{ height: '40px', width: 'auto' }}
          />
          <span className="d-none d-sm-inline">AgroStock</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <BiMenu className="fs-4" />
        </button>

        {/* Navbar Collapse */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Links principales */}
          <ul className="navbar-nav me-auto">
            {/* Inicio - Siempre visible */}
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/' ? 'active fw-bold' : ''}`} 
                to="/"
                style={navLinkStyle}
                onMouseEnter={handleNavLinkMouseEnter}
                onMouseLeave={handleNavLinkMouseLeave}
                onClick={(e) => {
                  if (location.pathname === '/') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <BiHome className="me-1" />
                Inicio
              </Link>
            </li>

            {/* Productos - Siempre visible */}
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname.startsWith('/productos') && !location.pathname.startsWith('/productor/productos') ? 'active fw-bold' : ''}`} 
                to="/productos"
                style={navLinkStyle}
                onMouseEnter={handleNavLinkMouseEnter}
                onMouseLeave={handleNavLinkMouseLeave}
              >
                <BiPackage className="me-1" />
                Productos
              </Link>
            </li>

            {/* Categorías - Solo en inicio, scroll a sección */}
            {location.pathname === '/' && (
              <li className="nav-item">
                <button
                  className="nav-link border-0 bg-transparent text-white"
                  onClick={() => handleScrollToSection('categorias-section')}
                  style={{ cursor: 'pointer', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <BiCategory className="me-1" />
                  Categorías
                </button>
              </li>
            )}

            {/* Productos Destacados - Solo en inicio, scroll a sección */}
            {location.pathname === '/' && (
              <li className="nav-item">
                <button
                  className="nav-link border-0 bg-transparent text-white"
                  onClick={() => handleScrollToSection('productos-destacados')}
                  style={{ cursor: 'pointer', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <BiStar className="me-1" />
                  Destacados
                </button>
              </li>
            )}

            {/* Mis Productos - Solo para productores */}
            {isAuthenticated && user && user.rol === 'productor' && (
              <li className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname.startsWith('/productor/productos') ? 'active fw-bold' : ''}`} 
                  to="/productor/productos"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <BiPackage className="me-1" />
                  Mis Productos
                </Link>
              </li>
            )}

          </ul>

          {/* Items del lado derecho */}
          <ul className="navbar-nav ms-auto align-items-center">
            {/* Lista de deseos - Siempre visible */}
            <li className="nav-item">
              {isAuthenticated && user?.rol === 'consumidor' ? (
                <Link 
                  className={`nav-link position-relative ${location.pathname === '/consumidor/lista-deseos' || location.pathname === '/lista-deseos' ? 'active' : ''}`} 
                  to="/consumidor/lista-deseos"
                  title="Lista de Deseos"
                  style={navLinkStyle}
                  onMouseEnter={handleNavLinkMouseEnter}
                  onMouseLeave={handleNavLinkMouseLeave}
                >
                  <BiHeart className="fs-5" />
                  {listaDeseosCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                      {listaDeseosCount > 9 ? '9+' : listaDeseosCount}
                    </span>
                  )}
                </Link>
              ) : (
                <span
                  className="nav-link position-relative"
                  style={{ ...navLinkStyle, cursor: 'pointer' }}
                  onClick={() => navigate('/login', { state: { from: location.pathname } })}
                  title="Inicia sesión para ver tu lista de deseos"
                  onMouseEnter={handleNavLinkMouseEnter}
                  onMouseLeave={handleNavLinkMouseLeave}
                >
                  <BiHeart className="fs-5" />
                  {listaDeseosCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                      {listaDeseosCount > 9 ? '9+' : listaDeseosCount}
                    </span>
                  )}
                </span>
              )}
            </li>

            {/* Carrito - Siempre visible */}
            <li className="nav-item">
              {isAuthenticated && user?.rol === 'consumidor' ? (
                <Link 
                  className={`nav-link position-relative ${location.pathname === '/consumidor/carrito' || location.pathname === '/carrito' ? 'active' : ''}`} 
                  to="/consumidor/carrito"
                  title="Carrito de Compras"
                  style={navLinkStyle}
                  onMouseEnter={handleNavLinkMouseEnter}
                  onMouseLeave={handleNavLinkMouseLeave}
                >
                  <BiCart className="fs-5" />
                  {carritoCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                      {carritoCount > 9 ? '9+' : carritoCount}
                    </span>
                  )}
                </Link>
              ) : (
                <span
                  className="nav-link position-relative"
                  style={{ ...navLinkStyle, cursor: 'pointer' }}
                  onClick={() => navigate('/login', { state: { from: location.pathname } })}
                  title="Inicia sesión para ver tu carrito"
                  onMouseEnter={handleNavLinkMouseEnter}
                  onMouseLeave={handleNavLinkMouseLeave}
                >
                  <BiCart className="fs-5" />
                  {carritoCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                      {carritoCount > 9 ? '9+' : carritoCount}
                    </span>
                  )}
                </span>
              )}
            </li>

            {isAuthenticated && user ? (
              <>

                {/* Notificaciones */}
                <li className="nav-item dropdown" style={{ position: 'relative' }}>
                  <button
                    className="nav-link position-relative btn btn-link text-white border-0 p-2"
                    onClick={handleToggleNotifications}
                    type="button"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
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
                        top: '100%',
                        right: 0,
                        zIndex: 1050,
                        minWidth: '320px',
                        maxWidth: '360px',
                        marginTop: '0.5rem',
                        boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
                        borderRadius: '0.75rem',
                        overflow: 'hidden'
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
                </li>

                {/* Menú de usuario */}
                <li className="nav-item dropdown" style={{ position: 'relative' }}>
                  <button
                    className="nav-link dropdown-toggle d-flex align-items-center text-white border-0 bg-transparent"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    type="button"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {user.foto_perfil ? (
                      <div className="position-relative me-2" style={{ width: '32px', height: '32px' }}>
                        <img
                          src={imagenesService.construirUrlImagen(user.foto_perfil) || ''}
                          alt={user.nombre}
                          className="rounded-circle"
                          style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            console.error('❌ [Navbar] Error cargando imagen de perfil:', {
                              foto_perfil: user.foto_perfil,
                              url: img.src,
                              user: user.nombre
                            });
                            img.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('✅ [Navbar] Imagen de perfil cargada exitosamente:', {
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
                      <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                        {getRolIcon()}
                      </div>
                    )}
                    <span className="d-none d-md-inline">{user.nombre}</span>
                  </button>
                  {showUserMenu && (
                    <ul 
                      className="dropdown-menu dropdown-menu-end show" 
                      style={{ 
                        position: 'absolute', 
                        top: '100%', 
                        right: 0,
                        zIndex: 1050, 
                        minWidth: '200px',
                        marginTop: '0.5rem',
                        boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
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
                      
                      {/* Dashboard - Solo para consumidores */}
                      {user && user.rol === 'consumidor' && (
                        <li>
                          <Link 
                            className="dropdown-item" 
                            to="/consumidor/dashboard"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <BiStore className="me-2" />
                            Mi Dashboard
                          </Link>
                        </li>
                      )}
                      
                      {/* Perfil */}
                      <li>
                        <Link 
                          className="dropdown-item" 
                          to={
                            user?.rol === 'productor' 
                              ? '/productor/perfil' 
                              : user?.rol === 'admin'
                              ? '/admin/perfil'
                              : '/consumidor/perfil'
                          }
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BiUser className="me-2" />
                          👤 Mi Perfil
                        </Link>
                      </li>
                      
                      {/* Panel Admin */}
                      {user && user.rol === 'admin' && (
                        <li>
                          <Link 
                            className="dropdown-item" 
                            to="/admin/dashboard"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <BiStore className="me-2" />
                            Panel Admin
                          </Link>
                        </li>
                      )}
                      
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
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    Iniciar Sesión
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-light btn-sm ms-2" to="/register">
                    Registrarse
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
