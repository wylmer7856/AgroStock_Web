// 🌾 PANTALLA DE AUTENTICACIÓN PROFESIONAL - AGROSTOCK
// Diseño basado en imágenes de referencia con colores del campo

import React, { useState, useEffect } from 'react';
// Importación removida - usando emoji directo
import { authService } from '../services/auth';
import { ubicacionesService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '../components/ReusableComponents';
import type { Ciudad, Departamento } from '../types';
import './AuthScreen.css';

interface AuthScreenProps {
  onNavigate?: (view: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { login: contextLogin } = useAuth();

  // Estados para formularios
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    direccion: '',
    id_ciudad: null as number | null,
    rol: 'consumidor' as 'consumidor' | 'productor'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loadingCiudades, setLoadingCiudades] = useState(false);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<number | null>(null);

  // Cargar departamentos al montar
  useEffect(() => {
    const cargarDepartamentos = async () => {
      try {
        const response = await ubicacionesService.listarDepartamentos();
        if (response.success && response.data) {
          setDepartamentos(response.data);
        }
      } catch (error) {
        console.error('Error cargando departamentos:', error);
      }
    };
    cargarDepartamentos();
  }, []);

  // Cargar ciudades cuando se seleccione un departamento
  useEffect(() => {
    if (!departamentoSeleccionado) {
      setCiudades([]);
      setRegisterData(prev => ({ ...prev, id_ciudad: null }));
      return;
    }

    const cargarCiudades = async () => {
      try {
        setLoadingCiudades(true);
        const response = await ubicacionesService.listarCiudades(departamentoSeleccionado);
        if (response.success && response.data) {
          setCiudades(response.data);
        } else {
          setCiudades([]);
        }
      } catch (error) {
        console.error('Error cargando ciudades:', error);
        setCiudades([]);
      } finally {
        setLoadingCiudades(false);
      }
    };
    cargarCiudades();
  }, [departamentoSeleccionado]);

  // Manejar login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await authService.login(loginData);
      
      // El LoginResponse tiene token y usuario directamente
      if (response && response.token && response.usuario) {
        setToast({ message: '¡Bienvenido a AgroStock!', type: 'success' });
        
        // El contexto maneja la redirección automáticamente basándose en el rol de la BD
        await contextLogin(response.usuario);
        
        // Redirigir según el rol de la base de datos usando el callback de navegación
        setTimeout(() => {
          const rol = response.usuario.rol;
          if (rol === 'admin') {
            onNavigate?.('admin');
          } else if (rol === 'productor') {
            onNavigate?.('productor');
          } else {
            // Por defecto o si es 'consumidor'
            onNavigate?.('consumidor');
          }
        }, 500);
      } else {
        setToast({ 
          message: 'Error: Respuesta inválida del servidor', 
          type: 'error' 
        });
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      setToast({ 
        message: error.message || 'Error al iniciar sesión', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Validar registro
  const validateRegister = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!registerData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (registerData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!registerData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!registerData.telefono) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!/^\+?[\d\s\-()]+$/.test(registerData.telefono)) {
      newErrors.telefono = 'El teléfono no es válido';
    }

    if (!registerData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    } else if (registerData.direccion.trim().length < 5) {
      newErrors.direccion = 'La dirección debe tener al menos 5 caracteres';
    }

    if (!registerData.id_ciudad || registerData.id_ciudad === null) {
      newErrors.id_ciudad = 'La ciudad es requerida';
    }

    if (!registerData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegister()) {
      return;
    }

    setLoading(true);

    try {
      if (!registerData.id_ciudad) {
        setToast({ 
          message: 'Por favor selecciona una ciudad', 
          type: 'error' 
        });
        setLoading(false);
        return;
      }

      const response = await authService.register({
        nombre: registerData.nombre,
        email: registerData.email,
        password: registerData.password,
        telefono: registerData.telefono,
        direccion: registerData.direccion,
        id_ciudad: registerData.id_ciudad,
        rol: registerData.rol
      });
      
      if (response.success) {
        setToast({ message: '¡Cuenta creada exitosamente!', type: 'success' });
        setTimeout(() => {
          setIsLogin(true);
          setLoginData({ email: registerData.email, password: '' });
        }, 1500);
      }
    } catch (error: any) {
      setToast({ 
        message: error.message || 'Error al crear la cuenta', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      {/* Logo y título superior */}
      <div className="auth-header">
        <div className="auth-logo-container">
          <div className="auth-logo-icon">🌾</div>
          <span className="auth-logo-text">AGROSTOCK</span>
        </div>
        <h1 className="auth-main-title">
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h1>
        <p className="auth-subtitle">
          {isLogin 
            ? 'Accede a tu cuenta para continuar'
            : 'Únete a nuestra comunidad agrícola'
          }
        </p>
      </div>


      {/* Tarjeta del formulario */}
      <div className="auth-card">
        {/* Título dentro de la tarjeta - Solo en registro */}
        {!isLogin && (
          <div className="auth-card-header">
            <h2 className="auth-card-title">
              Registro de {registerData.rol === 'consumidor' ? 'Consumidor' : 'Productor'}
            </h2>
            <p className="auth-card-subtitle">
              {registerData.rol === 'consumidor'
                ? 'Crea tu cuenta para explorar y comprar productos locales'
                : 'Crea tu cuenta para vender y gestionar tus productos'
              }
            </p>
          </div>
        )}

        {/* Formulario de Login */}
        {isLogin ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-field">
              <label htmlFor="login-email" className="form-label">
                Correo Electrónico
              </label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="login-email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="form-input"
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                />
              </div>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="login-password" className="form-label">
                Contraseña
              </label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="login-password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="form-input"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        ) : (
          /* Formulario de Registro */
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-field">
              <label htmlFor="register-nombre" className="form-label">
                Nombre Completo
              </label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="register-nombre"
                  value={registerData.nombre}
                  onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
                  className={`form-input ${errors.nombre ? 'error' : ''}`}
                  placeholder="Tu nombre completo"
                  required
                  disabled={loading}
                />
              </div>
              {errors.nombre && <span className="error-text">{errors.nombre}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="register-telefono" className="form-label">
                Teléfono
              </label>
              <div className="input-wrapper">
                <span className="input-icon">📱</span>
                <input
                  type="tel"
                  id="register-telefono"
                  value={registerData.telefono}
                  onChange={(e) => setRegisterData({ ...registerData, telefono: e.target.value })}
                  className={`form-input ${errors.telefono ? 'error' : ''}`}
                  placeholder="3001234567"
                  required
                  disabled={loading}
                />
              </div>
              {errors.telefono && <span className="error-text">{errors.telefono}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="register-email" className="form-label">
                Correo Electrónico
              </label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="register-email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                />
              </div>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="register-password" className="form-label">
                Contraseña
              </label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="register-password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="register-confirm" className="form-label">
                Confirmar Contraseña
              </label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  id="register-confirm"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="register-direccion" className="form-label">
                Dirección
              </label>
              <div className="input-wrapper">
                <span className="input-icon">📍</span>
                <input
                  type="text"
                  id="register-direccion"
                  value={registerData.direccion}
                  onChange={(e) => setRegisterData({ ...registerData, direccion: e.target.value })}
                  className={`form-input ${errors.direccion ? 'error' : ''}`}
                  placeholder="Tu dirección completa"
                  required
                  disabled={loading}
                />
              </div>
              {errors.direccion && <span className="error-text">{errors.direccion}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="register-departamento" className="form-label">
                Departamento
              </label>
              <div className="input-wrapper">
                <span className="input-icon">🗺️</span>
                <select
                  id="register-departamento"
                  value={departamentoSeleccionado || ''}
                  onChange={(e) => {
                    const deptoId = e.target.value ? Number(e.target.value) : null;
                    setDepartamentoSeleccionado(deptoId);
                    setRegisterData({ ...registerData, id_ciudad: null });
                  }}
                  className={`form-select ${errors.id_ciudad && !departamentoSeleccionado ? 'error' : ''}`}
                  required
                  disabled={loading}
                >
                  <option value="">Selecciona un departamento</option>
                  {departamentos.map((depto) => (
                    <option key={depto.id_departamento} value={depto.id_departamento}>
                      {depto.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="register-ciudad" className="form-label">
                Ciudad
              </label>
              <div className="input-wrapper">
                <span className="input-icon">🏙️</span>
                <select
                  id="register-ciudad"
                  value={registerData.id_ciudad || ''}
                  onChange={(e) => setRegisterData({ ...registerData, id_ciudad: e.target.value ? Number(e.target.value) : null })}
                  className={`form-select ${errors.id_ciudad ? 'error' : ''}`}
                  required
                  disabled={loading || loadingCiudades || !departamentoSeleccionado}
                >
                  <option value="">
                    {!departamentoSeleccionado 
                      ? 'Primero selecciona un departamento' 
                      : loadingCiudades 
                      ? 'Cargando ciudades...' 
                      : ciudades.length === 0
                      ? 'No hay ciudades disponibles'
                      : 'Selecciona tu ciudad'}
                  </option>
                  {ciudades.map((ciudad) => (
                    <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                      {ciudad.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {errors.id_ciudad && <span className="error-text">{errors.id_ciudad}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="register-rol" className="form-label">
                Tipo de Cuenta
              </label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <select
                  id="register-rol"
                  value={registerData.rol}
                  onChange={(e) => setRegisterData({ ...registerData, rol: e.target.value as 'consumidor' | 'productor' })}
                  className="form-select"
                  required
                  disabled={loading}
                >
                  <option value="consumidor">🛒 Consumidor - Comprar productos</option>
                  <option value="productor">🌾 Productor - Vender productos</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>
        )}
      </div>

      {/* Enlaces de navegación */}
      <div className="auth-footer">
        {isLogin ? (
          <>
            <p className="auth-footer-text">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                className="auth-footer-link"
                onClick={() => {
                  setIsLogin(false);
                  setRegisterData(prev => ({ ...prev, rol: 'consumidor' }));
                }}
              >
                Regístrate aquí
              </button>
            </p>
            <button
              type="button"
              className="auth-back-link"
              onClick={() => onNavigate?.('welcome')}
            >
              - Volver al inicio
            </button>
          </>
        ) : (
          <>
            <p className="auth-footer-text">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                className="auth-footer-link"
                onClick={() => setIsLogin(true)}
              >
                Inicia sesión aquí
              </button>
            </p>
            <button
              type="button"
              className="auth-back-link"
              onClick={() => onNavigate?.('welcome')}
            >
              - Volver al inicio
            </button>
          </>
        )}
      </div>

      {/* Toast para mensajes */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AuthScreen;
