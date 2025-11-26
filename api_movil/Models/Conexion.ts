import { Client } from "../Dependencies/dependencias.ts";
import { load } from "../Dependencies/dependencias.ts";

// 📌 Configuración de conexión a la base de datos
let conexion: Client;
let isConnected = false;

// Función para inicializar la conexión
async function inicializarConexion() {
  if (isConnected && conexion) {
    return conexion;
  }

  try {
    // Cargar variables de entorno (si existe el archivo .env)
    // Si no existe, usar valores por defecto para XAMPP
    let env: Record<string, string> = {};
    try {
      env = await load();
    } catch (error) {
      // Si no existe el archivo .env, usar valores por defecto
      console.log("ℹ️ No se encontró archivo .env, usando valores por defecto para XAMPP");
    }
    
    // Configuración de conexión con valores por defecto para XAMPP
    // Nota: La librería mysql de Deno acepta: hostname, port, username, password, db, poolSize, idleTimeout
    const config = {
      hostname: env.DB_HOST || "localhost",
      port: parseInt(env.DB_PORT || "3306"),
      username: env.DB_USER || "root",
      password: env.DB_PASSWORD || "", // XAMPP por defecto no tiene contraseña
      db: env.DB_NAME || "agrostock",
      poolSize: parseInt(env.DB_POOL_SIZE || "3"), // Reducido a 3 para evitar sobrecarga
      idleTimeout: parseInt(env.DB_IDLE_TIMEOUT || "60000"), // 1 minuto de timeout idle (reducido)
    };

    console.log("🔗 Conectando a la base de datos...");
    console.log(`   Host: ${config.hostname}:${config.port}`);
    console.log(`   Database: ${config.db}`);
    console.log(`   User: ${config.username}`);

    conexion = await new Client().connect(config);
    
    console.log("✅ Conexión a la base de datos establecida correctamente");
    
    // Configurar charset UTF-8 en la conexión
    await conexion.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    await conexion.query("SET CHARACTER SET utf8mb4");
    await conexion.query("SET character_set_connection=utf8mb4");
    
    // Probar la conexión
    await conexion.query("SELECT 1 as test");
    console.log("✅ Prueba de conexión exitosa");
    console.log("✅ Charset UTF-8 configurado correctamente");
    
    isConnected = true;
    return conexion;
    
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR AL CONECTAR CON LA BASE DE DATOS");
    console.error("=".repeat(60));
    console.error("Error:", error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && (error.message.includes("ConnectionRefused") || error.message.includes("10061") || error.code === "ECONNREFUSED")) {
      console.error("\n🔴 PROBLEMA DETECTADO: MySQL NO está corriendo");
      console.error("\n" + "=".repeat(60));
      console.error("⚠️  ACCIÓN REQUERIDA: INICIAR MYSQL EN XAMPP");
      console.error("=".repeat(60));
      console.error("\n📋 PASOS PARA SOLUCIONAR:");
      console.error("\n   1️⃣  Abre XAMPP Control Panel:");
      console.error("      - Busca 'XAMPP Control Panel' en el menú de inicio");
      console.error("      - O ejecuta: C:\\xampp\\xampp-control.exe");
      console.error("\n   2️⃣  Inicia MySQL:");
      console.error("      - Busca 'MySQL' en la lista de servicios");
      console.error("      - Si está 'Stopped' (rojo), haz clic en 'Start'");
      console.error("      - ESPERA hasta que el estado cambie a 'Running' (verde)");
      console.error("\n   3️⃣  Verifica que MySQL esté corriendo:");
      console.error("      - Debe mostrar 'Running' en verde");
      console.error("      - El puerto debe ser 3306");
      console.error("\n   4️⃣  Reinicia el servidor Deno:");
      console.error("      - Presiona Ctrl+C para detener");
      console.error("      - Ejecuta: deno run --allow-all app.ts");
      console.error("\n" + "=".repeat(60));
      console.error("💡 Si MySQL no inicia, revisa los logs en XAMPP");
      console.error("=".repeat(60) + "\n");
    } else if (error instanceof Error && error.message.includes("Access denied")) {
      console.error("\n🔴 PROBLEMA: Credenciales incorrectas");
      console.error("\n💡 SOLUCIÓN:");
      console.error("   1. Verifica el archivo .env en api_agrostock/api_movil");
      console.error("   2. Asegúrate de que DB_USER y DB_PASSWORD sean correctos");
      console.error("   3. XAMPP por defecto usa: usuario='root', contraseña='' (vacía)");
    } else if (error instanceof Error && error.message.includes("Unknown database")) {
      console.error("\n🔴 PROBLEMA: La base de datos 'agrostock' no existe");
      console.error("\n💡 SOLUCIÓN:");
      console.error("   1. Abre phpMyAdmin: http://localhost/phpmyadmin");
      console.error("   2. Crea una nueva base de datos llamada 'agrostock'");
      console.error("   3. O ejecuta: CREATE DATABASE agrostock;");
    } else if (error instanceof Error && (error.message.includes("timeout") || error.message.includes("read timed out"))) {
      console.error("\n🔴 PROBLEMA DETECTADO: Timeout de conexión a MySQL");
      console.error("\n💡 POSIBLES CAUSAS Y SOLUCIONES:");
      console.error("\n   1️⃣  MySQL está sobrecargado o lento:");
      console.error("      - Reinicia MySQL en XAMPP Control Panel");
      console.error("      - Cierra otras aplicaciones que usen MySQL");
      console.error("\n   2️⃣  Problemas de red o firewall:");
      console.error("      - Verifica que el firewall no esté bloqueando MySQL");
      console.error("      - Asegúrate de que el puerto 3306 esté abierto");
      console.error("\n   3️⃣  Configuración de MySQL:");
      console.error("      - Verifica que MySQL tenga suficientes recursos");
      console.error("      - Revisa los logs de MySQL en XAMPP");
      console.error("\n   4️⃣  Base de datos bloqueada:");
      console.error("      - Cierra conexiones antiguas en phpMyAdmin");
      console.error("      - Ejecuta: SHOW PROCESSLIST; para ver conexiones activas");
    } else {
      console.error("\n💡 Verifica que:");
      console.error("   - MySQL/MariaDB esté ejecutándose en XAMPP");
      console.error("   - Las credenciales en .env sean correctas");
      console.error("   - La base de datos 'agrostock' exista");
      console.error("   - El usuario tenga permisos suficientes");
    }
    
    console.error("=".repeat(60) + "\n");
    isConnected = false;
    throw error;
  }
}

// Inicializar conexión al cargar el módulo (con manejo de errores para no bloquear el servidor)
inicializarConexion().catch((error) => {
  // El error ya se maneja dentro de inicializarConexion con mensajes detallados
  // Solo agregamos un mensaje final aquí
  console.error("\n⚠️ El servidor continuará, pero las peticiones a la BD fallarán hasta que se resuelva el problema");
  console.error("💡 Ejecuta el script: .\\verificar-mysql.ps1 para diagnosticar el problema\n");
});

// 📌 Función para obtener la conexión (con reconexión automática y manejo de timeouts)
export const obtenerConexion = async (retryCount = 0): Promise<Client> => {
  const MAX_RETRIES = 2;
  
  try {
    if (!isConnected || !conexion) {
      console.log("[Conexion] Intentando conectar a la base de datos...");
      return await inicializarConexion();
    }
    
    // Verificar que la conexión sigue activa con timeout más corto
    try {
      // Usar Promise.race para agregar un timeout a la verificación (reducido a 3 segundos)
      const testQuery = conexion.query("SELECT 1 as test");
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout verificando conexión")), 3000)
      );
      
      await Promise.race([testQuery, timeoutPromise]);
      return conexion;
    } catch (testError) {
      const errorMsg = testError instanceof Error ? testError.message : String(testError);
      
      // Si es un timeout o error de conexión, intentar reconectar
      if (errorMsg.includes("timeout") || errorMsg.includes("Connection") || errorMsg.includes("read timed out")) {
        console.warn(`[Conexion] ⚠️ Conexión perdida o timeout (${errorMsg}), intentando reconectar... (intento ${retryCount + 1}/${MAX_RETRIES + 1})`);
        isConnected = false;
        
        // Cerrar la conexión anterior si existe
        try {
          if (conexion) {
            await conexion.close();
          }
        } catch (closeError) {
          // Ignorar errores al cerrar
        }
        
        // Esperar un poco antes de reintentar
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return await obtenerConexion(retryCount + 1);
        }
      }
      
      // Si no es un timeout, lanzar el error
      throw testError;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Manejar diferentes tipos de errores
    if (errorMsg.includes("ConnectionRefused") || errorMsg.includes("10061")) {
      console.error("[Conexion] ❌ MySQL no está corriendo. Verifica XAMPP Control Panel.");
    } else if (errorMsg.includes("timeout") || errorMsg.includes("read timed out")) {
      console.error("[Conexion] ❌ Timeout de conexión a MySQL");
      console.error("[Conexion] 💡 Verifica que MySQL esté respondiendo correctamente");
      
      // Cerrar la conexión anterior si existe
      try {
        if (conexion) {
          await conexion.close();
        }
        isConnected = false;
      } catch (closeError) {
        // Ignorar errores al cerrar
      }
      
      // Intentar reconectar una vez más si no hemos alcanzado el máximo
      if (retryCount < MAX_RETRIES) {
        console.log(`[Conexion] 🔄 Reintentando conexión... (intento ${retryCount + 1}/${MAX_RETRIES + 1})`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return await obtenerConexion(retryCount + 1);
      }
    }
    
    throw error;
  }
};

// 📌 Función para cerrar la conexión (útil para tests)
export const cerrarConexion = async () => {
  try {
    if (conexion) {
      await conexion.close();
      isConnected = false;
      console.log("🔌 Conexión a la base de datos cerrada");
    }
  } catch (error) {
    console.error("Error al cerrar la conexión:", error);
  }
};

// 📌 Función para verificar el estado de la conexión
export const verificarConexion = async (): Promise<boolean> => {
  try {
    const conn = await obtenerConexion();
    await conn.query("SELECT 1 as test");
    return true;
  } catch (error) {
    console.error("Error al verificar la conexión:", error);
    return false;
  }
};

// 📌 Función para obtener estadísticas de la conexión
export const obtenerEstadisticasConexion = async () => {
  try {
    const conn = await obtenerConexion();
    const stats = await conn.query("SHOW STATUS LIKE 'Connections'");
    return {
      conexiones_totales: stats[0]?.Value || 0,
      estado: "activa",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      conexiones_totales: 0,
      estado: "error",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
};

// 📌 Función helper para ejecutar consultas con timeout
export const ejecutarConsultaConTimeout = async <T>(
  consulta: () => Promise<T>,
  timeoutMs: number = 25000, // 25 segundos por defecto (menos que el timeout de MySQL)
  retryCount: number = 0
): Promise<T> => {
  const MAX_RETRIES = 1;
  
  try {
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Consulta excedió el timeout de ${timeoutMs}ms`)), timeoutMs)
    );
    
    const resultado = await Promise.race([consulta(), timeoutPromise]);
    return resultado;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Si es un timeout y no hemos alcanzado el máximo de reintentos, reintentar
    if (errorMsg.includes("timeout") && retryCount < MAX_RETRIES) {
      console.warn(`[Conexion] ⚠️ Timeout en consulta, reintentando... (intento ${retryCount + 1}/${MAX_RETRIES + 1})`);
      // Invalidar la conexión para forzar reconexión
      isConnected = false;
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await ejecutarConsultaConTimeout(consulta, timeoutMs, retryCount + 1);
    }
    
    throw error;
  }
};

// Exportar conexión directa (para compatibilidad con código existente)
// Nota: Se recomienda usar obtenerConexion() para mejor manejo de errores
// Esta exportación se actualiza cuando se inicializa la conexión
export { conexion };

// Función helper para obtener conexión de forma síncrona (solo si ya está conectada)
export const getConexion = (): Client | null => {
  return isConnected ? conexion : null;
};