import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { notificacionesService, imagenesService } from '../../services';
import { toast } from 'react-toastify';
import logoProyecto from '../../assets/logoProyecto.png';
import { 
  BiUser, 
  BiLogOut, 
  BiMenu,
  BiBell,
  BiHome
} from 'react-icons/bi';

interface DashboardHeaderProps {
  onToggleSidebar?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
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
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  useEffect(() => {
    if (notificacionesCount !== undefined) {
      setNotificacionesNoLeidas(notificacionesCount);
    }
  }, [notificacionesCount]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && !target.closest('.dropdown')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <header className="bg-white shadow-sm border-bottom sticky-top" style={{ zIndex: 1020, height: '60px' }}>
      <div className="d-flex align-items-center justify-content-between h-100 px-3">
        {/* Logo y botón de menú */}
        <div className="d-flex align-items-center gap-3">
          {onToggleSidebar && (
            <button
              className="btn btn-link text-dark p-0 d-lg-none"
              onClick={onToggleSidebar}
              style={{ fontSize: '1.5rem' }}
            >
              <BiMenu />
            </button>
          )}
          <Link to={getDashboardPath()} className="text-decoration-none d-flex align-items-center">
            <img 
              src={logoProyecto} 
              alt="AgroStock" 
              style={{ height: '40px', width: 'auto' }}
            />
            <span className="ms-2 fw-bold text-primary d-none d-md-inline">AgroStock</span>
          </Link>
        </div>

        {/* Opciones del usuario */}
        <div className="d-flex align-items-center gap-2">
          {/* Notificaciones */}
          {user && (
            <Link
              to="/notificaciones"
              className="btn btn-link text-dark position-relative p-2"
              title="Notificaciones"
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
            </Link>
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
};

export default DashboardHeader;


