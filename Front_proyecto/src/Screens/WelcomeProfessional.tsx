// 🌾 PANTALLA DE BIENVENIDA PROFESIONAL - CAMPO COLOMBIANO

import React, { useState, useEffect } from 'react';
import AgroStockLogo from '../components/AgroStockLogo';
import { Button, Card, Input, Loading, Toast } from '../components/ReusableComponents';
import { authService } from '../services/auth';
import { productosService, ubicacionesService, categoriasService } from '../services/index';
import { useAuth } from '../contexts/AuthContext';
import type { Producto, Ciudad, Categoria } from '../types';
import '../assets/fondo.png';
import './WelcomeProfessional.css';

interface WelcomeProfessionalProps {
  onNavigate?: (view: string) => void;
}

export const WelcomeProfessional: React.FC<WelcomeProfessionalProps> = ({ onNavigate }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { login: contextLogin } = useAuth();
  const [productosDestacados, setProductosDestacados] = useState<Producto[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);

  // Estados para formularios
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    direccion: '',
    id_ciudad: null as number | null,
    rol: 'consumidor' as 'consumidor' | 'productor'
  });

  // Cargar productos destacados, ciudades y categorías
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingProductos(true);
        const [productosRes, ciudadesRes, categoriasRes] = await Promise.all([
          productosService.obtenerProductosDisponibles({ limite: 6, pagina: 1 }).catch(() => ({ success: false, data: [] })),
          ubicacionesService.listarCiudades().catch(() => ({ success: false, data: [] })),
          categoriasService.listarCategorias().catch(() => ({ success: false, data: [] }))
        ]);

        // Asegurar que siempre sea un array
        const productos = productosRes?.data && Array.isArray(productosRes.data) 
          ? productosRes.data 
          : [];
        setProductosDestacados(productos);

        const ciudades = ciudadesRes?.data && Array.isArray(ciudadesRes.data)
          ? ciudadesRes.data
          : [];
        setCiudades(ciudades);

        const categorias = categoriasRes?.data && Array.isArray(categoriasRes.data)
          ? categoriasRes.data
          : [];
        setCategorias(categorias);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoadingProductos(false);
      }
    };

    cargarDatos();
  }, []);

  // Manejar login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(loginData);
      
      if (response && response.token) {
        setToast({ message: '¡Bienvenido a AgroStock!', type: 'success' });
        contextLogin(response.usuario);
        
        setTimeout(() => {
          if (response.usuario.rol === 'admin') {
            onNavigate?.('admin');
          } else if (response.usuario.rol === 'productor') {
            onNavigate?.('productor');
          } else {
            onNavigate?.('consumidor');
          }
        }, 1500);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión. Verifica tus credenciales.';
      setToast({ 
        message: errorMessage, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (registerData.password !== registerData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      if (!registerData.nombre || !registerData.email || !registerData.password || 
          !registerData.telefono || !registerData.direccion || !registerData.id_ciudad) {
        throw new Error('Todos los campos son obligatorios');
      }

      const response = await authService.register({
        nombre: registerData.nombre,
        email: registerData.email,
        password: registerData.password,
        telefono: registerData.telefono,
        direccion: registerData.direccion,
        id_ciudad: registerData.id_ciudad,
        rol: registerData.rol
      });
      
      if (response.success) {
        setToast({ 
          message: '¡Registro exitoso! Ahora puedes iniciar sesión.', 
          type: 'success' 
        });
          setIsLogin(true);
          setLoginData({ email: registerData.email, password: '' });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar. Intenta nuevamente.';
      setToast({ 
        message: errorMessage, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const mostrarToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="welcome-professional">
      {/* Hero Section con Campo Colombiano */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="field-pattern"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-logo">
            <AgroStockLogo size="large" variant="full" />
            </div>
          
            <h1 className="hero-title">
            Conectando el Campo Colombiano
            </h1>
          
            <p className="hero-subtitle">
            Plataforma digital para productores y consumidores. 
            <br />
            Productos frescos del campo directo a tu hogar.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">+500</div>
              <div className="stat-label">Productores</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">+2000</div>
              <div className="stat-label">Productos</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">+10000</div>
              <div className="stat-label">Clientes</div>
            </div>
          </div>

          <div className="hero-actions">
            <Button 
              variant="primary" 
              size="large"
              onClick={() => setShowAuthModal(true)}
            >
              🚀 Comenzar Ahora
            </Button>
            <Button 
              variant="secondary" 
              size="large"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('productos');
                } else {
                  const productosSection = document.getElementById('productos');
                  productosSection?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              🌾 Ver Productos
            </Button>
          </div>
        </div>

        {/* Decoraciones del Campo */}
        <div className="field-decorations">
          <div className="decoration decoration-1">🌾</div>
          <div className="decoration decoration-2">🌽</div>
          <div className="decoration decoration-3">🥔</div>
          <div className="decoration decoration-4">🍅</div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section id="productos" className="productos-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Productos Destacados del Campo</h2>
            <p className="section-subtitle">
              Productos frescos directamente de nuestros productores colombianos
            </p>
          </div>

          {loadingProductos ? (
            <Loading text="Cargando productos..." />
          ) : (
            <div className="productos-grid">
              {Array.isArray(productosDestacados) && productosDestacados.length > 0 ? (
                productosDestacados.map((producto) => (
                <div
                  key={producto.id_producto}
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('productos');
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                <Card 
                  className="producto-card"
                >
                  {producto.imagen_principal && (
                    <div className="producto-imagen-container">
                      <img 
                        src={producto.imagen_principal} 
                        alt={producto.nombre}
                        className="producto-imagen"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586771107445-d3ca888129ce?w=400';
                        }}
                      />
                      <div className="producto-badge">
                        {producto.disponible ? '✅ Disponible' : '⚠️ Agotado'}
                      </div>
                    </div>
                  )}
                  <div className="producto-info">
                    <h3 className="producto-nombre">{producto.nombre}</h3>
                    <p className="producto-descripcion">
                      {producto.descripcion?.substring(0, 100)}...
                    </p>
                    <div className="producto-precio">
                      ${producto.precio?.toLocaleString('es-CO')}
                      <span className="producto-unidad"> / {producto.unidad_medida}</span>
                </div>
                    <div className="producto-stock">
                      Stock: {producto.stock} {producto.unidad_medida}
                </div>
              </div>
                </Card>
                </div>
                ))
              ) : (
                <p className="no-productos">
                  No hay productos disponibles en este momento.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Características */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">¿Por qué AgroStock?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌾</div>
              <h3>Productos Frescos</h3>
              <p>Directamente del campo colombiano a tu hogar</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍🌾</div>
              <h3>Apoya Productores</h3>
              <p>Comercio justo que beneficia a nuestros campesinos</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Entrega Rápida</h3>
              <p>Recibe tus productos en tiempo récord</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Pago Seguro</h3>
              <p>Múltiples métodos de pago confiables</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">¿Cómo Funciona?</h2>
            <p className="section-subtitle">
              Tres simples pasos para conectarte con el campo colombiano
            </p>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon">📱</div>
              <h3 className="step-title">Regístrate</h3>
              <p className="step-description">
                Crea tu cuenta como consumidor o productor en menos de 2 minutos. 
                Es gratis y sin compromisos.
              </p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon">🛒</div>
              <h3 className="step-title">Explora y Compra</h3>
              <p className="step-description">
                Navega por cientos de productos frescos del campo. 
                Agrega a tu carrito y realiza tu pedido.
              </p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">📦</div>
              <h3 className="step-title">Recibe en Casa</h3>
              <p className="step-description">
                Recibe tus productos frescos directamente en tu puerta. 
                Rápido, seguro y confiable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Lo Que Dicen Nuestros Usuarios</h2>
            <p className="section-subtitle">
              Miles de colombianos confían en AgroStock
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Excelente plataforma. Los productos llegan frescos y el precio es justo. 
                Ahora compro directamente a los productores."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">MC</div>
                <div className="author-info">
                  <div className="author-name">María Camila López</div>
                  <div className="author-role">Consumidora - Bogotá</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Como productor, AgroStock me ha permitido llegar a más clientes. 
                Una herramienta indispensable para el campo."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">JR</div>
                <div className="author-info">
                  <div className="author-name">Jairo Rodríguez</div>
                  <div className="author-role">Productor - Boyacá</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Calidad garantizada y entrega puntual. Me encanta apoyar 
                a los campesinos colombianos desde mi hogar."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">AP</div>
                <div className="author-info">
                  <div className="author-name">Andrea Pérez</div>
                  <div className="author-role">Consumidora - Medellín</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Para Productores */}
      <section className="producers-section">
        <div className="container">
          <div className="producers-content">
            <div className="producers-text">
              <h2 className="section-title">¿Eres Productor?</h2>
              <p className="producers-description">
                Únete a nuestra red de productores y amplía tu mercado. 
                Con AgroStock puedes:
              </p>
              <ul className="producers-benefits">
                <li>
                  <span className="benefit-icon">✓</span>
                  Vender directamente sin intermediarios
                </li>
                <li>
                  <span className="benefit-icon">✓</span>
                  Fijar tus propios precios
                </li>
                <li>
                  <span className="benefit-icon">✓</span>
                  Gestionar tu inventario fácilmente
                </li>
                <li>
                  <span className="benefit-icon">✓</span>
                  Recibir pagos seguros y rápidos
                </li>
                <li>
                  <span className="benefit-icon">✓</span>
                  Llegar a miles de clientes en todo el país
                </li>
              </ul>
              <Button 
                variant="primary" 
                size="large"
                onClick={() => {
                  setShowAuthModal(true);
                  setIsLogin(false);
                }}
              >
                Únete Como Productor
              </Button>
            </div>
            <div className="producers-image">
              <div className="producers-icon">👨‍🌾</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías Populares */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Categorías Populares</h2>
            <p className="section-subtitle">
              Explora nuestra variedad de productos del campo
            </p>
          </div>

          <div className="categories-grid">
            {categorias.length > 0 ? (
              categorias.slice(0, 6).map((categoria) => {
                // Iconos según el nombre de la categoría
                const getCategoryIcon = (nombre: string) => {
                  const nombreLower = nombre.toLowerCase();
                  if (nombreLower.includes('fruta')) return '🍎';
                  if (nombreLower.includes('verdura') || nombreLower.includes('hortaliza')) return '🥕';
                  if (nombreLower.includes('grano') || nombreLower.includes('cereal')) return '🌾';
                  if (nombreLower.includes('lácteo') || nombreLower.includes('leche')) return '🥛';
                  if (nombreLower.includes('carne')) return '🥩';
                  if (nombreLower.includes('artesanía')) return '🎨';
                  return '🌾';
                };

                return (
                  <div 
                    key={categoria.id_categoria} 
                    className="category-card"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('productos');
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="category-icon">{getCategoryIcon(categoria.nombre)}</div>
                    <h3 className="category-name">{categoria.nombre}</h3>
                    <p className="category-count">
                      {categoria.descripcion || 'Productos disponibles'}
                    </p>
                  </div>
                );
              })
            ) : (
              // Categorías por defecto si no hay datos
              <>
                <div className="category-card">
                  <div className="category-icon">🥕</div>
                  <h3 className="category-name">Verduras</h3>
                  <p className="category-count">Productos frescos</p>
                </div>
                <div className="category-card">
                  <div className="category-icon">🍎</div>
                  <h3 className="category-name">Frutas</h3>
                  <p className="category-count">Productos frescos</p>
                </div>
                <div className="category-card">
                  <div className="category-icon">🌾</div>
                  <h3 className="category-name">Granos</h3>
                  <p className="category-count">Productos frescos</p>
                </div>
                <div className="category-card">
                  <div className="category-icon">🥛</div>
                  <h3 className="category-name">Lácteos</h3>
                  <p className="category-count">Productos frescos</p>
                </div>
                <div className="category-card">
                  <div className="category-icon">🥩</div>
                  <h3 className="category-name">Carnes</h3>
                  <p className="category-count">Productos frescos</p>
                </div>
                <div className="category-card">
                  <div className="category-icon">🎨</div>
                  <h3 className="category-name">Artesanías</h3>
                  <p className="category-count">Productos locales</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action Final */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">
              Comienza Tu Experiencia AgroStock Hoy
            </h2>
            <p className="cta-description">
              Únete a miles de colombianos que ya disfrutan de productos frescos del campo
            </p>
            <div className="cta-actions">
              <Button 
                variant="primary" 
                size="large"
                onClick={() => setShowAuthModal(true)}
              >
                Crear Cuenta Gratis
              </Button>
              <Button 
                variant="secondary" 
                size="large"
                onClick={() => {
                  const productosSection = document.getElementById('productos');
                  productosSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Explorar Productos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <AgroStockLogo size="medium" variant="full" />
              <p className="footer-description">
                Conectando el campo colombiano con tu hogar. 
                Productos frescos, comercio justo.
              </p>
            </div>

            <div className="footer-section">
              <h4 className="footer-title">Compañía</h4>
              <ul className="footer-links">
                <li><a href="#nosotros">Nosotros</a></li>
                <li><a href="#contacto">Contacto</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#prensa">Prensa</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-title">Soporte</h4>
              <ul className="footer-links">
                <li><a href="#ayuda">Centro de Ayuda</a></li>
                <li><a href="#terminos">Términos y Condiciones</a></li>
                <li><a href="#privacidad">Política de Privacidad</a></li>
                <li><a href="#faq">Preguntas Frecuentes</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-title">Contacto</h4>
              <ul className="footer-contact">
                <li>📧 info@agrostock.co</li>
                <li>📱 +57 300 123 4567</li>
                <li>📍 Bogotá, Colombia</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2024 AgroStock. Todos los derechos reservados.</p>
            <div className="footer-social">
              <a href="#facebook" className="social-link">Facebook</a>
              <a href="#instagram" className="social-link">Instagram</a>
              <a href="#twitter" className="social-link">Twitter</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Autenticación */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowAuthModal(false)}
            >
              ✕
            </button>

            <div className="auth-tabs">
              <button
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                Iniciar Sesión
              </button>
              <button
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                Registrarse
              </button>
            </div>

              {isLogin ? (
                <form onSubmit={handleLogin} className="auth-form">
                <h2>Bienvenido de Nuevo</h2>
                <p className="form-subtitle">Ingresa a tu cuenta AgroStock</p>

                <div className="form-group">
                  <label>Email</label>
                  <Input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                  
                <div className="form-group">
                  <label>Contraseña</label>
                  <Input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
                  
                  <Button
                    type="submit"
                    variant="primary"
                  fullWidth
                  loading={loading}
                  >
                  Iniciar Sesión
                  </Button>

                <p className="auth-link">
                  ¿Olvidaste tu contraseña?{' '}
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    mostrarToast('Función de recuperación disponible próximamente', 'success');
                  }}>
                    Recuperar
                  </a>
                </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="auth-form">
                <h2>Únete a AgroStock</h2>
                <p className="form-subtitle">Crea tu cuenta y comienza a comprar o vender</p>

                <div className="form-group">
                  <label>Nombre Completo</label>
                  <Input
                    type="text"
                    value={registerData.nombre}
                    onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                  
                <div className="form-group">
                  <label>Email</label>
                  <Input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <Input
                    type="tel"
                    value={registerData.telefono}
                    onChange={(e) => setRegisterData({ ...registerData, telefono: e.target.value })}
                    placeholder="+57 300 123 4567"
                    required
                  />
                </div>
                  
                <div className="form-group">
                  <label>Dirección</label>
                  <Input
                    type="text"
                    value={registerData.direccion}
                    onChange={(e) => setRegisterData({ ...registerData, direccion: e.target.value })}
                    placeholder="Calle 123 #45-67"
                    required
                  />
                </div>
                  
                  <div className="form-group">
                  <label>Ciudad</label>
                    <select
                    className="input"
                      value={registerData.id_ciudad || ''}
                      onChange={(e) => setRegisterData({ ...registerData, id_ciudad: e.target.value ? Number(e.target.value) : null })}
                      required
                  >
                    <option value="">Selecciona una ciudad</option>
                    {ciudades.map((ciudad) => (
                      <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                        {ciudad.nombre}
                      </option>
                    ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                  <label>Rol</label>
                  <select
                    className="input"
                    value={registerData.rol}
                          onChange={(e) => setRegisterData({ ...registerData, rol: e.target.value as 'consumidor' | 'productor' })}
                  >
                    <option value="consumidor">Consumidor</option>
                    <option value="productor">Productor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Contraseña</label>
                  <Input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label>Confirmar Contraseña</label>
                  <Input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    placeholder="Repite tu contraseña"
                    required
                  />
                  </div>
                  
                  <Button
                    type="submit"
                    variant="primary"
                  fullWidth
                  loading={loading}
                  >
                  Crear Cuenta
                  </Button>

                <p className="auth-link">
                  ¿Ya tienes cuenta?{' '}
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    setIsLogin(true);
                  }}>
                    Inicia Sesión
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}

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

export default WelcomeProfessional;