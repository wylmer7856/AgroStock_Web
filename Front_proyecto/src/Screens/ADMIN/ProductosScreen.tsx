// 🛍️ PANTALLA DE GESTIÓN DE PRODUCTOS - ADMIN

import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../hooks';
import adminService from '../../services/admin';
import imagenesService from '../../services/imagenes';
import { Card, Button, Input, Modal, Loading, Badge } from '../../components/ReusableComponents';
import type { ProductoDetallado, FiltrosProductos } from '../../types';
import Swal from 'sweetalert2';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import './AdminScreens.css';

interface ProductosScreenProps {
  onNavigate: (view: string) => void;
}

// Funciones helper
const formatearMoneda = (cantidad: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(cantidad);
};

const formatearFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return 'N/A';
  try {
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Fecha inválida';
  }
};

const construirUrlImagen = (producto: ProductoDetallado): string | null => {
  if (producto.imagenUrl) {
    return producto.imagenUrl.startsWith('http') 
      ? producto.imagenUrl 
      : imagenesService.construirUrlImagen(producto.imagenUrl);
  }
  if (producto.imagen_principal) {
    return imagenesService.construirUrlImagen(producto.imagen_principal);
  }
  return null;
};

export const ProductosScreen: React.FC<ProductosScreenProps> = ({ onNavigate }) => {
  // ===== ESTADOS =====
  const [productos, setProductos] = useState<ProductoDetallado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState<FiltrosProductos>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoDetallado | null>(null);

  // ===== DEBOUNCE PARA BÚSQUEDA =====
  const busquedaDebounced = useDebounce(busqueda, 300);

  // ===== EFECTOS =====
  useEffect(() => {
    cargarProductos();
    
    // Actualización automática cada 30 segundos
    const interval = setInterval(() => {
      cargarProductos();
    }, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      const response = await adminService.getProductos(filtrosCompletos);
      
      if (response.success && response.data) {
        setProductos(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.message || 'Error cargando productos');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      console.error('[ProductosScreen] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarProducto = async (id: number, motivo: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el producto y todos sus datos relacionados. Esta acción no se puede deshacer.',
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
      text: 'Por favor espera mientras se elimina el producto',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      console.log(`[handleEliminar] Eliminando producto ${id}`);
      
      const response = await adminService.eliminarProductoInapropiado(id, motivo);
      
      console.log(`[handleEliminar] Respuesta del servidor:`, response);
      
      if (response.success) {
        await cargarProductos();
        
        Swal.fire({
          icon: 'success',
          title: '¡Producto eliminado!',
          text: 'El producto y todos sus datos relacionados han sido eliminados correctamente.',
          confirmButtonColor: '#059669'
        });
        
        setShowDeleteModal(false);
        setProductoSeleccionado(null);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Error eliminando producto',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error eliminando producto:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error eliminando producto: ${errorMsg}`,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  // ===== FILTRADO Y ESTADÍSTICAS =====
  const productosFiltrados = useMemo(() => {
    return productos.filter(producto => {
      if (busquedaDebounced) {
        const busquedaLower = busquedaDebounced.toLowerCase();
        return (
          producto.nombre.toLowerCase().includes(busquedaLower) ||
          producto.descripcion?.toLowerCase().includes(busquedaLower) ||
          producto.nombre_productor?.toLowerCase().includes(busquedaLower)
        );
      }
      return true;
    });
  }, [productos, busquedaDebounced]);

  const estadisticas = useMemo(() => {
    const total = productosFiltrados.length;
    const disponibles = productosFiltrados.filter(p => p.stock > 0).length;
    const agotados = total - disponibles;
    const tasaDisponibilidad = total > 0 ? ((disponibles / total) * 100).toFixed(1) : '0';

    // Productos por categoría
    const porCategoria: Record<string, number> = {};
    productosFiltrados.forEach(p => {
      const categoria = p.nombre_categoria || 'Sin categoría';
      porCategoria[categoria] = (porCategoria[categoria] || 0) + 1;
    });

    const datosBarra = Object.entries(porCategoria).map(([nombre, cantidad]) => ({
      nombre,
      cantidad
    }));

    // Distribución por disponibilidad
    const datosDisponibilidad = [
      { name: 'Disponibles', value: disponibles, color: '#059669' },
      { name: 'Agotados', value: agotados, color: '#dc3545' }
    ];

    // Top 5 productos por precio
    const topPrecios = [...productosFiltrados]
      .sort((a, b) => b.precio - a.precio)
      .slice(0, 5)
      .map(p => ({
        nombre: p.nombre.length > 20 ? p.nombre.substring(0, 20) + '...' : p.nombre,
        precio: p.precio
      }));

    return {
      total,
      disponibles,
      agotados,
      tasaDisponibilidad,
      datosBarra,
      datosDisponibilidad,
      topPrecios
    };
  }, [productosFiltrados]);

  const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

  return (
    <div className="productos-screen">
      {/* Header */}
      <div className="screen-header">
        <div className="header-content">
          <h1>
            <i className="bi bi-box-seam me-2"></i>
            Gestión de Productos
          </h1>
          <p>Administra todos los productos de la plataforma</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="productos-filters-card">
        <div className="productos-filters-container">
          <div className="productos-search-wrapper">
            <div className="search-icon-wrapper">
              <i className="bi bi-search"></i>
            </div>
            <input
              type="text"
              className="productos-search-input"
              placeholder="Buscar por nombre, descripción o productor..."
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
          
          <div className="productos-filters-row">
            <div className="productos-filter-item">
              <label className="productos-filter-label">
                <i className="bi bi-check-circle me-2"></i>
                Disponibilidad:
              </label>
            <select
                className="productos-filter-select"
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

            <div className="productos-filter-item">
              <label className="productos-filter-label">
                <i className="bi bi-currency-dollar me-2"></i>
                Precio mínimo:
              </label>
              <input
                type="number"
                className="productos-filter-select"
                placeholder="Precio mínimo"
                value={filtros.precio_min || ''}
                onChange={(e) => setFiltros(prev => ({ 
                  ...prev, 
                  precio_min: e.target.value ? Number(e.target.value) : undefined
                }))}
              />
            </div>

            <div className="productos-filter-item">
              <label className="productos-filter-label">
                <i className="bi bi-currency-dollar me-2"></i>
                Precio máximo:
              </label>
              <input
                type="number"
                className="productos-filter-select"
                placeholder="Precio máximo"
                value={filtros.precio_max || ''}
                onChange={(e) => setFiltros(prev => ({ 
                  ...prev, 
                  precio_max: e.target.value ? Number(e.target.value) : undefined
                }))}
              />
          </div>

            <div className="productos-filter-item">
              <label className="productos-filter-label">
                <i className="bi bi-sort-down me-2"></i>
                Ordenar por:
              </label>
            <select
                className="productos-filter-select"
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
        </div>
      </Card>

      {/* Tabla de productos */}
      <Card className="productos-table-card">
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
          <>
            <div className="productos-table-wrapper">
              <table className="table productos-table">
                <thead>
                  <tr>
                    <th className="th-imagen">IMAGEN</th>
                    <th className="th-nombre">NOMBRE</th>
                    <th className="th-precio">PRECIO</th>
                    <th className="th-stock">STOCK</th>
                    <th className="th-categoria">CATEGORÍA</th>
                    <th className="th-productor">PRODUCTOR</th>
                    <th className="th-ubicacion">UBICACIÓN</th>
                    <th className="th-estado">ESTADO</th>
                    <th className="th-acciones">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((producto) => {
                    const imagenUrl = construirUrlImagen(producto);
                    return (
                      <tr key={producto.id_producto}>
                        <td className="td-imagen">
                          <div className="producto-imagen-cell">
                            {imagenUrl ? (
                              <img 
                                src={imagenUrl} 
                                alt={producto.nombre}
                                className="producto-imagen-img"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60x60?text=Sin+Imagen';
                                }}
                              />
                            ) : (
                              <div className="producto-imagen-placeholder">
                                <i className="bi bi-image"></i>
                    </div>
                    )}
                  </div>
                        </td>
                        <td className="td-nombre">
                          <div className="producto-nombre-cell">
                            <span className="producto-nombre-text">{producto.nombre}</span>
                            <span className="producto-id-text">ID: {producto.id_producto}</span>
                </div>
                        </td>
                        <td className="td-precio">
                          <span className="producto-precio-text">{formatearMoneda(producto.precio)}</span>
                        </td>
                        <td className="td-stock">
                          <span className={`producto-stock-text ${producto.stock === 0 ? 'stock-agotado' : ''}`}>
                        {producto.stock} {producto.unidad_medida}
                      </span>
                        </td>
                        <td className="td-categoria">
                          <span className="producto-categoria-text">
                            {producto.nombre_categoria || 'Sin categoría'}
                          </span>
                        </td>
                        <td className="td-productor">
                          <div className="producto-productor-cell">
                            <span className="producto-productor-text">{producto.nombre_productor || 'N/A'}</span>
                            {producto.email_productor && (
                              <span className="producto-email-text">{producto.email_productor}</span>
                            )}
                    </div>
                        </td>
                        <td className="td-ubicacion">
                          <span className="producto-ubicacion-text">
                            {producto.ciudad_origen ? `${producto.ciudad_origen}, ${producto.departamento_origen}` : 'N/A'}
                          </span>
                        </td>
                        <td className="td-estado">
                          {producto.stock > 0 ? (
                            <span className="estado-badge estado-disponible">
                              <i className="bi bi-check-circle me-1"></i>
                              Disponible
                            </span>
                          ) : (
                            <span className="estado-badge estado-agotado">
                              <i className="bi bi-x-circle me-1"></i>
                              Agotado
                            </span>
                          )}
                        </td>
                        <td className="td-acciones">
                          <div className="productos-acciones-buttons">
                            <button
                              className="btn btn-accion-view"
                      onClick={() => {
                        setProductoSeleccionado(producto);
                        setShowDetailsModal(true);
                      }}
                              title="Ver detalles"
                            >
                              <i className="bi bi-eye-fill"></i>
                            </button>
                            <button
                              className="btn btn-accion-delete"
                      onClick={() => {
                        setProductoSeleccionado(producto);
                        setShowDeleteModal(true);
                      }}
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
              <span>Mostrando 1 - {productosFiltrados.length} de {productosFiltrados.length} productos</span>
              </div>
          </>
        )}
      </Card>

      {/* Gráficas estadísticas */}
      {productosFiltrados.length > 0 && (
        <div className="productos-graficas-container">
          <div className="estadisticas-resumen estadisticas-resumen-full">
            <div className="resumen-stats">
              <div className="stat-item">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
                  <i className="bi bi-box-seam"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{estadisticas.total}</div>
                  <div className="stat-label">Total Productos</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
                  <i className="bi bi-check-circle"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{estadisticas.disponibles}</div>
                  <div className="stat-label">Disponibles</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #e63946 100%)' }}>
                  <i className="bi bi-x-circle"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{estadisticas.agotados}</div>
                  <div className="stat-label">Agotados</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }}>
                  <i className="bi bi-percent"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{estadisticas.tasaDisponibilidad}%</div>
                  <div className="stat-label">Tasa de Disponibilidad</div>
                </div>
              </div>
            </div>
          </div>

          <div className="graficas-grid">
            <div className="grafica-card">
              <div className="grafica-header">
                <h3><i className="bi bi-bar-chart me-2"></i>Productos por Categoría</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={estadisticas.datosBarra}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cantidad" fill="#059669" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grafica-card">
              <div className="grafica-header">
                <h3><i className="bi bi-pie-chart me-2"></i>Distribución por Disponibilidad</h3>
          </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={estadisticas.datosDisponibilidad}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadisticas.datosDisponibilidad.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grafica-card">
              <div className="grafica-header">
                <h3><i className="bi bi-trophy me-2"></i>Top 5 Productos por Precio</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={estadisticas.topPrecios} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nombre" type="category" width={150} />
                  <Tooltip formatter={(value: number) => formatearMoneda(value)} />
                  <Legend />
                  <Bar dataKey="precio" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles del producto */}
      {showDetailsModal && productoSeleccionado && (
        <ProductDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setProductoSeleccionado(null);
          }}
          producto={productoSeleccionado}
        />
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
          onConfirm={async (motivo) => {
            await handleEliminarProducto(productoSeleccionado.id_producto, motivo);
          }}
        />
      )}
    </div>
  );
};

// ===== MODAL PARA VER DETALLES DEL PRODUCTO =====
interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoDetallado;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  producto
}) => {
  const imagenUrl = construirUrlImagen(producto);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span>
          <i className="bi bi-box-seam me-2"></i>
          Detalles del Producto: {producto.nombre}
        </span>
      }
      size="large"
    >
      <div className="product-details-modal-content">
        {/* Imagen del producto */}
        <div className="product-details-image-section">
          {imagenUrl ? (
            <img 
              src={imagenUrl} 
              alt={producto.nombre}
              className="product-details-image-large"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Sin+Imagen';
              }}
            />
          ) : (
            <div className="no-image-large">
              <i className="bi bi-image display-1"></i>
              <p>Sin imagen</p>
            </div>
          )}
        </div>

        {/* Información principal */}
        <div className="product-details-section">
          <h3 className="product-details-title">
            <i className="bi bi-info-circle me-2"></i>
            Información General
          </h3>
          <div className="product-details-grid">
            <div className="detail-row">
              <span className="detail-label">Nombre:</span>
              <span className="detail-value">{producto.nombre}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Descripción:</span>
              <span className="detail-value">{producto.descripcion || 'Sin descripción'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Categoría:</span>
              <span className="detail-value">{producto.nombre_categoria || 'Sin categoría'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Precio:</span>
              <span className="detail-value price">{formatearMoneda(producto.precio)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Stock disponible:</span>
              <span className={`detail-value ${producto.stock === 0 ? 'out-of-stock' : 'in-stock'}`}>
                {producto.stock} {producto.unidad_medida}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Stock mínimo:</span>
              <span className="detail-value">{producto.stock_minimo} {producto.unidad_medida}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Unidad de medida:</span>
              <span className="detail-value">{producto.unidad_medida}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Disponible:</span>
              <span className="detail-value">
                <Badge variant={producto.stock > 0 ? 'success' : 'error'}>
                  {producto.stock > 0 ? 'Disponible' : 'Agotado'}
                </Badge>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Fecha de creación:</span>
              <span className="detail-value">{formatearFecha(producto.fecha_creacion)}</span>
            </div>
          </div>
        </div>

        {/* Información del productor */}
        <div className="product-details-section">
          <h3 className="product-details-title">
            <i className="bi bi-person me-2"></i>
            Información del Productor
          </h3>
          <div className="product-details-grid">
            <div className="detail-row">
              <span className="detail-label">Nombre:</span>
              <span className="detail-value">{producto.nombre_productor || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{producto.email_productor || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Teléfono:</span>
              <span className="detail-value">{producto.telefono_productor || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Ubicación:</span>
              <span className="detail-value">
                {producto.ciudad_origen ? `${producto.ciudad_origen}, ${producto.departamento_origen}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {(producto.total_resenas && producto.total_resenas > 0) && (
          <div className="product-details-section">
            <h3 className="product-details-title">
              <i className="bi bi-star me-2"></i>
              Calificaciones
            </h3>
            <div className="product-details-grid">
              <div className="detail-row">
                <span className="detail-label">Calificación promedio:</span>
                <span className="detail-value">
                  ⭐ {producto.calificacion_promedio?.toFixed(1) || '0.0'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total de reseñas:</span>
                <span className="detail-value">{producto.total_resenas}</span>
              </div>
            </div>
          </div>
        )}

        {/* Botón de cerrar */}
        <div className="product-details-actions">
          <Button variant="primary" onClick={onClose}>
            <i className="bi bi-x-circle me-2"></i>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
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
  const imagenUrl = construirUrlImagen(producto);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!motivo.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Motivo requerido',
        text: 'Por favor, proporciona un motivo para la eliminación',
        confirmButtonColor: '#059669'
      });
      return;
    }

    setLoading(true);
    try {
      await onConfirm(motivo);
    } catch (error) {
      console.error('Error en confirmación de eliminación:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span>
          <i className="bi bi-trash me-2"></i>
          Eliminar Producto
        </span>
      }
      size="medium"
    >
      <div className="delete-product-modal">
        <div className="producto-preview">
          <div className="preview-image">
            {imagenUrl ? (
              <img 
                src={imagenUrl} 
                alt={producto.nombre}
                className="preview-image-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x150?text=Sin+Imagen';
                }}
              />
            ) : (
              <div className="no-image">
                <i className="bi bi-image"></i>
              </div>
            )}
          </div>
          <div className="preview-info">
            <h3>{producto.nombre}</h3>
            <p><strong>Productor:</strong> {producto.nombre_productor || 'N/A'}</p>
            <p><strong>Precio:</strong> {formatearMoneda(producto.precio)}</p>
            <p><strong>Stock:</strong> {producto.stock} {producto.unidad_medida}</p>
            <p><strong>ID:</strong> {producto.id_producto}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Motivo de eliminación:
            </label>
            <textarea
              className="form-control"
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
              <i className="bi bi-x-circle me-2"></i>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={loading}
            >
              <i className="bi bi-trash-fill me-2"></i>
              Eliminar Producto
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ProductosScreen;
