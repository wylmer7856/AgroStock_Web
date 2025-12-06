import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { passwordRecoveryService } from '../services/passwordRecovery';
import { BiEnvelope, BiLock, BiCheckCircle, BiArrowBack, BiKey } from 'react-icons/bi';
import logoProyecto from '../assets/logoProyecto.png';
import './PasswordRecoveryPage.css';

interface RecoveryFormData {
  email: string;
}

interface CodeFormData {
  codigo: string;
}

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

const PasswordRecoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [step, setStep] = useState<'request' | 'validate' | 'code' | 'reset' | 'success'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [validatedCode, setValidatedCode] = useState<string>('');

  const {
    register: registerRecovery,
    handleSubmit: handleSubmitRecovery,
    formState: { errors: errorsRecovery },
  } = useForm<RecoveryFormData>();

  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: errorsCode },
  } = useForm<CodeFormData>();

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    watch,
    formState: { errors: errorsReset },
  } = useForm<ResetPasswordFormData>();

  const newPassword = watch('newPassword');

  // Validar token si viene en la URL
  useEffect(() => {
    if (token && !isValidatingToken) {
      validateToken(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateToken = async (tokenToValidate: string) => {
    setIsValidatingToken(true);
    try {
      const response = await passwordRecoveryService.validarToken(tokenToValidate);
      if (response.success && response.data?.valid) {
        setStep('reset');
      } else {
        toast.error(response.data?.message || 'Token inválido o expirado');
        setStep('request');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al validar token');
      setStep('request');
    } finally {
      setIsValidatingToken(false);
    }
  };

  const onSubmitRecovery = async (data: RecoveryFormData) => {
    try {
      setIsLoading(true);
      const response = await passwordRecoveryService.solicitarRecuperacionEmail(data.email);
      
      if (response.success) {
        setUserEmail(data.email);
        toast.success('Se ha enviado un código de recuperación a tu correo electrónico. Revisa tu bandeja de entrada.');
        setStep('code');
      } else {
        toast.error(response.message || 'Error al solicitar recuperación');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al solicitar recuperación de contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitCode = async (data: CodeFormData) => {
    try {
      setIsLoading(true);
      const response = await passwordRecoveryService.validarCodigo(userEmail, data.codigo);
      
      if (response.success && response.data?.valid) {
        setValidatedCode(data.codigo);
        toast.success('Código verificado correctamente');
        setStep('reset');
      } else {
        toast.error(response.data?.message || 'Código inválido o expirado');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al validar código');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitReset = async (data: ResetPasswordFormData) => {
    // Si hay token en la URL, usar el método antiguo
    if (token) {
      try {
        setIsLoading(true);
        const response = await passwordRecoveryService.restablecerContraseña(token, data.newPassword);
        
        if (response.success) {
          toast.success('Contraseña restablecida exitosamente');
          setStep('success');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          toast.error(response.message || 'Error al restablecer contraseña');
        }
      } catch (error: any) {
        toast.error(error.message || 'Error al restablecer contraseña');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Si no hay token, usar el método con código
    if (!userEmail || !validatedCode) {
      toast.error('Error: por favor valida el código primero');
      setStep('code');
      return;
    }

    try {
      setIsLoading(true);
      const response = await passwordRecoveryService.restablecerContraseñaConCodigo(userEmail, validatedCode, data.newPassword);
      
      if (response.success) {
        toast.success('Contraseña restablecida exitosamente');
        setStep('success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(response.message || 'Error al restablecer contraseña');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al restablecer contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="min-vh-100 d-flex align-items-center bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-lg border-0">
                <div className="card-body p-5 text-center">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Validando...</span>
                  </div>
                  <p>Validando enlace de recuperación...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light py-5">
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
                  {(() => {
                    switch (step) {
                      case 'request':
                        return <p className="text-muted">Recuperar contraseña</p>;
                      case 'validate':
                        return <p className="text-muted">Revisa tu correo</p>;
                      case 'code':
                        return <p className="text-muted">Ingresa el código</p>;
                      case 'reset':
                        return <p className="text-muted">Nueva contraseña</p>;
                      case 'success':
                        return <p className="text-success">Contraseña restablecida</p>;
                      default:
                        return null;
                    }
                  })()}
                </div>

                {/* Paso 1: Solicitar recuperación */}
                {step === 'request' && (
                  <div key="step-request">
                  <form onSubmit={handleSubmitRecovery(onSubmitRecovery)}>
                    <div className="mb-4">
                      <label htmlFor="email" className={`form-label ${errorsRecovery.email ? 'label-error' : ''}`}>
                        <BiEnvelope className="me-2" />
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className={`form-control ${errorsRecovery.email ? 'is-invalid' : ''}`}
                        {...registerRecovery('email', {
                          required: 'El email es requerido',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido',
                          },
                        })}
                        placeholder="tu@email.com"
                      />
                      {errorsRecovery.email && (
                        <div className="invalid-feedback">{errorsRecovery.email.message}</div>
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
                            Enviando...
                          </>
                        ) : (
                          <>
                            <BiEnvelope className="me-2" />
                            Enviar enlace de recuperación
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center">
                      <Link to="/login" className="text-decoration-none">
                        <BiArrowBack className="me-1" />
                        Volver al inicio de sesión
                      </Link>
                    </div>
                  </form>
                  </div>
                )}

                {/* Paso 2: Confirmación de envío */}
                {step === 'validate' && (
                  <div key="step-validate">
                  <div className="text-center">
                    <BiCheckCircle className="text-success mb-3" style={{ fontSize: '4rem' }} />
                    <h5 className="mb-3">Revisa tu correo electrónico</h5>
                    <p className="text-muted mb-4">
                      Hemos enviado un enlace de recuperación a tu correo electrónico.
                      Haz clic en el enlace para restablecer tu contraseña.
                    </p>
                    <p className="text-muted small mb-4">
                      Si no recibes el correo, revisa tu carpeta de spam o intenta nuevamente.
                    </p>
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => setStep('request')}
                      >
                        Enviar otro correo
                      </button>
                      <Link to="/login" className="btn btn-link text-decoration-none">
                        Volver al inicio de sesión
                      </Link>
                    </div>
                  </div>
                  </div>
                )}

                {/* Paso 2.5: Ingresar código */}
                {step === 'code' && (
                  <div key="step-code">
                  <form onSubmit={handleSubmitCode(onSubmitCode)}>
                    <div className="text-center mb-4">
                      <BiEnvelope className="text-primary mb-3" style={{ fontSize: '3rem' }} />
                      <h5 className="mb-3">Ingresa el código de verificación</h5>
                      <p className="text-muted mb-4">
                        Hemos enviado un código de 6 dígitos a <strong>{userEmail}</strong>.
                        Ingresa el código que recibiste en tu correo electrónico.
                      </p>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="codigo" className={`form-label ${errorsCode.codigo ? 'label-error' : ''}`}>
                        <BiKey className="me-2" />
                        Código de Verificación
                      </label>
                      <input
                        type="text"
                        id="codigo"
                        className={`form-control text-center ${errorsCode.codigo ? 'is-invalid' : ''}`}
                        style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
                        maxLength={6}
                        {...registerCode('codigo', {
                          required: 'El código es requerido',
                          pattern: {
                            value: /^\d{6}$/,
                            message: 'El código debe tener 6 dígitos numéricos',
                          },
                        })}
                        placeholder="000000"
                        autoComplete="off"
                      />
                      {errorsCode.codigo && (
                        <div className="invalid-feedback">{errorsCode.codigo.message}</div>
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
                            Verificando...
                          </>
                        ) : (
                          <>
                            <BiCheckCircle className="me-2" />
                            Verificar Código
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center mb-3">
                      <button
                        type="button"
                        className="btn btn-link text-decoration-none"
                        onClick={() => setStep('request')}
                        disabled={isLoading}
                      >
                        Reenviar código
                      </button>
                    </div>

                    <div className="text-center">
                      <Link to="/login" className="text-decoration-none">
                        <BiArrowBack className="me-1" />
                        Volver al inicio de sesión
                      </Link>
                    </div>
                  </form>
                  </div>
                )}

                {/* Paso 3: Restablecer contraseña */}
                {step === 'reset' && (
                  <div key="step-reset">
                  <form onSubmit={handleSubmitReset(onSubmitReset)}>
                    <div className="mb-3">
                      <label htmlFor="newPassword" className={`form-label ${errorsReset.newPassword ? 'label-error' : ''}`}>
                        <BiLock className="me-2" />
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        className={`form-control ${errorsReset.newPassword ? 'is-invalid' : ''}`}
                        {...registerReset('newPassword', {
                          required: 'La contraseña es requerida',
                          minLength: {
                            value: 6,
                            message: 'La contraseña debe tener al menos 6 caracteres',
                          },
                        })}
                        placeholder="••••••••"
                      />
                      {errorsReset.newPassword && (
                        <div className="invalid-feedback">{errorsReset.newPassword.message}</div>
                      )}
                    </div>

                    <div className="mb-4">
                      <label htmlFor="confirmPassword" className={`form-label ${errorsReset.confirmPassword ? 'label-error' : ''}`}>
                        <BiLock className="me-2" />
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        className={`form-control ${errorsReset.confirmPassword ? 'is-invalid' : ''}`}
                        {...registerReset('confirmPassword', {
                          required: 'Confirma tu contraseña',
                          validate: (value) =>
                            value === newPassword || 'Las contraseñas no coinciden',
                        })}
                        placeholder="••••••••"
                      />
                      {errorsReset.confirmPassword && (
                        <div className="invalid-feedback">{errorsReset.confirmPassword.message}</div>
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
                            Restableciendo...
                          </>
                        ) : (
                          <>
                            <BiCheckCircle className="me-2" />
                            Restablecer Contraseña
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center">
                      <Link to="/login" className="text-decoration-none">
                        <BiArrowBack className="me-1" />
                        Volver al inicio de sesión
                      </Link>
                    </div>
                  </form>
                  </div>
                )}

                {/* Paso 4: Éxito */}
                {step === 'success' && (
                  <div key="step-success">
                  <div className="text-center">
                    <BiCheckCircle className="text-success mb-3" style={{ fontSize: '4rem' }} />
                    <h5 className="mb-3 text-success">¡Contraseña restablecida!</h5>
                    <p className="text-muted mb-4">
                      Tu contraseña ha sido restablecida exitosamente.
                      Serás redirigido al inicio de sesión en unos segundos.
                    </p>
                    <Link to="/login" className="btn btn-primary">
                      Ir al inicio de sesión
                    </Link>
                  </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordRecoveryPage;


