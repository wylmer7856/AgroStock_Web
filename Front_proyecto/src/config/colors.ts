// 🎨 SISTEMA DE COLORES AGROSTOCK - DISEÑO PROFESIONAL AGRÍCOLA
// Paleta profesional inspirada en los colores del campo y la agricultura

export const COLORS_BOYACA = {
  // Verde Natural - Cultivos y Vegetación
  primary: {
    main: '#2D5016',      // Verde bosque profundo - principal
    light: '#4A7C47',     // Verde medio
    lighter: '#6B9E68',   // Verde claro
    dark: '#1F380F',      // Verde muy oscuro
    darkest: '#162408',   // Verde extremadamente oscuro
    hover: '#3A6432',     // Verde hover
    gradient: 'linear-gradient(135deg, #2D5016 0%, #4A7C47 50%, #6B9E68 100%)',
    gradientHover: 'linear-gradient(135deg, #3A6432 0%, #5A8C57 50%, #7BAD78 100%)',
    overlay: 'rgba(45, 80, 22, 0.1)',
  },

  // Ocre y Tonos Tierra - Suelo Fértil
  earth: {
    main: '#8B6914',      // Ocre tierra rica
    light: '#B8942A',     // Ocre claro soleado
    lighter: '#D4B85C',   // Ocre muy claro
    dark: '#6B5210',      // Ocre oscuro profundo
    darkest: '#4A3809',   // Ocre muy oscuro
    gradient: 'linear-gradient(135deg, #8B6914 0%, #B8942A 100%)',
    overlay: 'rgba(139, 105, 20, 0.1)',
  },

  // Azul Cielo
  sky: {
    main: '#4A90E2',      // Azul cielo de Boyacá
    light: '#6BADFF',     // Azul claro
    dark: '#3571B8',      // Azul oscuro
    gradient: 'linear-gradient(135deg, #4A90E2, #6BADFF)',
  },

  // Blanco Crema - Trigo y Grano
  cream: {
    main: '#FDF6E3',      // Crema trigo natural
    light: '#FFFBF0',     // Crema muy claro luminoso
    lighter: '#FFFFFF',   // Blanco puro
    dark: '#F5E8D3',      // Crema dorado
    darker: '#E8D5B7',    // Crema oscuro tierra
    gradient: 'linear-gradient(180deg, #FFFFFF 0%, #FDF6E3 50%, #F5E8D3 100%)',
  },

  // Verde Esmeralda (exótico)
  emerald: {
    main: '#4CAF50',      // Verde esmeralda
    light: '#66BB6A',     // Verde esmeralda claro
    dark: '#388E3C',      // Verde esmeralda oscuro
  },

  // Neutrales - Nubes y Piedra
  neutral: {
    white: '#FFFFFF',
    light: '#F8FAFC',     // Gris muy claro cielo
    lighter: '#F1F5F9',   // Gris extra claro
    medium: '#E2E8F0',    // Gris medio nube
    dark: '#475569',      // Gris oscuro piedra
    darker: '#334155',    // Gris más oscuro
    darkest: '#1E293B',   // Gris muy oscuro noche
    overlay: 'rgba(71, 85, 105, 0.05)',
  },

  // Estados
  success: {
    main: '#4CAF50',      // Verde éxito
    light: '#E8F5E9',     // Verde claro fondo
    text: '#2E7D32',      // Verde texto
  },

  warning: {
    main: '#FF9800',      // Naranja advertencia
    light: '#FFF3E0',     // Naranja claro fondo
    text: '#E65100',      // Naranja texto
  },

  error: {
    main: '#F44336',      // Rojo error
    light: '#FFEBEE',     // Rojo claro fondo
    text: '#C62828',      // Rojo texto
  },

  info: {
    main: '#2196F3',      // Azul información
    light: '#E3F2FD',     // Azul claro fondo
    text: '#1565C0',      // Azul texto
  },

  // Backgrounds
  backgrounds: {
    primary: '#FFFFFF',
    secondary: '#F5F7FA',
    tertiary: '#E0E6ED',
    agriculture: 'linear-gradient(135deg, #F5F7FA 0%, #E8F5E9 100%)',
    soil: 'linear-gradient(135deg, #FFF8E7 0%, #F5E8D3 100%)',
  },

  // Borders
  borders: {
    light: '#E0E6ED',
    medium: '#CBD5E0',
    dark: '#4A7C47',
  },

  // Shadows - Sombras Profesionales
  shadows: {
    xs: '0 1px 2px 0 rgba(45, 80, 22, 0.05)',
    small: '0 2px 4px -1px rgba(45, 80, 22, 0.1), 0 1px 2px -1px rgba(45, 80, 22, 0.06)',
    medium: '0 4px 8px -2px rgba(45, 80, 22, 0.15), 0 2px 4px -2px rgba(45, 80, 22, 0.08)',
    large: '0 10px 20px -4px rgba(45, 80, 22, 0.2), 0 4px 6px -4px rgba(45, 80, 22, 0.1)',
    xlarge: '0 20px 32px -8px rgba(45, 80, 22, 0.25), 0 8px 12px -6px rgba(45, 80, 22, 0.15)',
    inner: 'inset 0 2px 4px 0 rgba(45, 80, 22, 0.06)',
    glow: '0 0 20px rgba(107, 158, 104, 0.3)',
  },

  // Text
  text: {
    primary: '#1A202C',
    secondary: '#4A5568',
    muted: '#718096',
    light: '#A0AEC0',
    inverse: '#FFFFFF',
  },
} as const;

// Tipos de color para TypeScript
export type ColorPalette = typeof COLORS_BOYACA;
export type ColorKey = keyof typeof COLORS_BOYACA;

// Función para obtener colores con variantes
export const getColor = (category: string, variant: string = 'main'): string => {
  const colors = COLORS_BOYACA as any;
  return colors[category]?.[variant] || colors[category] || '#000000';
};

// Exportar colores por categoría
export const PRIMARY_COLORS = COLORS_BOYACA.primary;
export const EARTH_COLORS = COLORS_BOYACA.earth;
export const SKY_COLORS = COLORS_BOYACA.sky;
export const CREAM_COLORS = COLORS_BOYACA.cream;



