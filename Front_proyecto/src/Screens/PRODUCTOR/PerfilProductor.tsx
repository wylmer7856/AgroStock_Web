// 👤 PERFIL DE USUARIO - Formulario para gestionar datos de la tabla usuarios

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usuariosService, ubicacionesService, imagenesService } from '../../services';
import type { User } from '../../types';
import { BiUser, BiCamera, BiEnvelope, BiPhone, BiMapPin, BiSave, BiArrowBack, BiCheckCircle } from 'react-icons/bi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './PerfilProductor.css';

interface PerfilProductorProps {
  onNavigate?: (view: string) => void;
  onClose?: () => void;
}

export const PerfilProductor: React.FC<PerfilProductorProps> = ({ onNavigate, onClose }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<User>>({
    nombre: '',
    email: '',
    telefono: null,
    direccion: null,
    id_ciudad: null,
    foto_perfil: null,
    activo: true,
  });
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar datos del usuario desde el servidor
      const userRes = await usuariosService.obtenerMiPerfil();
      if (userRes.success && userRes.data) {
        const usuario = userRes.data;
        setFormData({
          nombre: usuario.nombre || '',
          email: usuario.email || '',
          telefono: usuario.telefono || null,
          direccion: usuario.direccion || null,
          id_ciudad: usuario.id_ciudad || null,
          foto_perfil: usuario.foto_perfil || null,
          activo: usuario.activo !== undefined ? usuario.activo : true,
        });
        
        // Construir URL completa de la imagen si existe
        if (usuario.foto_perfil) {
          const fotoUrl = imagenesService.construirUrlImagen(usuario.foto_perfil);
          console.log('📸 Cargando foto_perfil desde servidor:', {
            foto_perfil: usuario.foto_perfil,
            fotoUrl
          });
          setFotoPreview(fotoUrl);
        } else {
          setFotoPreview(null);
        }
        
        // Actualizar el contexto de autenticación
        if (updateUser) {
          updateUser(usuario);
        }
      } else {
        // Si falla, usar datos del contexto
        if (user) {
          setFormData({
            nombre: user.nombre || '',
            email: user.email || '',
            telefono: user.telefono || null,
            direccion: user.direccion || null,
            id_ciudad: user.id_ciudad || null,
            foto_perfil: user.foto_perfil || null,
            activo: user.activo !== undefined ? user.activo : true,
          });
          
          if (user.foto_perfil) {
            const fotoUrl = imagenesService.construirUrlImagen(user.foto_perfil);
            console.log('📸 Cargando foto_perfil desde contexto:', {
              foto_perfil: user.foto_perfil,
              fotoUrl
            });
            setFotoPreview(fotoUrl);
          }
        }
      }
      
      // Cargar departamentos
      try {
        const deptosRes = await ubicacionesService.listarDepartamentos();
        if (deptosRes.success && deptosRes.data) {
          setDepartamentos(deptosRes.data);
        }
      } catch (error) {
        console.error('Error cargando departamentos:', error);
      }

      // Cargar ciudades si hay una ciudad seleccionada
      if (formData.id_ciudad) {
        try {
          // Primero necesitamos obtener el departamento de la ciudad
          const ciudadRes = await ubicacionesService.obtenerCiudad(formData.id_ciudad);
          if (ciudadRes.success && ciudadRes.data?.id_departamento) {
            setDepartamentoSeleccionado(ciudadRes.data.id_departamento);
            const ciudadesRes = await ubicacionesService.listarCiudades(ciudadRes.data.id_departamento);
            if (ciudadesRes.success && ciudadesRes.data) {
              setCiudades(ciudadesRes.data);
            }
          }
        } catch (error) {
          console.error('Error cargando ciudades:', error);
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleDepartamentoChange = async (idDepartamento: number | null) => {
    setFormData({ ...formData, id_departamento: idDepartamento || undefined, id_ciudad: null });
    
    if (idDepartamento) {
      try {
        const ciudadesRes = await ubicacionesService.listarCiudades(idDepartamento);
        if (ciudadesRes.success && ciudadesRes.data) {
          setCiudades(ciudadesRes.data);
        }
      } catch (error) {
        console.error('Error cargando ciudades:', error);
        setCiudades([]);
      }
    } else {
      setCiudades([]);
    }
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

      // Intentar subir la imagen al servidor
      try {
        const uploadRes = await imagenesService.subirImagenPerfilProductor(file);
        console.log('📤 Respuesta de subida de imagen:', uploadRes);
        
        if (uploadRes.success && uploadRes.data) {
          // Siempre construir la URL usando el path, para asegurar consistencia
          // El path es lo que se guarda en la BD y es lo que usaremos para cargar la imagen
          const fotoUrl = imagenesService.construirUrlImagen(uploadRes.data.path);
          console.log('📸 URL de imagen construida:', fotoUrl);
          console.log('📸 Path de imagen guardado:', uploadRes.data.path);
          console.log('📸 URL del servidor (referencia):', uploadRes.data.url);
          
          setFotoPreview(fotoUrl);
          setFormData({ ...formData, foto_perfil: uploadRes.data.path });
          toast.success('✅ Imagen subida correctamente');
        } else {
          console.warn('⚠️ No se pudo subir la imagen:', uploadRes);
          toast.warning('⚠️ No se pudo subir la imagen, pero se mantiene el preview local');
        }
      } catch (error) {
        console.error('❌ Error subiendo imagen:', error);
        toast.error('Error al subir la imagen: ' + (error instanceof Error ? error.message : 'Error desconocido'));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Preparar datos para enviar
      let fotoPerfilToSave: string | null = formData.foto_perfil || null;
      
      // Si hay una foto preview que es data URL, ya debería estar subida
      // Si es una URL del servidor, extraer solo la ruta relativa
      if (fotoPreview && !fotoPreview.startsWith('data:')) {
        if (fotoPreview.startsWith('http://') || fotoPreview.startsWith('https://')) {
          const urlObj = new URL(fotoPreview);
          fotoPerfilToSave = urlObj.pathname.startsWith('/uploads') 
            ? urlObj.pathname 
            : `/uploads${urlObj.pathname}`;
        } else {
          fotoPerfilToSave = fotoPreview;
        }
      }
      
      const datosActualizar = {
        nombre: formData.nombre?.trim() || '',
        email: formData.email?.trim() || '',
        telefono: formData.telefono?.trim() || null,
        direccion: formData.direccion?.trim() || null,
        id_ciudad: formData.id_ciudad || null,
        foto_perfil: fotoPerfilToSave,
        activo: formData.activo !== undefined ? formData.activo : true,
      };

      const userRes = await usuariosService.actualizarMiPerfil(datosActualizar);
      
      if (userRes.success && userRes.data) {
        // Actualizar el contexto
        if (updateUser) {
          updateUser(userRes.data);
        }
        
        toast.success('✅ Perfil actualizado correctamente');
        
        // Recargar datos para asegurar sincronización
        await cargarDatos();
        
        if (onClose) {
          setTimeout(() => onClose(), 1500);
        }
      } else {
        throw new Error(userRes.message || 'Error al actualizar el perfil');
      }
    } catch (error: any) {
      console.error('Error guardando perfil:', error);
      toast.error(error.message || 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  // Obtener el departamento de la ciudad seleccionada para mostrar en el select
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {(onClose || onNavigate) && (
        <div className="mb-4">
          <button
            className="btn btn-outline-secondary"
            onClick={() => onClose ? onClose() : (onNavigate ? onNavigate('dashboard') : navigate(-1))}
          >
            <BiArrowBack className="me-1" />
            Volver
          </button>
        </div>
      )}
      
      <div className="profile-productor-container">
        {/* Header con foto y nombre */}
        <div className="profile-productor-header">
          <div className="text-center">
            <div className="profile-productor-avatar-container">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Foto de perfil"
                  className="profile-productor-avatar"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (fotoPreview && !fotoPreview.startsWith('data:')) {
                      if (fotoPreview.includes('/api/uploads')) {
                        img.src = fotoPreview.replace('/api/uploads', '/uploads');
                        return;
                      }
                      if (fotoPreview.startsWith('/api/')) {
                        img.src = fotoPreview.replace('/api', 'http://localhost:8000');
                        return;
                      }
                    }
                    img.style.display = 'none';
                  }}
                />
              ) : (
                <div className="profile-productor-avatar-placeholder">
                  <BiUser style={{ fontSize: '4rem', color: 'rgba(255,255,255,0.8)' }} />
                </div>
              )}
              <label className="profile-productor-avatar-edit-btn" title="Cambiar foto">
                <BiCamera style={{ fontSize: '1.2rem' }} />
                <input
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleFotoChange}
                />
              </label>
            </div>
            <h1 className="profile-productor-name">{user?.nombre || formData.nombre || 'Productor'}</h1>
            <p className="profile-productor-email">
              <BiEnvelope className="me-2" style={{ fontSize: '1rem' }} />
              {user?.email || formData.email || 'No especificado'}
            </p>
            <span className="profile-productor-status-badge">
              <BiCheckCircle className="me-1" />
              {formData.activo ? 'Cuenta Activa' : 'Cuenta Inactiva'}
            </span>
          </div>
        </div>

        {/* Cuerpo del perfil */}
        <div className="profile-productor-body">
          <form onSubmit={handleSubmit}>
            {/* Información Personal */}
            <div className="profile-productor-section">
              <h3 className="profile-productor-section-title">
                <BiUser />
                Información Personal
              </h3>

              <div className="row g-3">
                {/* Nombre */}
                <div className="col-md-6">
                  <label className="profile-productor-form-label">
                    <BiUser />
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    className="profile-productor-form-control"
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <label className="profile-productor-form-label">
                    <BiEnvelope />
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    className="profile-productor-form-control"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                {/* Teléfono */}
                <div className="col-md-6">
                  <label className="profile-productor-form-label">
                    <BiPhone />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="profile-productor-form-control"
                    value={formData.telefono || ''}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value || null })}
                    placeholder="Opcional"
                  />
                </div>

                {/* Dirección */}
                <div className="col-md-6">
                  <label className="profile-productor-form-label">
                    <BiMapPin />
                    Dirección
                  </label>
                  <input
                    type="text"
                    className="profile-productor-form-control"
                    value={formData.direccion || ''}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value || null })}
                    placeholder="Opcional"
                  />
                </div>

                {/* Departamento */}
                <div className="col-md-6">
                  <label className="profile-productor-form-label">
                    <BiMapPin />
                    Departamento
                  </label>
                  <select
                    className="profile-productor-form-control"
                    value={departamentoSeleccionado || ''}
                    onChange={(e) => {
                      const deptoId = e.target.value ? Number(e.target.value) : null;
                      setDepartamentoSeleccionado(deptoId);
                      handleDepartamentoChange(deptoId);
                    }}
                  >
                    <option value="">Seleccione un departamento</option>
                    {departamentos.map(depto => (
                      <option key={depto.id_departamento} value={depto.id_departamento}>
                        {depto.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ciudad */}
                <div className="col-md-6">
                  <label className="profile-productor-form-label">
                    <BiMapPin />
                    Ciudad / Municipio
                  </label>
                  <select
                    className="profile-productor-form-control"
                    value={formData.id_ciudad || ''}
                    onChange={(e) => setFormData({ ...formData, id_ciudad: e.target.value ? Number(e.target.value) : null })}
                    disabled={!departamentoSeleccionado}
                  >
                    <option value="">Seleccione una ciudad</option>
                    {ciudades.map(ciudad => (
                      <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                        {ciudad.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Información de Cuenta */}
            <div className="profile-productor-section">
              <h3 className="profile-productor-section-title">
                <BiCheckCircle />
                Información de Cuenta
              </h3>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="profile-productor-form-label">Rol</label>
                  <input
                    type="text"
                    className="profile-productor-form-control"
                    value={user?.rol || ''}
                    disabled
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="profile-productor-form-label">Estado</label>
                  <select
                    className="profile-productor-form-control"
                    value={formData.activo ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.value === '1' })}
                  >
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                  </select>
                  <small className="text-muted d-block mt-1">Tu cuenta puede estar activa o inactiva</small>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="profile-productor-actions">
              <button
                type="submit"
                className="profile-productor-btn profile-productor-btn-primary"
                disabled={saving}
              >
                {saving ? (
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
              {(onClose || onNavigate) && (
                <button
                  type="button"
                  className="profile-productor-btn profile-productor-btn-secondary"
                  onClick={() => onClose ? onClose() : (onNavigate ? onNavigate('dashboard') : navigate(-1))}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PerfilProductor;
