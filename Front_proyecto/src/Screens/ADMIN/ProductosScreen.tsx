// 🛍️ PANTALLA DE GESTIÓN DE PRODUCTOS - ADMIN

import React, { useState, useEffect } from 'react';
import { useApi, usePagination, useDebounce } from '../../hooks';
import adminService from '../../services/admin';
import { Card, Button, Input, Modal, Loading, Badge, Avatar, Toast } from '../../components/ReusableComponents';
import type { ProductoDetallado, FiltrosProductos } from '../../types';
import './AdminScreens.css';

interface ProductosScreenProps {
  onNavigate: (view: string) => void;
}

export const ProductosScreen: React.FC<ProductosScreenProps> = ({ onNavigate }) => {
  // ===== ESTADOS =====
  const [productos, setProductos] = useState<ProductoDetallado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState<FiltrosProductos>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoDetallado | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ===== PAGINACIÓN =====
  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 20,
    total: productos.length
  });

  // ===== DEBOUNCE PARA BÚSQUEDA =====
  const busquedaDebounced = useDebounce(busqueda, 300);

  // ===== EFECTOS =====
  useEffect(() => {
    cargarProductos();
  }, [filtros, busquedaDebounced]);

  // ===== FUNCIONES =====
  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filtrosCompletos = {
        ...filtros,
        ...(busquedaDebounced && { nombre: busquedaDebounced })
      };
      
      console.log('[ProductosScreen] Cargando productos con filtros:', filtrosCompletos);
      const response = await adminService.getProductos(filtrosCompletos);
      console.log('[ProductosScreen] Respuesta recibida:', response);
      
      if (response.success && response.data) {
        setProductos(response.data);
        console.log('[ProductosScreen] Productos cargados:', response.data.length);
      } else {
        const errorMsg = response.message || 'Error cargando productos';
        console.error('[ProductosScreen] Error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[ProductosScreen] Excepción:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarProducto = async (id: number, motivo: string) => {
    try {
      const response = await adminService.eliminarProductoInapropiado(id, motivo);
      
      if (response.success) {
        setProductos(prev => prev.filter(p => p.id_producto !== id));
        mostrarToast('Producto eliminado exitosamente', 'success');
        setShowDeleteModal(false);
        setProductoSeleccionado(null);
      } else {
        mostrarToast(response.message || 'Error eliminando producto', 'error');
      }
    } catch (err) {
      mostrarToast('Error eliminando producto', 'error');
    }
  };

  const mostrarToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const productosFiltrados = productos.filter(producto =>
    !busquedaDebounced || 
    producto.nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    producto.descripcion.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    producto.nombre_productor.toLowerCase().includes(busquedaDebounced.toLowerCase())
  );

  return (
    <div className="productos-screen">
      {/* Header */}
      <div className="screen-header">
        <div className="header-content">
          <h1>Gestión de Productos</h1>
          <p>Administra todos los productos de la plataforma</p>
        </div>
        <div className="header-actions">
          <Button
            variant="secondary"
            icon="🔄"
            onClick={cargarProductos}
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
              label="Buscar productos"
              placeholder="Nombre, descripción o productor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              icon="🔍"
            />
          </div>
          
          <div className="filter-group">
            <label>Disponibilidad:</label>
            <select
              value={filtros.disponible === undefined ? '' : filtros.disponible.toString()}
              onChange={(e) => setFiltros(prev => ({ 
                ...prev, 
                disponible: e.target.value === '' ? undefined : e.target.value === 'true'
              }))}
            >
              <option value="">Todos</option>
              <option value="true">Disponibles</option>
              <option value="false">Agotados</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Rango de precio:</label>
            <div className="price-range">
              <Input
                placeholder="Precio mínimo"
                type="number"
                value={filtros.precio_min || ''}
                onChange={(e) => setFiltros(prev => ({ 
                  ...prev, 
                  precio_min: e.target.value ? Number(e.target.value) : undefined
                }))}
              />
              <span>-</span>
              <Input
                placeholder="Precio máximo"
                type="number"
                value={filtros.precio_max || ''}
                onChange={(e) => setFiltros(prev => ({ 
                  ...prev, 
                  precio_max: e.target.value ? Number(e.target.value) : undefined
                }))}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Ordenar por:</label>
            <select
              value={filtros.orden || ''}
              onChange={(e) => setFiltros(prev => ({ 
                ...prev, 
                orden: e.target.value as any || undefined
              }))}
            >
              <option value="">Sin orden</option>
              <option value="nombre_asc">Nombre A-Z</option>
              <option value="nombre_desc">Nombre Z-A</option>
              <option value="precio_asc">Precio menor</option>
              <option value="precio_desc">Precio mayor</option>
              <option value="stock_asc">Stock menor</option>
              <option value="stock_desc">Stock mayor</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de productos */}
      <Card 
        title={`Productos encontrados (${productosFiltrados.length})`}
        className="productos-list-card"
      >
        {loading ? (
          <Loading text="Cargando productos..." />
        ) : error ? (
          <div className="error-message">
            <p>❌ {error}</p>
            <Button variant="primary" onClick={cargarProductos}>
              Reintentar
            </Button>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛍️</div>
            <h3>No se encontraron productos</h3>
            <p>Intenta ajustar los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="productos-grid">
            {productosFiltrados.map((producto) => (
              <div key={producto.id_producto} className="producto-card">
                {/* Imagen del producto */}
                <div className="producto-image">
                  {producto.imagenUrl ? (
                    <img src={producto.imagenUrl} alt={producto.nombre} />
                  ) : (
                    <div className="no-image">
                      <span>🛍️</span>
                    </div>
                  )}
                  <div className="producto-badges">
                    {producto.stock > 0 ? (
                      <Badge variant="success" size="small">Disponible</Badge>
                    ) : (
                      <Badge variant="error" size="small">Agotado</Badge>
                    )}
                    {producto.calificacion_promedio && (
                      <Badge variant="info" size="small">
                        ⭐ {producto.calificacion_promedio}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Información del producto */}
                <div className="producto-info">
                  <h3 className="producto-nombre">{producto.nombre}</h3>
                  <p className="producto-descripcion">{producto.descripcion}</p>
                  
                  <div className="producto-details">
                    <div className="detail-item">
                      <span className="detail-label">Precio:</span>
                      <span className="detail-value">${producto.precio.toLocaleString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Stock:</span>
                      <span className={`detail-value ${producto.stock === 0 ? 'out-of-stock' : ''}`}>
                        {producto.stock} {producto.unidad_medida}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Stock mínimo:</span>
                      <span className="detail-value">{producto.stock_minimo}</span>
                    </div>
                  </div>

                  {/* Información del productor */}
                  <div className="productor-info">
                    <div className="productor-header">
                      <Avatar name={producto.nombre_productor} size="small" />
                      <div className="productor-details">
                        <div className="productor-nombre">{producto.nombre_productor}</div>
                        <div className="productor-contacto">
                          📧 {producto.email_productor}
                        </div>
                        <div className="productor-ubicacion">
                          📍 {producto.ciudad_origen}, {producto.departamento_origen}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  {producto.total_resenas && producto.total_resenas > 0 && (
                    <div className="producto-stats">
                      <div className="stat-item">
                        <span className="stat-icon">⭐</span>
                        <span className="stat-value">{producto.calificacion_promedio}</span>
                        <span className="stat-label">({producto.total_resenas} reseñas)</span>
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="producto-actions">
                    <Button
                      size="small"
                      variant="secondary"
                      icon="👁️"
                      onClick={() => {
                        // Aquí podrías abrir un modal con detalles completos
                        alert(`Detalles del producto: ${producto.nombre}`);
                      }}
                    >
                      Ver Detalles
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      icon="🗑️"
                      onClick={() => {
                        setProductoSeleccionado(producto);
                        setShowDeleteModal(true);
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Paginación */}
      {productosFiltrados.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Mostrando {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, productosFiltrados.length)} de {productosFiltrados.length} productos
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

      {/* Modal para eliminar producto */}
      {showDeleteModal && productoSeleccionado && (
        <DeleteProductModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setProductoSeleccionado(null);
          }}
          producto={productoSeleccionado}
          onConfirm={(motivo) => {
            handleEliminarProducto(productoSeleccionado.id_producto, motivo);
          }}
        />
      )}

      {/* Toast de notificaciones */}
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

// ===== MODAL PARA ELIMINAR PRODUCTO =====
interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoDetallado;
  onConfirm: (motivo: string) => void;
}

const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  onClose,
  producto,
  onConfirm
}) => {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!motivo.trim()) {
      alert('Por favor, proporciona un motivo para la eliminación');
      return;
    }

    setLoading(true);
    onConfirm(motivo);
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Producto"
      size="medium"
    >
      <div className="delete-product-modal">
        <div className="producto-preview">
          <div className="preview-image">
            {producto.imagenUrl ? (
              <img src={producto.imagenUrl} alt={producto.nombre} />
            ) : (
              <div className="no-image">🛍️</div>
            )}
          </div>
          <div className="preview-info">
            <h3>{producto.nombre}</h3>
            <p>Productor: {producto.nombre_productor}</p>
            <p>Precio: ${producto.precio.toLocaleString()}</p>
            <p>Stock: {producto.stock} unidades</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Motivo de eliminación:</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe el motivo por el cual este producto debe ser eliminado..."
              required
              rows={4}
            />
          </div>

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
              variant="danger"
              loading={loading}
              icon="🗑️"
            >
              Eliminar Producto
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ProductosScreen;




