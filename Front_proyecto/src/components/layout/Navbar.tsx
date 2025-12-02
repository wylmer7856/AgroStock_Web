import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { notificacionesService, carritoService, listaDeseosService, imagenesService } from '../../services';
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
  BiReceipt,
  BiMessageSquare,
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
  const [notificacionesRecientes, setNotificacionesRecientes] = useState<Notification[]>([]);
  const [notificacionesLoading, setNotificacionesLoading] = useState(false);
  const [notificacionesError, setNotificacionesError] = useState<string | null>(null);

  // Query para carrito - SOLO si está autenticado como consumidor
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
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30000,
    retry: 1,
  });

  // Query para lista de deseos - SOLO si está autenticado como consumidor
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
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30000,
    retry: 1,
  });

  const itemsCarrito = carritoData?.items?.length || 0;
  const itemsListaDeseos = listaDeseosData?.length || 0;

  // Cargar notificaciones solo si está autenticado
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotificacionesNoLeidas(0);
      return;
    }

    const cargarNotificaciones = async () => {
      try {
        const response = await notificacionesService.contarNoLeidas();
        if (response.success && typeof response.data === 'number') {
          setNotificacionesNoLeidas(response.data);
        }
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      }
    };

    cargarNotificaciones();
    const interval = setInterval(cargarNotificaciones, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && !target.closest('.dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleToggleNotifications = () => {
    const nextValue = !showNotifications;
    setShowNotifications(nextValue);
    if (nextValue) {
      cargarNotificacionesRecientes();
    }
  };

  const handleNotificationClick = async (notificacion: Notification) => {
    setShowNotifications(false);
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
    navigate('/notificaciones');
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

  // No mostrar navbar en rutas del consumidor (tienen su propio layout)
  if (location.pathname.startsWith('/consumidor/') || location.pathname === '/consumidor') {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container-fluid">
        {/* Logo */}
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
          {/* Links principales - Siempre visibles */}
          <ul className="navbar-nav me-auto">
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

            {/* Categorías - Solo en inicio */}
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

            {/* Productos - Oculto en login y register */}
            {location.pathname !== '/login' && location.pathname !== '/register' && (
              <li className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname === '/productos' ? 'active fw-bold' : ''}`} 
                  to="/productos"
                >
                  <BiPackage className="me-1" />
                  Productos
                </Link>
              </li>
            )}

            {/* Destacados - Solo en inicio */}
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
            {/* Lista de deseos - SOLO si está autenticado como consumidor */}
            {isAuthenticated && user?.rol === 'consumidor' && (
              <li className="nav-item">
                <Link 
                  className="nav-link position-relative"
                  to="/consumidor/lista-deseos"
                  title="Lista de Deseos"
                >
                  <BiHeart />
                  {itemsListaDeseos > 0 && (
                    <span className="badge">
                      {itemsListaDeseos > 9 ? '9+' : itemsListaDeseos}
                    </span>
                  )}
                </Link>
              </li>
            )}

            {/* Carrito - SOLO si está autenticado como consumidor */}
            {isAuthenticated && user?.rol === 'consumidor' && (
              <li className="nav-item">
                <Link 
                  className="nav-link position-relative"
                  to="/consumidor/carrito"
                  title="Carrito de Compras"
                >
                  <BiCart />
                  {itemsCarrito > 0 && (
                    <span className="badge">
                      {itemsCarrito > 9 ? '9+' : itemsCarrito}
                    </span>
                  )}
                </Link>
              </li>
            )}

            {isAuthenticated && user ? (
              <>
                <li className="nav-item dropdown" style={{ position: 'relative' }}>
                  <button
                    className="nav-link position-relative btn btn-link text-white border-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleNotifications();
                    }}
                    type="button"
                    title="Notificaciones"
                    aria-expanded={showNotifications}
                  >
                    <BiBell />
                    {notificacionesNoLeidas > 0 && (
                      <span className="badge">
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
                        className="dropdown-menu dropdown-menu-end show"
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
                          overflowY: 'auto',
                          display: 'block',
                          visibility: 'visible',
                          opacity: 1
                        }}
                        onClick={(e) => e.stopPropagation()}
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
                            <div className="text-center text-muted small py-4 px-3">
                              No tienes notificaciones recientes
                            </div>
                          ) : (
                            notificacionesRecientes.map((notificacion) => (
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
                </li>

                {/* Perfil - Solo imagen, click directo al dashboard */}
                <li className="nav-item">
                  <Link
                    className="nav-link position-relative"
                    to={
                      user?.rol === 'consumidor'
                        ? '/consumidor/dashboard'
                        : user?.rol === 'productor'
                        ? '/productor/dashboard'
                        : user?.rol === 'admin'
                        ? '/admin/dashboard'
                        : '/'
                    }
                    title={`Ir a mi Dashboard - ${user.nombre}`}
                  >
                    {user.foto_perfil ? (
                      <img
                        src={imagenesService.construirUrlImagen(user.foto_perfil) || ''}
                        alt={user.nombre}
                        className="rounded-circle"
                        style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                        {getRolIcon()}
                      </div>
                    )}
                  </Link>
                </li>
              </>
            ) : (
              <>
                {/* Si NO está autenticado */}
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    Iniciar Sesión
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className="btn-register-custom" 
                    to="/register"
                  >
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
