// 🖼️ SERVICIO DE GESTIÓN DE IMÁGENES
// Maneja subida, almacenamiento y procesamiento de imágenes

import { join } from "../Dependencies/dependencias.ts";

export interface ImageUploadResult {
  success: boolean;
  path?: string;
  url?: string;
  message?: string;
  error?: string;
}

export class ImageService {
  private readonly UPLOADS_DIR = "./uploads";
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
  private readonly ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

  /**
   * Guardar imagen desde base64 o URL
   */
  async saveImage(
    imageData: string | Uint8Array,
    folder: string,
    filename?: string
  ): Promise<ImageUploadResult> {
    try {
      // Crear directorio si no existe
      const folderPath = join(this.UPLOADS_DIR, folder);
      await this.ensureDirectory(folderPath);

      // Procesar imagen
      let imageBytes: Uint8Array;
      let extension: string;

      if (imageData instanceof Uint8Array) {
        imageBytes = imageData;
        extension = 'jpg'; // Por defecto
      } else if (typeof imageData === 'string') {
        const processed = await this.processImageData(imageData);
        imageBytes = processed.data;
        extension = processed.extension;
      } else {
        throw new Error("Formato de imagen no válido");
      }

      // Validar tamaño
      if (imageBytes.length > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: "FILE_TOO_LARGE",
          message: `La imagen excede el tamaño máximo de ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
        };
      }

      // Generar nombre de archivo
      const finalFilename = filename || `imagen_${Date.now()}.${extension}`;
      const filePath = join(folderPath, finalFilename);

      // Guardar archivo
      // @ts-ignore - Deno is a global object in Deno runtime
      await Deno.writeFile(filePath, imageBytes);

      // Construir el path relativo y normalizar barras para compatibilidad multiplataforma
      const relativePath = join("uploads", folder, finalFilename).replace(/\\/g, '/');

      return {
        success: true,
        path: relativePath,
        message: "Imagen guardada exitosamente"
      };
    } catch (error) {
      console.error("Error guardando imagen:", error);
      return {
        success: false,
        error: "SAVE_ERROR",
        message: error instanceof Error ? error.message : "Error al guardar la imagen"
      };
    }
  }

  /**
   * Guardar imagen desde FormData (multipart/form-data)
   */
  async saveImageFromFormData(
    formData: FormData,
    folder: string,
    fieldName: string = 'image'
  ): Promise<ImageUploadResult> {
    try {
      const file = formData.get(fieldName) as File | null;

      if (!file) {
        return {
          success: false,
          error: "NO_FILE",
          message: "No se proporcionó ningún archivo"
        };
      }

      // Validar tipo
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        return {
          success: false,
          error: "INVALID_TYPE",
          message: `Tipo de archivo no permitido. Tipos permitidos: ${this.ALLOWED_TYPES.join(', ')}`
        };
      }

      // Validar tamaño
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: "FILE_TOO_LARGE",
          message: `El archivo excede el tamaño máximo de ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
        };
      }

      // Leer archivo
      const arrayBuffer = await file.arrayBuffer();
      const imageBytes = new Uint8Array(arrayBuffer);

      // Guardar imagen
      return await this.saveImage(imageBytes, folder, `${Date.now()}_${file.name}`);
    } catch (error) {
      console.error("Error guardando imagen desde FormData:", error);
      return {
        success: false,
        error: "SAVE_ERROR",
        message: error instanceof Error ? error.message : "Error al guardar la imagen"
      };
    }
  }

  /**
   * Procesar datos de imagen (base64, URL, etc.)
   */
  private async processImageData(imageData: string): Promise<{ data: Uint8Array; extension: string }> {
    // Base64 con data URL
    if (imageData.startsWith('data:image/')) {
      const match = imageData.match(/data:image\/([^;]+);base64,(.+)/);
      if (!match) {
        throw new Error("Formato base64 inválido");
      }
      const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
      const base64Data = match[2];
      const data = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      return { data, extension };
    }

    // URL HTTP/HTTPS
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      const response = await fetch(imageData);
      if (!response.ok) {
        throw new Error(`Error al descargar imagen: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const extension = this.getExtensionFromUrl(imageData) || 'jpg';
      return { data, extension };
    }

    // Ruta de archivo local
    if (imageData.startsWith('file://')) {
      let filePath = imageData.replace('file://', '');
      if (filePath.startsWith('/') && filePath.match(/^\/[A-Za-z]:/)) {
        filePath = filePath.substring(1);
      }
      // @ts-ignore - Deno is a global object in Deno runtime
      const data = await Deno.readFile(filePath);
      const extension = this.getExtensionFromFilename(filePath) || 'jpg';
      return { data, extension };
    }

    // Base64 puro
    if (imageData.match(/^[A-Za-z0-9+/]+=*$/)) {
      try {
        const data = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
        return { data, extension: 'jpg' };
      } catch {
        throw new Error("Base64 inválido");
      }
    }

    throw new Error("Formato de imagen no reconocido");
  }

  /**
   * Construir URL completa de imagen
   */
  buildImageUrl(relativePath: string | null | undefined, baseUrl: string = "http://localhost:8000"): string | null {
    if (!relativePath) return null;
    
    // Normalizar el path: remover barras duplicadas y asegurar que empiece con /
    let normalizedPath = relativePath.replace(/\\/g, '/').replace(/\/+/g, '/');
    
    // Si no empieza con /, agregarlo
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
    
    // Si no empieza con /uploads, agregarlo
    if (!normalizedPath.startsWith('/uploads')) {
      normalizedPath = '/uploads' + (normalizedPath.startsWith('/') ? '' : '/') + normalizedPath;
    }
    
    // Construir la URL completa
    const url = `${baseUrl}${normalizedPath}`;
    console.log('🔗 buildImageUrl:', { relativePath, normalizedPath, baseUrl, url });
    
    return url;
  }

  /**
   * Eliminar imagen
   */
  async deleteImage(imagePath: string): Promise<boolean> {
    try {
      if (!imagePath) {
        return false;
      }

      // Normalizar la ruta: remover "uploads/" si está al inicio, y normalizar separadores
      const normalizedPath = imagePath.replace(/^uploads[\/\\]/, '').replace(/\\/g, '/');
      
      // Si la ruta ya es absoluta o empieza con ./, usar directamente
      // Si no, construir la ruta completa desde UPLOADS_DIR
      let fullPath: string;
      if (normalizedPath.startsWith('./') || normalizedPath.startsWith('/')) {
        fullPath = normalizedPath;
      } else {
        // Construir ruta completa
        fullPath = join(this.UPLOADS_DIR, normalizedPath);
      }

      // Verificar que el archivo existe antes de intentar eliminarlo
      try {
        // @ts-ignore - Deno is a global object in Deno runtime
        const stat = await Deno.stat(fullPath);
        if (stat.isFile) {
          // @ts-ignore - Deno is a global object in Deno runtime
          await Deno.remove(fullPath);
          console.log(`Imagen eliminada exitosamente: ${fullPath}`);
          return true;
        }
      } catch (_statError) {
        // Si el archivo no existe, no es un error crítico
        console.log(`Imagen no encontrada (puede que ya fue eliminada): ${fullPath}`);
        return false;
      }

      return false;
    } catch (error) {
      console.error("Error eliminando imagen:", error);
      return false;
    }
  }

  /**
   * Eliminar carpeta completa
   */
  async deleteFolder(folder: string): Promise<boolean> {
    try {
      const folderPath = join(this.UPLOADS_DIR, folder);
      if (await this.directoryExists(folderPath)) {
        // @ts-ignore - Deno is a global object in Deno runtime
        await Deno.remove(folderPath, { recursive: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error eliminando carpeta:", error);
      return false;
    }
  }

  /**
   * Asegurar que el directorio existe
   */
  private async ensureDirectory(path: string): Promise<void> {
    try {
      if (!(await this.directoryExists(path))) {
        // @ts-ignore - Deno is a global object in Deno runtime
        await Deno.mkdir(path, { recursive: true });
      }
    } catch (error) {
      // @ts-ignore - Deno is a global object in Deno runtime
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }
  }

  /**
   * Verificar si un directorio existe
   */
  private async directoryExists(path: string): Promise<boolean> {
    try {
      // @ts-ignore - Deno is a global object in Deno runtime
      const stat = await Deno.stat(path);
      return stat.isDirectory;
    } catch {
      return false;
    }
  }

  /**
   * Obtener extensión de URL
   */
  private getExtensionFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      return this.getExtensionFromFilename(pathname);
    } catch {
      return null;
    }
  }

  /**
   * Obtener extensión de nombre de archivo
   */
  private getExtensionFromFilename(filename: string): string | null {
    const match = filename.match(/\.([^.]+)$/);
    if (match) {
      const ext = match[1].toLowerCase();
      return this.ALLOWED_EXTENSIONS.includes(ext) ? ext : null;
    }
    return null;
  }

  /**
   * Validar tipo de archivo
   */
  isValidImageType(mimeType: string): boolean {
    return this.ALLOWED_TYPES.includes(mimeType);
  }

  /**
   * Validar tamaño de archivo
   */
  isValidFileSize(size: number): boolean {
    return size <= this.MAX_FILE_SIZE;
  }
}

export const imageService = new ImageService();










