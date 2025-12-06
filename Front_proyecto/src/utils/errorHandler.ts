// 🛡️ MANEJADOR CENTRALIZADO DE ERRORES

export const logError = (error: Error, errorInfo?: any) => {
  console.error('🚨 Error:', error);
  if (errorInfo) {
    console.error('📋 Error Info:', errorInfo);
  }
  
  // Aquí puedes agregar lógica para enviar errores a un servicio de logging
  // Por ejemplo: Sentry, LogRocket, etc.
};

export const handleApiError = (error: any): string => {
  // Manejar errores de red
  if (isNetworkError(error)) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
  }

  // Manejar errores de autenticación
  if (error?.message?.includes('Sesión expirada') || error?.message?.includes('No autenticado')) {
    return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
  }

  // Manejar errores de permisos
  if (error?.message?.includes('No tienes permisos') || error?.message?.includes('403')) {
    return 'No tienes permisos para realizar esta acción.';
  }

  // Manejar errores del backend
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Manejar errores con mensaje directo
  if (error?.message) {
    return error.message;
  }

  // Error genérico
  return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.';
};

export const isNetworkError = (error: any): boolean => {
  return error?.message?.includes('Network') || 
         error?.message?.includes('Failed to fetch') ||
         error?.message?.includes('No se pudo conectar') ||
         error?.code === 'NETWORK_ERROR' ||
         error?.name === 'TypeError';
};

export const isAuthError = (error: any): boolean => {
  return error?.message?.includes('Sesión expirada') ||
         error?.message?.includes('No autenticado') ||
         error?.response?.status === 401;
};

export const isPermissionError = (error: any): boolean => {
  return error?.message?.includes('No tienes permisos') ||
         error?.response?.status === 403;
};

export const formatError = (error: any): { message: string; type: 'network' | 'auth' | 'permission' | 'validation' | 'server' | 'unknown' } => {
  if (isNetworkError(error)) {
    return {
      message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      type: 'network'
    };
  }

  if (isAuthError(error)) {
    return {
      message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      type: 'auth'
    };
  }

  if (isPermissionError(error)) {
    return {
      message: 'No tienes permisos para realizar esta acción.',
      type: 'permission'
    };
  }

  if (error?.response?.status === 400 || error?.response?.status === 422) {
    return {
      message: error?.response?.data?.message || 'Los datos proporcionados no son válidos.',
      type: 'validation'
    };
  }

  if (error?.response?.status >= 500) {
    return {
      message: 'Error en el servidor. Por favor, intenta más tarde.',
      type: 'server'
    };
  }

  return {
    message: handleApiError(error),
    type: 'unknown'
  };
};

