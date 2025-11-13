import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { notificacionesService, carritoService, listaDeseosService, imagenesService } from '../../services';
import { carritoLocalService } from '../../services/carritoLocal';
import { listaDeseosLocalService } from '../../services/listaDeseosLocal';
import { toast } from 'react-toastify';
import logoProyecto from '../../assets/logoProyecto.png';
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
  BiReceipt,
  BiMessageSquare,
  BiCog
} from 'react-icons/bi';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [carritoCount, setCarritoCount] = useState(0);
  const [listaDeseosCount, setListaDeseosCount] = useState(0);

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
    refetchInterval: 10000,
    retry: 1,
  });

  // Cargar contadores de carrito y lista de deseos
  useEffect(() => {
    const actualizarContadores = () => {
      try {
        if (isAuthenticated && user?.rol === 'consumidor') {
          // Usar datos del servidor
          setCarritoCount(carritoData?.items?.length || 0);
          setListaDeseosCount(Array.isArray(listaDeseosData) ? listaDeseosData.length : 0);
        } else {
          // Usar datos locales
          const carrito = carritoLocalService.obtenerCarrito();
          const listaDeseos = listaDeseosLocalService.obtenerListaDeseos();
          setCarritoCount(carrito?.items?.length || 0);
          setListaDeseosCount(listaDeseos?.length || 0);
        }
      } catch (error) {
        console.error('Error actualizando contadores:', error);
        setCarritoCount(0);
        setListaDeseosCount(0);
      }
    };

    actualizarContadores();
    // Actualizar cuando cambia la ruta (menos frecuente)
    const interval = setInterval(actualizarContadores, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, location.pathname, carritoData, listaDeseosData]);

  useEffect(() => {
    if (isAuthenticated && user) {
      cargarNotificacionesNoLeidas();
      const interval = setInterval(cargarNotificacionesNoLeidas, 30000); // Cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

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
                  style={{ cursor: 'pointer' }}
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
                  style={{ cursor: 'pointer' }}
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
              <Link 
                className={`nav-link position-relative ${location.pathname === '/consumidor/lista-deseos' || location.pathname === '/lista-deseos' ? 'active' : ''}`} 
                to={isAuthenticated && user?.rol === 'consumidor' ? '/consumidor/lista-deseos' : '/lista-deseos'}
                title="Lista de Deseos"
              >
                <BiHeart className="fs-5" />
                {listaDeseosCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                    {listaDeseosCount > 9 ? '9+' : listaDeseosCount}
                  </span>
                )}
              </Link>
            </li>

            {/* Carrito - Siempre visible */}
            <li className="nav-item">
              <Link 
                className={`nav-link position-relative ${location.pathname === '/consumidor/carrito' || location.pathname === '/carrito' ? 'active' : ''}`} 
                to={isAuthenticated && user?.rol === 'consumidor' ? '/consumidor/carrito' : '/carrito'}
                title="Carrito de Compras"
              >
                <BiCart className="fs-5" />
                {carritoCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                    {carritoCount > 9 ? '9+' : carritoCount}
                  </span>
                )}
              </Link>
            </li>

            {isAuthenticated && user ? (
              <>

                {/* Notificaciones */}
                <li className="nav-item dropdown">
                  <button
                    className="nav-link position-relative btn btn-link text-white border-0 p-2"
                    onClick={() => setShowNotifications(!showNotifications)}
                    type="button"
                  >
                    <BiBell className="fs-5" />
                    {notificacionesNoLeidas > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
                      </span>
                    )}
                  </button>
                </li>

                {/* Menú de usuario */}
                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle d-flex align-items-center text-white border-0 bg-transparent"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    type="button"
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
                    <ul className="dropdown-menu dropdown-menu-end show" style={{ position: 'absolute', zIndex: 1000, minWidth: '200px' }}>
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
