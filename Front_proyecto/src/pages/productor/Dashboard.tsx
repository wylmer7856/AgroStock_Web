import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productosService, pedidosService, notificacionesService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { 
  BiPackage, BiReceipt, BiTrendingUp, BiBell, BiPlus, BiEdit, BiTrash, 
  BiDollar, BiCheckCircle, BiTime, BiShoppingBag, BiBarChartAlt2,
  BiCalendar, BiStore
} from 'react-icons/bi';

const ProductorDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);

  // Queries para estadísticas
  const { data: misProductos } = useQuery({
    queryKey: ['productos', 'productor', user?.id_usuario],
    queryFn: async () => {
      if (!user?.id_usuario) return [];
      const response = await productosService.obtenerProductosPorUsuario(user.id_usuario);
      return response.data || [];
    },
    enabled: !!user?.id_usuario,
  });

  const { data: pedidos } = useQuery({
    queryKey: ['pedidos', 'productor', user?.id_usuario],
    queryFn: async () => {
      if (!user?.id_usuario) return [];
      const response = await pedidosService.obtenerMisPedidos('productor', user.id_usuario);
      return response.data || [];
    },
    enabled: !!user?.id_usuario,
  });

  const { data: notificacionesNoLeidas } = useQuery({
    queryKey: ['notificaciones', 'contar'],
    queryFn: async () => {
      const response = await notificacionesService.contarNoLeidas();
      return response.data || 0;
    },
  });

  const productosActivos = (misProductos || []).filter((p: any) => p.disponible).length;
  const productosStockBajo = (misProductos || []).filter((p: any) => p.stock <= p.stock_minimo).length;
  const pedidosPendientes = (pedidos || []).filter((p: any) => 
    ['pendiente', 'confirmado'].includes(p.estado)
  ).length;
  const pedidosEnPreparacion = (pedidos || []).filter((p: any) => 
    p.estado === 'en_preparacion'
  ).length;
  const pedidosEnCamino = (pedidos || []).filter((p: any) => 
    p.estado === 'en_camino'
  ).length;
  const pedidosEntregados = (pedidos || []).filter((p: any) => 
    p.estado === 'entregado'
  ).length;
  const ventasTotales = (pedidos || []).filter((p: any) => p.estado === 'entregado')
    .reduce((sum: number, p: any) => sum + (p.total || 0), 0);
  const totalPedidos = (pedidos || []).length;
  
  // Calcular porcentaje de productos activos
  const porcentajeActivos = misProductos && misProductos.length > 0 
    ? Math.round((productosActivos / misProductos.length) * 100) 
    : 0;

  // Mutation para eliminar producto con actualización optimista
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
    onError: (error: any, _id, context) => {
      // Revertir en caso de error
      if (context?.previousProductos) {
        queryClient.setQueryData(['productos', 'productor', user?.id_usuario], context.previousProductos);
      }
      toast.error(error.message || 'Error al eliminar producto');
      setShowModal(true); // Reabrir modal si hay error
    },
  });

  const handleEliminar = (producto: any) => {
    setProductoSeleccionado(producto);
    setShowModal(true);
  };

  const confirmarEliminar = () => {
    if (productoSeleccionado) {
      eliminarMutation.mutate(productoSeleccionado.id_producto);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header con Bienvenida */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold mb-2" style={{ color: '#2c3e50' }}>
                <BiStore className="me-2" style={{ color: '#28a745' }} />
                Dashboard del Productor
              </h1>
              <p className="text-muted mb-0">
                Bienvenido, {user?.nombre || 'Productor'} • Gestiona tus productos y pedidos
              </p>
            </div>
            <div className="text-end">
              <div className="badge bg-success fs-6 px-3 py-2">
                <BiCheckCircle className="me-1" />
                Activo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Estadísticas Principales */}
      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-lg h-100" style={{ 
            background: 'linear-gradient(135deg, #2d5016 0%, #4a7c2a 100%)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(45, 80, 22, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
          }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-white-50 mb-2" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    MIS PRODUCTOS
                  </h6>
                  <h2 className="fw-bold mb-1">{misProductos?.length || 0}</h2>
                  <small className="text-white-50">
                    {productosActivos} activos • {porcentajeActivos}%
                  </small>
                </div>
                <div className="bg-white bg-opacity-20 rounded-circle p-3">
                  <BiPackage className="fs-1 text-white" />
                </div>
              </div>
              <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <div 
                  className="progress-bar bg-white" 
                  role="progressbar" 
                  style={{ width: `${porcentajeActivos}%` }}
                />
              </div>
            </div>
            <div className="card-footer bg-transparent border-0">
              <Link to="/productor/productos" className="btn btn-light btn-sm w-100 fw-bold">
                <BiShoppingBag className="me-1" />
                Gestionar Productos
              </Link>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-lg h-100" style={{ 
            background: 'linear-gradient(135deg, #8b6914 0%, #d4a853 100%)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(139, 105, 20, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
          }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-white-50 mb-2" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    PEDIDOS PENDIENTES
                  </h6>
                  <h2 className="fw-bold mb-1">{pedidosPendientes}</h2>
                  <small className="text-white-50">
                    {totalPedidos} total • {pedidosEnPreparacion} en preparación
                  </small>
                </div>
                <div className="bg-white bg-opacity-20 rounded-circle p-3">
                  <BiReceipt className="fs-1 text-white" />
                </div>
              </div>
              <div className="d-flex gap-2">
                <span className="badge bg-white bg-opacity-30 text-white px-2 py-1">
                  <BiTime className="me-1" />
                  {pedidosPendientes} pendientes
                </span>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0">
              <Link to="/productor/pedidos" className="btn btn-light btn-sm w-100 fw-bold">
                <BiReceipt className="me-1" />
                Ver Todos los Pedidos
              </Link>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-lg h-100" style={{ 
            background: 'linear-gradient(135deg, #1e5631 0%, #2d7a3f 100%)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(30, 86, 49, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
          }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-white-50 mb-2" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    VENTAS TOTALES
                  </h6>
                  <h2 className="fw-bold mb-1">${ventasTotales.toLocaleString()}</h2>
                  <small className="text-white-50">
                    {pedidosEntregados} pedidos entregados
                  </small>
                </div>
                <div className="bg-white bg-opacity-20 rounded-circle p-3">
                  <BiDollar className="fs-1 text-white" />
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <BiTrendingUp className="fs-4 text-white" />
                <span className="small text-white-50">Ingresos acumulados</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-lg h-100" style={{ 
            background: 'linear-gradient(135deg, #6b4423 0%, #8b6f47 100%)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(107, 68, 35, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
          }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-white-50 mb-2" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    NOTIFICACIONES
                  </h6>
                  <h2 className="fw-bold mb-1">{notificacionesNoLeidas || 0}</h2>
                  <small className="text-white-50">
                    Sin leer
                  </small>
                </div>
                <div className="bg-white bg-opacity-20 rounded-circle p-3 position-relative">
                  <BiBell className="fs-1 text-white" />
                  {notificacionesNoLeidas && notificacionesNoLeidas > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                      {notificacionesNoLeidas}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0">
              <Link to="/notificaciones" className="btn btn-light btn-sm w-100 fw-bold">
                <BiBell className="me-1" />
                Ver Notificaciones
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Secundarias */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #28a745' }}>
            <div className="card-body text-center">
              <BiCheckCircle className="fs-3 mb-2" style={{ color: '#28a745' }} />
              <h5 className="fw-bold mb-0" style={{ color: '#28a745' }}>{pedidosEntregados}</h5>
              <small className="text-muted">Entregados</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #8b6914' }}>
            <div className="card-body text-center">
              <BiTime className="fs-3 mb-2" style={{ color: '#8b6914' }} />
              <h5 className="fw-bold mb-0" style={{ color: '#8b6914' }}>{pedidosEnPreparacion}</h5>
              <small className="text-muted">En Preparación</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #2d7a3f' }}>
            <div className="card-body text-center">
              <BiPackage className="fs-3 mb-2" style={{ color: '#2d7a3f' }} />
              <h5 className="fw-bold mb-0" style={{ color: '#2d7a3f' }}>{pedidosEnCamino}</h5>
              <small className="text-muted">En Camino</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #d4a853' }}>
            <div className="card-body text-center">
              <BiBarChartAlt2 className="fs-3 mb-2" style={{ color: '#d4a853' }} />
              <h5 className="fw-bold mb-0" style={{ color: '#d4a853' }}>{productosStockBajo}</h5>
              <small className="text-muted">Stock Bajo</small>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas Mejoradas */}
      {productosStockBajo > 0 && (
        <div className="alert border-0 shadow-sm mb-4 d-flex align-items-center justify-content-between" style={{ 
          background: 'linear-gradient(135deg, #fff8e1 0%, #ffe082 100%)',
          borderRadius: '12px',
          borderLeft: '4px solid #d4a853'
        }}>
          <div className="d-flex align-items-center">
            <div className="rounded-circle p-2 me-3" style={{ backgroundColor: '#d4a853' }}>
              <BiPackage className="fs-4 text-white" />
            </div>
            <div>
              <strong className="d-block" style={{ color: '#6b4423' }}>⚠️ Alerta de Stock Bajo</strong>
              <span className="small" style={{ color: '#8b6914' }}>Tienes {productosStockBajo} producto(s) que requieren atención inmediata.</span>
            </div>
          </div>
          <Link to="/productor/productos" className="btn btn-sm fw-bold" style={{ 
            backgroundColor: '#8b6914', 
            borderColor: '#8b6914',
            color: 'white'
          }}>
            Revisar Ahora
          </Link>
        </div>
      )}

      <div className="row g-4">
        {/* Mis Productos */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3" style={{ borderRadius: '12px 12px 0 0' }}>
              <h5 className="mb-0 fw-bold d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                  <BiPackage className="text-primary" />
                </div>
                Mis Productos
                {misProductos && misProductos.length > 0 && (
                  <span className="badge bg-primary ms-2">{misProductos.length}</span>
                )}
              </h5>
              <Link 
                to="/productor/productos/nuevo?from=dashboard" 
                className="btn btn-primary btn-sm fw-bold"
                style={{ borderRadius: '8px' }}
              >
                <BiPlus className="me-1" />
                Nuevo Producto
              </Link>
            </div>
            <div className="card-body">
              {misProductos && misProductos.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ borderTop: 'none' }}>Producto</th>
                        <th style={{ borderTop: 'none' }}>Precio</th>
                        <th style={{ borderTop: 'none' }}>Stock</th>
                        <th style={{ borderTop: 'none' }}>Estado</th>
                        <th style={{ borderTop: 'none', width: '120px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(misProductos || []).slice(0, 5).map((producto: any) => {
                        // Construir URL de imagen correctamente
                        const imagenUrl = producto.imagenUrl || 
                          (producto.imagen_principal 
                            ? (producto.imagen_principal.startsWith('http') 
                                ? producto.imagen_principal 
                                : `http://localhost:8000/${producto.imagen_principal.replace(/^\/+/, '')}`)
                            : null);
                        
                        const stockBajo = producto.stock <= producto.stock_minimo;
                        
                        return (
                          <tr key={producto.id_producto} style={{ transition: 'background-color 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td>
                              <div className="d-flex align-items-center">
                                {imagenUrl ? (
                                  <img
                                    src={imagenUrl}
                                    className="rounded me-3 shadow-sm"
                                    alt={producto.nombre}
                                    style={{ 
                                      width: '50px', 
                                      height: '50px', 
                                      objectFit: 'cover',
                                      border: '2px solid #e9ecef'
                                    }}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className="rounded me-3 bg-light d-flex align-items-center justify-content-center shadow-sm"
                                    style={{ 
                                      width: '50px', 
                                      height: '50px',
                                      border: '2px solid #e9ecef'
                                    }}
                                  >
                                    <BiPackage className="text-muted fs-5" />
                                  </div>
                                )}
                                <div>
                                  <div className="fw-bold mb-1" style={{ color: '#2c3e50' }}>
                                    {producto.nombre}
                                  </div>
                                  <small className="text-muted d-flex align-items-center">
                                    <BiBarChartAlt2 className="me-1" style={{ fontSize: '0.7rem' }} />
                                    {producto.categoria_nombre || producto.categoria || 'Sin categoría'}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="fw-bold text-success fs-6">
                                ${producto.precio?.toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <span className={`badge ${stockBajo ? 'bg-warning text-dark' : 'bg-success'} px-3 py-2`}>
                                  {producto.stock}
                                </span>
                                {stockBajo && (
                                  <small className="text-warning fw-bold">⚠️ Bajo</small>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${producto.disponible ? 'bg-success' : 'bg-danger'} px-3 py-2`}>
                                {producto.disponible ? '✓ Disponible' : '✗ No disponible'}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Link
                                  to={`/productor/productos/${producto.id_producto}/editar?from=dashboard`}
                                  className="btn btn-sm btn-outline-primary"
                                  title="Editar"
                                  style={{ borderRadius: '6px' }}
                                >
                                  <BiEdit />
                                </Link>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleEliminar(producto)}
                                  title="Eliminar"
                                  style={{ borderRadius: '6px' }}
                                >
                                  <BiTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {misProductos.length > 5 && (
                    <div className="card-footer bg-transparent border-0 text-center py-3">
                      <Link to="/productor/productos" className="btn btn-outline-primary btn-sm">
                        Ver todos los productos ({misProductos.length})
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                    <BiPackage className="display-4 text-muted" />
                  </div>
                  <h5 className="fw-bold mb-2">No tienes productos aún</h5>
                  <p className="text-muted mb-4">Comienza agregando tu primer producto</p>
                  <Link 
                    to="/productor/productos/nuevo?from=dashboard" 
                    className="btn btn-primary btn-lg fw-bold"
                    style={{ borderRadius: '10px' }}
                  >
                    <BiPlus className="me-2" />
                    Crear Primer Producto
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pedidos Recientes */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-lg h-100">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center py-3" style={{ borderRadius: '12px 12px 0 0' }}>
              <h5 className="mb-0 fw-bold d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-2">
                  <BiReceipt className="text-warning" />
                </div>
                Pedidos Recientes
                {pedidos && pedidos.length > 0 && (
                  <span className="badge bg-warning ms-2">{pedidos.length}</span>
                )}
              </h5>
              <Link to="/productor/pedidos" className="btn btn-sm btn-outline-warning fw-bold">
                Ver Todos
              </Link>
            </div>
            <div className="card-body p-0">
              {pedidos && pedidos.length > 0 ? (
                <div className="list-group list-group-flush">
                  {(pedidos || []).slice(0, 5).map((pedido: any, index: number) => {
                    const getEstadoColor = (estado: string) => {
                      switch(estado) {
                        case 'entregado': return 'success';
                        case 'cancelado': return 'danger';
                        case 'en_preparacion': return 'info';
                        case 'en_camino': return 'primary';
                        default: return 'warning';
                      }
                    };
                    
                    const getEstadoIcon = (estado: string) => {
                      switch(estado) {
                        case 'entregado': return <BiCheckCircle />;
                        case 'cancelado': return <BiTrash />;
                        case 'en_preparacion': return <BiTime />;
                        case 'en_camino': return <BiPackage />;
                        default: return <BiTime />;
                      }
                    };
                    
                    return (
                      <Link
                        key={pedido.id_pedido}
                        to="/productor/pedidos"
                        className="list-group-item list-group-item-action border-0 px-3 py-3"
                        style={{ 
                          transition: 'all 0.2s',
                          borderBottom: index < Math.min(pedidos.length, 5) - 1 ? '1px solid #e9ecef' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                          e.currentTarget.style.transform = 'translateX(5px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <h6 className="mb-0 fw-bold me-2" style={{ color: '#2c3e50' }}>
                                Pedido #{pedido.id_pedido}
                              </h6>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                              <span className="fw-bold text-success fs-6">
                                ${pedido.total?.toLocaleString()}
                              </span>
                              <small className="text-muted">
                                <BiCalendar className="me-1" />
                                {pedido.fecha_pedido 
                                  ? new Date(pedido.fecha_pedido).toLocaleDateString('es-ES', { 
                                      day: 'numeric', 
                                      month: 'short' 
                                    })
                                  : 'Reciente'}
                              </small>
                            </div>
                          </div>
                          <span className={`badge bg-${getEstadoColor(pedido.estado)} px-3 py-2 ms-2`}>
                            {getEstadoIcon(pedido.estado)}
                            <span className="ms-1 d-none d-sm-inline">
                              {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                            </span>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                    <BiReceipt className="display-4 text-muted" />
                  </div>
                  <h6 className="fw-bold mb-2">No tienes pedidos aún</h6>
                  <p className="text-muted small mb-0">Los pedidos aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
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

export default ProductorDashboard;






