import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { BiEnvelope, BiLock, BiLogIn } from 'react-icons/bi';
import logoProyecto from '../assets/logoProyecto.png';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      await login(data);
      toast.success('¡Bienvenido de nuevo!');
      
      // Obtener el usuario del localStorage después del login
      const currentUser = JSON.parse(localStorage.getItem('agrostock_user') || '{}');
      
      // Redirigir según el rol
      if (currentUser.rol === 'admin') {
        navigate('/admin/dashboard');
      } else if (currentUser.rol === 'productor') {
        navigate('/productor/dashboard');
      } else {
        // Consumidor siempre va al home
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <img 
                    src={logoProyecto} 
                    alt="AgroStock Logo" 
                    className="mb-3"
                    style={{ maxWidth: '200px', width: '100%', height: 'auto' }}
                  />
                  <p className="text-muted">Inicia sesión en tu cuenta</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      <BiEnvelope className="me-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      {...register('email', {
                        required: 'El email es requerido',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email inválido',
                        },
                      })}
                      placeholder="tu@email.com"
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email.message}</div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      <BiLock className="me-2" />
                      Contraseña
                    </label>
                    <input
                      type="password"
                      id="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      {...register('password', {
                        required: 'La contraseña es requerida',
                        minLength: {
                          value: 6,
                          message: 'La contraseña debe tener al menos 6 caracteres',
                        },
                      })}
                      placeholder="••••••••"
                    />
                    {errors.password && (
                      <div className="invalid-feedback">{errors.password.message}</div>
                    )}
                  </div>

                  <div className="d-grid mb-3">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Iniciando sesión...
                        </>
                      ) : (
                        <>
                          <BiLogIn className="me-2" />
                          Iniciar Sesión
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <Link to="/password-recovery" className="text-decoration-none">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                </form>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="text-muted mb-0">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" className="text-primary fw-bold text-decoration-none">
                      Regístrate aquí
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;






