// 📁 PANTALLA DE GESTIÓN DE CATEGORÍAS - ADMIN

import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../hooks';
import adminService from '../../services/admin';
import imagenesService from '../../services/imagenes';
import { Card, Button, Input, Modal, Loading, Badge } from '../../components/ReusableComponents';
import Swal from 'sweetalert2';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import './AdminScreens.css';

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  activa: boolean;
  total_productos?: number;
}

interface CategoriasScreenProps {
  onNavigate: (view: string) => void;
}

export const CategoriasScreen: React.FC<CategoriasScreenProps> = ({ onNavigate }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', imagen_url: '', activa: true });
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);

  const busquedaDebounced = useDebounce(busqueda, 300);

  useEffect(() => {
    cargarCategorias();
    cargarProductos();
    
    // Actualización automática cada 30 segundos
    const interval = setInterval(() => {
      cargarCategorias();
      cargarProductos();
    }, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getCategorias();
      
      if (response.success && response.data) {
        let categoriasData = response.data;
        
        if (busquedaDebounced) {
          categoriasData = categoriasData.filter((c: Categoria) => 
            c.nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
            c.descripcion?.toLowerCase().includes(busquedaDebounced.toLowerCase())
          );
        }
        
        setCategorias(categoriasData);
      } else {
        setError(response.message || 'Error cargando categorías');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      console.error('[CategoriasScreen] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await adminService.getProductos();
      if (response.success && response.data) {
        setProductos(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  };

  useEffect(() => {
    cargarCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaDebounced]);

  const handleCrearCategoria = async () => {
    if (!formData.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre de la categoría es obligatorio',
        confirmButtonColor: '#059669'
      });
      return;
    }

    Swal.fire({
      title: 'Creando...',
      text: 'Por favor espera mientras se crea la categoría',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      let imagenUrl = formData.imagen_url;
      
      // Si hay un archivo de imagen, subirlo primero
      if (imagenFile) {
        const validacion = imagenesService.validarImagen(imagenFile);
        if (!validacion.valid) {
          Swal.fire({
            icon: 'error',
            title: 'Error de imagen',
            text: validacion.error || 'La imagen no es válida',
            confirmButtonColor: '#dc3545'
          });
          return;
        }

        // Convertir a base64 y enviar
        const imageData = await imagenesService.fileToBase64(imagenFile);
        // Enviar como base64 al backend (el backend debe manejar esto)
        imagenUrl = imageData;
      }

      const dataToSend = {
        ...formData,
        imagen_url: imagenUrl || undefined
      };

      const response = await adminService.crearCategoria(dataToSend);
      
      if (response.success) {
        await cargarCategorias();
        Swal.fire({
          icon: 'success',
          title: '¡Categoría creada!',
          text: 'La categoría ha sido creada exitosamente.',
          confirmButtonColor: '#059669'
        });
        setShowCreateModal(false);
        setFormData({ nombre: '', descripcion: '', imagen_url: '', activa: true });
        setImagenPreview(null);
        setImagenFile(null);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Error creando categoría',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error creando categoría: ${errorMsg}`,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleEditarCategoria = async () => {
    if (!categoriaSeleccionada) return;
    
    if (!formData.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre de la categoría es obligatorio',
        confirmButtonColor: '#059669'
      });
      return;
    }

    Swal.fire({
      title: 'Actualizando...',
      text: 'Por favor espera mientras se actualiza la categoría',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      let imagenUrl = formData.imagen_url;
      
      // Si hay un archivo de imagen nuevo, subirlo primero
      if (imagenFile) {
        const validacion = imagenesService.validarImagen(imagenFile);
        if (!validacion.valid) {
          Swal.fire({
            icon: 'error',
            title: 'Error de imagen',
            text: validacion.error || 'La imagen no es válida',
            confirmButtonColor: '#dc3545'
          });
          return;
        }

        // Convertir a base64 y enviar
        const imageData = await imagenesService.fileToBase64(imagenFile);
        imagenUrl = imageData;
      }

      const dataToSend = {
        ...formData,
        imagen_url: imagenUrl || undefined
      };

      const response = await adminService.actualizarCategoria(
        categoriaSeleccionada.id_categoria,
        dataToSend
      );
      
      if (response.success) {
        await cargarCategorias();
        Swal.fire({
          icon: 'success',
          title: '¡Categoría actualizada!',
          text: 'La categoría ha sido actualizada exitosamente.',
          confirmButtonColor: '#059669'
        });
        setShowEditModal(false);
        setCategoriaSeleccionada(null);
        setFormData({ nombre: '', descripcion: '', imagen_url: '', activa: true });
        setImagenPreview(null);
        setImagenFile(null);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Error actualizando categoría',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error actualizando categoría: ${errorMsg}`,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleEliminarCategoria = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la categoría. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'Eliminando...',
      text: 'Por favor espera mientras se elimina la categoría',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
      const response = await adminService.eliminarCategoria(id);
      
      if (response.success) {
        await cargarCategorias();
        Swal.fire({
          icon: 'success',
          title: '¡Categoría eliminada!',
          text: 'La categoría ha sido eliminada exitosamente.',
          confirmButtonColor: '#059669'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Error eliminando categoría',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error eliminando categoría:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error eliminando categoría: ${errorMsg}`,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const abrirModalEditar = (categoria: Categoria) => {
    setCategoriaSeleccionada(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      imagen_url: categoria.imagen_url || '',
      activa: categoria.activa
    });
    // Cargar preview de imagen existente si hay
    if (categoria.imagen_url) {
      const imagenUrl = categoria.imagen_url.startsWith('http') 
        ? categoria.imagen_url 
        : imagenesService.construirUrlImagen(categoria.imagen_url);
      setImagenPreview(imagenUrl);
    } else {
      setImagenPreview(null);
    }
    setImagenFile(null);
    setShowEditModal(true);
  };

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validacion = imagenesService.validarImagen(file);
      if (!validacion.valid) {
        Swal.fire({
          icon: 'error',
          title: 'Error de imagen',
          text: validacion.error || 'La imagen no es válida',
          confirmButtonColor: '#dc3545'
        });
        return;
      }

      // Mostrar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImagenFile(file);
      setFormData({ ...formData, imagen_url: '' }); // Limpiar URL si había una
    }
  };

  const handleEliminarImagen = () => {
    setImagenPreview(null);
    setImagenFile(null);
    setFormData({ ...formData, imagen_url: '' });
  };

  // ===== ESTADÍSTICAS =====
  const estadisticas = useMemo(() => {
    // Contar productos por categoría
    const productosPorCategoria: Record<string, number> = {};
    
    productos.forEach((producto: any) => {
      const categoriaId = producto.id_categoria;
      if (categoriaId) {
        const categoria = categorias.find(c => c.id_categoria === categoriaId);
        const nombreCategoria = categoria?.nombre || 'Sin categoría';
        productosPorCategoria[nombreCategoria] = (productosPorCategoria[nombreCategoria] || 0) + 1;
      } else {
        productosPorCategoria['Sin categoría'] = (productosPorCategoria['Sin categoría'] || 0) + 1;
      }
    });

    // Agregar categorías sin productos
    categorias.forEach(categoria => {
      if (!productosPorCategoria[categoria.nombre]) {
        productosPorCategoria[categoria.nombre] = 0;
      }
    });

    const datosGrafica = Object.entries(productosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, cantidad]) => ({
        nombre: nombre.length > 20 ? nombre.substring(0, 20) + '...' : nombre,
        cantidad
      }));

    return {
      datosGrafica
    };
  }, [categorias, productos]);

  return (
    <div className="categorias-screen">
      {/* Header */}
      <div className="screen-header">
        <div className="header-content">
          <h1>
            <i className="bi bi-tags me-2"></i>
            Gestión de Categorías
          </h1>
          <p>Administra las categorías de productos del sistema</p>
        </div>
        <div className="header-actions">
          <Button
            variant="primary"
            onClick={() => {
              setFormData({ nombre: '', descripcion: '', imagen_url: '', activa: true });
              setShowCreateModal(true);
            }}
          >
            <i className="bi bi-plus-circle-fill me-2"></i>
            Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="categorias-filters-card">
        <div className="categorias-search-wrapper">
          <div className="search-icon-wrapper">
            <i className="bi bi-search"></i>
          </div>
          <input
            type="text"
            className="categorias-search-input"
            placeholder="Buscar categorías por nombre o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button
              className="clear-search-btn"
              onClick={() => setBusqueda('')}
              type="button"
            >
              <i className="bi bi-x-circle"></i>
            </button>
          )}
        </div>
      </Card>

      {/* Tabla de categorías */}
      <Card className="categorias-table-card">
        {loading ? (
          <Loading text="Cargando categorías..." />
        ) : error ? (
          <div className="error-message">
            <p>❌ {error}</p>
            <Button variant="primary" onClick={cargarCategorias}>
              Reintentar
            </Button>
          </div>
      ) : categorias.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>No se encontraron categorías</h3>
            <p>Intenta ajustar los filtros de búsqueda o crea una nueva categoría.</p>
          </div>
        ) : (
          <>
            <div className="categorias-table-wrapper">
              <table className="table categorias-table">
                <thead>
                  <tr>
                    <th className="th-id">ID</th>
                    <th className="th-nombre">NOMBRE</th>
                    <th className="th-descripcion">DESCRIPCIÓN</th>
                    <th className="th-productos">PRODUCTOS</th>
                    <th className="th-estado">ESTADO</th>
                    <th className="th-acciones">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((categoria) => {
                    const totalProductos = productos.filter((p: any) => p.id_categoria === categoria.id_categoria).length;
                    return (
                      <tr key={categoria.id_categoria}>
                        <td className="td-id">
                          <span className="categoria-id-text">#{categoria.id_categoria}</span>
                        </td>
                        <td className="td-nombre">
                          <span className="categoria-nombre-text">{categoria.nombre}</span>
                        </td>
                        <td className="td-descripcion">
                          <span className="categoria-descripcion-text">
                            {categoria.descripcion || 'Sin descripción'}
                          </span>
                        </td>
                        <td className="td-productos">
                          <span className="categoria-productos-text">{totalProductos}</span>
                        </td>
                        <td className="td-estado">
                          {categoria.activa ? (
                            <span className="estado-badge estado-activo">
                              <i className="bi bi-check-circle me-1"></i>
                              Activa
                            </span>
                          ) : (
                            <span className="estado-badge estado-inactivo">
                              <i className="bi bi-x-circle me-1"></i>
                              Inactiva
                            </span>
                          )}
                        </td>
                        <td className="td-acciones">
                          <div className="categorias-acciones-buttons">
                            <button
                              className="btn btn-accion-edit"
                              onClick={() => abrirModalEditar(categoria)}
                              title="Editar"
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button
                              className="btn btn-accion-delete"
                              onClick={() => handleEliminarCategoria(categoria.id_categoria)}
                              title="Eliminar"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                  </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
                </div>
                
            <div className="table-footer">
              <span>Mostrando 1 - {categorias.length} de {categorias.length} categorías</span>
                  </div>
          </>
        )}
      </Card>

      {/* Gráfica de productos por categoría */}
      {categorias.length > 0 && productos.length > 0 && (
        <div className="categorias-graficas-container">
          <div className="grafica-card">
            <div className="grafica-header">
              <h3><i className="bi bi-bar-chart me-2"></i>Productos por Categoría</h3>
                </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={estadisticas.datosGrafica}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={120} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
              </div>
        </div>
      )}

      {/* Modal crear categoría */}
      {showCreateModal && (
        <CreateCategoriaModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setFormData({ nombre: '', descripcion: '', imagen_url: '', activa: true });
            setImagenPreview(null);
            setImagenFile(null);
          }}
          formData={formData}
          setFormData={setFormData}
          imagenPreview={imagenPreview}
          imagenFile={imagenFile}
          onImagenChange={handleImagenChange}
          onEliminarImagen={handleEliminarImagen}
          onConfirm={handleCrearCategoria}
        />
      )}

      {/* Modal editar categoría */}
      {showEditModal && categoriaSeleccionada && (
        <EditCategoriaModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setCategoriaSeleccionada(null);
            setFormData({ nombre: '', descripcion: '', imagen_url: '', activa: true });
            setImagenPreview(null);
            setImagenFile(null);
          }}
          categoria={categoriaSeleccionada}
          formData={formData}
          setFormData={setFormData}
          imagenPreview={imagenPreview}
          imagenFile={imagenFile}
          onImagenChange={handleImagenChange}
          onEliminarImagen={handleEliminarImagen}
          onConfirm={handleEditarCategoria}
        />
      )}

    </div>
  );
};

// ===== MODAL CREAR CATEGORÍA =====
interface CreateCategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: { nombre: string; descripcion: string; imagen_url: string; activa: boolean };
  setFormData: React.Dispatch<React.SetStateAction<{ nombre: string; descripcion: string; imagen_url: string; activa: boolean }>>;
  imagenPreview: string | null;
  imagenFile: File | null;
  onImagenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEliminarImagen: () => void;
  onConfirm: () => void;
}

const CreateCategoriaModal: React.FC<CreateCategoriaModalProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  imagenPreview,
  imagenFile,
  onImagenChange,
  onEliminarImagen,
  onConfirm
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span>
          <i className="bi bi-plus-circle me-2"></i>
          Nueva Categoría
        </span>
      }
      size="medium"
    >
      <form onSubmit={(e) => { e.preventDefault(); onConfirm(); }}>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label">
              <i className="bi bi-tag me-2"></i>
              Nombre <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre de la categoría"
              required
            />
          </div>
            
          <div className="col-12">
            <label className="form-label">
              <i className="bi bi-text-paragraph me-2"></i>
              Descripción
            </label>
            <textarea
              className="form-control"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la categoría"
              rows={4}
            />
          </div>

          <div className="col-12">
            <label className="form-label">
              <i className="bi bi-image me-2"></i>
              Imagen de la Categoría
            </label>
            
            {imagenPreview ? (
              <div className="categoria-imagen-preview">
                <img src={imagenPreview} alt="Preview" className="categoria-preview-img" />
                <button
                  type="button"
                  className="btn btn-sm btn-danger mt-2"
                  onClick={onEliminarImagen}
                >
                  <i className="bi bi-trash me-1"></i>
                  Eliminar Imagen
                </button>
              </div>
            ) : (
              <div className="categoria-imagen-upload">
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={onImagenChange}
                  id="imagen-categoria-create"
                />
                <small className="form-text text-muted">
                  Formatos permitidos: JPG, PNG, GIF, WebP. Tamaño máximo: 5MB
                </small>
              </div>
            )}
          </div>

          <div className="col-12">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={formData.activa}
                onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                id="activa-create"
              />
              <label className="form-check-label" htmlFor="activa-create">
                Categoría activa
            </label>
            </div>
          </div>
            
          <div className="col-12">
            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!formData.nombre.trim()}
              >
                <i className="bi bi-check-circle me-2"></i>
                Crear Categoría
              </Button>
            </div>
          </div>
        </div>
      </form>
        </Modal>
  );
};

// ===== MODAL EDITAR CATEGORÍA =====
interface EditCategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoria: Categoria;
  formData: { nombre: string; descripcion: string; imagen_url: string; activa: boolean };
  setFormData: React.Dispatch<React.SetStateAction<{ nombre: string; descripcion: string; imagen_url: string; activa: boolean }>>;
  imagenPreview: string | null;
  imagenFile: File | null;
  onImagenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEliminarImagen: () => void;
  onConfirm: () => void;
}

const EditCategoriaModal: React.FC<EditCategoriaModalProps> = ({
  isOpen,
  onClose,
  categoria,
  formData,
  setFormData,
  imagenPreview,
  imagenFile,
  onImagenChange,
  onEliminarImagen,
  onConfirm
}) => {
  return (
        <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span>
          <i className="bi bi-pencil me-2"></i>
          Editar Categoría: {categoria.nombre}
        </span>
      }
      size="medium"
    >
      <form onSubmit={(e) => { e.preventDefault(); onConfirm(); }}>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label">
              <i className="bi bi-tag me-2"></i>
              Nombre <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre de la categoría"
              required
            />
          </div>
            
          <div className="col-12">
            <label className="form-label">
              <i className="bi bi-text-paragraph me-2"></i>
              Descripción
            </label>
            <textarea
              className="form-control"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la categoría"
              rows={4}
            />
          </div>

          <div className="col-12">
            <label className="form-label">
              <i className="bi bi-image me-2"></i>
              Imagen de la Categoría
            </label>
            
            {imagenPreview ? (
              <div className="categoria-imagen-preview">
                <img src={imagenPreview} alt="Preview" className="categoria-preview-img" />
                <div>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger mt-2"
                    onClick={onEliminarImagen}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Eliminar Imagen
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary mt-2 ms-2"
                    onClick={() => {
                      const input = document.getElementById('imagen-categoria-edit');
                      input?.click();
                    }}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Cambiar Imagen
                  </button>
                  <input
                    type="file"
                    className="d-none"
                    accept="image/*"
                    onChange={onImagenChange}
                    id="imagen-categoria-edit"
                  />
                </div>
              </div>
            ) : (
              <div className="categoria-imagen-upload">
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={onImagenChange}
                  id="imagen-categoria-edit"
                />
                <small className="form-text text-muted">
                  Formatos permitidos: JPG, PNG, GIF, WebP. Tamaño máximo: 5MB
                </small>
              </div>
            )}
          </div>

          <div className="col-12">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={formData.activa}
                onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                id="activa-edit"
              />
              <label className="form-check-label" htmlFor="activa-edit">
                Categoría activa
            </label>
            </div>
          </div>
            
          <div className="col-12">
            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!formData.nombre.trim()}
              >
                <i className="bi bi-check-circle me-2"></i>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      </form>
        </Modal>
  );
};

export default CategoriasScreen;
