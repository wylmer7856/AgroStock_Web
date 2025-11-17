import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { productosService, categoriasService, carritoService, listaDeseosService } from '../services';
import { toast } from 'react-toastify';
import Footer from '../components/Footer';
import SplashScreen from '../components/SplashScreen';
import fondoImage from '../assets/fondo.png';
import { 
  BiRightArrowAlt, 
  BiLeaf, 
  BiStore, 
  BiShoppingBag, 
  BiShield, 
  BiTrendingUp,
  BiPackage,
  BiCheckCircle,
  BiStar,
  BiTime,
  BiCart,
  BiHeart,
  BiCategory,
  BiUser
} from 'react-icons/bi';
import type { Producto, Categoria } from '../types';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Verificar si ya se mostró el splash screen antes
  const hasSeenSplash = localStorage.getItem('agrostock-splash-seen');
  const [showSplash, setShowSplash] = useState(!hasSeenSplash);
  
  // Query para obtener productos destacados (más vendidos o con mejor stock)
  const { data: productosDestacados, isLoading: productosLoading } = useQuery({
    queryKey: ['productos-destacados'],
    queryFn: async () => {
      const response = await productosService.listarProductos({
        disponible: true,
        limite: 8,
      });
      return response.data || [];
    },
  });

  // Query para obtener productos recientes
  const { data: productosRecientes } = useQuery({
    queryKey: ['productos-recientes'],
    queryFn: async () => {
      const response = await productosService.listarProductos({
        disponible: true,
        limite: 6,
      });
      return response.data || [];
    },
  });

  // Query para obtener categorías
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const response = await categoriasService.listarCategorias();
      return response.data || [];
    },
  });

  // Query para lista de deseos (si estÃ¡ autenticado)
  const { data: listaDeseosData } = useQuery({
    queryKey: ['lista-deseos'],
    queryFn: async () => {
      if (!isAuthenticated || user?.rol !== 'consumidor') return [];
      const response = await listaDeseosService.obtenerListaDeseos();
      return response.data || [];
    },
    enabled: isAuthenticated && user?.rol === 'consumidor',
  });

  const productosDestacadosList = productosDestacados || [];
  const productosRecientesList = productosRecientes || [];
  const categorias = categoriasData || [];

  const productosEnListaDeseos = React.useMemo(() => {
    if (!listaDeseosData) return new Set<number>();
    return new Set(listaDeseosData.map((item: any) => item.id_producto || item.producto?.id_producto));
  }, [listaDeseosData]);

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
    onError: (error: any) => {
      toast.error(error.message || 'Error al agregar al carrito');
    },
  });

  // Mutation para lista de deseos con actualización optimista
  const toggleListaDeseosMutation = useMutation({
    mutationFn: async ({ idProducto, agregar }: { idProducto: number; agregar: boolean }) => {
      if (agregar) {
        return await listaDeseosService.agregarAListaDeseos(idProducto);
      } else {
        return await listaDeseosService.eliminarProductoDeListaDeseos(idProducto);
      }
    },
    onMutate: async ({ idProducto, agregar }) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: ['lista-deseos'] });
      
      // Snapshot del valor anterior
      const previousListaDeseos = queryClient.getQueryData(['lista-deseos']);
      
      // Actualización optimista
      queryClient.setQueryData(['lista-deseos'], (old: any) => {
        if (!Array.isArray(old)) return old;
        if (agregar) {
          // Agregar producto a la lista (simulado)
          return [...old, { id_producto: idProducto }];
        } else {
          // Eliminar producto de la lista
          return old.filter((item: any) => item.id_producto !== idProducto);
        }
      });
      
      return { previousListaDeseos };
    },
    onSuccess: (_, variables) => {
      toast.success(variables.agregar ? 'Agregado a favoritos' : 'Eliminado de favoritos');
      // Invalidar queries para sincronizar con el servidor (sin refetch inmediato)
      queryClient.invalidateQueries({ queryKey: ['lista-deseos'] });
    },
    onError: (error: any, _variables, context) => {
      // Revertir en caso de error
      if (context?.previousListaDeseos) {
        queryClient.setQueryData(['lista-deseos'], context.previousListaDeseos);
      }
      toast.error(error.message || 'Error al actualizar favoritos');
    },
  });

  const handleAgregarAlCarrito = (e: React.MouseEvent, idProducto: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || user?.rol !== 'consumidor') {
      toast.warning('Debes iniciar sesión como consumidor para agregar productos al carrito');
      navigate('/login', { state: { from: '/' } });
      return;
    }
    agregarAlCarritoMutation.mutate(idProducto);
  };

  const handleToggleListaDeseos = (e: React.MouseEvent, idProducto: number, estaEnLista: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || user?.rol !== 'consumidor') {
      toast.warning('Debes iniciar sesión como consumidor para usar la lista de deseos');
      navigate('/login', { state: { from: '/' } });
      return;
    }
    toggleListaDeseosMutation.mutate({ idProducto, agregar: !estaEnLista });
  };

  // Si aún está mostrando el splash, no renderizar el contenido
  if (showSplash) {
    return (
      <SplashScreen 
        onComplete={() => {
          setShowSplash(false);
          // Marcar que ya se mostró el splash screen
          localStorage.setItem('agrostock-splash-seen', 'true');
        }}
        duration={3000}
      />
    );
  }

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section 
        className="hero-section"
        style={{
          backgroundImage: `url(${fondoImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container">
          <div className="row align-items-center min-vh-75">
            <div className="col-lg-6">
              <div className="hero-content">
                <div className="hero-badge">
                  <BiLeaf className="me-2" />
                  <span>Plataforma #1 en Agricultura</span>
                </div>
                <h1 className="hero-title">
                  Conectamos el Campo
                  <span className="hero-title-highlight"> con tu Mesa</span>
              </h1>
                <p className="hero-description">
                  Productos frescos directamente de productores locales. 
                  Apoya la agricultura colombiana mientras disfrutas de la mejor calidad.
              </p>
              {!isAuthenticated ? (
                  <div className="hero-actions">
                    <Link to="/register" className="btn btn-primary btn-hero">
                      Comenzar Ahora
                    <BiRightArrowAlt className="ms-2" />
                  </Link>
                    <Link to="/productos" className="btn btn-outline-light btn-hero">
                      Explorar Productos
                  </Link>
                </div>
              ) : (
                  <div className="hero-actions">
                    <Link to="/dashboard" className="btn btn-primary btn-hero">
                  Ir a mi Dashboard
                  <BiRightArrowAlt className="ms-2" />
                </Link>
                    <Link to="/productos" className="btn btn-outline-light btn-hero">
                      Ver Productos
                    </Link>
                  </div>
              )}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-image">
                <div className="hero-image-wrapper">
                  <BiStore className="hero-icon" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estadísticas Rápidas */}
      <section className="stats-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-3 col-6">
              <div className="stat-card">
                <BiPackage className="stat-icon" />
                <h3 className="stat-number">500+</h3>
                <p className="stat-label">Productos</p>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card">
                <BiStore className="stat-icon" />
                <h3 className="stat-number">200+</h3>
                <p className="stat-label">Productores</p>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card">
                <BiShoppingBag className="stat-icon" />
                <h3 className="stat-number">1000+</h3>
                <p className="stat-label">Clientes</p>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="stat-card">
                <BiCheckCircle className="stat-icon" />
                <h3 className="stat-number">98%</h3>
                <p className="stat-label">Satisfacción</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      {productosDestacadosList.length > 0 && (
        <section id="productos-destacados" className="products-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <BiStar className="me-2 text-warning" />
                Productos Destacados
              </h2>
              <p className="section-subtitle">
                Los productos más populares y mejor valorados de nuestra plataforma
              </p>
            </div>
            {productosLoading ? (
              <div className="row g-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="col-6 col-md-4 col-lg-3">
                    <div className="product-card-skeleton">
                      <div className="skeleton-image"></div>
                      <div className="skeleton-content">
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line short"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="row g-4">
                {productosDestacadosList.slice(0, 8).map((producto: Producto) => {
                  const estaEnLista = productosEnListaDeseos.has(producto.id_producto);
                  return (
                    <div key={producto.id_producto} className="col-6 col-md-4 col-lg-3">
                      <div className="product-card ecommerce-card">
                        <Link to={`/productos/${producto.id_producto}`} className="product-image-link">
                          <div className="product-image-wrapper">
                            {producto.imagenUrl || producto.imagen_principal ? (
                              <img
                                src={producto.imagenUrl || producto.imagen_principal || '/placeholder.png'}
                                alt={producto.nombre}
                                className="product-image"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x250?text=Sin+Imagen';
                                }}
                              />
                            ) : (
                              <div className="product-image-placeholder">
                                <BiPackage className="product-placeholder-icon" />
                              </div>
                            )}
                            {/* Badge de Destacado */}
                            <span className="product-badge product-badge-featured">
                              <BiStar className="me-1" />
                              Destacado
                            </span>
                            {!producto.disponible && (
                              <span className="product-badge product-badge-unavailable">Agotado</span>
                            )}
                            {producto.stock > 0 && producto.stock <= (producto.stock_minimo || 5) && producto.disponible && (
                              <span className="product-badge product-badge-warning">Stock Bajo</span>
                            )}
                            {/* Botón de favorito flotante */}
                            {isAuthenticated && user?.rol === 'consumidor' && (
                              <button
                                className="product-favorite-btn"
                                onClick={(e) => handleToggleListaDeseos(e, producto.id_producto, estaEnLista)}
                                title={estaEnLista ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                                style={{
                                  background: estaEnLista ? 'rgba(220, 53, 69, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                                  border: estaEnLista ? 'none' : '1px solid rgba(0,0,0,0.1)',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <BiHeart 
                                  className={estaEnLista ? 'heart-filled' : 'heart-outline'}
                                  style={{ 
                                    fontSize: '1.5rem',
                                    color: estaEnLista ? '#ffffff' : '#dc3545',
                                    transition: 'all 0.3s ease',
                                    display: 'block'
                                  }}
                                />
                              </button>
                            )}
                            {!isAuthenticated && (
                              <button
                                className="product-favorite-btn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toast.warning('Inicia sesión para agregar a favoritos');
                                  navigate('/login', { state: { from: '/' } });
                                }}
                                title="Inicia sesión para agregar a favoritos"
                              >
                                <BiHeart className="text-white" style={{ fontSize: '1.5rem' }} />
                              </button>
                            )}
                          </div>
                        </Link>
                        <div className="product-content">
                          <Link to={`/productos/${producto.id_producto}`} className="product-title-link">
                            <h5 className="product-title">{producto.nombre}</h5>
                          </Link>
                          {producto.nombre_productor && (
                            <p className="product-producer">
                              <BiUser className="me-1" />
                              {producto.nombre_productor}
                            </p>
                          )}
                          <div className="product-footer">
                            <div className="product-price">
                              <span className="price-amount">${producto.precio.toLocaleString()}</span>
                              <span className="price-unit">/{producto.unidad_medida}</span>
                            </div>
                            <div className="product-actions-home">
                              {isAuthenticated && user?.rol === 'consumidor' ? (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={(e) => handleAgregarAlCarrito(e, producto.id_producto)}
                                  disabled={!producto.disponible || producto.stock === 0 || agregarAlCarritoMutation.isPending}
                                  title="Agregar al carrito"
                                >
                                  {agregarAlCarritoMutation.isPending ? (
                                    <span className="spinner-border spinner-border-sm" />
                                  ) : (
                                    <BiCart />
                                  )}
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toast.warning('Inicia sesión para agregar al carrito');
                                    navigate('/login', { state: { from: '/' } });
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
            <div className="text-center mt-5">
              <Link to="/productos" className="btn btn-primary btn-lg">
                Ver Todos los Productos
                <BiRightArrowAlt className="ms-2" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Productos Recientes */}
      {productosRecientesList.length > 0 && (
        <section className="products-section bg-white">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <BiTime className="me-2 text-info" />
                Productos Nuevos
              </h2>
              <p className="section-subtitle">
                Descubre los últimos productos agregados a nuestra plataforma
              </p>
            </div>
            <div className="row g-4">
              {productosRecientesList.slice(0, 6).map((producto: Producto) => {
                const estaEnLista = productosEnListaDeseos.has(producto.id_producto);
                return (
                  <div key={producto.id_producto} className="col-6 col-md-4 col-lg-3">
                    <div className="product-card ecommerce-card">
                      <Link to={`/productos/${producto.id_producto}`} className="product-image-link">
                        <div className="product-image-wrapper">
                          {producto.imagenUrl || producto.imagen_principal ? (
                            <img
                              src={producto.imagenUrl || producto.imagen_principal || '/placeholder.png'}
                              alt={producto.nombre}
                              className="product-image"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x250?text=Sin+Imagen';
                              }}
                            />
                          ) : (
                            <div className="product-image-placeholder">
                              <BiPackage className="product-placeholder-icon" />
                            </div>
                          )}
                          {!producto.disponible && (
                            <span className="product-badge product-badge-unavailable">Agotado</span>
                          )}
                          {isAuthenticated && user?.rol === 'consumidor' && (
                            <button
                              className="product-favorite-btn"
                              onClick={(e) => handleToggleListaDeseos(e, producto.id_producto, estaEnLista)}
                              title={estaEnLista ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                            >
                              <BiHeart 
                                className={estaEnLista ? 'text-danger fill' : 'text-white'} 
                                style={{ fontSize: '1.5rem' }}
                              />
                            </button>
                          )}
                        </div>
                      </Link>
                      <div className="product-content">
                        <Link to={`/productos/${producto.id_producto}`} className="product-title-link">
                          <h5 className="product-title">{producto.nombre}</h5>
                        </Link>
                        <div className="product-footer">
                          <div className="product-price">
                            <span className="price-amount">${producto.precio.toLocaleString()}</span>
                            <span className="price-unit">/{producto.unidad_medida}</span>
                          </div>
                          <Link 
                            to={`/productos/${producto.id_producto}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Ver
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Categorías Section */}
      {categorias.length > 0 && (
        <section id="categorias-section" className="categorias-section py-5 bg-light">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="section-title fw-bold">
                <BiCategory className="me-2 text-primary" />
                Explora por Categorías
              </h2>
              <p className="section-subtitle text-muted">
                Encuentra productos organizados por tipo
              </p>
            </div>
            <div className="row g-4">
              {categorias.map((categoria: Categoria) => (
                <div key={categoria.id_categoria} className="col-6 col-md-4 col-lg-3 col-xl-2">
                  <Link 
                    to={`/productos?categoria=${categoria.id_categoria}`}
                    className="categoria-card text-decoration-none d-block h-100"
                  >
                    <div className="card border-0 shadow-sm h-100 categoria-card-hover">
                      <div className="card-body text-center p-4">
                        <div className="categoria-icon mb-3">
                          <BiPackage className="fs-1 text-primary" />
                        </div>
                        <h6 className="categoria-name mb-0 fw-bold text-dark">
                          {categoria.nombre}
                        </h6>
                        {categoria.descripcion && (
                          <p className="text-muted small mt-2 mb-0">
                            {categoria.descripcion.length > 50 
                              ? `${categoria.descripcion.substring(0, 50)}...` 
                              : categoria.descripcion}
                          </p>
                        )}
                        <div className="mt-3">
                          <BiRightArrowAlt className="text-primary" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            {categorias.length > 6 && (
              <div className="text-center mt-4">
                <Link to="/productos" className="btn btn-outline-primary btn-lg">
                  Ver Todas las Categorías
                  <BiRightArrowAlt className="ms-2" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">¿Por qué elegir AgroStock?</h2>
            <p className="section-subtitle">
              La plataforma que revoluciona el comercio agrícola en Colombia
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon-wrapper feature-icon-primary">
                  <BiStore className="feature-icon" />
                  </div>
                <h4 className="feature-title">Para Productores</h4>
                <p className="feature-description">
                    Gestiona tus productos, recibe pedidos y conecta directamente con consumidores.
                  Amplía tu alcance y aumenta tus ventas.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon-wrapper feature-icon-success">
                  <BiShoppingBag className="feature-icon" />
                </div>
                <h4 className="feature-title">Para Consumidores</h4>
                <p className="feature-description">
                  Encuentra productos frescos del campo, realiza pedidos y apoya a productores locales. 
                  Calidad garantizada.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon-wrapper feature-icon-info">
                  <BiShield className="feature-icon" />
                </div>
                <h4 className="feature-title">Seguro y Confiable</h4>
                <p className="feature-description">
                  Sistema seguro con seguimiento de pedidos y comunicación directa entre usuarios. 
                  Tu información protegida.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios Adicionales */}
      <section className="benefits-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="benefits-content">
                <h2 className="benefits-title">
                  Beneficios que te <span className="text-primary">impulsan</span>
                </h2>
                <div className="benefits-list">
                  <div className="benefit-item">
                    <BiCheckCircle className="benefit-icon" />
                    <div>
                      <h5>Envío Rápido</h5>
                      <p>Recibe tus productos frescos en tiempo récord</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <BiCheckCircle className="benefit-icon" />
                    <div>
                      <h5>Calidad Garantizada</h5>
                      <p>Productos verificados directamente del productor</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <BiCheckCircle className="benefit-icon" />
                    <div>
                      <h5>Precios Justos</h5>
                      <p>Sin intermediarios, precios directos del campo</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <BiCheckCircle className="benefit-icon" />
                    <div>
                      <h5>Soporte 24/7</h5>
                      <p>Estamos aquí para ayudarte cuando lo necesites</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="benefits-image">
                <div className="benefits-image-wrapper">
                  <BiLeaf className="benefits-icon-large" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2 className="cta-title">¿Listo para comenzar?</h2>
              <p className="cta-description">
                Únete a nuestra comunidad de productores y consumidores. 
                Crea tu cuenta gratis y comienza hoy mismo.
              </p>
              <div className="cta-actions">
                <Link to="/register" className="btn btn-light btn-lg">
              Crear Cuenta Gratis
              <BiRightArrowAlt className="ms-2" />
            </Link>
                <Link to="/productos" className="btn btn-outline-light btn-lg">
                  Explorar Productos
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
    );
};

export default HomePage; 
