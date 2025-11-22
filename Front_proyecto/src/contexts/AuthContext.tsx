// 🔐 CONTEXTO DE AUTENTICACIÓN GLOBAL

import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, ReactNode } from 'react';
import authService from '../services/auth';
import { APP_CONFIG } from '../config';
import type { User, LoginCredentials, RegisterData, AppView } from '../types';

// ===== TIPOS DEL CONTEXTO =====
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  currentView: AppView;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentView: (view: AppView) => void;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// ===== ACCIONES DEL REDUCER =====
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_VIEW'; payload: AppView }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

// ===== ESTADO INICIAL =====
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  currentView: 'welcome',
};

// ===== REDUCER =====
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        currentView: 'welcome',
      };
    
    default:
      return state;
  }
}

// ===== CONTEXTO =====
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===== PROVIDER =====
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Log para debug (solo al montar)
  useEffect(() => {
    console.log('🔐 AuthProvider montado');
  }, []);

  // ===== EFECTOS =====
  
  // Verificar autenticación al cargar la aplicación - VERSIÓN RÁPIDA Y SIMPLE
  useEffect(() => {
    console.log('🔍 Iniciando verificación de autenticación...');
    
    // Inmediatamente marcar como no cargando para que se renderice algo
    // Luego verificar en segundo plano
    dispatch({ type: 'SET_LOADING', payload: false });
    dispatch({ type: 'SET_USER', payload: null });
    
    // Verificar en segundo plano (no bloquea renderizado)
    const checkAuth = () => {
      try {
        const user = authService.getCurrentUser();
        if (user && authService.isAuthenticated()) {
          if (user.rol && (user.rol === 'admin' || user.rol === 'consumidor' || user.rol === 'productor')) {
            console.log('✅ Usuario válido encontrado, rol:', user.rol);
            dispatch({ type: 'SET_USER', payload: user });
            const view: AppView = user.rol === 'admin' ? 'admin' : 
                                 user.rol === 'productor' ? 'productor' : 'consumidor';
            dispatch({ type: 'SET_VIEW', payload: view });
          }
        }
      } catch (error) {
        console.warn('⚠️ Error verificando autenticación:', error);
        // No hacer nada, ya está en estado por defecto
      }
    };
    
    // Ejecutar inmediatamente pero no bloquear - timeout más corto
    setTimeout(checkAuth, 50);
  }, []);

  // ===== FUNCIONES DEL CONTEXTO =====
  // Usar useCallback para estabilizar las funciones y evitar re-renders
  
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const loginResponse = await authService.login(credentials);
      
      if (loginResponse.success && loginResponse.usuario) {
        dispatch({ type: 'SET_USER', payload: loginResponse.usuario });
        
        // Redirigir según el rol
        let view: AppView = 'consumidor';
        if (loginResponse.usuario.rol === 'admin') {
          view = 'admin';
        } else if (loginResponse.usuario.rol === 'productor') {
          view = 'productor';
        }
        
        dispatch({ type: 'SET_VIEW', payload: view });
      } else {
        throw new Error(loginResponse.message || 'Error en el login');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en el login';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authService.register(userData);
      
      if (response.success && response.data) {
        // Después del registro exitoso, hacer login automático
        try {
          await login({ email: userData.email, password: userData.password });
        } catch (loginError) {
          // Si el login falla pero el registro fue exitoso, no lanzar error
          // El usuario puede iniciar sesión manualmente
          console.warn('Registro exitoso pero login automático falló:', loginError);
          // No lanzar error, el registro fue exitoso
        }
      } else {
        throw new Error(response.message || 'Error en el registro');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en el registro';
      // Solo mostrar error si realmente fue un error de registro, no de login
      if (!errorMessage.includes('login') && !errorMessage.includes('sesión')) {
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  }, [login]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
      
    } catch (error) {
      console.error('Error en logout:', error);
      // Aún así limpiar el estado local
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const setCurrentView = useCallback((view: AppView): void => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      const isValid = await authService.refreshTokenIfNeeded();
      if (!isValid) {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Error refrescando autenticación:', error);
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>): void => {
    if (state.user) {
      const updatedUser: User = {
        ...state.user,
        ...userData,
        id_usuario: state.user.id_usuario || state.user.id || 0,
        id: state.user.id_usuario || state.user.id || 0,
      };
      dispatch({ type: 'SET_USER', payload: updatedUser });
      // También actualizar en localStorage
      localStorage.setItem(APP_CONFIG.AUTH.USER_KEY, JSON.stringify(updatedUser));
    }
  }, [state.user]);

  // ===== VALOR DEL CONTEXTO =====
  // Usar useMemo para evitar que el contexto cambie en cada render
  // Las funciones están envueltas en useCallback, así que son estables
  const contextValue: AuthContextType = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    setCurrentView,
    clearError,
    refreshAuth,
    updateUser,
  }), [state, login, register, logout, setCurrentView, clearError, refreshAuth, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ===== HOOK PERSONALIZADO =====
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// ===== HOOKS ESPECÍFICOS =====

// Hook para verificar si el usuario es admin
export const useIsAdmin = (): boolean => {
  const { user } = useAuth();
  return user?.rol === 'admin';
};

// Hook para verificar si el usuario es productor
export const useIsProducer = (): boolean => {
  const { user } = useAuth();
  return user?.rol === 'productor';
};

// Hook para verificar si el usuario es consumidor
export const useIsConsumer = (): boolean => {
  const { user } = useAuth();
  return user?.rol === 'consumidor';
};

// Hook para obtener el ID del usuario actual
export const useCurrentUserId = (): number | null => {
  const { user } = useAuth();
  return user?.id_usuario || user?.id || null;
};

export default AuthContext;
