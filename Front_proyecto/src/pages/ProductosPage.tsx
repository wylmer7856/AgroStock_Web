import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productosService, categoriasService, carritoService, listaDeseosService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { BiSearch, BiFilter, BiCart, BiPackage, BiX, BiUser } from 'react-icons/bi';
import type { Producto, Categoria } from '../types';
import './ProductosPage.css';

// Componentes personalizados para los iconos de corazón
const HeartOutline = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="#dc3545" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ display: 'block' }}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const HeartFilled = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="#dc3545" 
    stroke="none"
    style={{ display: 'block' }}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const ProductosPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000 });
  const [sortBy, setSortBy] = useState<'nombre' | 'precio_asc' | 'precio_desc' | 'stock'>('nombre');

  // Leer parámetro de categoría de la URL
  useEffect(() => {
    try {
      const categoriaParam = searchParams.get('categoria');
      if (categoriaParam) {
        const categoriaId = parseInt(categoriaParam, 10);
        if (!isNaN(categoriaId) && categoriaId > 0) {
          setSelectedCategory(categoriaId);
        } else {
          setSelectedCategory(null);
        }
      } else {
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Error leyendo parámetro de categoría:', error);
      setSelectedCategory(null);
    }
  }, [searchParams]);

  // Query para productos
  const { data: productosData, isLoading: productosLoading } = useQuery({
    queryKey: ['productos', searchTerm, selectedCategory, priceRange],
    queryFn: async () => {
      const filtros: {
        nombre?: string;
        id_categoria?: number;
        precio_min?: number;
        precio_max?: number;
      } = {};
      
      if (searchTerm && searchTerm.trim() !== '') {
        filtros.nombre = searchTerm.trim();
      }
      
      if (selectedCategory !== null && selectedCategory !== undefined) {
        filtros.id_categoria = selectedCategory;
      }
      
      if (priceRange.min > 0) {
        filtros.precio_min = priceRange.min;
      }
      
      if (priceRange.max < 100000) {
        filtros.precio_max = priceRange.max;
      }
      
      const response = await productosService.listarProductos(filtros);
      
      if (selectedCategory !== null && selectedCategory !== undefined && response.data) {
        const productosFiltrados = response.data.filter((p: Producto) => {
          const catId = p.id_categoria ? Number(p.id_categoria) : null;
          const esCorrecto = catId === selectedCategory;
          if (!esCorrecto) {
            console.error(`❌ Producto con categoría incorrecta filtrado: "${p.nombre}" tiene categoría ${p.id_categoria} pero se esperaba ${selectedCategory}`);
          }
          return esCorrecto;
        });
        
        if (productosFiltrados.length !== response.data.length) {
          console.error(`⚠️ Se filtraron ${response.data.length - productosFiltrados.length} productos con categoría incorrecta del backend`);
        }
        
        return productosFiltrados;
      }
      
      return response.data || [];
    },
  });

  // Query para categorías
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const response = await categoriasService.listarCategorias();
      return response.data || [];
    },
  });

  // Query para lista de deseos
  const { data: listaDeseosData } = useQuery({
    queryKey: ['lista-deseos'],
    queryFn: async () => {
      if (!isAuthenticated || user?.rol !== 'consumidor') return [];
      const response = await listaDeseosService.obtenerMiListaDeseos();
      return response.data || [];
    },
    enabled: isAuthenticated && user?.rol === 'consumidor',
  });

  const productosEnListaDeseos = React.useMemo(() => {
    if (!listaDeseosData) return new Set<number>();
    return new Set(listaDeseosData.map((item: { id_producto?: number; producto?: { id_producto?: number } }) => item.id_producto || item.producto?.id_producto));
  }, [listaDeseosData]);

  const categorias = categoriasData || [];

  // Ordenar productos
  const productos = React.useMemo(() => {
    const productosDataRaw = productosData || [];
    const sorted = [...productosDataRaw];
    switch (sortBy) {
      case 'precio_asc':
        return sorted.sort((a, b) => a.precio - b.precio);
      case 'precio_desc':
        return sorted.sort((a, b) => b.precio - a.precio);
      case 'stock':
        return sorted.sort((a, b) => b.stock - a.stock);
      case 'nombre':
      default:
        return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
  }, [productosData, sortBy]);

  // Mutation para agregar al carrito
  const agregarAlCarritoMutation = useMutation({
    mutationFn: async (idProducto: number) => {
      return await carritoService.agregarAlCarrito({
        id_producto: idProducto,
        cantidad: 1,
      });
    },
    onSuccess: () => {
      toast.success('Producto agregado al carrito');
      queryClient.invalidateQueries({ queryKey: ['carrito'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al agregar al carrito');
    },
  });

  // Mutation para lista de deseos
  const toggleListaDeseosMutation = useMutation({
    mutationFn: async ({ idProducto, agregar }: { idProducto: number; agregar: boolean }) => {
      if (agregar) {
        return await listaDeseosService.agregarAListaDeseos(idProducto);
      } else {
        return await listaDeseosService.eliminarProductoDeListaDeseos(idProducto);
      }
    },
    onMutate: async ({ idProducto, agregar }) => {
      await queryClient.cancelQueries({ queryKey: ['lista-deseos'] });
      const previousListaDeseos = queryClient.getQueryData(['lista-deseos']);
      
      queryClient.setQueryData(['lista-deseos'], (old: unknown) => {
        if (!Array.isArray(old)) return old;
        if (agregar) {
          return [...old, { id_producto: idProducto }];
        } else {
          return old.filter((item: { id_producto?: number }) => item.id_producto !== idProducto);
        }
      });
      
      return { previousListaDeseos };
    },
    onSuccess: (_, variables) => {
      toast.success(variables.agregar ? 'Agregado a favoritos' : 'Eliminado de favoritos');
      queryClient.invalidateQueries({ queryKey: ['lista-deseos'] });
      queryClient.invalidateQueries({ queryKey: ['lista-deseos-verificar'] });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousListaDeseos) {
        queryClient.setQueryData(['lista-deseos'], context.previousListaDeseos);
      }
      toast.error(error.message || 'Error al actualizar favoritos');
    },
  });

  const handleAgregarAlCarrito = async (e: React.MouseEvent, idProducto: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || user?.rol !== 'consumidor') {
      toast.warning('Debes iniciar sesión como consumidor para agregar productos al carrito');
      navigate('/login', { state: { from: '/productos' } });
      return;
    }
    agregarAlCarritoMutation.mutate(idProducto);
  };

  const handleToggleListaDeseos = async (e: React.MouseEvent, idProducto: number, estaEnLista: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || user?.rol !== 'consumidor') {
      toast.warning('Debes iniciar sesión como consumidor para usar la lista de deseos');
      navigate('/login', { state: { from: '/productos' } });
      return;
    }
    toggleListaDeseosMutation.mutate({ idProducto, agregar: !estaEnLista });
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Sidebar de Filtros */}
        <div className="col-lg-3 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <BiFilter className="me-2" />
                Filtros
              </h5>
            </div>
            <div className="card-body">
              {/* Búsqueda */}
              <div className="mb-4">
                <label className="form-label fw-bold">Buscar</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <BiSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nombre del producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Categorías */}
              <div className="mb-4">
                <label className="form-label fw-bold">Categorías</label>
                <div className="list-group">
                  <button
                    className={`list-group-item list-group-item-action ${selectedCategory === null ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(null);
                      const newParams = new URLSearchParams();
                      if (searchTerm) newParams.set('nombre', searchTerm);
                      if (priceRange.min > 0) newParams.set('precio_min', priceRange.min.toString());
                      if (priceRange.max < 100000) newParams.set('precio_max', priceRange.max.toString());
                      setSearchParams(newParams);
                    }}
                  >
                    Todas las categorías
                  </button>
                  {categorias.map((cat: Categoria) => (
                    <button
                      key={cat.id_categoria}
                      className={`list-group-item list-group-item-action ${selectedCategory === cat.id_categoria ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(cat.id_categoria);
                        setSearchParams({ categoria: cat.id_categoria.toString() });
                      }}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rango de Precios */}
              <div className="mb-4">
                <label className="form-label fw-bold">Rango de Precios</label>
                <div className="row g-2">
                  <div className="col-6">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      placeholder="Mín"
                      value={priceRange.min || ''}
                      onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      placeholder="Máx"
                      value={priceRange.max || ''}
                      onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) || 100000 })}
                    />
                  </div>
                </div>
                {(priceRange.min > 0 || priceRange.max < 100000) && (
                  <button
                    className="btn btn-sm btn-outline-secondary mt-2 w-100"
                    onClick={() => setPriceRange({ min: 0, max: 100000 })}
                  >
                    <BiX className="me-1" />
                    Limpiar Filtro
                  </button>
                )}
              </div>

              {/* Botón limpiar todos los filtros */}
              {(selectedCategory !== null || searchTerm || priceRange.min > 0 || priceRange.max < 100000) && (
                <button
                  className="btn btn-outline-danger btn-sm w-100"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchTerm('');
                    setPriceRange({ min: 0, max: 100000 });
                    setSearchParams({});
                  }}
                >
                  <BiX className="me-1" />
                  Limpiar Todos los Filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Productos */}
        <div className="col-lg-9">
          {/* Header con búsqueda y ordenamiento */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-6 mb-3 mb-md-0">
                  <h2 className="fw-bold mb-0">
                    <BiPackage className="me-2 text-primary" />
                    Productos
                  </h2>
                  <small className="text-muted">
                    {productos.length} producto{productos.length !== 1 ? 's' : ''} encontrado{productos.length !== 1 ? 's' : ''}
                  </small>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2 align-items-center">
                    <label className="form-label mb-0 small">Ordenar por:</label>
                    <select
                      className="form-select form-select-sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'nombre' | 'precio_asc' | 'precio_desc' | 'stock')}
                      style={{ maxWidth: '200px' }}
                    >
                      <option value="nombre">Nombre A-Z</option>
                      <option value="precio_asc">Precio: Menor a Mayor</option>
                      <option value="precio_desc">Precio: Mayor a Menor</option>
                      <option value="stock">Stock Disponible</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {productosLoading ? (
            <div className="row g-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="col-md-4">
                  <div className="card border-0 shadow-sm">
                    <div className="card-img-top bg-light" style={{ height: '200px' }} />
                    <div className="card-body">
                      <div className="placeholder-glow">
                        <span className="placeholder col-7"></span>
                        <span className="placeholder col-4"></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-5">
              <BiPackage className="display-1 text-muted mb-3" />
              <h4 className="text-muted">No se encontraron productos</h4>
              <p className="text-muted">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="row g-4">
              {productos.map((producto: Producto) => {
                const estaEnLista = productosEnListaDeseos.has(producto.id_producto);
                return (
                  <div key={producto.id_producto} className="col-md-6 col-lg-4">
                    <div className="card product-card h-100 border-0 shadow-sm">
                      <div className="position-relative overflow-hidden">
                        <Link to={`/productos/${producto.id_producto}`} className="text-decoration-none">
                          {producto.imagen_principal || producto.imagenUrl ? (
                            <img
                              src={producto.imagenUrl || producto.imagen_principal || '/placeholder.png'}
                              className="card-img-top w-100"
                              alt={producto.nombre}
                              style={{ height: '280px', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x280?text=Sin+Imagen';
                              }}
                            />
                          ) : (
                            <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: '280px' }}>
                              <BiPackage className="display-4 text-muted" />
                            </div>
                          )}
                        </Link>
                        <div className="position-absolute top-0 end-0 m-2 d-flex flex-column gap-1">
                          {!producto.disponible && (
                            <span className="badge bg-danger">
                              Agotado
                            </span>
                          )}
                          {producto.stock > 0 && producto.stock <= (producto.stock_minimo || 5) && producto.disponible && (
                            <span className="badge bg-warning text-dark">
                              Stock Bajo
                            </span>
                          )}
                        </div>
                        {/* Botón de favorito flotante CON ICONOS PERSONALIZADOS */}
                        {isAuthenticated && user?.rol === 'consumidor' && (
                          <button
                            className="position-absolute top-0 start-0 m-2 btn btn-sm rounded-circle heart-button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleListaDeseos(e, producto.id_producto, estaEnLista);
                            }}
                            title={estaEnLista ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                          >
                            {estaEnLista ? <HeartFilled /> : <HeartOutline />}
                          </button>
                        )}
                      </div>
                      
                      <div className="card-body d-flex flex-column">
                        <Link to={`/productos/${producto.id_producto}`} className="text-decoration-none text-dark">
                          <h5 className="card-title fw-bold mb-2" style={{ minHeight: '48px' }}>
                            {producto.nombre}
                          </h5>
                          {producto.descripcion && (
                            <p className="card-text text-muted small mb-3" style={{ minHeight: '40px' }}>
                              {producto.descripcion.length > 80 
                                ? `${producto.descripcion.substring(0, 80)}...` 
                                : producto.descripcion}
                            </p>
                          )}
                        </Link>

                        <div className="mt-auto">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <span className="h4 fw-bold text-primary mb-0">
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

                          {producto.nombre_productor && (
                            <p className="text-muted small mb-3">
                              <BiUser className="me-1" />
                              {producto.nombre_productor}
                            </p>
                          )}

                          <div className="d-flex gap-2 product-actions">
                            <Link
                              to={`/productos/${producto.id_producto}`}
                              className="btn btn-primary btn-sm flex-fill"
                            >
                              Ver Detalles
                            </Link>
                            {isAuthenticated && user?.rol === 'consumidor' && (
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAgregarAlCarrito(e, producto.id_producto);
                                }}
                                disabled={!producto.disponible || producto.stock === 0 || agregarAlCarritoMutation.isPending}
                                title="Agregar al carrito"
                              >
                                {agregarAlCarritoMutation.isPending ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : (
                                  <BiCart />
                                )}
                              </button>
                            )}
                            {!isAuthenticated && (
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toast.warning('Debes iniciar sesión para agregar al carrito');
                                  navigate('/login', { state: { from: '/productos' } });
                                }}
                                title="Inicia sesión para agregar al carrito"
                              >
                                <BiCart />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductosPage;