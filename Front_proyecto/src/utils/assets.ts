// 🎨 UTILIDADES PARA MANEJAR ASSETS

/**
 * Obtiene la ruta completa de un asset
 * @param path - Ruta relativa desde /assets/
 * @returns Ruta completa del asset
 */
export const getAssetPath = (path: string): string => {
  // Si ya comienza con /assets/, retornarlo tal cual
  if (path.startsWith('/assets/')) {
    return path;
  }
  
  // Si comienza con assets/ sin el slash, agregarlo
  if (path.startsWith('assets/')) {
    return `/${path}`;
  }
  
  // Si no, agregar /assets/
  return `/assets/${path}`;
};

/**
 * Obtiene la ruta del logo
 * @param variant - Variante del logo (logo, icon, favicon)
 * @returns Ruta del logo
 */
export const getLogoPath = (variant: 'logo' | 'icon' | 'favicon' = 'logo'): string => {
  const extensions = {
    logo: ['svg', 'png'],
    icon: ['png', 'svg'],
    favicon: ['ico', 'png', 'svg']
  };

  const ext = extensions[variant][0];
  return getAssetPath(`images/logo/agrostock-${variant}.${ext}`);
};

/**
 * Obtiene la ruta de una imagen de producto
 * @param filename - Nombre del archivo
 * @returns Ruta completa de la imagen
 */
export const getProductImagePath = (filename: string): string => {
  return getAssetPath(`images/productos/${filename}`);
};

/**
 * Obtiene la ruta de una imagen de usuario
 * @param filename - Nombre del archivo
 * @returns Ruta completa de la imagen
 */
export const getUserImagePath = (filename: string): string => {
  return getAssetPath(`images/usuarios/${filename}`);
};

/**
 * Obtiene la ruta de un banner
 * @param filename - Nombre del archivo
 * @returns Ruta completa del banner
 */
export const getBannerPath = (filename: string): string => {
  return getAssetPath(`images/banners/${filename}`);
};

/**
 * Obtiene la ruta de un icono
 * @param filename - Nombre del archivo
 * @returns Ruta completa del icono
 */
export const getIconPath = (filename: string): string => {
  return getAssetPath(`icons/${filename}`);
};

/**
 * Carga un JSON desde assets
 * @param filename - Nombre del archivo JSON
 * @returns Promise con los datos JSON
 */
export const loadJsonAsset = async <T = any>(filename: string): Promise<T> => {
  const path = getAssetPath(`json/${filename}`);
  const response = await fetch(path);
  
  if (!response.ok) {
    throw new Error(`No se pudo cargar el archivo JSON: ${filename}`);
  }
  
  return await response.json();
};

/**
 * Obtiene una imagen con fallback
 * @param primaryPath - Ruta principal de la imagen
 * @param fallbackPath - Ruta de respaldo si la principal falla
 * @returns Ruta de la imagen a usar
 */
export const getImageWithFallback = (
  primaryPath: string | undefined | null,
  fallbackPath: string = getAssetPath('images/productos/placeholder.jpg')
): string => {
  if (!primaryPath) return fallbackPath;
  
  // Si es una URL completa, retornarla tal cual
  if (primaryPath.startsWith('http://') || primaryPath.startsWith('https://')) {
    return primaryPath;
  }
  
  // Si ya es una ruta de asset, retornarla
  if (primaryPath.startsWith('/assets/')) {
    return primaryPath;
  }
  
  // Si no, intentar construirla
  return primaryPath;
};

/**
 * Placeholder para imágenes
 */
export const PLACEHOLDER_IMAGES = {
  PRODUCTO: getAssetPath('images/productos/placeholder.jpg'),
  USUARIO: getAssetPath('images/usuarios/avatar-placeholder.png'),
  BANNER: getAssetPath('images/banners/placeholder.jpg'),
  LOGO: getAssetPath('images/logo/agrostock-logo.png'),
};

/**
 * Maneja errores de carga de imágenes
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = PLACEHOLDER_IMAGES.PRODUCTO
) => {
  const img = event.currentTarget;
  if (img.src !== fallback) {
    img.src = fallback;
  }
};




