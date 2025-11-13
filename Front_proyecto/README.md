# 🌾 AgroStock - E-commerce Agrícola

## 📋 Descripción

AgroStock es una plataforma de e-commerce especializada en productos agrícolas que conecta a campesinos, productores y consumidores en Colombia. La aplicación cuenta con un sistema robusto de roles, gestión de productos, y funcionalidades específicas para el sector agrícola.

## 🚀 Inicio Rápido

### Prerrequisitos
- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **npm** - Viene incluido con Node.js
- **Deno 1.40+** - [Instalar Deno](https://deno.land/install)
- **MySQL/MariaDB** - Para la base de datos

### Instalación Automática
```bash
# Clonar el repositorio
git clone <repository-url>
cd proyecto

# Ejecutar script automático
# Linux/Mac:
chmod +x start_agrostock.sh
./start_agrostock.sh

# Windows:
start_agrostock.bat
```

### Instalación Manual

#### 1. Configurar Base de Datos
```bash
# Crear base de datos y usuarios de prueba
mysql -u root -p < setup_database.sql
```

#### 2. Instalar Dependencias del Frontend
```bash
cd Front_proyecto
npm install
```

#### 3. Configurar Variables de Entorno
```bash
# Crear archivo .env
cp env.example .env
# Editar .env con tus configuraciones
```

#### 4. Iniciar Servicios

**Terminal 1 - API:**
```bash
cd api_agrostock
deno run --allow-all api_movil/app.ts
```

**Terminal 2 - Frontend:**
```bash
cd Front_proyecto
npm run dev
```

## 🌐 URLs de Acceso

- **Frontend:** http://localhost:5173
- **API:** http://localhost:5000

## 🔐 Credenciales de Prueba

### Administrador
- **Email:** admin@agrostock.com
- **Password:** password

### Productor
- **Email:** juan@productor.com
- **Password:** password

### Consumidor
- **Email:** maria@consumidor.com
- **Password:** password

## 🌟 Características de la Pantalla Profesional

### ✨ Diseño Empresarial
- **Navbar fijo** con navegación completa y logo animado
- **Hero section impactante** con estadísticas en tiempo real
- **Modal de autenticación elegante** con animaciones suaves
- **Diseño responsive** adaptable a todos los dispositivos
- **Gradientes profesionales** con colores naturales

### 🔐 Sistema de Autenticación Avanzado
- **Login integrado** con validación en tiempo real
- **Registro completo** con selección de rol (Consumidor/Productor)
- **Validación robusta** de campos con mensajes claros
- **Integración con base de datos** MySQL/MariaDB
- **Autenticación JWT** con renovación automática

### 📊 Secciones Informativas Completas
- **Beneficios clave** con iconos y descripciones
- **Categorías especializadas** con estadísticas de productos
- **Productos destacados** con ratings y badges
- **Testimonios reales** de agricultores satisfechos
- **Footer completo** con información de contacto

### 🎯 Experiencia de Usuario Premium
- **Navegación intuitiva** con breadcrumbs
- **Animaciones CSS** suaves y profesionales
- **Toast notifications** para feedback inmediato
- **Estados de carga** durante operaciones
- **Navegación automática** según el rol del usuario

## 🏗️ Arquitectura del Frontend

### Estructura de Carpetas

```
Front_proyecto/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ReusableComponents.tsx
│   │   ├── ReusableComponents.css
│   │   └── Navigation.tsx
│   ├── contexts/            # Contextos de React
│   │   └── AuthContext.tsx
│   ├── hooks/               # Hooks personalizados
│   │   └── index.ts
│   ├── services/            # Servicios de API
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── admin.ts
│   ├── types/               # Tipos TypeScript
│   │   └── index.ts
│   ├── config/              # Configuración
│   │   └── index.ts
│   ├── Screens/             # Pantallas de la aplicación
│   │   ├── Welcome.tsx
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   └── Registrar.tsx
│   │   ├── ADMIN/
│   │   │   └── Dashboard.tsx
│   │   ├── PRODUCTOR/
│   │   │   └── Dashboard.tsx
│   │   └── CONSUMIDOR/
│   │       └── Dashboard.tsx
│   ├── App.tsx              # Componente principal
│   └── main.tsx             # Punto de entrada
├── package.json
├── vite.config.ts
└── env.example
```

## 🚀 Características Principales

### ✅ Implementado

- **🏗️ Arquitectura Escalable**: Estructura modular y mantenible
- **🔐 Sistema de Autenticación**: JWT con contexto global
- **👨‍💼 Dashboard de Admin**: Gestión completa de usuarios
- **🎨 Componentes Reutilizables**: UI consistente y profesional
- **🎣 Hooks Personalizados**: Lógica reutilizable
- **📱 Responsive Design**: Adaptable a todos los dispositivos
- **🛡️ TypeScript**: Tipado fuerte y seguro

### 🔄 En Desarrollo

- **🌱 Dashboard de Productor**: Gestión de productos y ventas
- **🛒 Dashboard de Consumidor**: Carrito y compras
- **📊 Sistema de Reportes**: Gestión de reportes y moderación
- **📈 Analytics**: Métricas y estadísticas avanzadas

## 🛠️ Tecnologías Utilizadas

- **React 19** - Framework principal
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **CSS3** - Estilos personalizados
- **Fetch API** - Comunicación con backend

## 📦 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- API de AgroStock funcionando

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd Front_proyecto
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp env.example .env
# Editar .env con tus configuraciones
```

4. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:5173
```

## 🔧 Configuración

### Variables de Entorno

```env
# URL de la API
VITE_API_URL=http://localhost:5000

# Configuración de desarrollo
VITE_ENABLE_MOCK=false
VITE_DEBUG_MODE=true

# Configuración de la aplicación
VITE_APP_NAME=AgroStock
VITE_APP_VERSION=1.0.0
```

### Configuración de la API

El frontend se conecta a la API de AgroStock que debe estar ejecutándose en el puerto 5000 por defecto. Asegúrate de que:

1. La API esté funcionando
2. CORS esté configurado correctamente
3. Las rutas de autenticación estén disponibles

## 🎯 Funcionalidades por Rol

### 👨‍💼 Administrador

- **Dashboard Completo**: Métricas y estadísticas generales
- **Gestión de Usuarios**: Crear, editar, eliminar usuarios
- **Gestión de Productos**: Moderar y administrar productos
- **Gestión de Reportes**: Resolver reportes y moderación
- **Estadísticas**: Análisis de la plataforma

### 🌱 Productor

- **Panel de Productos**: Gestionar inventario
- **Gestión de Pedidos**: Ver y procesar pedidos
- **Comunicación**: Mensajes con consumidores
- **Estadísticas**: Métricas de ventas

### 🛒 Consumidor

- **Exploración**: Buscar y filtrar productos
- **Carrito**: Gestión de compras
- **Pedidos**: Historial y seguimiento
- **Comunicación**: Contactar productores

## 🧩 Componentes Principales

### Componentes Reutilizables

- **Button**: Botones con variantes y estados
- **Input**: Campos de entrada con validación
- **Card**: Tarjetas de contenido
- **Modal**: Ventanas modales
- **Loading**: Estados de carga
- **Toast**: Notificaciones
- **Badge**: Etiquetas de estado
- **Avatar**: Imágenes de perfil

### Hooks Personalizados

- **useApi**: Manejo de llamadas a la API
- **useForm**: Gestión de formularios
- **usePagination**: Paginación de datos
- **useDebounce**: Optimización de búsquedas
- **useLocalStorage**: Persistencia local

## 🔐 Sistema de Autenticación

### Flujo de Autenticación

1. **Login**: Credenciales → JWT Token
2. **Almacenamiento**: Token en localStorage
3. **Contexto**: Estado global del usuario
4. **Verificación**: Validación automática del token
5. **Logout**: Limpieza de datos locales

### Roles y Permisos

- **admin**: Acceso completo al sistema
- **productor**: Gestión de productos y ventas
- **consumidor**: Compra y comunicación

## 📱 Responsive Design

La aplicación está diseñada para funcionar en:

- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: 320px - 767px

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## 🐛 Debugging

### Herramientas de Desarrollo

- **React DevTools**: Inspección de componentes
- **Redux DevTools**: Estado de la aplicación
- **Network Tab**: Monitoreo de API calls
- **Console Logs**: Logs de desarrollo

### Logs de Desarrollo

Los logs están habilitados en modo desarrollo. Para deshabilitarlos:

```env
VITE_DEBUG_MODE=false
```

## 🔄 Integración con la API

### Endpoints Principales

- **Autenticación**: `/auth/*`
- **Usuarios**: `/usuarios/*`
- **Productos**: `/productos/*`
- **Administración**: `/admin/*`

### Manejo de Errores

- **Errores de Red**: Reintentos automáticos
- **Errores de API**: Mensajes descriptivos
- **Errores de Validación**: Feedback inmediato

## 📈 Performance

### Optimizaciones Implementadas

- **Lazy Loading**: Carga bajo demanda
- **Debouncing**: Optimización de búsquedas
- **Memoización**: Evitar re-renders innecesarios
- **Code Splitting**: División del código

## 🧪 Testing

### Estrategia de Testing

- **Unit Tests**: Componentes individuales
- **Integration Tests**: Flujos completos
- **E2E Tests**: Casos de uso reales

## 🚀 Deployment

### Build de Producción

```bash
npm run build
```

### Variables de Producción

```env
VITE_API_URL=https://api.agrostock.com
VITE_DEBUG_MODE=false
VITE_ENABLE_MOCK=false
```

## 🤝 Contribución

### Estándares de Código

- **TypeScript**: Tipado estricto
- **ESLint**: Linting automático
- **Prettier**: Formato consistente
- **Conventional Commits**: Mensajes descriptivos

### Flujo de Trabajo

1. Fork del repositorio
2. Crear rama feature
3. Implementar cambios
4. Tests y linting
5. Pull request

## 📞 Soporte

Para soporte técnico o preguntas:

- **Email**: soporte@agrostock.com
- **Documentación**: [docs.agrostock.com](https://docs.agrostock.com)
- **Issues**: GitHub Issues

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**AgroStock** - Conectando el campo con la tecnología 🌾