// 🖼️ CONTROLADOR DE IMÁGENES
// Endpoints para subir y gestionar imágenes

import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { imageService } from "../Services/ImageService.ts";

/**
 * Subir imagen de producto
 * POST /images/producto/:id
 */
export const uploadProductImage = async (ctx: RouterContext<"/images/producto/:id">) => {
  try {
    const user = ctx.state.user;
    const idProducto = Number(ctx.params.id);

    if (isNaN(idProducto) || idProducto <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "ID_INVALIDO",
        message: "ID de producto inválido"
      };
      return;
    }

    // Verificar que el producto pertenece al usuario o es admin
    const { conexion } = await import("../Models/Conexion.ts");
    const producto = await conexion.query(
      "SELECT id_usuario, imagen_principal FROM productos WHERE id_producto = ?",
      [idProducto]
    );

    if (producto.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NO_ENCONTRADO",
        message: "Producto no encontrado"
      };
      return;
    }

    if (producto[0].id_usuario !== user.id && user.rol !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "NO_AUTORIZADO",
        message: "No tienes permisos para subir imágenes a este producto"
      };
      return;
    }

    // Guardar referencia a la imagen anterior para eliminarla después
    const imagenAnterior = producto[0].imagen_principal;

    // Obtener datos de imagen
    const contentType = ctx.request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // Intentar leer FormData
      try {
        const body = ctx.request.body;
        const formData = await body.formData();
        const result = await imageService.saveImageFromFormData(
          formData,
          `productos/${idProducto}`,
          "image"
        );

        if (result.success && result.path) {
          // Eliminar imagen anterior si existe
          if (imagenAnterior) {
            try {
              await imageService.deleteImage(imagenAnterior);
              console.log(`Imagen anterior eliminada: ${imagenAnterior}`);
            } catch (deleteError) {
              console.error("Error eliminando imagen anterior:", deleteError);
              // Continuar aunque falle la eliminación de la imagen anterior
            }
          }

          // Actualizar producto con nueva imagen
          await conexion.execute(
            "UPDATE productos SET imagen_principal = ? WHERE id_producto = ?",
            [result.path, idProducto]
          );

          const baseUrl = `${ctx.request.url.protocol}//${ctx.request.url.host}`;
          const imageUrl = imageService.buildImageUrl(result.path, baseUrl);

          ctx.response.status = 200;
          ctx.response.body = {
            success: true,
            message: "Imagen subida exitosamente",
            data: {
              path: result.path,
              url: imageUrl
            }
          };
          return;
        } else {
          ctx.response.status = 400;
          ctx.response.body = {
            success: false,
            error: result.error || "UPLOAD_ERROR",
            message: result.message || "Error al subir la imagen"
          };
          return;
        }
      } catch (formDataError) {
        console.log("FormData no disponible, intentando JSON:", formDataError);
        // Continuar al bloque JSON
      }
    }
    
    // Procesar como JSON (base64)
    if (contentType.includes("application/json") || !contentType.includes("multipart/form-data")) {
      // Soporte para base64
      const body = await ctx.request.body.json();
      const { imageData } = body;

      if (!imageData) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "NO_IMAGE_DATA",
          message: "No se proporcionó imagen"
        };
        return;
      }

      const result = await imageService.saveImage(
        imageData,
        `productos/${idProducto}`
      );

      if (result.success && result.path) {
        // Eliminar imagen anterior si existe
        if (imagenAnterior) {
          try {
            await imageService.deleteImage(imagenAnterior);
            console.log(`Imagen anterior eliminada: ${imagenAnterior}`);
          } catch (deleteError) {
            console.error("Error eliminando imagen anterior:", deleteError);
            // Continuar aunque falle la eliminación de la imagen anterior
          }
        }

        await conexion.execute(
          "UPDATE productos SET imagen_principal = ? WHERE id_producto = ?",
          [result.path, idProducto]
        );

        const baseUrl = `${ctx.request.url.protocol}//${ctx.request.url.host}`;
        const imageUrl = imageService.buildImageUrl(result.path, baseUrl);

        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Imagen subida exitosamente",
          data: {
            path: result.path,
            url: imageUrl
          }
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: result.error || "UPLOAD_ERROR",
          message: result.message || "Error al subir la imagen"
        };
      }
    } else {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "INVALID_CONTENT_TYPE",
        message: "Content-Type debe ser multipart/form-data o application/json"
      };
    }
  } catch (error) {
    console.error("Error en uploadProductImage:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "ERROR_INTERNO",
      message: "Error interno del servidor"
    };
  }
};

/**
 * Subir imagen de perfil de productor
 * POST /images/productor/perfil
 */
export const uploadProductorProfileImage = async (ctx: Context) => {
  try {
    const user = ctx.state.user;
    const userId = user?.id || user?.id_usuario;

    if (!user || !userId) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: "NO_AUTENTICADO",
        message: "Usuario no autenticado"
      };
      return;
    }

    // Cualquier usuario autenticado puede subir su foto de perfil
    // (ya no solo productores, ya que el perfil está en la tabla usuarios)

    const contentType = ctx.request.headers.get("content-type") || "";
    const { conexion } = await import("../Models/Conexion.ts");

    // Obtener foto anterior para eliminarla después
    const usuarioActual = await conexion.query(
      "SELECT foto_perfil FROM usuarios WHERE id_usuario = ?",
      [userId]
    );
    const fotoAnterior = usuarioActual.length > 0 ? usuarioActual[0].foto_perfil : null;

    // ⚠️ IMPORTANTE: Eliminar la carpeta del usuario ANTES de guardar la nueva imagen
    // Esto asegura que no queden imágenes antiguas, pero debe hacerse ANTES de guardar
    try {
      const userFolder = `usuarios/${userId}`;
      const deleted = await imageService.deleteFolder(userFolder);
      if (deleted) {
        console.log(`🗑️ [uploadProductorProfileImage] Carpeta del usuario eliminada ANTES de guardar nueva imagen: ${userFolder}`);
      } else {
        console.log(`ℹ️ [uploadProductorProfileImage] No había carpeta previa para eliminar: ${userFolder}`);
      }
    } catch (deleteError) {
      console.error("⚠️ [uploadProductorProfileImage] Error eliminando carpeta del usuario:", deleteError);
      // Continuar aunque falle la eliminación
    }

    // También intentar eliminar la imagen específica anterior si existe (por si acaso)
    if (fotoAnterior) {
      try {
        await imageService.deleteImage(fotoAnterior);
        console.log(`🗑️ [uploadProductorProfileImage] Imagen anterior específica eliminada: ${fotoAnterior}`);
      } catch (deleteError) {
        console.warn("⚠️ [uploadProductorProfileImage] Error eliminando imagen anterior específica:", deleteError);
        // Continuar aunque falle la eliminación
      }
    }

    // Leer el body solo una vez según el Content-Type
    // Usar la API de Oak para leer el body de forma segura
    let result: { success: boolean; path?: string; error?: string; message?: string } | null = null;

    try {
      if (contentType.includes("multipart/form-data")) {
        // Para FormData, leer directamente desde ctx.request.body
        // IMPORTANTE: Asegurarse de que el stream se consuma completamente
        try {
          const body = ctx.request.body;
          // Leer el FormData de manera asíncrona y asegurar que se complete
          const formDataPromise = body.formData();
          
          // Esperar a que se complete la lectura del stream
          const formData = await formDataPromise;
          
          // Procesar el FormData
          result = await imageService.saveImageFromFormData(
            formData,
            `usuarios/${userId}`,
            "image"
          );
        } catch (formDataError) {
          // Si hay un error con FormData, intentar como JSON (fallback)
          console.warn("Error leyendo FormData, intentando como JSON:", formDataError);
          throw formDataError; // Re-lanzar para que se maneje en el catch externo
        }
      } else if (contentType.includes("application/json")) {
        // Para JSON, leer directamente
        const body = await ctx.request.body.json();
        const { imageData } = body;

        if (!imageData) {
          ctx.response.status = 400;
          ctx.response.body = {
            success: false,
            error: "NO_IMAGE_DATA",
            message: "No se proporcionó imagen"
          };
          return;
        }

        result = await imageService.saveImage(
          imageData,
          `usuarios/${userId}`
        );
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "INVALID_CONTENT_TYPE",
          message: "Content-Type debe ser multipart/form-data o application/json"
        };
        return;
      }
    } catch (bodyError) {
      console.error("Error procesando body:", bodyError);
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "BODY_ERROR",
        message: "Error al procesar el body: " + (bodyError instanceof Error ? bodyError.message : "Error desconocido")
      };
      return;
    }

    // Si no se pudo leer el body o no hay resultado, retornar error
    if (!result) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "BODY_ERROR",
        message: "No se pudo procesar el body de la solicitud"
      };
      return;
    }

    // Procesar resultado
    if (result.success && result.path) {

      // Normalizar el path para guardarlo en la BD (debe empezar con /uploads)
      // Reemplazar barras invertidas con barras normales para compatibilidad multiplataforma
      let pathToSave = result.path.replace(/\\/g, '/');
      if (!pathToSave.startsWith('/uploads')) {
        if (pathToSave.startsWith('uploads')) {
          pathToSave = '/' + pathToSave;
        } else {
          pathToSave = '/uploads/' + pathToSave;
        }
      }

      console.log('📸 Guardando foto_perfil:', {
        originalPath: result.path,
        normalizedPath: pathToSave,
        userId
      });

      // Actualizar foto_perfil en la tabla usuarios
      await conexion.execute(
        "UPDATE usuarios SET foto_perfil = ? WHERE id_usuario = ?",
        [pathToSave, userId]
      );

      const baseUrl = `${ctx.request.url.protocol}//${ctx.request.url.host}`;
      const imageUrl = imageService.buildImageUrl(pathToSave, baseUrl);

      console.log('📸 URL de imagen construida:', {
        pathToSave,
        baseUrl,
        imageUrl
      });

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Imagen de perfil subida exitosamente",
        data: {
          path: pathToSave,
          url: imageUrl
        }
      };
    } else {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: result.error || "UPLOAD_ERROR",
        message: result.message || "Error al subir la imagen"
      };
    }
  } catch (error) {
    console.error("Error en uploadProductorProfileImage:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "ERROR_INTERNO",
      message: error instanceof Error ? error.message : "Error interno del servidor"
    };
  }
};

/**
 * Eliminar imagen
 * DELETE /images/:path
 */
export const deleteImage = async (ctx: RouterContext<"/images/:path">) => {
  try {
    const user = ctx.state.user;
    const imagePath = ctx.params.path;

    // Solo admin puede eliminar imágenes directamente
    if (user.rol !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "NO_AUTORIZADO",
        message: "Solo los administradores pueden eliminar imágenes"
      };
      return;
    }

    const deleted = await imageService.deleteImage(imagePath);

    if (deleted) {
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Imagen eliminada exitosamente"
      };
    } else {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NO_ENCONTRADO",
        message: "Imagen no encontrada"
      };
    }
  } catch (error) {
    console.error("Error en deleteImage:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "ERROR_INTERNO",
      message: "Error interno del servidor"
    };
  }
};

/**
 * Subir imagen adicional a un producto
 * POST /images/producto/:id/adicional
 */
export const uploadProductAdditionalImage = async (ctx: RouterContext<"/images/producto/:id/adicional">) => {
  try {
    const user = ctx.state.user;
    const idProducto = Number(ctx.params.id);

    if (isNaN(idProducto) || idProducto <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "ID_INVALIDO",
        message: "ID de producto inválido"
      };
      return;
    }

    // Verificar que el producto pertenece al usuario o es admin
    const { conexion } = await import("../Models/Conexion.ts");
    const producto = await conexion.query(
      "SELECT id_usuario, imagenes_adicionales FROM productos WHERE id_producto = ?",
      [idProducto]
    );

    if (producto.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NO_ENCONTRADO",
        message: "Producto no encontrado"
      };
      return;
    }

    if (producto[0].id_usuario !== user.id && user.rol !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "NO_AUTORIZADO",
        message: "No tienes permisos para subir imágenes a este producto"
      };
      return;
    }

    // Obtener datos de imagen
    const contentType = ctx.request.headers.get("content-type") || "";
    let result: { success: boolean; path?: string; error?: string; message?: string } | null = null;

    if (contentType.includes("multipart/form-data")) {
      try {
        const body = ctx.request.body;
        const formData = await body.formData();
        result = await imageService.saveImageFromFormData(
          formData,
          `productos/${idProducto}`,
          "image"
        );
      } catch (formDataError) {
        console.warn("Error leyendo FormData, intentando como JSON:", formDataError);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "BODY_ERROR",
          message: "Error al procesar FormData"
        };
        return;
      }
    } else if (contentType.includes("application/json")) {
      const body = await ctx.request.body.json();
      const { imageData } = body;

      if (!imageData) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "NO_IMAGE_DATA",
          message: "No se proporcionó imagen"
        };
        return;
      }

      result = await imageService.saveImage(
        imageData,
        `productos/${idProducto}`
      );
    } else {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "INVALID_CONTENT_TYPE",
        message: "Content-Type debe ser multipart/form-data o application/json"
      };
      return;
    }

    if (result.success && result.path) {
      // Normalizar el path
      let pathToSave = result.path.replace(/\\/g, '/');
      if (!pathToSave.startsWith('/uploads')) {
        if (pathToSave.startsWith('uploads')) {
          pathToSave = '/' + pathToSave;
        } else {
          pathToSave = '/uploads/' + pathToSave;
        }
      }

      // Obtener imágenes adicionales actuales
      let imagenesAdicionales: string[] = [];
      const imagenesActuales = producto[0].imagenes_adicionales;
      
      if (imagenesActuales) {
        try {
          // Si es string, parsearlo como JSON
          if (typeof imagenesActuales === 'string') {
            imagenesAdicionales = JSON.parse(imagenesActuales);
          } else if (Array.isArray(imagenesActuales)) {
            imagenesAdicionales = imagenesActuales;
          }
        } catch (parseError) {
          console.warn("Error parseando imagenes_adicionales, iniciando array vacío:", parseError);
          imagenesAdicionales = [];
        }
      }

      // Agregar la nueva imagen
      imagenesAdicionales.push(pathToSave);

      // Actualizar en la BD
      await conexion.execute(
        "UPDATE productos SET imagenes_adicionales = ? WHERE id_producto = ?",
        [JSON.stringify(imagenesAdicionales), idProducto]
      );

      const baseUrl = `${ctx.request.url.protocol}//${ctx.request.url.host}`;
      const imageUrl = imageService.buildImageUrl(pathToSave, baseUrl);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Imagen adicional subida exitosamente",
        data: {
          path: pathToSave,
          url: imageUrl,
          index: imagenesAdicionales.length - 1
        }
      };
    } else {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: result.error || "UPLOAD_ERROR",
        message: result.message || "Error al subir la imagen"
      };
    }
  } catch (error) {
    console.error("Error en uploadProductAdditionalImage:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "ERROR_INTERNO",
      message: error instanceof Error ? error.message : "Error interno del servidor"
    };
  }
};

/**
 * Eliminar imagen adicional de un producto
 * DELETE /images/producto/:id/adicional/:index
 */
export const deleteProductAdditionalImage = async (ctx: RouterContext<"/images/producto/:id/adicional/:index">) => {
  try {
    const user = ctx.state.user;
    const idProducto = Number(ctx.params.id);
    const index = Number(ctx.params.index);

    if (isNaN(idProducto) || idProducto <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "ID_INVALIDO",
        message: "ID de producto inválido"
      };
      return;
    }

    if (isNaN(index) || index < 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "INDEX_INVALIDO",
        message: "Índice de imagen inválido"
      };
      return;
    }

    // Verificar que el producto pertenece al usuario o es admin
    const { conexion } = await import("../Models/Conexion.ts");
    const producto = await conexion.query(
      "SELECT id_usuario, imagenes_adicionales FROM productos WHERE id_producto = ?",
      [idProducto]
    );

    if (producto.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NO_ENCONTRADO",
        message: "Producto no encontrado"
      };
      return;
    }

    if (producto[0].id_usuario !== user.id && user.rol !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "NO_AUTORIZADO",
        message: "No tienes permisos para eliminar imágenes de este producto"
      };
      return;
    }

    // Obtener imágenes adicionales actuales
    let imagenesAdicionales: string[] = [];
    const imagenesActuales = producto[0].imagenes_adicionales;
    
    if (imagenesActuales) {
      try {
        if (typeof imagenesActuales === 'string') {
          imagenesAdicionales = JSON.parse(imagenesActuales);
        } else if (Array.isArray(imagenesActuales)) {
          imagenesAdicionales = imagenesActuales;
        }
      } catch (parseError) {
        console.warn("Error parseando imagenes_adicionales:", parseError);
        imagenesAdicionales = [];
      }
    }

    if (index >= imagenesAdicionales.length) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "INDEX_FUERA_RANGO",
        message: "El índice está fuera del rango de imágenes adicionales"
      };
      return;
    }

    // Obtener la ruta de la imagen a eliminar
    const imagenAEliminar = imagenesAdicionales[index];

    // Eliminar la imagen del sistema de archivos
    try {
      await imageService.deleteImage(imagenAEliminar);
      console.log(`🗑️ Imagen adicional eliminada: ${imagenAEliminar}`);
    } catch (deleteError) {
      console.warn("⚠️ Error eliminando imagen del sistema de archivos:", deleteError);
      // Continuar aunque falle la eliminación del archivo
    }

    // Eliminar del array
    imagenesAdicionales.splice(index, 1);

    // Actualizar en la BD
    await conexion.execute(
      "UPDATE productos SET imagenes_adicionales = ? WHERE id_producto = ?",
      [JSON.stringify(imagenesAdicionales), idProducto]
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Imagen adicional eliminada exitosamente",
      data: {
        imagenes_adicionales: imagenesAdicionales
      }
    };
  } catch (error) {
    console.error("Error en deleteProductAdditionalImage:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "ERROR_INTERNO",
      message: error instanceof Error ? error.message : "Error interno del servidor"
    };
  }
};

