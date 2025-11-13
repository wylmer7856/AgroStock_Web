import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { ubicacionesService, productoresService } from '../services';
import { BiUser, BiEnvelope, BiLock, BiPhone, BiMapPin, BiStore, BiLeaf } from 'react-icons/bi';
import logoProyecto from '../assets/logoProyecto.png';
import type { Departamento, Ciudad } from '../types';
import './RegisterPage.css';

interface RegisterFormData {
  // Campos básicos
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefono?: string;
  direccion?: string;
  id_ciudad?: number | null;
  rol: 'consumidor' | 'productor';
  
  // Campos específicos de productor
  nombre_finca?: string;
  tipo_productor?: 'agricultor' | 'ganadero' | 'apicultor' | 'piscicultor' | 'avicultor' | 'mixto' | 'otro';
  id_departamento?: number | null;
  vereda?: string;
  direccion_finca?: string;
  numero_registro_ica?: string;
  certificaciones?: string;
  descripcion_actividad?: string;
  anos_experiencia?: number | null;
  hectareas?: number | null;
  metodo_produccion?: 'tradicional' | 'organico' | 'convencional' | 'mixto';
  sitio_web?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      rol: 'consumidor',
    },
  });

  const selectedRol = watch('rol');
  const selectedDepartamento = watch('id_departamento');
  const password = watch('password');

  // Cargar departamentos
  const { data: departamentosData } = useQuery({
    queryKey: ['departamentos'],
    queryFn: async () => {
      const response = await ubicacionesService.listarDepartamentos();
      return response.data || [];
    },
  });

  // Cargar ciudades según departamento seleccionado
  const { data: ciudadesData } = useQuery({
    queryKey: ['ciudades', selectedDepartamento],
    queryFn: async () => {
      if (!selectedDepartamento) return [];
      const response = await ubicacionesService.listarCiudades(selectedDepartamento);
      return response.data || [];
    },
    enabled: !!selectedDepartamento,
  });

  const departamentos = departamentosData || [];
  const ciudades = ciudadesData || [];

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      setIsLoading(true);
      const { confirmPassword, ...registerData } = data;
      
      // Validar campos específicos de productor (según ProductoresModel)
      // nombre_finca es recomendado para mejor UX
      // tipo_productor tiene valor por defecto 'agricultor' según ProductoresModel línea 287
      if (selectedRol === 'productor') {
        if (!registerData.nombre_finca) {
          toast.error('El nombre de la finca es requerido para productores');
          return;
        }
        // Asegurar valor por defecto si no se selecciona (según BD)
        if (!registerData.tipo_productor) {
          registerData.tipo_productor = 'agricultor';
        }
      }

      // Validar campos básicos requeridos por el backend (según UsuariosModel.InsertarUsuario)
      // El backend requiere: nombre, email, password, telefono, direccion, id_ciudad, rol
      if (!registerData.telefono || !registerData.direccion || !registerData.id_ciudad) {
        toast.error('Teléfono, dirección y ciudad son campos requeridos');
        return;
      }

      // Guardar datos de productor antes del registro (si aplica)
      // Según ProductoresModel, los campos de productor son opcionales excepto id_usuario
      const productorDataToSave = selectedRol === 'productor' ? {
        nombre_finca: registerData.nombre_finca || undefined,
        tipo_productor: registerData.tipo_productor || 'agricultor', // Valor por defecto según BD
        id_departamento: registerData.id_departamento || undefined,
        id_ciudad: registerData.id_ciudad || undefined,
        vereda: registerData.vereda || undefined,
        direccion_finca: registerData.direccion_finca || undefined,
        numero_registro_ica: registerData.numero_registro_ica || undefined,
        certificaciones: registerData.certificaciones || undefined,
        descripcion_actividad: registerData.descripcion_actividad || undefined,
        anos_experiencia: registerData.anos_experiencia || undefined,
        hectareas: registerData.hectareas || undefined,
        metodo_produccion: registerData.metodo_produccion || undefined,
        sitio_web: registerData.sitio_web || undefined,
      } : null;

      // Registrar usuario básico (esto también hace login automático)
      try {
        await registerUser(registerData);
        
        // Mostrar mensaje de éxito
        toast.success('✅ ¡Usuario registrado exitosamente!');
        
        // Si es productor, crear el perfil de productor después del login
        if (selectedRol === 'productor' && productorDataToSave) {
          // Esperar un momento para que el login se complete
          setTimeout(async () => {
            try {
              const productorResult = await productoresService.guardarPerfil(productorDataToSave);
              
              if (!productorResult.success) {
                console.warn('Usuario creado pero no se pudo crear el perfil de productor:', productorResult.message);
                toast.warning('Cuenta creada, pero hubo un problema al crear el perfil de productor. Puedes completarlo más tarde.');
              } else {
                toast.success('Perfil de productor creado exitosamente');
              }
            } catch (error: any) {
              console.error('Error creando perfil de productor:', error);
              toast.warning('Cuenta creada, pero hubo un problema al crear el perfil de productor. Puedes completarlo más tarde.');
            }
          }, 1000);
        }
        
        // Obtener el usuario del localStorage después del registro
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
      } catch (registerError: any) {
        // Si el registro fue exitoso pero el login falló, mostrar mensaje apropiado
        if (registerError.message && registerError.message.includes('registrado')) {
          toast.success('✅ ¡Usuario registrado exitosamente!');
          // Intentar navegar de todas formas
          const currentUser = JSON.parse(localStorage.getItem('agrostock_user') || '{}');
          if (currentUser.rol === 'admin') {
            setTimeout(() => navigate('/admin/dashboard'), 1000);
          } else if (currentUser.rol === 'productor') {
            setTimeout(() => navigate('/productor/dashboard'), 1000);
          } else {
            setTimeout(() => navigate('/'), 1000);
          }
        } else {
          throw registerError; // Re-lanzar el error para que se maneje en el catch externo
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-9">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <img 
                    src={logoProyecto} 
                    alt="AgroStock Logo" 
                    className="mb-3"
                    style={{ maxWidth: '200px', width: '100%', height: 'auto' }}
                  />
                  <p className="text-muted">Únete a AgroStock</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* Tipo de Cuenta - Segmented Control */}
                  <div className="mb-4">
                    <label className="form-label fw-bold mb-3 d-block">
                      Tipo de Cuenta *
                    </label>
                    <div className={`role-selector ${selectedRol === 'consumidor' ? 'consumidor-selected' : 'productor-selected'}`}>
                      <input
                        type="radio"
                        id="rol-consumidor"
                        value="consumidor"
                        className="role-selector-input"
                        {...register('rol', { required: 'Selecciona un tipo de cuenta' })}
                      />
                      <label 
                        htmlFor="rol-consumidor" 
                        className={`role-selector-option ${selectedRol === 'consumidor' ? 'active' : ''}`}
                      >
                        Consumidor
                      </label>
                      
                      <input
                        type="radio"
                        id="rol-productor"
                        value="productor"
                        className="role-selector-input"
                        {...register('rol', { required: 'Selecciona un tipo de cuenta' })}
                      />
                      <label 
                        htmlFor="rol-productor" 
                        className={`role-selector-option ${selectedRol === 'productor' ? 'active' : ''}`}
                      >
                        Productor
                      </label>
                    </div>
                    {errors.rol && (
                      <div className="text-danger small mt-2">{errors.rol.message}</div>
                    )}
                  </div>

                  <hr className="my-4" />

                  {/* Campos Básicos */}
                  <h5 className="mb-3">
                    <BiUser className="me-2" />
                    Información Personal
                  </h5>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="nombre" className="form-label">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        id="nombre"
                        className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                        {...register('nombre', {
                          required: 'El nombre es requerido',
                          minLength: {
                            value: 3,
                            message: 'El nombre debe tener al menos 3 caracteres',
                          },
                        })}
                        placeholder="Juan Pérez"
                      />
                      {errors.nombre && (
                        <div className="invalid-feedback">{errors.nombre.message}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">
                        <BiEnvelope className="me-2" />
                        Email *
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
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="password" className="form-label">
                        <BiLock className="me-2" />
                        Contraseña *
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

                    <div className="col-md-6 mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        <BiLock className="me-2" />
                        Confirmar Contraseña *
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        {...register('confirmPassword', {
                          required: 'Confirma tu contraseña',
                          validate: (value) =>
                            value === password || 'Las contraseñas no coinciden',
                        })}
                        placeholder="••••••••"
                      />
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword.message}</div>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="telefono" className="form-label">
                        <BiPhone className="me-2" />
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                        {...register('telefono', {
                          required: 'El teléfono es requerido',
                          pattern: {
                            value: /^[0-9]{7,15}$/,
                            message: 'Teléfono inválido (solo números, 7-15 dígitos)',
                          },
                        })}
                        placeholder="3001234567"
                      />
                      {errors.telefono && (
                        <div className="invalid-feedback">{errors.telefono.message}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="direccion" className="form-label">
                        <BiMapPin className="me-2" />
                        Dirección *
                      </label>
                      <input
                        type="text"
                        id="direccion"
                        className={`form-control ${errors.direccion ? 'is-invalid' : ''}`}
                        {...register('direccion', {
                          required: 'La dirección es requerida',
                          minLength: {
                            value: 5,
                            message: 'La dirección debe tener al menos 5 caracteres',
                          },
                        })}
                        placeholder="Calle 123 #45-67"
                      />
                      {errors.direccion && (
                        <div className="invalid-feedback">{errors.direccion.message}</div>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="id_departamento" className="form-label">
                        Departamento *
                      </label>
                      <select
                        id="id_departamento"
                        className={`form-select ${errors.id_departamento ? 'is-invalid' : ''}`}
                        {...register('id_departamento', {
                          required: 'Selecciona un departamento',
                          valueAsNumber: true,
                        })}
                      >
                        <option value="">Selecciona un departamento</option>
                        {departamentos.map((dept: Departamento) => (
                          <option key={dept.id_departamento} value={dept.id_departamento}>
                            {dept.nombre}
                          </option>
                        ))}
                      </select>
                      {errors.id_departamento && (
                        <div className="invalid-feedback">{errors.id_departamento.message}</div>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label htmlFor="id_ciudad" className="form-label">
                        Ciudad *
                      </label>
                      <select
                        id="id_ciudad"
                        className={`form-select ${errors.id_ciudad ? 'is-invalid' : ''}`}
                        {...register('id_ciudad', {
                          required: 'Selecciona una ciudad',
                          valueAsNumber: true,
                        })}
                        disabled={!selectedDepartamento || ciudades.length === 0}
                      >
                        <option value="">
                          {!selectedDepartamento 
                            ? 'Primero selecciona un departamento' 
                            : ciudades.length === 0 
                            ? 'Cargando ciudades...' 
                            : 'Selecciona una ciudad'}
                        </option>
                        {ciudades.map((ciudad: Ciudad) => (
                          <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                            {ciudad.nombre}
                          </option>
                        ))}
                      </select>
                      {errors.id_ciudad && (
                        <div className="invalid-feedback">{errors.id_ciudad.message}</div>
                      )}
                    </div>
                  </div>

                  {/* Campos Específicos de Productor */}
                  {selectedRol === 'productor' && (
                    <>
                      <hr className="my-4" />
                      <h5 className="mb-3">
                        <BiStore className="me-2" />
                        Información del Productor
                      </h5>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="nombre_finca" className="form-label">
                            Nombre de la Finca *
                          </label>
                          <input
                            type="text"
                            id="nombre_finca"
                            className={`form-control ${errors.nombre_finca ? 'is-invalid' : ''}`}
                            {...register('nombre_finca', {
                              required: selectedRol === 'productor' ? 'El nombre de la finca es requerido' : false,
                            })}
                            placeholder="Finca El Paraíso"
                          />
                          {errors.nombre_finca && (
                            <div className="invalid-feedback">{errors.nombre_finca.message}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-3">
                          <label htmlFor="tipo_productor" className="form-label">
                            Tipo de Productor
                          </label>
                          <select
                            id="tipo_productor"
                            className="form-select"
                            {...register('tipo_productor')}
                            defaultValue="agricultor"
                          >
                            <option value="agricultor">Agricultor</option>
                            <option value="ganadero">Ganadero</option>
                            <option value="apicultor">Apicultor</option>
                            <option value="piscicultor">Piscicultor</option>
                            <option value="avicultor">Avicultor</option>
                            <option value="mixto">Mixto</option>
                            <option value="otro">Otro</option>
                          </select>
                          <small className="text-muted">Valor por defecto: Agricultor (según BD)</small>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="vereda" className="form-label">
                            Vereda
                          </label>
                          <input
                            type="text"
                            id="vereda"
                            className="form-control"
                            {...register('vereda')}
                            placeholder="Vereda La Esperanza"
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label htmlFor="direccion_finca" className="form-label">
                            Dirección de la Finca
                          </label>
                          <input
                            type="text"
                            id="direccion_finca"
                            className="form-control"
                            {...register('direccion_finca')}
                            placeholder="Kilómetro 5 vía principal"
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="numero_registro_ica" className="form-label">
                            Número de Registro ICA
                    </label>
                    <input
                      type="text"
                            id="numero_registro_ica"
                            className="form-control"
                            {...register('numero_registro_ica')}
                            placeholder="ICA-123456"
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label htmlFor="metodo_produccion" className="form-label">
                            Método de Producción
                          </label>
                          <select
                            id="metodo_produccion"
                            className="form-select"
                            {...register('metodo_produccion')}
                          >
                            <option value="tradicional">Tradicional</option>
                            <option value="organico">Orgánico</option>
                            <option value="convencional">Convencional</option>
                            <option value="mixto">Mixto</option>
                          </select>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label htmlFor="anos_experiencia" className="form-label">
                            Años de Experiencia
                          </label>
                          <input
                            type="number"
                            id="anos_experiencia"
                            className="form-control"
                            {...register('anos_experiencia', { valueAsNumber: true })}
                            placeholder="5"
                            min="0"
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label htmlFor="hectareas" className="form-label">
                            Hectáreas
                          </label>
                          <input
                            type="number"
                            id="hectareas"
                            className="form-control"
                            {...register('hectareas', { valueAsNumber: true })}
                            placeholder="10"
                            min="0"
                            step="0.1"
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label htmlFor="sitio_web" className="form-label">
                            Sitio Web
                          </label>
                          <input
                            type="url"
                            id="sitio_web"
                            className="form-control"
                            {...register('sitio_web')}
                            placeholder="https://www.mifinca.com"
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="certificaciones" className="form-label">
                          Certificaciones
                        </label>
                        <textarea
                          id="certificaciones"
                      className="form-control"
                          rows={3}
                          {...register('certificaciones')}
                          placeholder="Certificaciones orgánicas, ISO, etc."
                    />
                  </div>

                      <div className="mb-3">
                        <label htmlFor="descripcion_actividad" className="form-label">
                          Descripción de la Actividad
                        </label>
                        <textarea
                          id="descripcion_actividad"
                          className="form-control"
                          rows={4}
                          {...register('descripcion_actividad')}
                          placeholder="Describe las actividades principales de tu finca..."
                        />
                      </div>
                    </>
                  )}

                  <div className="d-grid mb-3 mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Creando cuenta...
                        </>
                      ) : (
                        <>
                          <BiLeaf className="me-2" />
                          Crear Cuenta
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="text-muted mb-0">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-primary fw-bold text-decoration-none">
                      Inicia sesión aquí
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

export default RegisterPage;
