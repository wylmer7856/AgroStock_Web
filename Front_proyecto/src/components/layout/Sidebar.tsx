import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BiHome,
  BiPackage,
  BiReceipt,
  BiMessageSquare,
  BiBarChart,
  BiUser,
  BiCog,
  BiFile,
  BiX
} from 'react-icons/bi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    // Verificar si la ruta actual coincide o comienza con la ruta del menú
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = () => {
    if (!user) return [];

    switch (user.rol) {
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: <BiHome /> },
          { path: '/admin/usuarios', label: 'Usuarios', icon: <BiUser /> },
          { path: '/admin/productos', label: 'Productos', icon: <BiPackage /> },
          { path: '/admin/pedidos', label: 'Pedidos', icon: <BiReceipt /> },
          { path: '/admin/reportes', label: 'Reportes', icon: <BiFile /> },
          { path: '/admin/estadisticas', label: 'Estadísticas', icon: <BiBarChart /> },
          { path: '/admin/configuracion', label: 'Configuración', icon: <BiCog /> },
        ];
      
      case 'productor':
        return [
          { path: '/productor/dashboard', label: 'Dashboard', icon: <BiHome /> },
          { path: '/productor/productos', label: 'Mis Productos', icon: <BiPackage /> },
          { path: '/productor/pedidos', label: 'Pedidos', icon: <BiReceipt /> },
          { path: '/productor/mensajes', label: 'Mensajes', icon: <BiMessageSquare /> },
          { path: '/productor/estadisticas', label: 'Estadísticas', icon: <BiBarChart /> },
          { path: '/productor/perfil', label: 'Mi Perfil', icon: <BiUser /> },
        ];
      
      case 'consumidor':
        return [
          { path: '/', label: 'Inicio', icon: <BiHome /> },
          { path: '/consumidor/pedidos', label: 'Mis Pedidos', icon: <BiReceipt /> },
          { path: '/consumidor/mensajes', label: 'Mensajes', icon: <BiMessageSquare /> },
          { path: '/consumidor/perfil', label: 'Mi Perfil', icon: <BiUser /> },
        ];
      
      default:
        return [];
    }
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-primary shadow-lg position-fixed start-0 overflow-auto ${
          isOpen ? 'show' : ''
        }`}
        style={{
          width: '280px',
          zIndex: 1010, // Menor que el navbar (1020) para que no lo cubra
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          top: '56px', // Debajo del navbar
          height: 'calc(100vh - 56px)', // Altura completa menos el navbar
          position: 'fixed',
          left: 0,
        }}
      >
        <div className="p-3 border-bottom border-light border-opacity-25 d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fw-bold text-white">
            <i className="bi bi-flower1 me-2"></i>
            AgroStock
          </h5>
          <button
            className="btn btn-sm btn-link text-white d-lg-none"
            onClick={onClose}
            type="button"
          >
            <BiX className="fs-4" />
          </button>
        </div>

        <nav className="p-3">
          <ul className="nav nav-pills flex-column gap-1">
            {menuItems().map((item) => (
              <li key={item.path} className="nav-item">
                <Link
                  className={`nav-link d-flex align-items-center ${
                    isActive(item.path) 
                      ? 'active bg-white text-primary fw-bold' 
                      : 'text-white'
                  }`}
                  to={item.path}
                  onClick={() => {
                    // Solo cerrar en móvil
                    if (window.innerWidth < 992) {
                      onClose();
                    }
                  }}
                  style={{
                    borderRadius: '0.5rem',
                    marginBottom: '0.25rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="me-2">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
