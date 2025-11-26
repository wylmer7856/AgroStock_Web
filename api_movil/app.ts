import { Application } from "./Dependencies/dependencias.ts";
import { UsuariosRouter } from "./Routers/UsuariosRouter.ts";
import { AuthRouter } from "./Routers/AuthRouter.ts";
import { ProductosRouter } from "./Routers/ProductosRouter.ts";
import { RegionesRouter } from "./Routers/RegionesRouter.ts";
import { DepartamentosRouter } from "./Routers/DepartamentosRouter.ts";
import { CiudadesRouter } from "./Routers/CiudadesRouter.ts";
import { AlertasRouter } from "./Routers/Alertas_StockRouter.ts";
import { DetallePedidosRouter } from "./Routers/Detalle_PedidosRouter.ts";
import { pedidosRouter } from "./Routers/PedidosRouter.ts";
import { MensajesRouter } from "./Routers/MensajesRouter.ts";
import { ReportesRouter } from "./Routers/ReportesRouter.ts";
import { CategoriasRouter } from "./Routers/CategoriasRouter.ts";
import { EstadisticasRouter } from "./Routers/EstadisticasRouter.ts";
import { AdminRouter } from "./Routers/AdminRouter.ts";
import { CartRouter } from "./Routers/CartRouter.ts";
import { ReseñasRouter } from "./Routers/ReseñasRouter.ts";
import { PasswordRecoveryRouter } from "./Routers/PasswordRecoveryRouter.ts";
import { AuditoriaRouter } from "./Routers/AuditoriaRouter.ts";
import { PaymentRouter } from "./Routers/PaymentRouter.ts";
import { ProductoresRouter } from "./Routers/ProductoresRouter.ts";
import { ImageRouter } from "./Routers/ImageRouter.ts";
import { HistorialPreciosRouter } from "./Routers/HistorialPreciosRouter.ts";
import { NotificacionesRouter } from "./Routers/NotificacionesRouter.ts";
import { ListaDeseosRouter } from "./Routers/ListaDeseosRouter.ts";

// Importar middlewares avanzados
import { 
  requestLoggingMiddleware, 
  securityHeadersMiddleware, 
  compressionMiddleware,
  rateLimitMiddleware
  // metricsMiddleware - puede habilitarse cuando se necesite
} from "./Middlewares/AdvancedMiddlewares.ts";
import { staticFilesMiddleware } from "./Middlewares/StaticFilesMiddleware.ts";

const app = new Application();

// 📌 Middleware CORS - DEBE IR PRIMERO (antes de cualquier otro middleware)
app.use(async (ctx, next) => {
  const origin = ctx.request.headers.get("origin");
  
  // En desarrollo, permitir todos los orígenes para facilitar pruebas con móviles
  // En producción, especificar dominios permitidos
  const isDevelopment = Deno.env.get("NODE_ENV") !== "production";
  
  if (isDevelopment) {
    // En desarrollo, permitir todas las conexiones (incluyendo móviles)
    ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  } else {
    // En producción, solo permitir orígenes específicos
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:8080", 
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://192.168.1.11:5173",
      "https://agrostock.com"
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      ctx.response.headers.set("Access-Control-Allow-Origin", origin);
    } else if (!origin) {
      ctx.response.headers.set("Access-Control-Allow-Origin", "*");
    }
  }
  
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset");
  ctx.response.headers.set("Access-Control-Allow-Credentials", "true");
  ctx.response.headers.set("Access-Control-Max-Age", "86400");
  
  // Manejar solicitudes preflight OPTIONS
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    ctx.response.body = "";
    return;
  }
  
  await next();
});

// 📌 Middleware para establecer UTF-8 en todas las respuestas JSON
app.use(async (ctx, next) => {
  await next();
  
  // Establecer charset UTF-8 para respuestas JSON
  const contentType = ctx.response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json') && !contentType.includes('charset')) {
    ctx.response.headers.set('Content-Type', 'application/json; charset=utf-8');
  }
});

// 📌 Middlewares globales (orden importante)
// Habilitados para producción con configuración moderada
app.use(requestLoggingMiddleware());
app.use(securityHeadersMiddleware());
app.use(compressionMiddleware());
app.use(rateLimitMiddleware(15 * 60 * 1000, 100)); // 100 requests per 15 minutes

// Middleware para servir archivos estáticos (uploads)
app.use(staticFilesMiddleware);

// 📌 Endpoint de health check simple (antes de los routers)
app.use(async (ctx, next) => {
  if (ctx.request.url.pathname === "/health" || ctx.request.url.pathname === "/ping") {
    ctx.response.status = 200;
    ctx.response.body = {
      status: "ok",
      message: "Servidor funcionando correctamente",
      timestamp: new Date().toISOString(),
      server: "AgroStock API",
      version: "1.0.0"
    };
    return;
  }
  await next();
});

// 📌 Routers principales (orden de prioridad)
const routers = [
  AuthRouter,                // Autenticación (prioridad alta)
  PasswordRecoveryRouter,    // Recuperación de contraseña (público)
  CartRouter,                // Carrito de compras
  ProductosRouter,           // Productos (público y privado)
  CategoriasRouter,          // Categorías
  ProductoresRouter,          // Perfiles de productores
  ImageRouter,                // Gestión de imágenes
  ReseñasRouter,            // Sistema de reseñas
  MensajesRouter,            // Sistema de mensajes
  PaymentRouter,             // Sistema de pagos
  ReportesRouter,            // Sistema de reportes
  EstadisticasRouter,        // Estadísticas
  AuditoriaRouter,           // Auditoría y trazabilidad
  AdminRouter,               // Panel de administración (DEBE IR ANTES de NotificacionesRouter)
  UsuariosRouter,            // Gestión de usuarios
  RegionesRouter,            // Regiones
  DepartamentosRouter,       // Departamentos
  CiudadesRouter,            // Ciudades
  AlertasRouter,             // Alertas de stock
  DetallePedidosRouter,      // Detalle de pedidos
  pedidosRouter,             // Pedidos
  HistorialPreciosRouter,    // Historial de precios
  NotificacionesRouter,      // Notificaciones push (rutas generales)
  ListaDeseosRouter          // Lista de deseos
];

// Registrar todos los routers
routers.forEach((router, index) => {
  console.log(`📌 Registrando router ${index + 1}/${routers.length}:`, router.constructor?.name || 'Unknown');
  app.use(router.routes());
  app.use(router.allowedMethods());
});
console.log("✅ Todos los routers registrados correctamente");

// 📌 Middleware de manejo de errores global mejorado
// IMPORTANTE: Este middleware debe ir DESPUÉS de todos los routers
app.use(async (ctx, next) => {
  try {
    await next();
    
    // Si no hay respuesta, es una ruta no encontrada
    if (!ctx.response.body && ctx.response.status === 404) {
      return; // Ya será manejado por el middleware de 404
    }
  } catch (err) {
    console.error("🚨 Error en el servidor:", err);
    
    // Log del error con más detalles
    let ip = 'unknown';
    try {
      ip = ctx.request.ip || 'unknown';
    } catch {
      ip = ctx.request.headers.get('x-forwarded-for') || 
           ctx.request.headers.get('x-real-ip') || 
           'unknown';
    }
    
    console.error("📊 Detalles del error:", {
      method: ctx.request.method,
      url: ctx.request.url.pathname,
      ip: ip,
      userAgent: ctx.request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    });

    // Determinar el tipo de error y responder apropiadamente
    let status = 500;
    let message = "Error interno del servidor";
    let errorCode = "INTERNAL_ERROR";

    if (err instanceof Error) {
      const errorMessage = err.message.toLowerCase();
      
      // Errores de base de datos
      if (errorMessage.includes('connection') || errorMessage.includes('database') || errorMessage.includes('mysql')) {
        status = 503;
        message = "Error de conexión con la base de datos";
        errorCode = "DATABASE_ERROR";
      }
      // Errores de validación
      else if (err.name === "ValidationError" || err.name === "ZodError" || errorMessage.includes('validation')) {
        status = 400;
        message = "Datos de entrada inválidos";
        errorCode = "VALIDATION_ERROR";
      }
      // Errores de autenticación
      else if (err.name === "UnauthorizedError" || errorMessage.includes('unauthorized') || errorMessage.includes('token')) {
        status = 401;
        message = "No autorizado";
        errorCode = "UNAUTHORIZED";
      }
      // Errores de permisos
      else if (err.name === "ForbiddenError" || errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
        status = 403;
        message = "Acceso denegado";
        errorCode = "FORBIDDEN";
      }
      // Errores de recurso no encontrado
      else if (err.name === "NotFoundError" || errorMessage.includes('not found') || errorMessage.includes('no encontrado')) {
        status = 404;
        message = "Recurso no encontrado";
        errorCode = "NOT_FOUND";
      }
    }

    // Solo establecer respuesta si no se ha establecido ya
    if (!ctx.response.body) {
      ctx.response.status = status;
      ctx.response.body = { 
        success: false,
        error: errorCode,
        message: message,
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID()
      };
    }
  }
});

// 📌 Middleware para rutas no encontradas (debe ir al final)
app.use((ctx) => {
  // Solo responder 404 si no se ha establecido una respuesta
  if (!ctx.response.body) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      error: "RUTA_NO_ENCONTRADA",
      message: "La ruta solicitada no existe en el servidor.",
      timestamp: new Date().toISOString(),
      path: ctx.request.url.pathname,
      method: ctx.request.method,
      available_routes: {
        auth: {
          login: "POST /auth/login",
          register: "POST /auth/register",
          logout: "POST /auth/logout",
          verify: "GET /auth/verify",
          change_password: "POST /auth/change-password"
        },
        cart: {
          get: "GET /cart",
          add: "POST /cart/add",
          update: "PUT /cart/item/:id",
          remove: "DELETE /cart/item/:id",
          clear: "DELETE /cart/clear",
          validate: "GET /cart/validate",
          checkout: "POST /cart/checkout",
          stats: "GET /cart/stats"
        },
        productos: {
          list: "GET /productos",
          get: "GET /productos/:id",
          create: "POST /productos",
          update: "PUT /productos/:id",
          delete: "DELETE /productos/:id",
          search: "GET /productos/buscar",
          by_user: "GET /productos/usuario/:id"
        },
        categorias: "GET /categorias",
        resenas: "GET|POST|PUT|DELETE /resenas",
        mensajes: "GET|POST /mensajes",
        reportes: "GET|POST /reportes",
        estadisticas: "GET /estadisticas",
        admin: "GET|POST|PUT|DELETE /admin/*",
        usuarios: "GET|POST|PUT|DELETE /Usuario",
        pedidos: "GET|POST|PUT|DELETE /pedidos",
        ubicaciones: {
          regiones: "GET /regiones",
          departamentos: "GET /departamentos",
          ciudades: "GET /ciudades"
        }
      }
    };
  }
});

// 📌 Información del servidor al iniciar
console.log("🚀 Servidor AgroStock API iniciando...");
console.log("📋 Configuración:");
console.log("   🔐 Autenticación: JWT con sesiones");
console.log("   🛒 Carrito: Sistema completo de compras");
console.log("   📧 Email: Servicio de notificaciones");
console.log("   🔔 Push: Notificaciones en tiempo real");
console.log("   🛡️ Seguridad: Rate limiting, validaciones");
console.log("   📊 Métricas: Logging y analytics");

console.log("📋 Rutas disponibles:");
console.log("  🔐 Autenticación: /auth/*");
console.log("  🛒 Carrito: /cart/*");
console.log("  🛍️  Productos: /productos/*");
console.log("  📂 Categorías: /categorias");
console.log("  ⭐ Reseñas: /resenas/*");
console.log("  💬 Mensajes: /mensajes");
console.log("  📊 Reportes: /reportes");
console.log("  📈 Estadísticas: /estadisticas");
console.log("  👨‍💼 Administración: /admin");
console.log("  👥 Usuarios: /usuarios");
console.log("  🌍 Ubicaciones: /regiones, /departamentos, /ciudades");
console.log("  💚 Health check: /health");

// 📌 Iniciar servidor - Puerto 8000
const PORT = 8000;
const HOST = "0.0.0.0"; // Escuchar en todas las interfaces para permitir conexiones desde localhost

// Función para iniciar el servidor con manejo de errores
async function iniciarServidor() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 INICIANDO SERVIDOR AGROSTOCK API");
    console.log("=".repeat(60));
    console.log(`📡 Escuchando en todas las interfaces (0.0.0.0:${PORT})`);
    console.log(`🌐 URLs disponibles:`);
    console.log(`   - http://localhost:${PORT}`);
    console.log(`   - http://127.0.0.1:${PORT}`);
    console.log(`   - http://192.168.1.11:${PORT} (IP local)`);
    console.log(`\n✅ Servidor listo para recibir conexiones`);
    console.log(`💡 Health check: http://localhost:${PORT}/health`);
    console.log("=".repeat(60) + "\n");
    
    await app.listen({ port: PORT, hostname: HOST });
  } catch (error) {
    console.error("\n❌ Error al iniciar el servidor:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("AddrInUse") || errorMessage.includes("10048")) {
      console.error(`\n💡 El puerto ${PORT} está en uso.`);
      console.error(`   Cierra la otra instancia del servidor que está usando el puerto ${PORT}.`);
      console.error(`\n   En Windows PowerShell puedes usar:`);
      console.error(`   Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess | Stop-Process`);
      console.error(`\n   O simplemente cierra la otra ventana de terminal donde está corriendo el servidor.`);
    } else {
      console.error(`\n   Error: ${errorMessage}`);
    }
    
    Deno.exit(1);
  }
}

// Manejar errores no capturados
globalThis.addEventListener("error", (event) => {
  const error = event.error || event.message;
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes("AddrInUse") || errorMessage.includes("10048")) {
    console.error("\n❌ Error: El puerto 8000 está en uso.");
    console.error(`\n💡 Cierra la otra instancia del servidor.`);
    console.error(`   En Windows PowerShell:`);
    console.error(`   Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process`);
    Deno.exit(1);
  }
});

globalThis.addEventListener("unhandledrejection", (event) => {
  const error = event.reason;
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes("AddrInUse") || errorMessage.includes("10048")) {
    console.error("\n❌ Error: El puerto 8000 está en uso.");
    console.error(`\n💡 Cierra la otra instancia del servidor.`);
    console.error(`   En Windows PowerShell:`);
    console.error(`   Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process`);
    Deno.exit(1);
  }
});

// Iniciar el servidor
await iniciarServidor();
