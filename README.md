# 🌾 AgroStock - Plataforma E-commerce Agrícola

## 📋 Descripción General

AgroStock es una plataforma completa de e-commerce especializada en productos agrícolas que conecta directamente a productores con consumidores en Colombia. La aplicación cuenta con un sistema robusto de roles, gestión de productos, carrito de compras, sistema de pagos integrado con Stripe, notificaciones en tiempo real, y funcionalidades específicas para el sector agrícola.

### 🎯 Objetivo Principal

Facilitar la comercialización de productos agrícolas frescos directamente del campo a la mesa, eliminando intermediarios y apoyando a los productores locales colombianos.

---

## 🚀 Inicio Rápido

### Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **npm** - Viene incluido con Node.js
- **Deno 1.40+** - [Instalar Deno](https://deno.land/install)
- **MySQL/MariaDB 8.0+** - Para la base de datos
- **Git** - Para clonar el repositorio

### Instalación Paso a Paso

#### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd ProyectoAS
```

#### 2. Configurar la Base de Datos

```bash
# Conectarse a MySQL
mysql -u root -p

# Crear la base de datos
CREATE DATABASE agrostock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Salir de MySQL
exit

# Importar el esquema de la base de datos
mysql -u root -p agrostock < agrostock\ \(1\).sql
```

#### 3. Configurar el Backend (API)

```bash
cd api_movil

# Crear archivo .env (si no existe)
# Copiar el contenido necesario desde las variables de entorno del sistema

# Las variables de entorno necesarias son:
# - DB_HOST=localhost
# - DB_USER=root
# - DB_PASSWORD=tu_password
# - DB_NAME=agrostock
# - JWT_SECRET=tu_secret_key_muy_segura
# - PORT=5000
# - STRIPE_SECRET_KEY=sk_test_... (para pagos con tarjeta)
# - STRIPE_PUBLISHABLE_KEY=pk_test_... (para pagos con tarjeta)
# - WEBHOOK_SECRET=whsec_... (para webhooks de Stripe)
```

#### 4. Instalar Dependencias del Frontend

```bash
cd ../Front_proyecto
npm install
```

#### 5. Configurar Variables de Entorno del Frontend

```bash
# Crear archivo .env en Front_proyecto/
cp env.example .env

# Editar .env con tus configuraciones:
# VITE_API_BASE_URL=http://localhost:5000
```

#### 6. Iniciar los Servicios

**Terminal 1 - Backend (API):**
```bash
cd api_movil
deno task dev
# O manualmente:
deno run --allow-net --allow-read --allow-write --allow-env app.ts
```

**Terminal 2 - Frontend:**
```bash
cd Front_proyecto
npm run dev
```

### 🌐 URLs de Acceso

Una vez iniciados los servicios:

- **Frontend:** http://localhost:5173
- **API Backend:** http://localhost:5000
- **API Docs:** http://localhost:5000/docs (si está configurado)



## 📁 Estructura del Proyecto

```
ProyectoAS/
├── api_movil/                    # Backend (Deno + Oak)
│   ├── Controller/               # Controladores de rutas
│   │   ├── AdminController.ts
│   │   ├── AuthController.ts
│   │   ├── ProductosController.ts
│   │   ├── PedidosController.ts
│   │   ├── CartController.ts
│   │   ├── PaymentController.ts
│   │   └── ...
│   ├── Models/                    # Modelos de datos
│   │   ├── Conexion.ts           # Configuración de BD
│   │   ├── ProductosModel.ts
│   │   ├── UsuariosModel.ts
│   │   ├── PedidosModel.ts
│   │   └── ...
│   ├── Services/                  # Lógica de negocio
│   │   ├── CartService.ts
│   │   ├── PaymentService.ts
│   │   ├── EmailService.ts
│   │   └── ...
│   ├── Routers/                   # Definición de rutas
│   │   ├── AuthRouter.ts
│   │   ├── ProductosRouter.ts
│   │   └── ...
│   ├── Middlewares/               # Middlewares
│   │   ├── AuthMiddleware.ts
│   │   └── ...
│   ├── Dependencies/              # Dependencias centralizadas
│   │   └── dependencias.ts
│   ├── uploads/                   # Archivos subidos
│   │   ├── productos/
│   │   └── usuarios/
│   ├── app.ts                     # Punto de entrada
│   └── deno.json                  # Configuración Deno
│
├── Front_proyecto/                # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/            # Componentes reutilizables
│   │   │   ├── layout/           # Layouts (Navbar, Sidebar, etc.)
│   │   │   └── ...
│   │   ├── pages/                 # Páginas de la aplicación
│   │   │   ├── HomePage.tsx
│   │   │   ├── ProductosPage.tsx
│   │   │   ├── consumidor/       # Páginas del consumidor
│   │   │   ├── productor/         # Páginas del productor
│   │   │   └── admin/             # Páginas del admin
│   │   ├── Screens/               # Pantallas principales
│   │   │   ├── Auth/
│   │   │   ├── ADMIN/
│   │   │   ├── PRODUCTOR/
│   │   │   └── CONSUMIDOR/
│   │   ├── services/              # Servicios de API
│   │   │   ├── api.ts             # Servicio base
│   │   │   ├── auth.ts
│   │   │   ├── productos.ts
│   │   │   ├── pedidos.ts
│   │   │   └── ...
│   │   ├── contexts/              # Contextos de React
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/                 # Hooks personalizados
│   │   ├── types/                 # Tipos TypeScript
│   │   ├── utils/                 # Utilidades
│   │   │   ├── errorHandler.ts
│   │   │   └── ...
│   │   ├── config/                # Configuración
│   │   ├── App.tsx                # Componente principal
│   │   └── main.tsx               # Punto de entrada
│   ├── public/                    # Archivos estáticos
│   ├── package.json
│   └── vite.config.ts
│
└── agrostock (1).sql              # Script de base de datos
```

---

## 🎯 Funcionalidades Principales

### 👤 Sistema de Usuarios y Roles

#### Administrador
- ✅ Gestión completa de usuarios (crear, editar, eliminar)
- ✅ Gestión de categorías de productos
- ✅ Gestión de regiones, departamentos y ciudades
- ✅ Ver todos los pedidos del sistema
- ✅ Ver reportes y estadísticas globales
- ✅ Moderación de contenido
- ✅ Gestión de alertas de stock

#### Productor
- ✅ Crear, editar y eliminar productos
- ✅ Subir imágenes de productos
- ✅ Gestionar stock y precios
- ✅ Ver pedidos recibidos
- ✅ Actualizar estado de pedidos (excepto estado de pago si es tarjeta)
- ✅ Ver estadísticas de ventas
- ✅ Gestionar alertas de stock bajo
- ✅ Comunicarse con consumidores

#### Consumidor
- ✅ Explorar catálogo de productos (solo disponibles)
- ✅ Agregar productos al carrito
- ✅ Gestionar lista de deseos
- ✅ Realizar pedidos
- ✅ Pagar con múltiples métodos (tarjeta, Nequi, Daviplata, PSE, efectivo)
- ✅ Ver historial de pedidos
- ✅ Ver notificaciones
- ✅ Comunicarse con productores
- ✅ Dejar reseñas

### 🛍️ Sistema de Productos

- **Catálogo Público:** Los consumidores solo ven productos disponibles
- **Gestión Completa:** Productores pueden gestionar todos sus productos
- **Imágenes:** Soporte para imagen principal e imágenes adicionales
- **Categorías:** Organización por categorías
- **Búsqueda:** Búsqueda por nombre, categoría, precio, ubicación
- **Filtros:** Filtros avanzados por múltiples criterios
- **Stock:** Control de stock y alertas de stock bajo

### 🛒 Sistema de Carrito

- **Carrito Persistente:** Se guarda en la base de datos
- **Validación Automática:** Elimina productos no disponibles automáticamente
- **Actualización de Precios:** Los precios se actualizan automáticamente
- **Agrupación por Productor:** Los pedidos se agrupan por productor
- **Expiración:** El carrito expira después de 24 horas

### 💳 Sistema de Pagos

#### Métodos de Pago Soportados

1. **Tarjeta de Crédito/Débito (Stripe)**
   - Integración completa con Stripe
   - Procesamiento seguro
   - El estado de pago se actualiza automáticamente
   - **No se puede modificar manualmente desde el panel del productor**

2. **Efectivo**
   - Pago en efectivo al momento de la entrega
   - El productor puede actualizar el estado de pago

### 📦 Sistema de Pedidos

- **Estados del Pedido:**
  - `pendiente` - Pedido creado, esperando confirmación
  - `confirmado` - Pedido confirmado por el productor
  - `en_preparacion` - Productor está preparando el pedido
  - `en_camino` - Pedido en tránsito
  - `entregado` - Pedido entregado
  - `cancelado` - Pedido cancelado

- **Estados de Pago:**
  - `pendiente` - Pago pendiente
  - `pagado` - Pago completado
  - `reembolsado` - Pago reembolsado

- **Restricciones:**
  - Si el método de pago es `tarjeta`, el productor **NO puede** modificar el estado de pago
  - Solo el sistema (Stripe webhook) puede actualizar el estado de pago de pagos con tarjeta

### 🔔 Sistema de Notificaciones

- **Notificaciones en Tiempo Real:** Actualizaciones automáticas
- **Notificaciones por Rol:** Cada rol recibe notificaciones relevantes
- **Notificaciones en Home:** Los consumidores ven notificaciones en la página de inicio
- **Marcar como Leídas:** Sistema de lectura de notificaciones
- **Tipos de Notificaciones:**
  - Nuevos pedidos
  - Cambios de estado de pedidos
  - Actualizaciones de productos
  - Alertas de stock bajo
  - Mensajes nuevos

### 📊 Sistema de Reportes

- **Reportes de Ventas:** Para productores
- **Reportes de Compras:** Para consumidores
- **Reportes Globales:** Para administradores
- **Exportación:** Exportar a PDF, Excel, PowerPoint

---

## 🔌 API Endpoints Principales

### Autenticación

```
POST   /auth/login              # Iniciar sesión
POST   /auth/register           # Registrar nuevo usuario
POST   /auth/forgot-password   # Recuperar contraseña
POST   /auth/reset-password    # Restablecer contraseña
GET    /auth/me                # Obtener usuario actual
```

### Productos

```
GET    /productos              # Listar productos (filtrado por rol)
GET    /productos/:id          # Obtener producto por ID
POST   /productos              # Crear producto (productor/admin)
PUT    /productos/:id          # Actualizar producto (productor/admin)
DELETE /productos/:id         # Eliminar producto (productor/admin)
GET    /productos/usuario/:id # Productos de un usuario
```

### Carrito

```
GET    /cart                   # Obtener carrito del usuario
POST   /cart/add               # Agregar producto al carrito
PUT    /cart/item/:id          # Actualizar cantidad
DELETE /cart/item/:id         # Eliminar item del carrito
POST   /cart/checkout         # Convertir carrito en pedido
```

### Pedidos

```
GET    /pedidos                # Listar pedidos (filtrado por rol)
GET    /pedidos/:id           # Obtener pedido por ID
POST   /pedidos               # Crear pedido
PUT    /pedidos/:id           # Actualizar pedido
GET    /pedidos/mis-pedidos   # Mis pedidos (productor/consumidor)
```

### Pagos

```
POST   /pagos                  # Crear pago
POST   /pagos/stripe/create-intent  # Crear intent de pago Stripe
POST   /pagos/stripe/confirm   # Confirmar pago Stripe
GET    /pagos/pedido/:id      # Obtener pagos de un pedido
```

### Notificaciones

```
GET    /notificaciones         # Obtener mis notificaciones
GET    /notificaciones/contar  # Contar no leídas
PUT    /notificaciones/:id/leer # Marcar como leída
PUT    /notificaciones/leer-todas # Marcar todas como leídas
```

---

## 🛠️ Tecnologías Utilizadas

### Backend

- **Deno 1.40+** - Runtime de JavaScript/TypeScript
- **Oak** - Framework web para Deno
- **MySQL/MariaDB** - Base de datos relacional
- **JWT** - Autenticación con tokens
- **Stripe** - Procesamiento de pagos
- **Zod** - Validación de esquemas

### Frontend

- **React 19** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **React Router** - Enrutamiento
- **React Query (TanStack Query)** - Gestión de estado del servidor
- **Bootstrap 5** - Framework CSS
- **React Icons** - Iconos
- **React Toastify** - Notificaciones
- **Stripe.js** - Integración de pagos en frontend

---

## ⚙️ Configuración Detallada

### Variables de Entorno del Backend

Crear un archivo `.env` en `api_movil/` o configurar variables de entorno del sistema:

```env
# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=agrostock
DB_PORT=3306

# JWT
JWT_SECRET=tu_secret_key_muy_segura_y_larga
JWT_EXPIRES_IN=7d

# Servidor
PORT=5000
NODE_ENV=development

# Stripe (Pagos)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
WEBHOOK_SECRET=whsec_...

# Email (Opcional pero RECOMENDADO para recuperación de contraseña)
# OPCIÓN 1: Resend (RECOMENDADO - Gratis hasta 3,000 emails/mes)
# 1. Regístrate en https://resend.com
# 2. Obtén tu API key en https://resend.com/api-keys
# 3. Usa el dominio de prueba o verifica tu dominio
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=onboarding@resend.dev
SMTP_PASS=re_tu_api_key_de_resend_aqui

# OPCIÓN 2: Gmail SMTP
# 1. Activa verificación en 2 pasos en tu cuenta de Google
# 2. Genera una "App Password" en: https://myaccount.google.com/apppasswords
# 3. Usa esa contraseña (NO tu contraseña normal de Gmail)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=tu_email@gmail.com
# SMTP_PASS=tu_app_password_de_gmail
# SMTP_SECURE=false
```

### Variables de Entorno del Frontend

Crear un archivo `.env` en `Front_proyecto/`:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🐛 Solución de Problemas Comunes

### Error: "No se pudo conectar con el servidor"

**Causa:** El backend no está corriendo o la URL es incorrecta.

**Solución:**
1. Verifica que el backend esté corriendo en el puerto 5000
2. Verifica la variable `VITE_API_BASE_URL` en el frontend
3. Verifica que no haya un firewall bloqueando la conexión

### Error: "Sesión expirada"

**Causa:** El token JWT ha expirado.

**Solución:**
1. Cierra sesión e inicia sesión nuevamente
2. Verifica que el `JWT_SECRET` esté configurado correctamente
3. Verifica que el tiempo de expiración del token sea adecuado

### Error: "No tienes permisos"

**Causa:** El usuario no tiene el rol necesario para realizar la acción.

**Solución:**
1. Verifica que estés usando la cuenta correcta
2. Verifica que el rol del usuario sea el adecuado en la base de datos
3. Contacta al administrador si necesitas permisos adicionales

### Error: "Producto no disponible"

**Causa:** El producto fue marcado como no disponible o se agotó el stock.

**Solución:**
1. Si eres productor, verifica el estado del producto en tu panel
2. Si eres consumidor, el producto se eliminará automáticamente del carrito
3. Busca productos alternativos

### Error al subir imágenes

**Causa:** Problemas con permisos de escritura o tamaño de archivo.

**Solución:**
1. Verifica que la carpeta `uploads/` tenga permisos de escritura
2. Verifica que el tamaño de la imagen no exceda el límite
3. Verifica el formato de la imagen (JPG, PNG)

### Error de conexión a la base de datos

**Causa:** Configuración incorrecta de la base de datos.

**Solución:**
1. Verifica que MySQL esté corriendo
2. Verifica las credenciales en las variables de entorno
3. Verifica que la base de datos `agrostock` exista
4. Verifica que el usuario tenga permisos sobre la base de datos

---

## 📝 Scripts Disponibles

### Backend (Deno)

```bash
# Desarrollo con watch
deno task dev

# Iniciar servidor
deno task start

# Linting
deno task lint

# Formatear código
deno task fmt

# Verificar tipos
deno task check

# Tests
deno task test
```

### Frontend (npm)

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint

# Corregir errores de linting
npm run lint:fix

# Verificar tipos TypeScript
npm run type-check
```

---

## 🔒 Seguridad

### Prácticas Implementadas

- ✅ Autenticación JWT con tokens seguros
- ✅ Validación de datos con Zod
- ✅ Sanitización de inputs
- ✅ Protección contra SQL Injection (consultas parametrizadas)
- ✅ CORS configurado correctamente
- ✅ Variables de entorno para secretos
- ✅ Middleware de autenticación en rutas protegidas
- ✅ Validación de roles y permisos
- ✅ Manejo seguro de archivos subidos

### Recomendaciones para Producción

1. **Cambiar todas las contraseñas por defecto**
2. **Usar HTTPS en producción**
3. **Configurar variables de entorno seguras**
4. **Implementar rate limiting**
5. **Configurar backups automáticos de la base de datos**
6. **Usar claves de Stripe de producción**
7. **Configurar monitoreo y logging**
8. **Implementar validación de email**
9. **Configurar políticas de CORS restrictivas**

---

## 📚 Guía de Uso

### Para Consumidores

1. **Registro/Login:** Crea una cuenta o inicia sesión
2. **Explorar Productos:** Navega por el catálogo de productos disponibles
3. **Agregar al Carrito:** Agrega productos que te interesen
4. **Realizar Pedido:** Procede al checkout y completa el pedido
5. **Pagar:** Elige tu método de pago preferido
6. **Seguimiento:** Revisa el estado de tus pedidos en tu dashboard
7. **Notificaciones:** Mantente al día con las notificaciones en la página de inicio

### Para Productores

1. **Registro/Login:** Crea una cuenta como productor
2. **Crear Productos:** Agrega tus productos con imágenes y descripciones
3. **Gestionar Stock:** Actualiza el stock y precios de tus productos
4. **Ver Pedidos:** Revisa los pedidos recibidos en tu dashboard
5. **Actualizar Estados:** Actualiza el estado de los pedidos según avancen
6. **Comunicación:** Responde mensajes de consumidores
7. **Estadísticas:** Revisa tus ventas y estadísticas

### Para Administradores

1. **Login:** Inicia sesión con credenciales de administrador
2. **Gestión de Usuarios:** Crea, edita o elimina usuarios
3. **Gestión de Categorías:** Organiza las categorías de productos
4. **Gestión de Ubicaciones:** Gestiona regiones, departamentos y ciudades
5. **Moderación:** Revisa y modera contenido del sistema
6. **Reportes:** Genera reportes globales del sistema



## 📈 Performance

### Optimizaciones Implementadas

- ✅ Lazy loading de componentes
- ✅ Code splitting
- ✅ Memoización de componentes
- ✅ Debouncing en búsquedas
- ✅ Paginación de resultados
- ✅ Caché de queries con React Query
- ✅ Optimización de imágenes
- ✅ Consultas SQL optimizadas




## 👥 Autores

- **Equipo AgroStock** - Wilmer Andres Morales, Juan Pablo Barrera, Andres Felipe Saavedra, Lina Daniela Cepeda
---

## 🙏 Agradecimientos

- A todos los productores y consumidores que usan la plataforma
- A la comunidad de desarrolladores de código abierto
- A los contribuidores del proyecto


## 🔄 Changelog

### Versión 1.1.0 (Actual)

#### Funcionalidades

- Sistema completo de autenticación
- Gestión de productos
- Sistema de carrito
- Sistema de pedidos
- Integración con Stripe
- Sistema de notificaciones
- Sistema de reportes
- Gestión de usuarios y roles

---

## 📖 Recursos Adicionales

- [Documentación de Deno](https://deno.land/docs)
- [Documentación de React](https://react.dev)
- [Documentación de Stripe](https://stripe.com/docs)
- [Documentación de MySQL](https://dev.mysql.com/doc/)

---

**¡Gracias por usar AgroStock! 🌾**


