// 📁 MIDDLEWARE PARA SERVIR ARCHIVOS ESTÁTICOS
// Sirve imágenes y archivos desde la carpeta uploads

import { Context } from "../Dependencies/dependencias.ts";
import { join, resolve, fromFileUrl } from "../Dependencies/dependencias.ts";

// Resolver la ruta absoluta del directorio uploads
// Usar Deno.cwd() que ya está en api_movil según los logs
let UPLOADS_DIR: string;
try {
  // @ts-ignore - Deno is a global object in Deno runtime
  const cwd = Deno.cwd();
  // Si cwd es api_movil, usar directamente; si no, construir la ruta
  if (cwd.endsWith('api_movil')) {
    UPLOADS_DIR = resolve(cwd, "uploads");
  } else {
    // Si estamos en el directorio raíz del proyecto
    UPLOADS_DIR = resolve(cwd, "api_movil", "uploads");
  }
  console.log(`📁 [StaticFilesMiddleware] UPLOADS_DIR resuelto: ${UPLOADS_DIR} (cwd: ${cwd})`);
} catch (error) {
  // Fallback: usar ruta relativa
  UPLOADS_DIR = "./uploads";
  console.log(`⚠️ [StaticFilesMiddleware] Usando fallback UPLOADS_DIR: ${UPLOADS_DIR}`);
}

/**
 * Middleware para servir archivos estáticos desde uploads
 */
export async function staticFilesMiddleware(ctx: Context, next: () => Promise<unknown>) {
  // Solo procesar rutas que empiecen con /uploads
  if (!ctx.request.url.pathname.startsWith('/uploads')) {
    await next();
    return;
  }

  try {
    // Obtener la ruta del archivo y decodificar URL (para manejar espacios y caracteres especiales)
    const pathname = ctx.request.url.pathname;
    // Decodificar el pathname para convertir %20 a espacios, etc.
    let decodedPathname: string;
    try {
      decodedPathname = decodeURIComponent(pathname);
    } catch (decodeError) {
      // Si falla la decodificación, usar el pathname original
      console.warn('⚠️ Error decodificando pathname, usando original:', pathname);
      decodedPathname = pathname;
    }
    // Normalizar la ruta: remover /uploads/ del inicio y normalizar separadores
    let filePath = decodedPathname.replace(/^\/uploads\//, '').replace(/\\/g, '/');
    // Asegurar que no empiece con /
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    // Usar resolve para construir la ruta completa de forma correcta
    const fullPath = resolve(UPLOADS_DIR, filePath);

    console.log('📁 [StaticFilesMiddleware] Intentando servir archivo:', {
      pathname,
      decodedPathname,
      filePath,
      fullPath,
      UPLOADS_DIR,
      // @ts-ignore - Deno is a global object in Deno runtime
      cwd: Deno.cwd(),
      fullPathNormalized: fullPath.replace(/\\/g, '/')
    });

    // Verificar que el archivo existe
    let fileInfo;
    try {
      // @ts-ignore - Deno is a global object in Deno runtime
      fileInfo = await Deno.stat(fullPath);
      console.log('✅ [StaticFilesMiddleware] Archivo encontrado:', {
        fullPath,
        size: fileInfo.size,
        isFile: fileInfo.isFile
      });
    } catch (statError) {
      const errorMessage = statError instanceof Error ? statError.message : 'Error desconocido';
      console.error('❌ [StaticFilesMiddleware] Archivo no encontrado:', {
        pathname,
        decodedPathname,
        filePath,
        fullPath,
        UPLOADS_DIR,
        error: errorMessage
      });
      
      // Verificar si el directorio existe
      try {
        const dirPath = fullPath.substring(0, fullPath.lastIndexOf('\\') || fullPath.lastIndexOf('/'));
        // @ts-ignore - Deno is a global object in Deno runtime
        const dirInfo = await Deno.stat(dirPath);
        if (dirInfo.isDirectory) {
          console.log(`📁 [StaticFilesMiddleware] El directorio existe pero el archivo no: ${dirPath}`);
        }
      } catch (dirError) {
        console.warn(`⚠️ [StaticFilesMiddleware] El directorio tampoco existe: ${fullPath.substring(0, fullPath.lastIndexOf('\\') || fullPath.lastIndexOf('/'))}`);
      }
      
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "FILE_NOT_FOUND",
        message: `Archivo no encontrado: ${filePath}`,
        path: filePath
      };
      return;
    }

    // Verificar que es un archivo
    if (!fileInfo.isFile) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NOT_A_FILE",
        message: "La ruta no corresponde a un archivo"
      };
      return;
    }

    // Leer el archivo
    // @ts-ignore - Deno is a global object in Deno runtime
    const fileContent = await Deno.readFile(fullPath);

    // Determinar el tipo MIME
    const extension = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'txt': 'text/plain'
    };

    const contentType = mimeTypes[extension || ''] || 'application/octet-stream';

    // Configurar headers
    ctx.response.headers.set('Content-Type', contentType);
    ctx.response.headers.set('Content-Length', fileInfo.size.toString());
    ctx.response.headers.set('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
    ctx.response.headers.set('Last-Modified', fileInfo.mtime?.toUTCString() || new Date().toUTCString());

    // Enviar el archivo
    ctx.response.body = fileContent;
    ctx.response.status = 200;
    
    console.log('✅ [StaticFilesMiddleware] Archivo servido exitosamente:', {
      pathname,
      contentType,
      size: fileInfo.size
    });
  } catch (error) {
    console.error("Error sirviendo archivo estático:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "SERVER_ERROR",
      message: "Error al servir el archivo"
    };
  }
}










