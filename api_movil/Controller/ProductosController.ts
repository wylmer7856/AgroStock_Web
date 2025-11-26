import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { z } from "../Dependencies/dependencias.ts";
import { ProductosModel, ProductoData } from "../Models/ProductosModel.ts";
import { conexion } from "../Models/Conexion.ts";

interface ProductoDataResponse extends ProductoData {
  imagenUrl: string | null;
}

// Helper function para obtener la URL base de forma segura
function getBaseUrl(ctx: Context): string {
  const origin = ctx.request.url.origin;
  if (typeof origin === 'string' && origin) {
    return origin;
  }
  return 'http://localhost:8000';
}

const productosSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  precio: z.number().min(0),
  stock: z.number().min(0),
  stock_minimo: z.number().min(0).optional(),
  id_usuario: z.number().int().positive(),
  id_categoria: z.number().int().positive().optional().nullable(),
  id_ciudad_origen: z.number().int().positive().optional().nullable(),
  unidad_medida: z.string().optional(),
  disponible: z.boolean().optional(),
  imagen_principal: z.string().url().optional().nullable(),
});

const productosUpdateSchema = productosSchema.extend({
  id_producto: z.number().int().positive(),
  imagen_principal: z.string().optional(),
  imagenes_adicionales: z.array(z.string()).optional(),
});

const filtrosSchema = z.object({
  nombre: z.string().optional(),
  precio_min: z.string().transform((val: string) => val ? Number(val) : undefined).optional(),
  precio_max: z.string().transform((val: string) => val ? Number(val) : undefined).optional(),
  stock_min: z.string().transform((val: string) => val ? Number(val) : undefined).optional(),
  id_usuario: z.string().transform((val: string) => val ? Number(val) : undefined).optional(),
  id_categoria: z.string().transform((val: string) => {
    if (!val || val === '' || val === 'null' || val === 'undefined') {
      return undefined;
    }
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }).optional(),
  id_ciudad_origen: z.string().transform((val: string) => val ? Number(val) : undefined).optional(),
  unidad_medida: z.string().optional(),
  disponible: z.string().transform((val: string) => val === 'true' ? true : val === 'false' ? false : undefined).optional(),
  orden: z.enum(['nombre_asc', 'nombre_desc', 'precio_asc', 'precio_desc', 'stock_asc', 'stock_desc']).optional(),
  limite: z.string().transform((val: string) => val ? Number(val) : 50).optional(),
  pagina: z.string().transform((val: string) => val ? Number(val) : 1).optional(),
});

// deno-lint-ignore no-explicit-any
function filtrarProductos(productos: ProductoData[], filtros: any): ProductoData[] {
  let productosFiltrados = [...productos];

  if (filtros.nombre) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())
    );
  }

  if (filtros.precio_min !== undefined) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.precio !== undefined && producto.precio >= filtros.precio_min
    );
  }
  if (filtros.precio_max !== undefined) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.precio !== undefined && producto.precio <= filtros.precio_max
    );
  }

  if (filtros.stock_min !== undefined) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.stock >= filtros.stock_min
    );
  }

  if (filtros.id_usuario !== undefined) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.id_usuario === filtros.id_usuario
    );
  }

  // NOTA: El filtro de categoría ya se aplicó en SQL, así que no lo aplicamos aquí de nuevo
  // Si llegamos aquí con id_categoria, significa que ya fue filtrado en la consulta SQL
  // Solo verificamos que todos tengan la categoría correcta (por seguridad)
  if (filtros.id_categoria !== undefined && filtros.id_categoria !== null) {
    const categoriaId = Number(filtros.id_categoria);
    const productosIncorrectos = productosFiltrados.filter(p => {
      const catId = p.id_categoria ? Number(p.id_categoria) : null;
      return catId !== categoriaId;
    });
    if (productosIncorrectos.length > 0) {
      console.error(`❌ ERROR: Se encontraron ${productosIncorrectos.length} productos con categoría incorrecta!`);
      productosIncorrectos.forEach(p => {
        console.error(`  - "${p.nombre}" tiene categoría ${p.id_categoria} pero debería ser ${categoriaId}`);
      });
      // Filtrar los incorrectos por seguridad
      productosFiltrados = productosFiltrados.filter(p => {
        const catId = p.id_categoria ? Number(p.id_categoria) : null;
        return catId === categoriaId;
      });
    }
  }

  if (filtros.id_ciudad_origen !== undefined) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.id_ciudad_origen === filtros.id_ciudad_origen
    );
  }

  if (filtros.unidad_medida) {
    productosFiltrados = productosFiltrados.filter(producto => 
      producto.unidad_medida?.toLowerCase().includes(filtros.unidad_medida.toLowerCase())
    );
  }

  if (filtros.disponible !== undefined) {
    if (filtros.disponible) {
      productosFiltrados = productosFiltrados.filter(producto => producto.stock > 0);
    } else {
      productosFiltrados = productosFiltrados.filter(producto => producto.stock === 0);
    }
  }

  if (filtros.orden) {
    switch (filtros.orden) {
      case 'nombre_asc':
        productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'nombre_desc':
        productosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case 'precio_asc':
        productosFiltrados.sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0));
        break;
      case 'precio_desc':
        productosFiltrados.sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0));
        break;
      case 'stock_asc':
        productosFiltrados.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock_desc':
        productosFiltrados.sort((a, b) => b.stock - a.stock);
        break;
    }
  }

  return productosFiltrados;
}

function paginarResultados(productos: ProductoData[], pagina: number, limite: number) {
  const inicio = (pagina - 1) * limite;
  const fin = inicio + limite;
  const productosPaginados = productos.slice(inicio, fin);
  
  return {
    productos: productosPaginados,
    total: productos.length,
    pagina,
    limite,
    totalPaginas: Math.ceil(productos.length / limite),
    hayMasPaginas: fin < productos.length
  };
}

export const getProductos = async (ctx: Context) => {
  try {
    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    console.log('📦 Query params recibidos (raw):', queryParams);
    console.log('📦 URL completa:', ctx.request.url.toString());
    
    const filtros = filtrosSchema.parse(queryParams);
    console.log('🔍 Filtros parseados:', filtros);
    console.log('🔍 id_categoria en filtros:', filtros.id_categoria, 'tipo:', typeof filtros.id_categoria);

    const objProductos = new ProductosModel();
    
    // Si hay filtro de categoría, aplicar directamente en SQL para mejor rendimiento
    let lista: ProductoData[];
    if (filtros.id_categoria !== undefined && filtros.id_categoria !== null) {
      const categoriaId = Number(filtros.id_categoria);
      console.log(`🔍 Intentando filtrar por categoría. Valor recibido: ${filtros.id_categoria}, convertido a número: ${categoriaId}`);
      
      if (isNaN(categoriaId) || categoriaId <= 0) {
        console.log(`⚠️ ID de categoría inválido: ${filtros.id_categoria}, obteniendo todos los productos`);
        lista = await objProductos.ListarProductos();
      } else {
        console.log(`🔍 Aplicando filtro de categoría ${categoriaId} directamente en SQL`);
        console.log(`🔍 Tipo de categoriaId: ${typeof categoriaId}, valor: ${categoriaId}`);
        const { conexion } = await import("../Models/Conexion.ts");
        
        // Asegurar que categoriaId sea un número entero
        const categoriaIdInt = parseInt(String(categoriaId), 10);
        if (isNaN(categoriaIdInt) || categoriaIdInt <= 0) {
          console.error(`❌ ID de categoría inválido después de conversión: ${categoriaIdInt}`);
          lista = await objProductos.ListarProductos();
        } else {
          // Primero verificar cuántos productos hay con esa categoría
          const countResult = await conexion.query(
            "SELECT COUNT(*) as total FROM productos WHERE id_categoria = ? AND disponible = 1",
            [categoriaIdInt]
          );
          const totalConCategoria = (countResult[0] as { total: number }).total;
          console.log(`📊 Total de productos en BD con categoría ${categoriaIdInt}: ${totalConCategoria}`);
          
          const result = await conexion.query(
            "SELECT * FROM productos WHERE id_categoria = ? AND disponible = 1 ORDER BY id_producto DESC",
            [categoriaIdInt]
          );
          lista = result as ProductoData[];
          console.log(`📋 Productos obtenidos de BD con categoría ${categoriaIdInt}: ${lista.length}`);
          
          // Verificar que los productos realmente tienen la categoría correcta
          if (lista.length > 0) {
            const categoriasEncontradas = [...new Set(lista.map(p => p.id_categoria))];
            console.log(`📋 Categorías encontradas en los productos:`, categoriasEncontradas);
            
            // Mostrar algunos productos para verificar
            lista.slice(0, 3).forEach((p, idx) => {
              console.log(`  Producto ${idx + 1}: "${p.nombre}" - Categoría: ${p.id_categoria} (tipo: ${typeof p.id_categoria})`);
            });
            
            // FILTRAR PRODUCTOS INCORRECTOS - Esto es crítico
            const productosCorrectos = lista.filter(p => {
              const catId = p.id_categoria ? Number(p.id_categoria) : null;
              const esCorrecto = catId === categoriaIdInt;
              if (!esCorrecto) {
                console.error(`❌ Producto incorrecto filtrado: "${p.nombre}" tiene categoría ${p.id_categoria} (tipo: ${typeof p.id_categoria}) pero se esperaba ${categoriaIdInt}`);
              }
              return esCorrecto;
            });
            
            if (productosCorrectos.length !== lista.length) {
              console.error(`⚠️ Se filtraron ${lista.length - productosCorrectos.length} productos con categoría incorrecta`);
            }
            
            lista = productosCorrectos;
            console.log(`✅ Productos correctos después de filtrar: ${lista.length}`);
          } else {
            console.log(`⚠️ No se encontraron productos con categoría ${categoriaIdInt}`);
          }
        }
      }
    } else {
      console.log('📋 No hay filtro de categoría, obteniendo todos los productos');
      lista = await objProductos.ListarProductos();
      console.log(`📋 Total productos antes de filtrar: ${lista.length}`);
    }

    // Aplicar otros filtros (nombre, precio, etc.)
    const productosFiltrados = filtrarProductos(lista, filtros);
    console.log(`✅ Productos después de filtrar: ${productosFiltrados.length}`);
    const resultado = paginarResultados(productosFiltrados, filtros.pagina || 1, filtros.limite || 50);
    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagen_principal 
        ? objProductos.construirUrlImagen(producto.imagen_principal, baseUrl)
        : null
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: resultado.productos.length > 0 ? `${resultado.productos.length} productos encontrados.` : "No se encontraron productos con los filtros aplicados.",
      data: listaConImagenes,
      pagination: {
        total: resultado.total,
        pagina: resultado.pagina,
        limite: resultado.limite,
        totalPaginas: resultado.totalPaginas,
        hayMasPaginas: resultado.hayMasPaginas
      },
      filtros_aplicados: filtros
    };
  } catch (error) {
    console.error("Error en getProductos:", error);
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Parámetros de filtro inválidos.",
        errors: zodError.errors.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Error interno del servidor.",
      };
    }
  }
};

export const getProductosPorUsuario = async (ctx: RouterContext<"/productos/usuario/:id">) => {
  try {
    const id_usuario = Number(ctx.params.id);
    
    if (isNaN(id_usuario) || id_usuario <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de usuario inválido.",
      };
      return;
    }

    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    const filtros = { ...filtrosSchema.parse(queryParams), id_usuario };

    const objProductos = new ProductosModel();
    const { conexion } = await import("../Models/Conexion.ts");
    
    // Obtener productos con información de categoría
    const productosConCategoria = await conexion.query(`
      SELECT 
        p.*,
        cat.nombre as categoria_nombre,
        cat.imagen_url as categoria_imagen
      FROM productos p
      LEFT JOIN categorias cat ON p.id_categoria = cat.id_categoria AND cat.activa = 1
      WHERE p.id_usuario = ?
      ORDER BY p.id_producto DESC
    `, [id_usuario]);

    const productosFiltrados = filtrarProductos(productosConCategoria, filtros);
    const resultado = paginarResultados(productosFiltrados, filtros.pagina || 1, filtros.limite || 50);
    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = resultado.productos.map((producto: any) => ({
      ...producto,
      imagenUrl: producto.imagen_principal 
        ? objProductos.construirUrlImagen(producto.imagen_principal, baseUrl)
        : null
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: resultado.productos.length > 0 ? `${resultado.productos.length} productos encontrados para el usuario.` : "No se encontraron productos para este usuario.",
      data: listaConImagenes,
      pagination: {
        total: resultado.total,
        pagina: resultado.pagina,
        limite: resultado.limite,
        totalPaginas: resultado.totalPaginas,
        hayMasPaginas: resultado.hayMasPaginas
      }
    };
  } catch (error) {
    console.error("Error en getProductosPorUsuario:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const getProductosDisponibles = async (ctx: Context) => {
  try {
    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    const filtros = { ...filtrosSchema.parse(queryParams), disponible: true };

    const objProductos = new ProductosModel();
    const lista = await objProductos.ListarProductos();

    const productosFiltrados = filtrarProductos(lista, filtros);
    const resultado = paginarResultados(productosFiltrados, filtros.pagina || 1, filtros.limite || 50);
    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagen_principal 
        ? objProductos.construirUrlImagen(producto.imagen_principal, baseUrl)
        : null
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: resultado.productos.length > 0
        ? `${resultado.productos.length} productos disponibles encontrados.`
        : "No hay productos disponibles.",
      data: listaConImagenes,
      pagination: {
        total: resultado.total,
        pagina: resultado.pagina,
        limite: resultado.limite,
        totalPaginas: resultado.totalPaginas,
        hayMasPaginas: resultado.hayMasPaginas
      }
    };
  } catch (error) {
    console.error("Error en getProductosDisponibles:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const buscarProductos = async (ctx: Context) => {
  try {
    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    const filtros = filtrosSchema.parse(queryParams);

    if (!filtros.nombre) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "El parámetro 'nombre' es requerido para la búsqueda.",
      };
      return;
    }

    const objProductos = new ProductosModel();
    const lista = await objProductos.ListarProductos();

    const productosFiltrados = filtrarProductos(lista, filtros);
    const resultado = paginarResultados(productosFiltrados, filtros.pagina || 1, filtros.limite || 50);
    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagen_principal 
        ? objProductos.construirUrlImagen(producto.imagen_principal, baseUrl)
        : null
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: resultado.productos.length > 0 ? `${resultado.productos.length} productos encontrados con "${filtros.nombre}".` : `No se encontraron productos con "${filtros.nombre}".`,
      data: listaConImagenes,
      pagination: {
        total: resultado.total,
        pagina: resultado.pagina,
        limite: resultado.limite,
        totalPaginas: resultado.totalPaginas,
        hayMasPaginas: resultado.hayMasPaginas
      },
      termino_busqueda: filtros.nombre
    };
  } catch (error) {
    console.error("Error en buscarProductos:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const getProductoPorId = async (ctx: RouterContext<"/productos/:id">) => {
  try {
    const id_producto = Number(ctx.params.id);
    
    if (isNaN(id_producto) || id_producto <= 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "ID de producto invalido.",
      };
      return;
    }

    // Obtener producto con información del productor usando JOIN
    const { conexion } = await import("../Models/Conexion.ts");
    
    const productos = await conexion.query(`
      SELECT 
        p.*,
        u.nombre as nombre_productor,
        u.email as email_productor,
        u.telefono as telefono_productor,
        u.foto_perfil as foto_productor,
        c.nombre as ciudad_origen,
        d.nombre as departamento_origen,
        r.nombre as region_origen,
        cat.nombre as categoria_nombre,
        cat.imagen_url as categoria_imagen
      FROM productos p
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      LEFT JOIN ciudades c ON p.id_ciudad_origen = c.id_ciudad
      LEFT JOIN departamentos d ON c.id_departamento = d.id_departamento
      LEFT JOIN regiones r ON d.id_region = r.id_region
      LEFT JOIN categorias cat ON p.id_categoria = cat.id_categoria AND cat.activa = 1
      WHERE p.id_producto = ?
    `, [id_producto]);

    if (productos.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Producto no encontrado.",
      };
      return;
    }

    const producto = productos[0];
    const objProductos = new ProductosModel();
    const baseUrl = getBaseUrl(ctx);
    
    const productoConImagen = {
      ...producto,
      imagenUrl: producto.imagen_principal 
        ? objProductos.construirUrlImagen(producto.imagen_principal, baseUrl)
        : null
    };

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Producto encontrado.",
      data: productoConImagen,
    };
  } catch (error) {
    console.error("Error en getProductoPorId:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const postProducto = async (ctx: Context) => {
  try {
    const body = await ctx.request.body.json();
    console.log(`📦 [POST /productos] Datos recibidos:`, { 
      campos: Object.keys(body),
      tieneImagenData: !!body.imagenData,
      tipoImagenData: typeof body.imagenData,
      longitudImagenData: body.imagenData ? body.imagenData.length : 0,
      prefijoImagenData: body.imagenData ? body.imagenData.substring(0, 50) : null
    });
    
    // Extraer imagenData ANTES de validar con Zod
    const imagenDataRaw = body.imagenData;
    const imagen_principal = body.imagen_principal;
    
    // Remover imagenData del body para que Zod no lo valide
    const bodySinImagenData = { ...body };
    delete bodySinImagenData.imagenData;
    
    // Normalizar imagenData: convertir strings vacíos a undefined
    const imagenData = (imagenDataRaw && typeof imagenDataRaw === 'string' && imagenDataRaw !== '' && imagenDataRaw !== null) 
      ? imagenDataRaw 
      : undefined;
    
    // Log para depuración
    if (imagenData) {
      console.log(`🔍 [POST /productos] imagenData recibido:`, {
        tipo: typeof imagenData,
        longitud: imagenData.length,
        prefijo: imagenData.substring(0, 100),
        esDataImage: imagenData.startsWith('data:image/'),
        esDataImagePuntoComa: imagenData.startsWith('data:image;'),
      });
    }
    
    let validated;
    try {
      validated = productosSchema.parse(bodySinImagenData);
      console.log(`✅ [POST /productos] Validación exitosa`);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error(`❌ [POST /productos] Error de validación:`, validationError.errors);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "VALIDATION_ERROR",
          message: "Datos inválidos.",
          errors: validationError.errors.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        };
        return;
      }
      throw validationError;
    }

    const { imagen_principal: imagenPrincipalValidada, ...productoData } = validated;
    
    console.log(`🖼️ [POST /productos] imagenData procesado:`, {
      tipo: typeof imagenData,
      tieneValor: !!imagenData,
      longitud: imagenData ? imagenData.length : 0,
      prefijo: imagenData ? imagenData.substring(0, 50) : null
    });

    const productoCompleto: ProductoData = {
      id_producto: 0,
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      precio: productoData.precio,
      stock: productoData.stock,
      stock_minimo: productoData.stock_minimo || 5,
      id_usuario: productoData.id_usuario,
      id_categoria: productoData.id_categoria ?? undefined,
      id_ciudad_origen: productoData.id_ciudad_origen ?? undefined,
      unidad_medida: productoData.unidad_medida || 'kg',
      disponible: productoData.disponible !== false,
      imagen_principal: imagenPrincipalValidada ?? undefined
    };

    const objProductos = new ProductosModel(productoCompleto);
    // Si hay imagen_principal (URL), actualizarla después de crear el producto
    const result = await objProductos.AgregarProducto(imagenData);
    
    // Si se creó exitosamente y hay imagen_principal (URL), actualizarla
    if (result.success && result.producto && imagenPrincipalValidada && !imagenData) {
      await conexion.execute(
        "UPDATE productos SET imagen_principal = ? WHERE id_producto = ?",
        [imagenPrincipalValidada, result.producto.id_producto]
      );
      // Recargar el producto con la imagen actualizada
      const productoActualizado = await conexion.query(
        "SELECT * FROM productos WHERE id_producto = ?",
        [result.producto.id_producto]
      );
      if (productoActualizado.length > 0) {
        result.producto = productoActualizado[0] as ProductoData;
      }
    }

    if (result.success && result.producto) {
      const baseUrl = getBaseUrl(ctx);
      const productoConUrl: ProductoDataResponse = {
        ...result.producto,
        imagenUrl: result.producto.imagen_principal 
          ? objProductos.construirUrlImagen(result.producto.imagen_principal, baseUrl)
          : null
      };

      ctx.response.status = 200;
      ctx.response.body = {
        success: result.success,
        message: result.message,
        data: productoConUrl,
      };
    } else {
      ctx.response.status = result.success ? 200 : 404;
      ctx.response.body = {
        success: result.success,
        message: result.message,
        data: result.producto,
      };
    }
  } catch (error) {
    console.error("Error en postProducto:", error);
    
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      ctx.response.status = 400; // Bad Request para errores de validación
      ctx.response.body = {
        success: false,
        error: "VALIDATION_ERROR",
        message: "Datos inválidos.",
        errors: zodError.errors.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor al agregar el producto.",
      };
    }
  }
};

export const putProducto = async (ctx: RouterContext<"/productos/:id">) => {
  try {
    const id_producto = Number(ctx.params.id);
    
    console.log(`📝 [PUT /productos/${id_producto}] Iniciando actualización de producto`);
    
    if (isNaN(id_producto) || id_producto <= 0) {
      console.warn(`⚠️ [PUT /productos/${id_producto}] ID de producto inválido`);
      ctx.response.status = 400; // Cambiar a 400 (Bad Request) en lugar de 404
      ctx.response.body = {
        success: false,
        error: "INVALID_ID",
        message: "ID de producto inválido.",
      };
      return;
    }

    let body;
    try {
      body = await ctx.request.body.json();
      console.log(`📦 [PUT /productos/${id_producto}] Datos recibidos:`, { 
        campos: Object.keys(body),
        tieneImagen: !!body.imagenData 
      });
    } catch (jsonError) {
      console.error(`❌ [PUT /productos/${id_producto}] Error parseando JSON:`, jsonError);
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "INVALID_JSON",
        message: "Error al parsear el cuerpo de la petición.",
      };
      return;
    }
    
    // Extraer imagenData ANTES de validar con Zod
    const imagenDataRaw = body.imagenData;
    
    // Remover imagenData del body para que Zod no lo valide
    const bodySinImagenData = { ...body };
    delete bodySinImagenData.imagenData;
    
    // Normalizar imagenData: convertir strings vacíos a undefined
    const imagenData = (imagenDataRaw && typeof imagenDataRaw === 'string' && imagenDataRaw !== '' && imagenDataRaw !== null) 
      ? imagenDataRaw 
      : undefined;
    
    // Log para depuración
    if (imagenData) {
      console.log(`🔍 [PUT /productos/${id_producto}] imagenData recibido:`, {
        tipo: typeof imagenData,
        longitud: imagenData.length,
        prefijo: imagenData.substring(0, 100),
        esDataImage: imagenData.startsWith('data:image/'),
        esDataImagePuntoComa: imagenData.startsWith('data:image;'),
      });
    }
    
    const bodyWithId = { ...bodySinImagenData, id_producto };
    let validated;
    try {
      validated = productosUpdateSchema.parse(bodyWithId);
      console.log(`✅ [PUT /productos/${id_producto}] Datos validados correctamente`);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error(`❌ [PUT /productos/${id_producto}] Error de validación:`, validationError.errors);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "VALIDATION_ERROR",
          message: "Datos inválidos.",
          errors: validationError.errors.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        };
        return;
      }
      throw validationError;
    }

    const { ...productoData } = validated;
    
    console.log(`🖼️ [PUT /productos/${id_producto}] imagenData procesado:`, {
      tipo: typeof imagenData,
      tieneValor: !!imagenData,
      longitud: imagenData ? imagenData.length : 0,
      prefijo: imagenData ? imagenData.substring(0, 50) : null
    });

    const objProductosCheck = new ProductosModel();
    const productoExiste = await objProductosCheck.ObtenerProductoPorId(id_producto);
    
    if (!productoExiste) {
      console.warn(`⚠️ [PUT /productos/${id_producto}] Producto no encontrado en la base de datos`);
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "PRODUCT_NOT_FOUND",
        message: "Producto no encontrado.",
      };
      return;
    }

    console.log(`✅ [PUT /productos/${id_producto}] Producto encontrado:`, { 
      nombre: productoExiste.nombre,
      tieneImagenActual: !!productoExiste.imagen_principal 
    });

    const productoCompleto: ProductoData = {
      id_producto: productoData.id_producto,
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      precio: productoData.precio,
      stock: productoData.stock,
      stock_minimo: productoData.stock_minimo || 5,
      id_usuario: productoData.id_usuario,
      id_categoria: productoData.id_categoria ?? undefined,
      id_ciudad_origen: productoData.id_ciudad_origen ?? undefined,
      unidad_medida: productoData.unidad_medida || 'kg',
      disponible: productoData.disponible !== false,
      imagen_principal: productoExiste.imagen_principal,
      imagenes_adicionales: productoExiste.imagenes_adicionales,
    };

    const objProductos = new ProductosModel(productoCompleto);
    const result = await objProductos.EditarProducto(imagenData);

    if (result.success) {
      console.log(`✅ [PUT /productos/${id_producto}] Producto actualizado exitosamente:`, result.message);
      ctx.response.status = 200;
    } else {
      console.error(`❌ [PUT /productos/${id_producto}] Error al actualizar producto:`, result.message);
      ctx.response.status = 500; // Cambiar a 500 (Internal Server Error) en lugar de 404
    }
    
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error(`❌ [PUT /productos/${ctx.params.id}] Error inesperado:`, error);
    
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      ctx.response.status = 400; // Bad Request para errores de validación
      ctx.response.body = {
        success: false,
        error: "VALIDATION_ERROR",
        message: "Datos inválidos.",
        errors: zodError.errors.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Error interno del servidor al actualizar el producto.",
      };
    }
  }
};

export const deleteProducto = async (ctx: RouterContext<"/productos/:id">) => {
  try {
    const id_producto = Number(ctx.params.id);
    
    if (isNaN(id_producto) || id_producto <= 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "ID de producto invalido.",
      };
      return;
    }

    // Obtener información del producto antes de eliminarlo para borrar todas las imágenes
    const { conexion } = await import("../Models/Conexion.ts");
    const producto = await conexion.query(
      "SELECT imagen_principal, imagenes_adicionales FROM productos WHERE id_producto = ?",
      [id_producto]
    );

    // Eliminar todas las imágenes si existen
    if (producto.length > 0) {
      try {
        const { imageService } = await import("../Services/ImageService.ts");
        
        // Eliminar imagen principal si existe
        if (producto[0].imagen_principal) {
          await imageService.deleteImage(producto[0].imagen_principal);
          console.log(`🗑️ Imagen principal eliminada: ${producto[0].imagen_principal}`);
        }
        
        // Eliminar imágenes adicionales si existen
        if (producto[0].imagenes_adicionales) {
          let imagenesAdicionales: string[] = [];
          try {
            if (typeof producto[0].imagenes_adicionales === 'string') {
              imagenesAdicionales = JSON.parse(producto[0].imagenes_adicionales);
            } else if (Array.isArray(producto[0].imagenes_adicionales)) {
              imagenesAdicionales = producto[0].imagenes_adicionales;
            }
            
            // Eliminar cada imagen adicional
            for (const imagenPath of imagenesAdicionales) {
              try {
                await imageService.deleteImage(imagenPath);
                console.log(`🗑️ Imagen adicional eliminada: ${imagenPath}`);
              } catch (imgError) {
                console.warn(`⚠️ Error eliminando imagen adicional ${imagenPath}:`, imgError);
              }
            }
          } catch (parseError) {
            console.warn("⚠️ Error parseando imagenes_adicionales:", parseError);
          }
        }
        
        // Eliminar toda la carpeta del producto (esto eliminará cualquier imagen restante)
        await imageService.deleteFolder(`productos/${id_producto}`);
        console.log(`🗑️ Carpeta del producto eliminada: productos/${id_producto}`);
      } catch (imageError) {
        console.error("⚠️ Error eliminando imágenes del producto:", imageError);
        // Continuar con la eliminación del producto aunque falle la eliminación de las imágenes
      }
    }

    const objProductos = new ProductosModel();
    const result = await objProductos.EliminarProducto(id_producto);

    ctx.response.status = result.success ? 200 : 404;
    ctx.response.body = {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error("Error en deleteProducto:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

// 📌 Nuevas funciones para funcionalidades mejoradas

export const getProductosConInfo = async (ctx: Context) => {
  try {
    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    const filtros = filtrosSchema.parse(queryParams);

    const objProductos = new ProductosModel();
    const lista = await objProductos.ListarProductosConInfo();

    // Aplicar filtros básicos
    let productosFiltrados: ProductoData[] = [...(lista as unknown as ProductoData[])];

    if (filtros.nombre) {
      productosFiltrados = productosFiltrados.filter((producto: ProductoData) => 
        producto.nombre.toLowerCase().includes(filtros.nombre!.toLowerCase())
      );
    }

    if (filtros.precio_min !== undefined) {
      productosFiltrados = productosFiltrados.filter((producto: ProductoData) => 
        producto.precio >= filtros.precio_min!
      );
    }

    if (filtros.precio_max !== undefined) {
      productosFiltrados = productosFiltrados.filter((producto: ProductoData) => 
        producto.precio <= filtros.precio_max!
      );
    }

    if (filtros.stock_min !== undefined) {
      productosFiltrados = productosFiltrados.filter((producto: ProductoData) => 
        producto.stock >= filtros.stock_min!
      );
    }

    const resultado = paginarResultados(productosFiltrados, filtros.pagina || 1, filtros.limite || 50);
    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = resultado.productos.map(producto => ({
      ...producto,
      imagenUrl: producto.imagen_principal 
        ? objProductos.construirUrlImagen(producto.imagen_principal, baseUrl)
        : null
    }));

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: resultado.productos.length > 0 ? `${resultado.productos.length} productos encontrados.` : "No se encontraron productos.",
      data: listaConImagenes,
      pagination: {
        total: resultado.total,
        pagina: resultado.pagina,
        limite: resultado.limite,
        totalPaginas: resultado.totalPaginas,
        hayMasPaginas: resultado.hayMasPaginas
      }
    };
  } catch (error) {
    console.error("Error en getProductosConInfo:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const buscarProductosAvanzado = async (ctx: Context) => {
  try {
    const queryParams = Object.fromEntries(ctx.request.url.searchParams.entries());
    
    const criterios = {
      nombre: queryParams.nombre,
      categoria: queryParams.categoria ? parseInt(queryParams.categoria) : undefined,
      ciudad: queryParams.ciudad ? parseInt(queryParams.ciudad) : undefined,
      departamento: queryParams.departamento ? parseInt(queryParams.departamento) : undefined,
      region: queryParams.region ? parseInt(queryParams.region) : undefined,
      precio_min: queryParams.precio_min ? parseFloat(queryParams.precio_min) : undefined,
      precio_max: queryParams.precio_max ? parseFloat(queryParams.precio_max) : undefined,
      stock_min: queryParams.stock_min ? parseInt(queryParams.stock_min) : undefined,
    };

    const objProductos = new ProductosModel();
    const productos = await objProductos.BuscarProductos(criterios);

    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = productos.map((producto: any) => {
      const imagenPrincipal = typeof producto.imagen_principal === 'string' ? producto.imagen_principal : null;
      return {
        ...producto,
        imagenUrl: imagenPrincipal 
          ? objProductos.construirUrlImagen(imagenPrincipal, baseUrl)
          : null
      };
    });

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: productos.length > 0 ? `${productos.length} productos encontrados.` : "No se encontraron productos con los criterios especificados.",
      data: listaConImagenes,
      total: productos.length,
      criterios_aplicados: criterios
    };
  } catch (error) {
    console.error("Error en buscarProductosAvanzado:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const getProductosPorProductor = async (ctx: RouterContext<"/productos/productor/:id">) => {
  try {
    const id_usuario = Number(ctx.params.id);
    
    if (isNaN(id_usuario) || id_usuario <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "ID de usuario inválido.",
      };
      return;
    }

    const objProductos = new ProductosModel();
    const productos = await objProductos.ObtenerProductosPorProductor(id_usuario);

    const baseUrl = getBaseUrl(ctx);
    const listaConImagenes = productos.map((producto: any) => {
      const imagenPrincipal = typeof producto.imagen_principal === 'string' ? producto.imagen_principal : null;
      return {
        ...producto,
        imagenUrl: imagenPrincipal 
          ? objProductos.construirUrlImagen(imagenPrincipal, baseUrl)
          : null
      };
    });

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: productos.length > 0 ? `${productos.length} productos encontrados para el productor.` : "No se encontraron productos para este productor.",
      data: listaConImagenes,
      total: productos.length
    };
  } catch (error) {
    console.error("Error en getProductosPorProductor:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};

export const getProductoDetallado = async (ctx: RouterContext<"/productos/:id/detalle">) => {
  try {
    const id_producto = Number(ctx.params.id);
    
    if (isNaN(id_producto) || id_producto <= 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "ID de producto inválido.",
      };
      return;
    }

    const { conexion } = await import("../Models/Conexion.ts");
    
    const producto = await conexion.query(`
      SELECT 
        p.*,
        u.nombre as nombre_productor,
        u.email as email_productor,
        u.telefono as telefono_productor,
        u.direccion as direccion_productor,
        c.nombre as ciudad_origen,
        d.nombre as departamento_origen,
        r.nombre as region_origen,
        GROUP_CONCAT(cat.nombre) as categorias,
        AVG(res.calificacion) as calificacion_promedio,
        COUNT(res.id_resena) as total_resenas
      FROM productos p
      INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
      INNER JOIN ciudades c ON p.id_ciudad_origen = c.id_ciudad
      INNER JOIN departamentos d ON c.id_departamento = d.id_departamento
      INNER JOIN regiones r ON d.id_region = r.id_region
      LEFT JOIN categorias cat ON p.id_categoria = cat.id_categoria AND cat.activa = 1
      LEFT JOIN reseñas res ON p.id_producto = res.id_producto
      WHERE p.id_producto = ?
      GROUP BY p.id_producto
    `, [id_producto]);

    if (producto.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Producto no encontrado.",
      };
      return;
    }

    const objProductos = new ProductosModel();
    const baseUrl = getBaseUrl(ctx);
    const productoDetallado = {
      ...producto[0],
      imagenUrl: producto[0].imagenPrincipal 
        ? objProductos.construirUrlImagen(producto[0].imagenPrincipal, baseUrl)
        : null,
      calificacion_promedio: producto[0].calificacion_promedio ? parseFloat(producto[0].calificacion_promedio).toFixed(1) : null,
      total_resenas: parseInt(producto[0].total_resenas) || 0
    };

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Producto encontrado.",
      data: productoDetallado,
    };
  } catch (error) {
    console.error("Error en getProductoDetallado:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error interno del servidor.",
    };
  }
};