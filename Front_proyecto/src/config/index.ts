// CONFIGURACIÓN CENTRALIZADA DE LA APLICACIÓN

export const APP_CONFIG = {
  // Información de la aplicación
  APP_NAME: 'AgroStock',
  VERSION: '1.0.0',
  ENVIRONMENT: (import.meta.env.MODE || 'development') as 'development' | 'production' | 'testing',
  
  // URLs de la API - Usa /api que será proxy a localhost:8000 (backend)
  // Si VITE_API_URL está definido y es una URL completa (http://), usarlo directamente
  // De lo contrario, usar /api que será manejado por el proxy de Vite
  API_BASE_URL: (() => {
    const envUrl = import.meta.env.VITE_API_URL;
    // Si es una URL completa (http:// o https://), usarla directamente
    if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
      return envUrl;
    }
    // De lo contrario, usar el proxy /api
    return '/api';
  })(),
  API_ENDPOINTS: {
    // Autenticación
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      VERIFY: '/auth/verify',
      CHANGE_PASSWORD: '/auth/change-password',
    },
    
    // Usuarios
    USUARIOS: {
      LIST: '/usuarios',
      CREATE: '/usuarios',
      UPDATE: '/usuarios',
      DELETE: '/usuarios',
      FILTER: '/usuarios/filter',
    },
    
    // Productos
    PRODUCTOS: {
      LIST: '/productos',
      DETAIL: '/productos',
      CREATE: '/productos',
      UPDATE: '/productos',
      DELETE: '/productos',
      SEARCH: '/productos/buscar',
      BY_USER: '/productos/usuario',
      BY_PRODUCER: '/productos/productor',
      AVAILABLE: '/productos/disponibles',
    },
    
    // Administración
    ADMIN: {
      USUARIOS: '/admin/usuarios',
      PRODUCTOS: '/admin/productos',
      REPORTES: '/admin/reportes',
      ESTADISTICAS: '/admin/estadisticas',
      ACTIVIDAD: '/admin/actividad-reciente',
    },
    
    // Ubicaciones
    UBICACIONES: {
      REGIONES: '/regiones',
      DEPARTAMENTOS: '/departamentos',
      CIUDADES: '/ciudades',
    },
    
    // Categorías
    CATEGORIAS: {
      LIST: '/categorias',
    },
  },
  
  // Configuración de paginación
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1,
  },
  
  // Configuración de autenticación
  AUTH: {
    TOKEN_KEY: 'agrostock_token',
    USER_KEY: 'agrostock_user',
    SESSION_KEY: 'agrostock_session',
    TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutos antes de expirar
  },
  
  // Configuración de UI
  UI: {
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 5000,
    LOADING_TIMEOUT: 10000,
    ANIMATION_DURATION: 300,
  },
  
  // Configuración de validación
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^\+?[\d\s\-()]+$/,
    PASSWORD_MIN_LENGTH: 6,
    NAME_MIN_LENGTH: 2,
  },
  
  // Configuración de archivos
  FILES: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    UPLOAD_ENDPOINT: '/upload',
  },
  
  // Configuración de notificaciones
  NOTIFICATIONS: {
    AUTO_HIDE_DELAY: 5000,
    MAX_VISIBLE: 5,
    POSITION: 'top-right' as const,
  },
  
  // Configuración de desarrollo
  DEV: {
    ENABLE_CONSOLE_LOGS: import.meta.env.DEV,
    ENABLE_MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK === 'true',
    MOCK_DELAY: 1000,
  },
} as const;

// Tipos derivados de la configuración
export type ApiEndpoint = typeof APP_CONFIG.API_ENDPOINTS;
export type AuthConfig = typeof APP_CONFIG.AUTH;
export type UIConfig = typeof APP_CONFIG.UI;
