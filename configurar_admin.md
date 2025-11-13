# 🔧 Guía de Configuración del Administrador - AgroStock

Esta guía te ayudará a configurar y hacer funcionar el panel de administración.

## 📋 Requisitos Previos

1. **Base de datos MySQL/MariaDB** configurada y ejecutándose
2. **Deno** instalado (versión 1.40+)
3. **Node.js** instalado (versión 18+)
4. **npm** instalado

## 🚀 Pasos de Configuración

### 1. Configurar Variables de Entorno del Backend

Crea un archivo `.env` en la carpeta `api_movil/`:

```bash
cd api_movil
copy env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# 🔐 Configuración de JWT
JWT_SECRET=mi_clave_secreta_super_segura_para_jwt_2024
JWT_EXPIRES_IN=24h

# 🗄️ Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=agrostock

# 🌐 Configuración del Servidor
PORT=8000
HOST=0.0.0.0
NODE_ENV=development
```

### 2. Configurar Variables de Entorno del Frontend

Crea un archivo `.env` en la carpeta `Front_proyecto/`:

```bash
cd Front_proyecto
copy env.example .env
```

Edita el archivo `.env`:

```env
# URL de la API
VITE_API_URL=http://localhost:8000

# Configuración de desarrollo
VITE_ENABLE_MOCK=false
VITE_DEBUG_MODE=true
```

### 3. Crear Base de Datos

Asegúrate de que la base de datos `agrostock` exista. Si tienes el archivo SQL:

```bash
mysql -u root -p < agrostock.sql
```

O crea la base de datos manualmente:

```sql
CREATE DATABASE agrostock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Crear Usuario Administrador

Si no tienes un usuario administrador, puedes crearlo directamente en la base de datos:

```sql
USE agrostock;

-- Nota: La contraseña debe estar hasheada. Por ahora, puedes usar el endpoint de registro
-- o crear el usuario manualmente con una contraseña hasheada.

-- Ejemplo (requiere que la contraseña esté hasheada con bcrypt):
-- INSERT INTO usuarios (nombre, email, password, telefono, direccion, id_ciudad, rol, activo, email_verificado)
-- VALUES ('Admin', 'admin@agrostock.com', '$2b$12$...', '1234567890', 'Dirección', 1, 'admin', 1, 1);
```

**Recomendación**: Usa el endpoint de registro o el panel de administración para crear usuarios.

### 5. Iniciar el Backend

En una terminal:

```bash
cd api_movil
deno run --allow-all app.ts
```

Deberías ver:
```
🚀 Servidor AgroStock API iniciando...
✅ AgroStock API lista para recibir conexiones
🌐 Servidor corriendo en http://localhost:8000
```

### 6. Iniciar el Frontend

En otra terminal:

```bash
cd Front_proyecto
npm install  # Solo la primera vez
npm run dev
```

Deberías ver:
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 7. Acceder al Panel de Administración

1. Abre tu navegador en: `http://localhost:5173`
2. Inicia sesión con un usuario que tenga rol `admin`
3. Si no tienes un admin, primero regístrate o crea uno desde la base de datos
4. Una vez autenticado como admin, serás redirigido a: `http://localhost:5173/admin/dashboard`

## 🔐 Credenciales de Prueba

Si usaste el script SQL de ejemplo, las credenciales pueden ser:

- **Email**: admin@agrostock.com
- **Password**: password

**⚠️ IMPORTANTE**: Cambia estas credenciales en producción.

## 🛠️ Solución de Problemas

### Error: "No se pudo conectar con el servidor"

- Verifica que el backend esté corriendo en el puerto 8000
- Verifica que `VITE_API_URL` en el frontend apunte a `http://localhost:8000`
- Revisa la consola del navegador (F12) para ver errores de CORS

### Error: "Token no proporcionado" o "No autorizado"

- Verifica que estés iniciado sesión
- Verifica que tu usuario tenga el rol `admin`
- Revisa que el token JWT esté siendo enviado en las peticiones

### Error: "Error de conexión con la base de datos"

- Verifica que MySQL/MariaDB esté ejecutándose
- Verifica las credenciales en el archivo `.env` del backend
- Verifica que la base de datos `agrostock` exista

### El panel de administración no carga

- Verifica que todas las dependencias estén instaladas: `npm install` en Front_proyecto
- Revisa la consola del navegador para errores
- Verifica que el backend esté respondiendo correctamente

## 📊 Funcionalidades del Panel de Administración

Una vez configurado, el panel de administración incluye:

- ✅ **Resumen**: Vista general con estadísticas
- ✅ **Usuarios**: Gestión completa de usuarios
- ✅ **Productos**: Administración de productos
- ✅ **Reportes**: Revisión y resolución de reportes
- ✅ **Pedidos**: Gestión de pedidos
- ✅ **Estadísticas**: Métricas y análisis
- ✅ **Categorías**: Gestión de categorías
- ✅ **Auditoría**: Logs de actividad
- ✅ **Configuración**: Ajustes del sistema

## 🎯 Próximos Pasos

1. Configura los archivos `.env` según tus necesidades
2. Crea un usuario administrador
3. Inicia ambos servidores (backend y frontend)
4. Accede al panel de administración
5. Explora todas las funcionalidades disponibles

¡Listo! El panel de administración debería estar funcionando correctamente.

