// 🧭 SISTEMA DE NAVEGACIÓN CENTRALIZADO

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { AppView } from '../types';
import './Navigation.css';

// ===== TIPOS =====
interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  view: AppView;
  roles: string[];
  description?: string;
}

interface NavigationConfig {
  [key: string]: NavigationItem[];
}

// ===== CONFIGURACIÓN DE NAVEGACIÓN =====
const navigationConfig: NavigationConfig = {
  // Navegación pública
  public: [
    {
      id: 'welcome',
      label: 'Inicio',
      icon: '🏠',
      view: 'welcome',
      roles: ['guest'],
      description: 'Página principal de AgroStock'
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: '🛍️',
      view: 'productos',
      roles: ['guest', 'admin', 'productor', 'consumidor'],
      description: 'Explorar todos los productos'
    },
    {
      id: 'login',
      label: 'Iniciar Sesión',
      icon: '🔐',
      view: 'login',
      roles: ['guest'],
      description: 'Acceder a tu cuenta'
    },
    {
      id: 'register',
      label: 'Registrarse',
      icon: '📝',
      view: 'register',
      roles: ['guest'],
      description: 'Crear nueva cuenta'
    }
  ],

  // Navegación para administradores
  admin: [
    {
      id: 'productos',
      label: 'Productos',
      icon: '🛍️',
      view: 'productos',
      roles: ['admin', 'productor', 'consumidor'],
      description: 'Explorar todos los productos'
    },
    {
      id: 'admin-dashboard',
      label: 'Dashboard',
      icon: '📊',
      view: 'admin',
      roles: ['admin'],
      description: 'Panel de control administrativo'
    },
    {
      id: 'admin-users',
      label: 'Usuarios',
      icon: '👥',
      view: 'admin',
      roles: ['admin'],
      description: 'Gestión de usuarios'
    },
    {
      id: 'admin-products',
      label: 'Productos',
      icon: '🛍️',
      view: 'admin',
      roles: ['admin'],
      description: 'Administración de productos'
    },
    {
      id: 'admin-reports',
      label: 'Reportes',
      icon: '📋',
      view: 'admin',
      roles: ['admin'],
      description: 'Gestión de reportes'
    },
    {
      id: 'admin-statistics',
      label: 'Estadísticas',
      icon: '📈',
      view: 'admin',
      roles: ['admin'],
      description: 'Métricas y análisis'
    }
  ],

  // Navegación para productores
  producer: [
    {
      id: 'productos',
      label: 'Productos',
      icon: '🛍️',
      view: 'productos',
      roles: ['productor', 'admin', 'consumidor'],
      description: 'Explorar todos los productos'
    },
    {
      id: 'producer-dashboard',
      label: 'Mi Panel',
      icon: '🌱',
      view: 'productor',
      roles: ['productor'],
      description: 'Panel del productor'
    },
    {
      id: 'producer-products',
      label: 'Mis Productos',
      icon: '📦',
      view: 'productor',
      roles: ['productor'],
      description: 'Gestionar mis productos'
    },
    {
      id: 'producer-orders',
      label: 'Pedidos',
      icon: '📋',
      view: 'productor',
      roles: ['productor'],
      description: 'Ver pedidos recibidos'
    },
    {
      id: 'producer-messages',
      label: 'Mensajes',
      icon: '💬',
      view: 'productor',
      roles: ['productor'],
      description: 'Comunicación con clientes'
    }
  ],

  // Navegación para consumidores
  consumer: [
    {
      id: 'productos',
      label: 'Productos',
      icon: '🛍️',
      view: 'productos',
      roles: ['consumidor', 'admin', 'productor'],
      description: 'Explorar todos los productos'
    },
    {
      id: 'consumer-dashboard',
      label: 'Mi Cuenta',
      icon: '🛒',
      view: 'consumidor',
      roles: ['consumidor'],
      description: 'Panel del consumidor'
    },
    {
      id: 'consumer-cart',
      label: 'Carrito',
      icon: '🛒',
      view: 'consumidor',
      roles: ['consumidor'],
      description: 'Mi carrito de compras'
    },
    {
      id: 'consumer-orders',
      label: 'Mis Pedidos',
      icon: '📋',
      view: 'consumidor',
      roles: ['consumidor'],
      description: 'Historial de pedidos'
    }
  ]
};

// ===== HOOKS DE NAVEGACIÓN =====

// Hook para obtener navegación según el rol del usuario
export const useNavigation = (): NavigationItem[] => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return navigationConfig.public;
  }

  const role = user.rol;
  // Mapear roles a claves de configuración
  const roleMap: { [key: string]: string } = {
    'admin': 'admin',
    'productor': 'producer',
    'consumidor': 'consumer'
  };
  const configKey = roleMap[role] || 'public';
  return navigationConfig[configKey] || navigationConfig.public;
};

// Hook para obtener navegación específica por rol
export const useNavigationByRole = (role: string): NavigationItem[] => {
  return navigationConfig[role] || [];
};

// Hook para verificar si una vista es accesible
export const useCanAccessView = (view: AppView): boolean => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return ['welcome', 'login', 'register', 'productos'].includes(view);
  }

  const role = user.rol;
  // Mapear roles a claves de configuración
  const roleMap: { [key: string]: string } = {
    'admin': 'admin',
    'productor': 'producer',
    'consumidor': 'consumer'
  };
  const configKey = roleMap[role] || 'public';
  const roleNavigation = navigationConfig[configKey] || [];
  
  // También verificar navegación pública para productos
  const publicNav = navigationConfig.public || [];
  const allNavigation = [...roleNavigation, ...publicNav];
  
  return allNavigation.some(item => item.view === view);
};

// ===== COMPONENTE DE NAVEGACIÓN =====
interface NavigationProps {
  onNavigate: (view: AppView) => void;
  currentView: AppView;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  onNavigate,
  currentView,
  className = ''
}) => {
  const navigationItems = useNavigation();
  const { user, isAuthenticated } = useAuth();

  const handleItemClick = (item: NavigationItem) => {
    onNavigate(item.view);
  };

  return (
    <nav className={`navigation ${className}`}>
      <div className="navigation-header">
        <div className="navigation-logo">
          <span className="logo-icon">🌾</span>
          <span className="logo-text">AGROSTOCK</span>
        </div>
        {isAuthenticated && user && (
          <div className="navigation-user">
            <span className="user-avatar">👤</span>
            <span className="user-name">{user.nombre}</span>
            <span className="user-role">{user.rol}</span>
          </div>
        )}
      </div>
      
      <ul className="navigation-list">
        {navigationItems.map((item) => (
          <li key={item.id} className="navigation-item">
            <button
              className={`navigation-link ${
                currentView === item.view ? 'active' : ''
              }`}
              onClick={() => handleItemClick(item)}
              title={item.description}
            >
              <span className="navigation-icon">{item.icon}</span>
              <span className="navigation-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// ===== COMPONENTE DE BREADCRUMB =====
interface BreadcrumbProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  currentView,
  onNavigate,
  className = ''
}) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated || currentView === 'welcome') {
    return null;
  }

  const getBreadcrumbItems = (): Array<{ label: string; view: AppView }> => {
    const items = [{ label: 'Inicio', view: 'welcome' as AppView }];
    
    if (currentView !== 'welcome') {
      const viewLabels: Record<AppView, string> = {
        welcome: 'Inicio',
        login: 'Iniciar Sesión',
        register: 'Registrarse',
        admin: 'Administración',
        productor: 'Productor',
        consumidor: 'Consumidor'
      };
      
      items.push({
        label: viewLabels[currentView] || currentView,
        view: currentView
      });
    }
    
    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <nav className={`breadcrumb ${className}`}>
      <ol className="breadcrumb-list">
        {breadcrumbItems.map((item, index) => (
          <li key={item.view} className="breadcrumb-item">
            {index === breadcrumbItems.length - 1 ? (
              <span className="breadcrumb-current">{item.label}</span>
            ) : (
              <button
                className="breadcrumb-link"
                onClick={() => onNavigate(item.view)}
              >
                {item.label}
              </button>
            )}
            {index < breadcrumbItems.length - 1 && (
              <span className="breadcrumb-separator">›</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// ===== UTILIDADES DE NAVEGACIÓN =====

// Función para obtener el título de la vista actual
export const getViewTitle = (view: AppView): string => {
  const titles: Record<AppView, string> = {
    welcome: 'AgroStock - Soluciones Agropecuarias',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    admin: 'Panel de Administración',
    productor: 'Panel del Productor',
    consumidor: 'Mi Cuenta'
  };
  
  return titles[view] || 'AgroStock';
};

// Función para obtener la descripción de la vista actual
export const getViewDescription = (view: AppView): string => {
  const descriptions: Record<AppView, string> = {
    welcome: 'Plataforma líder en soluciones agropecuarias',
    login: 'Accede a tu cuenta de AgroStock',
    register: 'Únete a la comunidad agropecuaria',
    admin: 'Administra la plataforma AgroStock',
    productor: 'Gestiona tus productos y ventas',
    consumidor: 'Explora y compra productos agrícolas'
  };
  
  return descriptions[view] || '';
};

export default Navigation;




