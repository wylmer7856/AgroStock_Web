// 👥 PANTALLA DE GESTIÓN DE USUARIOS - ADMIN

import React, { useState, useEffect } from 'react';
import { usePagination, useDebounce } from '../../hooks';
import adminService from '../../services/admin';
import { ubicacionesService } from '../../services';
import { Card, Button, Input, Modal, Loading, Badge, Avatar, Toast } from '../../components/ReusableComponents';
import type { UsuarioAdmin, FiltrosUsuarios, Ciudad } from '../../types';
import ConfirmModal from '../../components/ConfirmModal';
import './AdminScreens.css';

// ===== FUNCIONES HELPER =====
const formatearFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return 'N/A';
  
  try {
    const date = new Date(fecha);
    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    // Formato: DD/MM/YYYY
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
};

const formatearTelefono = (telefono: string | null | undefined): string => {
  if (!telefono) return 'N/A';
  
  // Remover espacios y caracteres especiales
  const numero = telefono.replace(/\D/g, '');
  
  // Formato colombiano: +57 300 123 4567 o 300 123 4567
  if (numero.length === 10) {
    return `${numero.substring(0, 3)} ${numero.substring(3, 6)} ${numero.substring(6)}`;
  } else if (numero.length === 12 && numero.startsWith('57')) {
    return `+57 ${numero.substring(2, 5)} ${numero.substring(5, 8)} ${numero.substring(8)}`;
  }
  
  return telefono;
};

interface UsuariosScreenProps {
  onNavigate: (view: string) => void;
}

export const UsuariosScreen: React.FC<UsuariosScreenProps> = ({ onNavigate }) => {
  // ===== ESTADOS =====
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState<FiltrosUsuarios>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioAdmin | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<{ show: boolean; id?: number }>({ show: false });

  // ===== FUNCIONES =====
  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filtrosCompletos = {
        ...filtros,
        ...(busquedaDebounced && { busqueda: busquedaDebounced })
      };
      
      console.log('[UsuariosScreen] Cargando usuarios con filtros:', filtrosCompletos);
      const response = await adminService.getUsuarios(filtrosCompletos);
      console.log('[UsuariosScreen] Respuesta recibida:', response);
      
      if (response.success && response.data) {
        setUsuarios(response.data);
        console.log('[UsuariosScreen] Usuarios cargados:', response.data.length);
      } else {
        const errorMsg = response.message || 'Error cargando usuarios';
        console.error('[UsuariosScreen] Error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[UsuariosScreen] Excepción:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ===== PAGINACIÓN =====
  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 20,
    total: usuarios.length
  });

  // ===== DEBOUNCE PARA BÚSQUEDA =====
  const busquedaDebounced = useDebounce(busqueda, 300);

  // ===== EFECTOS =====
  useEffect(() => {
    cargarUsuarios();
  }, [filtros, busquedaDebounced]);

  useEffect(() => {
    console.log('[UsuariosScreen] showCreateModal cambió a:', showCreateModal);
  }, [showCreateModal]);

  useEffect(() => {
    console.log('[UsuariosScreen] showEditModal cambió a:', showEditModal);
  }, [showEditModal]);

  useEffect(() => {
    console.log('[UsuariosScreen] showDeleteModal cambió a:', showDeleteModal);
  }, [showDeleteModal]);

  const handleEliminarUsuario = (id: number) => {
    console.log('[UsuariosScreen] Eliminando usuario ID:', id);
    setShowDeleteModal({ show: true, id });
    console.log('[UsuariosScreen] showDeleteModal debería ser true ahora');
  };

  const confirmEliminarUsuario = async () => {
    if (showDeleteModal.id === undefined) {
      console.error('[UsuariosScreen] No hay ID para eliminar');
      return;
    }

    console.log('[UsuariosScreen] Confirmando eliminación de usuario ID:', showDeleteModal.id);

    try {
      const response = await adminService.eliminarUsuario(showDeleteModal.id);
      console.log('[UsuariosScreen] Respuesta de eliminación:', response);
      
      if (response.success) {
        setUsuarios(prev => prev.filter(u => u.id_usuario !== showDeleteModal.id));
        mostrarToast('Usuario eliminado exitosamente', 'success');
        setShowDeleteModal({ show: false });
      } else {
        const errorMsg = response.message || 'Error eliminando usuario';
        console.error('[UsuariosScreen] Error en respuesta:', errorMsg);
        mostrarToast(errorMsg, 'error');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[UsuariosScreen] Excepción al eliminar:', errorMsg, error);
      mostrarToast(`Error eliminando usuario: ${errorMsg}`, 'error');
    }
  };

  const handleCambiarEstadoUsuario = async (id: number, activo: boolean) => {
    try {
      const response = await adminService.editarUsuario(id, { activo });
      
      if (response.success) {
        setUsuarios(prev =>
          prev.map(u => u.id_usuario === id ? { ...u, activo } : u)
        );
        mostrarToast(`Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`, 'success');
      } else {
        mostrarToast(response.message || 'Error cambiando estado', 'error');
      }
    } catch {
      mostrarToast('Error cambiando estado', 'error');
    }
  };

  const handleEditarUsuario = (usuario: UsuarioAdmin) => {
    console.log('[UsuariosScreen] Editando usuario:', usuario);
    setUsuarioSeleccionado(usuario);
    setShowEditModal(true);
    console.log('[UsuariosScreen] showEditModal debería ser true ahora');
  };

  const mostrarToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Filtrar usuarios localmente
  const usuariosFiltrados = usuarios.filter(usuario =>
    !busquedaDebounced || 
    usuario.nombre?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    usuario.email?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    usuario.telefono?.toLowerCase().includes(busquedaDebounced.toLowerCase())
  );

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div className="header-content">
          <h1>Gestión de Usuarios</h1>
          <p>Administra todos los usuarios del sistema</p>
        </div>
        <div className="header-actions">
          <Button
            variant="primary"
            onClick={() => {
              console.log('[UsuariosScreen] Click en Nuevo Usuario, abriendo modal...');
              setShowCreateModal(true);
              console.log('[UsuariosScreen] showCreateModal debería ser true ahora');
            }}
          >
            Nuevo Usuario
          </Button>
          <Button
            variant="secondary"
            onClick={cargarUsuarios}
            loading={loading}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card title="Filtros y Búsqueda" className="filters-card">
        <div className="filters-grid">
          <div className="search-group">
            <Input
              label="Buscar usuarios"
              placeholder="Nombre, email o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Rol:</label>
            <select
              value={filtros.rol || ''}
              onChange={(e) => setFiltros(prev => ({ 
                ...prev, 
                rol: e.target.value || undefined
              }))}
            >
              <option value="">Todos los roles</option>
              <option value="admin">Admin</option>
              <option value="productor">Productor</option>
              <option value="consumidor">Consumidor</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Estado:</label>
            <select
              value={filtros.activo === undefined ? '' : filtros.activo.toString()}
              onChange={(e) => setFiltros(prev => ({ 
                ...prev, 
                activo: e.target.value === '' ? undefined : e.target.value === 'true'
              }))}
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de usuarios en tarjetas */}
      <Card 
        title={`Usuarios (${usuariosFiltrados.length})`}
        className="usuarios-list-card"
      >
        {loading ? (
          <Loading text="Cargando usuarios..." />
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <Button variant="primary" onClick={cargarUsuarios}>
              Reintentar
            </Button>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No se encontraron usuarios</h3>
            <p>Intenta ajustar los filtros o crear un nuevo usuario.</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Crear Primer Usuario
            </Button>
          </div>
        ) : (
          <div className="usuarios-cards-grid">
            {usuariosFiltrados.map((usuario) => (
              <Card key={usuario.id_usuario} className="usuario-card">
                <div className="usuario-card-header">
                  <div className="usuario-avatar-section">
                    <Avatar name={usuario.nombre} size="large" />
                    <div className="usuario-basic-info">
                      <h3 className="usuario-nombre">{usuario.nombre}</h3>
                      <div className="usuario-id">ID: {usuario.id_usuario}</div>
                    </div>
                  </div>
                  <div className="usuario-badges">
                    <Badge 
                      variant={
                        usuario.rol === 'admin' ? 'error' : 
                        usuario.rol === 'productor' ? 'warning' : 'info'
                      }
                      size="medium"
                    >
                      {usuario.rol === 'admin' && '👨‍💼'}
                      {usuario.rol === 'productor' && '🌱'}
                      {usuario.rol === 'consumidor' && '🛒'}
                      {' '}{usuario.rol}
                    </Badge>
                  </div>
                </div>

                <div className="usuario-card-body">
                  <div className="usuario-contact-info">
                    <div className="contact-item">
                      <span className="contact-icon">📧</span>
                      <span className="contact-value">{usuario.email || 'N/A'}</span>
                    </div>
                    <div className="contact-item">
                      <span className="contact-icon">📱</span>
                      <span className="contact-value">{formatearTelefono(usuario.telefono)}</span>
                    </div>
                  </div>
                  
                  <div className="usuario-meta-info">
                    <div className="meta-item">
                      <span className="meta-label">Estado:</span>
                      <Badge 
                        variant={usuario.activo ? 'success' : 'error'}
                        size="small"
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Registro:</span>
                      <span className="meta-value">{formatearFecha(usuario.fecha_registro)}</span>
                    </div>
                  </div>
                </div>

                <div className="usuario-card-body">
                  <div className="usuario-contact-info">
                    <div className="contact-item">
                      <span className="contact-icon">📧</span>
                      <span className="contact-value">{usuario.email}</span>
                      {usuario.email_verificado && (
                        <Badge variant="success" size="small">✓</Badge>
                      )}
                    </div>
                    <div className="contact-item">
                      <span className="contact-icon">📞</span>
                      <span className="contact-value">{usuario.telefono || 'N/A'}</span>
                      {usuario.telefono_verificado && (
                        <Badge variant="success" size="small">✓</Badge>
                      )}
                    </div>
                    {usuario.ubicacion && (
                      <div className="contact-item">
                        <span className="contact-icon">📍</span>
                        <span className="contact-value">
                          {usuario.ubicacion.ciudad}, {usuario.ubicacion.departamento}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="usuario-meta-info">
                    <div className="meta-item">
                      <span className="meta-label">Registro:</span>
                      <span className="meta-value">
                        {new Date(usuario.fecha_registro).toLocaleDateString()}
                      </span>
                    </div>
                    {usuario.ultimo_acceso && (
                      <div className="meta-item">
                        <span className="meta-label">Último acceso:</span>
                        <span className="meta-value">
                          {new Date(usuario.ultimo_acceso).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="usuario-card-footer">
                  <div className="usuario-actions">
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => handleEditarUsuario(usuario)}
                    >
                      Editar
                    </Button>
                    {usuario.rol === 'productor' && (
                      <Button
                        size="small"
                        variant="info"
                        onClick={() => onNavigate('productor')}
                      >
                        Panel Productor
                      </Button>
                    )}
                    {usuario.rol === 'consumidor' && (
                      <Button
                        size="small"
                        variant="info"
                        onClick={() => onNavigate('consumidor')}
                      >
                        Panel Consumidor
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant={usuario.activo ? 'warning' : 'success'}
                      onClick={() => handleCambiarEstadoUsuario(usuario.id_usuario, !usuario.activo)}
                    >
                      {usuario.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => handleEliminarUsuario(usuario.id_usuario)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Paginación */}
      {usuariosFiltrados.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Mostrando {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, usuariosFiltrados.length)} de {usuariosFiltrados.length} usuarios
          </div>
          <div className="pagination-controls">
            <Button
              size="small"
              variant="secondary"
              onClick={pagination.prevPage}
              disabled={!pagination.hasPrevPage}
            >
              ← Anterior
            </Button>
            <span className="pagination-page">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
            <Button
              size="small"
              variant="secondary"
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage}
            >
              Siguiente →
            </Button>
          </div>
        </div>
      )}

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        show={showDeleteModal.show}
        onClose={() => setShowDeleteModal({ show: false })}
        onConfirm={confirmEliminarUsuario}
        title="Eliminar Usuario"
        message="¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Modal para crear usuario */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => {
          console.log('[UsuariosScreen] Cerrando modal de crear usuario');
          setShowCreateModal(false);
        }}
        onSuccess={() => {
          console.log('[UsuariosScreen] Usuario creado exitosamente');
          setShowCreateModal(false);
          cargarUsuarios();
        }}
      />

      {/* Modal para editar usuario */}
      {usuarioSeleccionado && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setUsuarioSeleccionado(null);
          }}
          usuario={usuarioSeleccionado}
          onSuccess={() => {
            setShowEditModal(false);
            setUsuarioSeleccionado(null);
            cargarUsuarios();
          }}
        />
      )}
    </div>
  );
};

// ===== MODAL PARA CREAR USUARIO =====
interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    id_ciudad: '',
    rol: 'consumidor' as 'admin' | 'consumidor' | 'productor'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loadingCiudades, setLoadingCiudades] = useState(false);

  // Cargar ciudades al abrir el modal
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.crearUsuario({
        ...formData,
        id_ciudad: Number(formData.id_ciudad)
      });
      
      if (response.success) {
        onSuccess();
        // Resetear formulario
        setFormData({
          nombre: '',
          email: '',
          password: '',
          telefono: '',
          direccion: '',
          id_ciudad: '',
          rol: 'consumidor'
        });
      } else {
        setError(response.message || 'Error creando usuario');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  console.log('[CreateUserModal] Renderizando, isOpen:', isOpen, 'ciudades:', ciudades.length);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Usuario"
      size="large"
    >
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-grid">
          <div className="form-group">
            <Input
              label="Nombre completo"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              required
              placeholder="Ej: Juan Pérez"
            />
          </div>
          
          <div className="form-group">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              placeholder="usuario@ejemplo.com"
            />
          </div>
          
          <div className="form-group">
            <Input
              label="Contraseña"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          
          <div className="form-group">
            <Input
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              required
              placeholder="+57 300 123 4567"
            />
          </div>
          
          <div className="form-group">
            <Input
              label="Dirección"
              value={formData.direccion}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
              required
              placeholder="Dirección completa"
            />
          </div>
          
          <div className="form-group">
            <label>Ciudad:</label>
            <select
              value={formData.id_ciudad}
              onChange={(e) => handleInputChange('id_ciudad', e.target.value)}
              required
              disabled={loadingCiudades}
            >
              <option value="">{loadingCiudades ? 'Cargando ciudades...' : 'Selecciona una ciudad'}</option>
              {ciudades.map((ciudad) => (
                <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                  {ciudad.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Rol del usuario:</label>
            <select
              value={formData.rol}
              onChange={(e) => handleInputChange('rol', e.target.value)}
            >
              <option value="consumidor">🛒 Consumidor</option>
              <option value="productor">🌱 Productor</option>
              <option value="admin">👨‍💼 Administrador</option>
            </select>
          </div>
        </div>
        
        {error && (
          <div className="form-error">
            <span className="error-icon">❌</span>
            <span>{error}</span>
          </div>
        )}
        
        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon="➕"
          >
            Crear Usuario
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ===== MODAL PARA EDITAR USUARIO =====
interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: UsuarioAdmin;
  onSuccess: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  usuario,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    direccion: usuario.direccion,
    id_ciudad: usuario.id_ciudad?.toString() || '',
    rol: usuario.rol,
    activo: usuario.activo
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loadingCiudades, setLoadingCiudades] = useState(false);

  // Cargar ciudades al abrir el modal
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.editarUsuario(usuario.id_usuario, {
        ...formData,
        id_ciudad: formData.id_ciudad ? Number(formData.id_ciudad) : undefined
      });
      
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Error actualizando usuario');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Usuario: ${usuario.nombre}`}
      size="large"
    >
      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-grid">
          <div className="form-group">
            <Input
              label="Nombre completo"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <Input
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <Input
              label="Dirección"
              value={formData.direccion}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Ciudad:</label>
            <select
              value={formData.id_ciudad}
              onChange={(e) => handleInputChange('id_ciudad', e.target.value)}
              required
              disabled={loadingCiudades}
            >
              <option value="">{loadingCiudades ? 'Cargando ciudades...' : 'Selecciona una ciudad'}</option>
              {ciudades.map((ciudad) => (
                <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                  {ciudad.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Rol del usuario:</label>
            <select
              value={formData.rol}
              onChange={(e) => handleInputChange('rol', e.target.value)}
            >
              <option value="consumidor">🛒 Consumidor</option>
              <option value="productor">🌱 Productor</option>
              <option value="admin">👨‍💼 Administrador</option>
            </select>
          </div>

          <div className="form-group">
            <label>Estado del usuario:</label>
            <select
              value={formData.activo.toString()}
              onChange={(e) => handleInputChange('activo', e.target.value === 'true')}
            >
              <option value="true">✅ Activo</option>
              <option value="false">❌ Inactivo</option>
            </select>
          </div>
        </div>
        
        {error && (
          <div className="form-error">
            <span className="error-icon">❌</span>
            <span>{error}</span>
          </div>
        )}
        
        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon="💾"
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UsuariosScreen;
