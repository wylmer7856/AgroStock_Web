import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { usuariosService, ubicacionesService, imagenesService } from '../../services';
import { toast } from 'react-toastify';
import { BiUser, BiEdit, BiSave, BiX, BiCamera, BiMapPin, BiPhone, BiEnvelope, BiCheckCircle } from 'react-icons/bi';
import type { Departamento, Ciudad } from '../../types';
import './PerfilPage.css';

interface PerfilFormData {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  id_ciudad: string;
  foto_perfil: string;
}

const ConsumidorPerfilPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loadingCiudades, setLoadingCiudades] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<PerfilFormData>({
    defaultValues: {
      nombre: user?.nombre || '',
      email: user?.email || '',
      telefono: user?.telefono || '',
      direccion: user?.direccion || '',
      id_ciudad: user?.id_ciudad?.toString() || '',
      foto_perfil: user?.foto_perfil || '',
    }
  });

  const idCiudadSeleccionada = watch('id_ciudad');

  // Cargar departamentos
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

  // Cargar ciudades al montar o cuando se habilita la edición
  useEffect(() => {
    const cargarCiudades = async () => {
      try {
        setLoadingCiudades(true);
        const response = await ubicacionesService.listarCiudades();
        if (response.success && response.data) {
          setCiudades(response.data);
        }
      } catch (error) {
        console.error('Error cargando ciudades:', error);
      } finally {
        setLoadingCiudades(false);
      }
    };
    
    cargarCiudades();
  }, [isEditing]);

  // Actualizar formulario cuando cambia el usuario
  useEffect(() => {
    if (user) {
      reset({
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        id_ciudad: user.id_ciudad?.toString() || '',
        foto_perfil: user.foto_perfil || '',
      });
      // Construir URL completa de la foto de perfil
      if (user.foto_perfil) {
        const fotoUrl = imagenesService.construirUrlImagen(user.foto_perfil);
        setFotoPreview(fotoUrl);
      } else {
        setFotoPreview(null);
      }
    }
  }, [user, reset]);

  // Mutation para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: PerfilFormData) => {
      const response = await usuariosService.actualizarMiPerfil({
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono || null,
        direccion: data.direccion || null,
        id_ciudad: data.id_ciudad ? Number(data.id_ciudad) : null,
        foto_perfil: data.foto_perfil || null,
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Error al actualizar perfil');
      }
      
      return response.data;
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        updateUser(updatedUser);
        queryClient.invalidateQueries({ queryKey: ['usuario', 'perfil'] });
        toast.success('Perfil actualizado correctamente');
        setIsEditing(false);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar perfil');
    }
  });

  const onSubmit = (data: PerfilFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    if (user) {
      reset({
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        id_ciudad: user.id_ciudad?.toString() || '',
        foto_perfil: user.foto_perfil || '',
      });
      // Construir URL completa de la foto de perfil
      if (user.foto_perfil) {
        const fotoUrl = imagenesService.construirUrlImagen(user.foto_perfil);
        setFotoPreview(fotoUrl);
      } else {
        setFotoPreview(null);
      }
    }
    setIsEditing(false);
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar el archivo
      const validacion = imagenesService.validarImagen(file);
      if (!validacion.valid) {
        toast.error(validacion.error || 'Error al validar la imagen');
        return;
      }

      // Mostrar preview inmediatamente
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Subir imagen al servidor
      try {
        const uploadRes = await imagenesService.subirImagenPerfilProductor(file);
        if (uploadRes.success && uploadRes.data) {
          const fotoUrl = imagenesService.construirUrlImagen(uploadRes.data.path);
          setFotoPreview(fotoUrl);
          // Actualizar el campo foto_perfil en el formulario
          reset({
            ...watch(),
            foto_perfil: uploadRes.data.path,
          });
          toast.success('Foto de perfil actualizada');
        } else {
          toast.error(uploadRes.message || 'Error al subir la imagen');
        }
      } catch (error) {
        console.error('Error subiendo imagen:', error);
        toast.error('Error al subir la imagen: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      }
    }
  };

  const ciudadSeleccionada = ciudades.find(c => c.id_ciudad.toString() === idCiudadSeleccionada);
  const departamentoSeleccionado = ciudadSeleccionada?.departamento;

  return (
    <div className="container py-5">
      <div className="profile-container">
        {/* Header con foto y nombre */}
        <div className="profile-header">
          <div className="text-center">
            <div className="profile-avatar-container">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Foto de perfil"
                  className="profile-avatar"
                  onError={(e) => {
                    console.error('Error cargando imagen de perfil:', fotoPreview);
                    (e.target as HTMLImageElement).style.display = 'none';
                    setFotoPreview(null);
                  }}
                  onLoad={() => {
                    console.log('✅ Imagen de perfil cargada exitosamente:', fotoPreview);
                  }}
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  <BiUser style={{ fontSize: '4rem', color: 'rgba(255,255,255,0.8)' }} />
                </div>
              )}
              {isEditing && (
                <label className="profile-avatar-edit-btn">
                  <BiCamera style={{ fontSize: '1.2rem' }} />
                  <input
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleFotoChange}
                  />
                </label>
              )}
            </div>
            <h1 className="profile-name">{user?.nombre || 'Usuario'}</h1>
            <p className="profile-email">
              <BiEnvelope className="me-2" style={{ fontSize: '1rem' }} />
              {user?.email || 'No especificado'}
            </p>
            <span className="profile-status-badge">
              <BiCheckCircle className="me-1" />
              Cuenta Activa
            </span>
          </div>
        </div>

        {/* Cuerpo del perfil */}
        <div className="profile-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Información Personal */}
            <div className="profile-section">
              <h3 className="profile-section-title">
                <BiUser />
                Información Personal
              </h3>

              {!isEditing ? (
                <div className="profile-info-card">
                  <div className="profile-info-item">
                    <BiUser />
                    <div>
                      <strong>Nombre:</strong>
                      <span className="profile-info-value ms-2">{user?.nombre || 'No especificado'}</span>
                    </div>
                  </div>
                  <div className="profile-info-item">
                    <BiEnvelope />
                    <div>
                      <strong>Email:</strong>
                      <span className="profile-info-value ms-2">{user?.email || 'No especificado'}</span>
                    </div>
                  </div>
                  <div className="profile-info-item">
                    <BiPhone />
                    <div>
                      <strong>Teléfono:</strong>
                      <span className={`profile-info-value ms-2 ${!user?.telefono ? 'profile-info-empty' : ''}`}>
                        {user?.telefono || 'No especificado'}
                      </span>
                    </div>
                  </div>
                  <div className="profile-info-item">
                    <BiMapPin />
                    <div>
                      <strong>Dirección:</strong>
                      <span className={`profile-info-value ms-2 ${!user?.direccion ? 'profile-info-empty' : ''}`}>
                        {user?.direccion || 'No especificado'}
                      </span>
                    </div>
                  </div>
                  <div className="profile-info-item">
                    <BiMapPin />
                    <div>
                      <strong>Ciudad:</strong>
                      <span className={`profile-info-value ms-2 ${!ciudadSeleccionada ? 'profile-info-empty' : ''}`}>
                        {ciudadSeleccionada 
                          ? `${ciudadSeleccionada.nombre}${departamentoSeleccionado ? `, ${departamentoSeleccionado.nombre}` : ''}`
                          : 'No especificada'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="profile-form-group">
                    <label className="profile-form-label">
                      <BiUser />
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      className={`profile-form-control ${errors.nombre ? 'is-invalid' : ''}`}
                      {...register('nombre', {
                        required: 'El nombre es requerido',
                        minLength: {
                          value: 2,
                          message: 'El nombre debe tener al menos 2 caracteres'
                        }
                      })}
                    />
                    {errors.nombre && (
                      <div className="invalid-feedback d-block">{errors.nombre.message}</div>
                    )}
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">
                      <BiEnvelope />
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      className={`profile-form-control ${errors.email ? 'is-invalid' : ''}`}
                      {...register('email', {
                        required: 'El email es requerido',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email inválido'
                        }
                      })}
                    />
                    {errors.email && (
                      <div className="invalid-feedback d-block">{errors.email.message}</div>
                    )}
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">
                      <BiPhone />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      className="profile-form-control"
                      {...register('telefono')}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">
                      <BiMapPin />
                      Dirección
                    </label>
                    <input
                      type="text"
                      className="profile-form-control"
                      {...register('direccion')}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">
                      <BiMapPin />
                      Ciudad
                    </label>
                    <select
                      className="profile-form-control"
                      {...register('id_ciudad')}
                      disabled={loadingCiudades}
                    >
                      <option value="">Seleccione una ciudad</option>
                      {ciudades.map((ciudad) => (
                        <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                          {ciudad.nombre} - {ciudad.departamento?.nombre || ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Botones de acción */}
            <div className="profile-actions">
              {!isEditing ? (
                <button
                  type="button"
                  className="profile-btn profile-btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <BiEdit />
                  Editar Perfil
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="profile-btn profile-btn-secondary"
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isPending}
                  >
                    <BiX />
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="profile-btn profile-btn-primary"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <BiSave />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConsumidorPerfilPage;

