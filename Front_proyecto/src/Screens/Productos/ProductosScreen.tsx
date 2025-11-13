// 🛍️ PANTALLA DE PRODUCTOS PROFESIONAL - BÚSQUEDA Y FILTROS

import React, { useState, useEffect, useCallback } from 'react';
import { productosService, ubicacionesService } from '../../services/index';
import { Button, Card, Input, Loading, Badge } from '../../components/ReusableComponents';
import { SearchIcon, FilterIcon, GridIcon, ListIcon, ArrowRightIcon } from '../../components/Icons';
import { useAuth } from '../../contexts/AuthContext';
import type { Producto, FiltrosProductos, Ciudad } from '../../types';
import { getProductImagePath, handleImageError, PLACEHOLDER_IMAGES } from '../../utils/assets';
import './ProductosScreen.css';

interface ProductosScreenProps {
  onNavigate?: (view: string) => void;
}

export const ProductosScreen: React.FC<ProductosScreenProps> = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  
  // Estados de búsqueda y filtros
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtros, setFiltros] = useState<FiltrosProductos>({
    precio_min: undefined,
    precio_max: undefined,
    disponible: true,
    orden: 'nombre_asc',
    limite: 20,
    pagina: 1
  });
  
  // Estados de UI
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [vista, setVista] = useState<'grid' | 'list'>('grid');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');

  // Cargar productos
  const cargarProductos = useCallback(async () => {
    try {
      setBuscando(true);
      const response = await productosService.obtenerProductosDisponibles(filtros);
      
      if (response.success && response.data) {
        setProductos(response.data);
        setProductosFiltrados(response.data);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
      setBuscando(false);
    }
  }, [filtros]);

  // Cargar ciudades
  useEffect(() => {
    const cargarCiudades = async () => {
      try {
        const response = await ubicacionesService.listarCiudades();
        if (response.success && response.data) {
          setCiudades(response.data);
        }
      } catch (error) {
        console.error('Error cargando ciudades:', error);
      }
    };
    cargarCiudades();
  }, []);

  // Cargar productos al montar y cuando cambien los filtros
  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // Filtrar productos localmente cuando cambia el término de búsqueda
  useEffect(() => {
    if (!terminoBusqueda.trim()) {
      setProductosFiltrados(productos);
      return;
    }

    const filtrado = productos.filter(producto => {
      const busqueda = terminoBusqueda.toLowerCase();
      return (
        producto.nombre.toLowerCase().includes(busqueda) ||
        producto.descripcion?.toLowerCase().includes(busqueda) ||
        producto.unidad_medida.toLowerCase().includes(busqueda) ||
        producto.categoria_nombre?.toLowerCase().includes(busqueda)
      );
    });
    
    setProductosFiltrados(filtrado);
  }, [terminoBusqueda, productos]);

  // Manejar búsqueda
  const handleBuscar = async () => {
    if (!terminoBusqueda.trim()) {
      cargarProductos();
      return;
    }

    try {
      setBuscando(true);
      const response = await productosService.buscarProductos(terminoBusqueda, filtros);
      
      if (response.success && response.data) {
        setProductos(response.data);
        setProductosFiltrados(response.data);
      }
    } catch (error) {
      console.error('Error buscando productos:', error);
    } finally {
      setBuscando(false);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    cargarProductos();
    setMostrarFiltros(false);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      disponible: true,
      orden: 'nombre_asc',
      limite: 20,
      pagina: 1
    });
    setTerminoBusqueda('');
    setCategoriaSeleccionada('');
  };

  // Formatear precio
  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  return (
    <div className="productos-screen">
      {/* Header con búsqueda */}
      <div className="productos-header">
        <div className="productos-header-content">
          <div className="productos-title-section">
            <h1 className="productos-title">Productos del Campo</h1>
            <p className="productos-subtitle">
              {productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto encontrado' : 'productos encontrados'}
            </p>
          </div>

          {/* Barra de búsqueda */}
          <div className="productos-search-bar">
            <div className="search-input-container">
              <Input
                type="text"
                placeholder="Buscar productos, categorías..."
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                icon={<SearchIcon size={20} color="#9CA3AF" />}
              />
              <Button
                variant="primary"
                onClick={handleBuscar}
                loading={buscando}
              >
                Buscar
              </Button>
            </div>

            {/* Controles de vista */}
            <div className="productos-controls">
              <Button
                variant={mostrarFiltros ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                icon={<FilterIcon size={16} color={mostrarFiltros ? '#FFFFFF' : '#2D5016'} />}
              >
                Filtros
              </Button>
              <div className="vista-toggle">
                <button
                  className={`vista-btn ${vista === 'grid' ? 'active' : ''}`}
                  onClick={() => setVista('grid')}
                  title="Vista de cuadrícula"
                >
                  <GridIcon size={18} color="currentColor" />
                </button>
                <button
                  className={`vista-btn ${vista === 'list' ? 'active' : ''}`}
                  onClick={() => setVista('list')}
                  title="Vista de lista"
                >
                  <ListIcon size={18} color="currentColor" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de filtros */}
      {mostrarFiltros && (
        <div className="productos-filtros-panel">
          <div className="filtros-content">
            <h3 className="filtros-title">Filtros</h3>

            <div className="filtros-grid">
              {/* Rango de precios */}
              <div className="filtro-group">
                <label>Precio Mínimo</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filtros.precio_min || ''}
                  onChange={(e) => setFiltros({
                    ...filtros,
                    precio_min: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>

              <div className="filtro-group">
                <label>Precio Máximo</label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={filtros.precio_max || ''}
                  onChange={(e) => setFiltros({
                    ...filtros,
                    precio_max: e.target.value ? Number(e.target.value) : undefined
                  })}
                />
              </div>

              {/* Ciudad */}
              <div className="filtro-group">
                <label>Ciudad de Origen</label>
                <select
                  className="input"
                  value={filtros.id_ciudad_origen || ''}
                  onChange={(e) => setFiltros({
                    ...filtros,
                    id_ciudad_origen: e.target.value ? Number(e.target.value) : undefined
                  })}
                >
                  <option value="">Todas las ciudades</option>
                  {ciudades.map((ciudad) => (
                    <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                      {ciudad.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Orden */}
              <div className="filtro-group">
                <label>Ordenar por</label>
                <select
                  className="input"
                  value={filtros.orden || 'nombre_asc'}
                  onChange={(e) => setFiltros({
                    ...filtros,
                    orden: e.target.value as FiltrosProductos['orden']
                  })}
                >
                  <option value="nombre_asc">Nombre A-Z</option>
                  <option value="nombre_desc">Nombre Z-A</option>
                  <option value="precio_asc">Precio: Menor a Mayor</option>
                  <option value="precio_desc">Precio: Mayor a Menor</option>
                  <option value="stock_asc">Stock: Menor a Mayor</option>
                  <option value="stock_desc">Stock: Mayor a Menor</option>
                </select>
              </div>
            </div>

            <div className="filtros-actions">
              <Button variant="primary" onClick={aplicarFiltros}>
                Aplicar Filtros
              </Button>
              <Button variant="secondary" onClick={limpiarFiltros}>
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="productos-content">
        {loading ? (
          <Loading message="Cargando productos..." />
        ) : productosFiltrados.length === 0 ? (
          <div className="productos-empty">
            <div className="empty-illustration">
              <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                <circle cx="100" cy="100" r="80" fill="#F1F5F9" opacity="0.5"/>
                <path d="M70 90L100 70L130 90L100 130L70 90Z" stroke="#CBD5E0" strokeWidth="2" fill="none"/>
                <circle cx="100" cy="100" r="30" fill="#E2E8F0"/>
              </svg>
            </div>
            <h2>No se encontraron productos</h2>
            <p>Intenta ajustar tus filtros de búsqueda o explora otras categorías.</p>
            <Button variant="primary" onClick={limpiarFiltros}>
              Limpiar Filtros
            </Button>
          </div>
        ) : (
          <div className={`productos-grid productos-grid-${vista}`}>
            {productosFiltrados.map((producto) => (
              <Card key={producto.id_producto} className="producto-card-item">
                <div className="producto-imagen-wrapper">
                  <img
                    src={producto.imagen_principal || PLACEHOLDER_IMAGES.PRODUCTO}
                    alt={producto.nombre}
                    onError={(e) => handleImageError(e, PLACEHOLDER_IMAGES.PRODUCTO)}
                    className="producto-imagen-card"
                  />
                  {producto.disponible && (
                    <Badge variant="success" className="producto-badge-disponible">
                      Disponible
                    </Badge>
                  )}
                  {producto.stock && producto.stock < 10 && (
                    <Badge variant="warning" className="producto-badge-stock">
                      Últimas unidades
                    </Badge>
                  )}
                </div>

                <div className="producto-info-card">
                  <h3 className="producto-nombre-card">{producto.nombre}</h3>
                  {producto.descripcion && (
                    <p className="producto-descripcion-card">
                      {producto.descripcion.length > 100
                        ? `${producto.descripcion.substring(0, 100)}...`
                        : producto.descripcion}
                    </p>
                  )}
                  
                  <div className="producto-detalles-card">
                    <div className="producto-precio-card">
                      {formatearPrecio(producto.precio || 0)}
                      <span className="producto-unidad"> / {producto.unidad_medida}</span>
                    </div>
                    {producto.stock !== undefined && (
                      <div className="producto-stock-card">
                        Stock: {producto.stock} {producto.unidad_medida}
                      </div>
                    )}
                  </div>

                  <div className="producto-actions-card">
                    <Button
                      variant="primary"
                      size="small"
                      fullWidth
                      onClick={() => {
                        // TODO: Agregar al carrito o ver detalles
                        console.log('Ver producto:', producto.id_producto);
                      }}
                      icon={<ArrowRightIcon size={16} color="#FFFFFF" />}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductosScreen;

