import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import PublicLayout from './components/layout/PublicLayout';
import PrivateLayout from './components/layout/PrivateLayout';
import ConsumerLayout from './components/layout/ConsumerLayout';
import ProductorLayout from './components/layout/ProductorLayout';
import LoadingScreen from './components/LoadingScreen';
import MantenimientoScreen from './components/MantenimientoScreen';
import { useMantenimiento } from './hooks/useMantenimiento';

// Páginas públicas
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductosPage from './pages/ProductosPage';
import ProductoDetailPage from './pages/ProductoDetailPage';
import TestPage from './pages/TestPage';
import TerminosCondicionesPage from './pages/TerminosCondicionesPage';
import ComoVenderPage from './pages/ComoVenderPage';
import BeneficiosPage from './pages/BeneficiosPage';
import RecursosPage from './pages/RecursosPage';
import SoportePage from './pages/SoportePage';

// Páginas de consumidor
import ConsumidorDashboard from './Screens/CONSUMIDOR/Dashboard';
import CarritoPage from './pages/consumidor/CarritoPage';
import ListaDeseosPage from './pages/consumidor/ListaDeseosPage';
import PedidosPage from './pages/consumidor/PedidosPage';
import PedidoDetailPage from './pages/consumidor/PedidoDetailPage';
import ConsumidorPerfilPage from './pages/consumidor/PerfilPage';
import ConsumidorMensajesPage from './pages/consumidor/MensajesPage';

// Páginas de productor
import ProductorDashboard from './Screens/PRODUCTOR/Dashboard';
import ProductorProductosPage from './pages/productor/ProductosPage';
import ProductorPedidosPage from './pages/productor/PedidosPage';
import ProductorMensajesPage from './pages/productor/MensajesPage';
import ProductorEstadisticasPage from './pages/productor/EstadisticasPage';
import PerfilPage from './pages/productor/PerfilPage';
import NuevoProductoPage from './pages/productor/NuevoProductoPage';
import EditarProductoPage from './pages/productor/EditarProductoPage';

// Páginas compartidas
import NotificacionesPage from './pages/NotificacionesPage';

// Páginas de admin
import { AdminDashboard } from './Screens/ADMIN/Dashboard';

// Función helper para obtener el dashboard según el rol
const getDashboardPath = (rol?: string): string => {
  switch (rol) {
    case 'admin':
      return '/admin/dashboard';
    case 'productor':
      return '/productor/dashboard';
    case 'consumidor':
      return '/consumidor/dashboard'; // Consumidores van a su dashboard
    default:
      return '/login';
  }
};

// Componente para proteger rutas públicas (redirige si está autenticado, excepto consumidores en home)
const PublicRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // Si está autenticado y NO es consumidor, redirigir a su dashboard
  // Los consumidores pueden estar en el home
  if (isAuthenticated && user && user.rol !== 'consumidor') {
    return <Navigate to={getDashboardPath(user.rol)} replace />;
  }
  
  return <>{children}</>;
};

// Componente interno que usa el contexto
const AppRoutes: React.FC = () => {
  // TODOS LOS HOOKS DEBEN IR PRIMERO, ANTES DE CUALQUIER RETURN CONDICIONAL
  const { isAuthenticated, user, isLoading } = useAuth();
  const { isMantenimiento, loading: mantenimientoLoading } = useMantenimiento();
  const location = useLocation();
  const [showLoading, setShowLoading] = React.useState(true);

  // Forzar renderizado después de máximo 300ms - NO BLOQUEAR
  React.useEffect(() => {
    const forceTimeout = setTimeout(() => {
      console.log('⏰ Forzando renderizado después de timeout');
      setShowLoading(false);
    }, 300);
    return () => clearTimeout(forceTimeout);
  }, []);

  // También actualizar cuando isLoading cambie
  React.useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
    }
  }, [isLoading]);
  
  // Log para debug
  console.log('🔄 AppRoutes renderizando:', { 
    isLoading, 
    isAuthenticated, 
    hasUser: !!user,
    isMantenimiento,
    mantenimientoLoading
  });
  
  // AHORA SÍ PODEMOS HACER RETURNS CONDICIONALES DESPUÉS DE TODOS LOS HOOKS
  // Esperar a que se verifique el estado de mantenimiento antes de renderizar
  // Esto es crítico para mostrar la pantalla de mantenimiento inmediatamente
  if (mantenimientoLoading) {
    console.log('⏳ Esperando verificación de mantenimiento...');
    return <LoadingScreen />;
  }

  // Si el sistema está en mantenimiento, mostrar pantalla de mantenimiento
  // Los admins pueden seguir navegando normalmente (para poder desactivar el mantenimiento)
  // Todos los demás usuarios (incluidos no autenticados) ven la pantalla de mantenimiento
  if (isMantenimiento) {
    console.log('🚧 Sistema en mantenimiento detectado');
    // Solo los admins pueden seguir navegando durante el mantenimiento
    if (user?.rol === 'admin') {
      console.log('✅ Admin puede seguir navegando durante mantenimiento');
      // El admin puede acceder a todo para poder desactivar el mantenimiento
    } else {
      // Para todos los demás usuarios (incluidos no autenticados), mostrar pantalla de mantenimiento
      console.log('🚧 Usuario no admin en mantenimiento, mostrando pantalla');
      return <MantenimientoScreen />;
    }
  } else {
    console.log('✅ Sistema operativo, no hay mantenimiento');
  }

  // NO bloquear el renderizado - mostrar siempre algo
  if (isLoading && showLoading) {
    console.log('⏳ Mostrando LoadingScreen brevemente...');
    return <LoadingScreen />;
  }

  console.log('✅ Renderizando rutas, isLoading:', isLoading);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Rutas públicas - Con PublicLayout (Navbar + Footer) */}
        <Route element={<PublicLayout />}>
          {/* Home - Accesible para todos, especialmente consumidores */}
          <Route path="/" element={<HomePage />} />
          
          {/* Rutas que requieren NO estar autenticado (login, register) */}
          <Route 
            path="/login" 
            element={
              <PublicRouteGuard>
                <LoginPage />
              </PublicRouteGuard>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRouteGuard>
                <RegisterPage />
              </PublicRouteGuard>
            } 
          />
          
          {/* Rutas públicas accesibles para todos (incluso autenticados) */}
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/productos/:id" element={<ProductoDetailPage />} />
          <Route path="/test" element={<TestPage />} />
          {/* Rutas públicas de carrito y lista de deseos */}
          <Route path="/carrito" element={<CarritoPage />} />
          <Route path="/lista-deseos" element={<ListaDeseosPage />} />
          {/* Rutas de información y soporte */}
          <Route path="/terminos-condiciones" element={<TerminosCondicionesPage />} />
          <Route path="/como-vender" element={<ComoVenderPage />} />
          <Route path="/beneficios" element={<BeneficiosPage />} />
          <Route path="/recursos" element={<RecursosPage />} />
          <Route path="/soporte" element={<SoportePage />} />
        </Route>

      {/* Rutas de consumidor - Todas con el mismo layout (sidebar, sin navbar) */}
      <Route
        path="/consumidor/*"
        element={
          <ProtectedRoute allowedRoles={['consumidor', 'admin']}>
            <ConsumerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ConsumidorDashboard />} />
        <Route path="carrito" element={<CarritoPage />} />
        <Route path="lista-deseos" element={<ListaDeseosPage />} />
        <Route path="pedidos" element={<PedidosPage />} />
        <Route path="pedidos/:id" element={<PedidoDetailPage />} />
        <Route path="perfil" element={<ConsumidorPerfilPage />} />
        <Route path="mensajes" element={<ConsumidorMensajesPage />} />
      </Route>

      {/* Rutas protegidas con PrivateLayout (sin navbar) - Dashboards */}
      <Route element={<PrivateLayout />}>
        {/* Dashboard según rol */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navigate to={getDashboardPath(user?.rol)} replace />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Rutas de productor - Todas con ProductorLayout (sidebar, sin navbar) */}
      <Route
        path="/productor/*"
        element={
          <ProtectedRoute allowedRoles={['productor', 'admin']}>
            <ProductorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ProductorDashboard />} />
        <Route path="productos" element={<ProductorProductosPage />} />
        <Route path="productos/nuevo" element={<NuevoProductoPage />} />
        <Route path="productos/:id/editar" element={<EditarProductoPage />} />
        <Route path="pedidos" element={<ProductorPedidosPage />} />
        <Route path="mensajes" element={<ProductorMensajesPage />} />
        <Route path="estadisticas" element={<ProductorEstadisticasPage />} />
        <Route path="perfil" element={<PerfilPage />} />
      </Route>

      {/* Rutas de admin - SIN PrivateLayout, usa su propio layout interno */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="usuarios" element={<AdminDashboard />} />
              <Route path="productos" element={<AdminDashboard />} />
              <Route path="pedidos" element={<AdminDashboard />} />
              <Route path="categorias" element={<AdminDashboard />} />
              <Route path="resenas" element={<AdminDashboard />} />
              <Route path="notificaciones" element={<AdminDashboard />} />
              <Route path="estadisticas" element={<AdminDashboard />} />
              <Route path="configuracion" element={<AdminDashboard />} />
              <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Notificaciones para consumidor - ConsumerLayout (sin navbar) */}
      <Route
        path="/notificaciones"
        element={
          <ProtectedRoute allowedRoles={['consumidor']}>
            <ConsumerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<NotificacionesPage />} />
      </Route>

      {/* Notificaciones para productor - ProductorLayout (sin navbar) */}
      <Route
        path="/notificaciones"
        element={
          <ProtectedRoute allowedRoles={['productor']}>
            <ProductorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<NotificacionesPage />} />
      </Route>

      {/* Rutas protegidas con MainLayout (con navbar) - Solo para admin */}
      <Route element={<MainLayout />}>
        {/* Notificaciones para admin (con navbar) */}
        <Route
          path="/notificaciones"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <NotificacionesPage />
            </ProtectedRoute>
          }
        />
      </Route>

        {/* Ruta 404 - Redirigir según autenticación */}
        <Route 
          path="*" 
          element={
            isAuthenticated && user ? (
              user.rol === 'consumidor' ? (
                <Navigate to="/" replace />
              ) : (
                <Navigate to={getDashboardPath(user.rol)} replace />
              )
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
      </Routes>
    </Suspense>
  );
};

// Componente principal
const App: React.FC = () => {
  console.log('🚀 App component renderizando...');
  
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
