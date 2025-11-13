import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productosService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { BiPlus, BiEdit, BiTrash, BiPackage, BiImage, BiGridAlt, BiListUl, BiSearch } from 'react-icons/bi';
import type { Producto } from '../../types';

const ProductorProductosPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [vista, setVista] = useState<'grid' | 'table'>('grid');
  const [busqueda, setBusqueda] = useState('');

  // Query para productos del productor
  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos', 'productor', user?.id_usuario],
    queryFn: async () => {
      if (!user?.id_usuario) return [];
      const response = await productosService.obtenerProductosPorUsuario(user.id_usuario);
      return response.data || [];
    },
    enabled: !!user?.id_usuario,
  });

  // Mutation para eliminar con actualización optimista
  const eliminarMutation = useMutation({
    mutationFn: async (id: number) => {
      return await productosService.eliminarProducto(id);
    },
    onMutate: async (id) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: ['productos', 'productor', user?.id_usuario] });
      
      // Snapshot del valor anterior
      const previousProductos = queryClient.getQueryData(['productos', 'productor', user?.id_usuario]);
      
      // Actualización optimista: remover el producto inmediatamente
      queryClient.setQueryData(['productos', 'productor', user?.id_usuario], (old: any) => {
        return (old || []).filter((p: any) => p.id_producto !== id);
      });
      
      // Cerrar modal inmediatamente
      setShowModal(false);
      
      return { previousProductos };
    },
    onSuccess: () => {
      // Invalidar para asegurar sincronización con el servidor
      queryClient.invalidateQueries({ queryKey: ['productos', 'productor'] });
      toast.success('✅ Producto eliminado correctamente');
    },
    onError: (error: any, id, context) => {
      // Revertir en caso de error
      if (context?.previousProductos) {
        queryClient.setQueryData(['productos', 'productor', user?.id_usuario], context.previousProductos);
      }
      toast.error(error.message || 'Error al eliminar producto');
      setShowModal(true); // Reabrir modal si hay error
    },
  });

  const handleEliminar = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setShowModal(true);
  };

  const confirmarEliminar = () => {
    if (productoSeleccionado) {
      eliminarMutation.mutate(productoSeleccionado.id_producto);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando productos...</span>
        </div>
      </div>
    );
  }

  const productosList = (productos || []) as Producto[];
  
  // Filtrar productos por búsqueda
  const productosFiltrados = productosList.filter(producto =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">
          <BiPackage className="me-2" />
          Gestión de Productos
        </h2>
        <div className="d-flex gap-2">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-outline-secondary ${vista === 'grid' ? 'active' : ''}`}
              onClick={() => setVista('grid')}
              title="Vista de cuadrícula"
            >
              <BiGridAlt />
            </button>
            <button
              type="button"
              className={`btn btn-outline-secondary ${vista === 'table' ? 'active' : ''}`}
              onClick={() => setVista('table')}
              title="Vista de tabla"
            >
              <BiListUl />
            </button>
          </div>
          <Link to="/productor/productos/nuevo" className="btn btn-primary">
            <BiPlus className="me-2" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Barra de búsqueda */}
      {productosList.length > 0 && (
        <div className="mb-4">
          <div className="input-group" style={{ maxWidth: '400px' }}>
            <span className="input-group-text">
              <BiSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Resumen */}
      {productosList.length > 0 && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-0">Total Productos</h6>
                <h3 className="fw-bold mb-0">{productosList.length}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-0">Disponibles</h6>
                <h3 className="fw-bold text-success mb-0">
                  {productosList.filter(p => p.disponible).length}
                </h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-0">Stock Bajo</h6>
                <h3 className="fw-bold text-warning mb-0">
                  {productosList.filter(p => p.stock <= p.stock_minimo).length}
                </h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-0">No Disponibles</h6>
                <h3 className="fw-bold text-danger mb-0">
                  {productosList.filter(p => !p.disponible).length}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {productosList.length === 0 ? (
        <div className="text-center py-5">
          <BiPackage className="display-1 text-muted mb-3" />
          <h3 className="text-muted">No tienes productos aún</h3>
          <p className="text-muted mb-4">Comienza agregando tu primer producto</p>
          <Link to="/productor/productos/nuevo" className="btn btn-primary btn-lg">
            <BiPlus className="me-2" />
            Crear Primer Producto
          </Link>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-5">
          <BiSearch className="display-1 text-muted mb-3" />
          <h3 className="text-muted">No se encontraron productos</h3>
          <p className="text-muted mb-4">Intenta con otro término de búsqueda</p>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => setBusqueda('')}
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : vista === 'table' ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '80px' }}>Imagen</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th style={{ width: '150px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((producto) => (
                    <tr key={producto.id_producto}>
                      <td>
                        {producto.imagen_principal || producto.imagenUrl ? (
                          <img
                            src={producto.imagenUrl || producto.imagen_principal}
                            alt={producto.nombre}
                            className="rounded"
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                            <BiImage className="text-muted" />
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="fw-bold">{producto.nombre}</div>
                        {producto.stock <= producto.stock_minimo && (
                          <small className="text-warning">⚠️ Stock bajo</small>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {producto.descripcion 
                            ? (producto.descripcion.length > 50 
                                ? `${producto.descripcion.substring(0, 50)}...` 
                                : producto.descripcion)
                            : 'Sin descripción'}
                        </small>
                      </td>
                      <td>
                        <span className="fw-bold text-primary">
                          ${producto.precio.toLocaleString()}
                        </span>
                        <small className="text-muted d-block">/{producto.unidad_medida}</small>
                      </td>
                      <td>
                        <span className={`badge ${producto.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
                          {producto.stock}
                        </span>
                        <small className="text-muted d-block">Min: {producto.stock_minimo}</small>
                      </td>
                      <td>
                        <span className={`badge ${producto.disponible ? 'bg-success' : 'bg-danger'}`}>
                          {producto.disponible ? 'Disponible' : 'No disponible'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Link
                            to={`/productor/productos/${producto.id_producto}/editar`}
                            className="btn btn-sm btn-outline-primary"
                            title="Editar"
                          >
                            <BiEdit />
                          </Link>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleEliminar(producto)}
                            title="Eliminar"
                          >
                            <BiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {productosFiltrados.map((producto) => (
            <div key={producto.id_producto} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="position-relative">
                  {producto.imagen_principal || producto.imagenUrl ? (
                    <img
                      src={producto.imagenUrl || producto.imagen_principal}
                      className="card-img-top"
                      alt={producto.nombre}
                      style={{ height: '250px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: '250px' }}>
                      <BiImage className="display-4 text-muted" />
                    </div>
                  )}
                  <div className="position-absolute top-0 end-0 m-2">
                    <span className={`badge ${producto.disponible ? 'bg-success' : 'bg-danger'}`}>
                      {producto.disponible ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                  {producto.stock <= producto.stock_minimo && (
                    <div className="position-absolute top-0 start-0 m-2">
                      <span className="badge bg-warning">Stock Bajo</span>
                    </div>
                  )}
                </div>

                <div className="card-body d-flex flex-column">
                  <h5 className="card-title fw-bold mb-2">{producto.nombre}</h5>
                  {producto.descripcion && (
                    <p className="card-text text-muted small mb-3">
                      {producto.descripcion.length > 100
                        ? `${producto.descripcion.substring(0, 100)}...`
                        : producto.descripcion}
                    </p>
                  )}

                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <span className="h5 fw-bold text-primary mb-0">
                          ${producto.precio.toLocaleString()}
                        </span>
                        <small className="text-muted d-block">
                          / {producto.unidad_medida}
                        </small>
                      </div>
                      <div className="text-end">
                        <small className="text-muted d-block">Stock:</small>
                        <span className={`badge ${producto.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
                          {producto.stock}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <Link
                        to={`/productor/productos/${producto.id_producto}/editar`}
                        className="btn btn-outline-primary btn-sm flex-fill"
                      >
                        <BiEdit className="me-1" />
                        Editar
                      </Link>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleEliminar(producto)}
                      >
                        <BiTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmación */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar Eliminación</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                <p>
                  ¿Estás seguro de que deseas eliminar el producto{' '}
                  <strong>{productoSeleccionado?.nombre}</strong>?
                </p>
                <p className="text-muted small mb-0">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmarEliminar}
                  disabled={eliminarMutation.isPending}
                >
                  {eliminarMutation.isPending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductorProductosPage;






