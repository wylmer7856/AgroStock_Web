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
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.';
};

export const isNetworkError = (error: any): boolean => {
  return error?.message?.includes('Network') || 
         error?.message?.includes('Failed to fetch') ||
         error?.code === 'NETWORK_ERROR';
};

