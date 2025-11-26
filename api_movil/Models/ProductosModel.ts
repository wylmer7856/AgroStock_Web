import { conexion } from "./Conexion.ts";
import { join, resolve, fromFileUrl } from "../Dependencies/dependencias.ts";
import { HistorialPreciosModel, HistorialPrecioCreateData } from "./HistorialPreciosModel.ts";

export interface ProductoData {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stock_minimo: number;
  unidad_medida: string;
  id_usuario: number;
  id_categoria?: number;
  id_ciudad_origen?: number;
  imagen_principal?: string;
  imagenes_adicionales?: string | string[]; // JSON array o string
  disponible: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface ProductoDataResponse extends ProductoData {
  imagenUrl?: string | null; // Para compatibilidad
  nombre_productor?: string;
  email_productor?: string;
  ciudad_origen?: string;
  departamento_origen?: string;
  categoria_nombre?: string;
}

export class ProductosModel {
    public _objProducto: ProductoData | null;
    private readonly UPLOADS_DIR: string;
    
    constructor(objProducto: ProductoData | null = null) {
        this._objProducto = objProducto;
        // Resolver la ruta absoluta del directorio uploads
        // Usar Deno.cwd() que ya está en api_movil según los logs
        try {
            // @ts-ignore - Deno is a global object in Deno runtime
            const cwd = Deno.cwd();
            // Si cwd es api_movil, usar directamente; si no, construir la ruta
            if (cwd.endsWith('api_movil')) {
                this.UPLOADS_DIR = resolve(cwd, "uploads");
            } else {
                // Si estamos en el directorio raíz del proyecto
                this.UPLOADS_DIR = resolve(cwd, "api_movil", "uploads");
            }
            console.log(`📁 [ProductosModel] UPLOADS_DIR resuelto: ${this.UPLOADS_DIR} (cwd: ${cwd})`);
        } catch (error) {
            // Fallback: usar ruta relativa
            this.UPLOADS_DIR = "./uploads";
            console.log(`⚠️ [ProductosModel] Usando fallback UPLOADS_DIR: ${this.UPLOADS_DIR}`);
        }
    }

    public async ListarProductos(): Promise<ProductoData[]> {
        try {
            const result = await conexion.query("SELECT * FROM productos ORDER BY id_producto DESC");
            return result as ProductoData[];
        } catch (error) {
            console.error("Error al listar productos:", error);
            throw new Error("Error al listar productos.");
        }
    }

    // 📌 Listar productos con información adicional
    public async ListarProductosConInfo(): Promise<Record<string, unknown>[]> {
        try {
            const result = await conexion.query(`
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
                INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
                LEFT JOIN ciudades c ON p.id_ciudad_origen = c.id_ciudad
                LEFT JOIN departamentos d ON c.id_departamento = d.id_departamento
                LEFT JOIN regiones r ON d.id_region = r.id_region
                LEFT JOIN categorias cat ON p.id_categoria = cat.id_categoria AND cat.activa = 1
                WHERE p.disponible = 1
                ORDER BY p.id_producto DESC
            `);
            return result;
        } catch (error) {
            console.error("Error al listar productos con info:", error);
            return [];
        }
    }

    // 📌 Buscar productos por criterios
    public async BuscarProductos(criterios: {
        nombre?: string;
        categoria?: number;
        ciudad?: number;
        departamento?: number;
        region?: number;
        precio_min?: number;
        precio_max?: number;
        stock_min?: number;
    }): Promise<Record<string, unknown>[]> {
        try {
            let query = `
                SELECT 
                    p.*,
                    u.nombre as nombre_productor,
                    u.email as email_productor,
                    u.telefono as telefono_productor,
                    c.nombre as ciudad_origen,
                    d.nombre as departamento_origen,
                    r.nombre as region_origen,
                    GROUP_CONCAT(cat.nombre) as categorias
                FROM productos p
                INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
                INNER JOIN ciudades c ON p.id_ciudad_origen = c.id_ciudad
                INNER JOIN departamentos d ON c.id_departamento = d.id_departamento
                INNER JOIN regiones r ON d.id_region = r.id_region
                LEFT JOIN categorias cat ON p.id_categoria = cat.id_categoria AND cat.activa = 1
                WHERE p.disponible = 1
            `;
            
            const params: unknown[] = [];

            if (criterios.nombre) {
                query += " AND p.nombre LIKE ?";
                params.push(`%${criterios.nombre}%`);
            }

            if (criterios.categoria) {
                query += " AND p.id_categoria = ?";
                params.push(criterios.categoria);
            }

            if (criterios.ciudad) {
                query += " AND p.id_ciudad_origen = ?";
                params.push(criterios.ciudad);
            }

            if (criterios.departamento) {
                query += " AND c.id_departamento = ?";
                params.push(criterios.departamento);
            }

            if (criterios.region) {
                query += " AND d.id_region = ?";
                params.push(criterios.region);
            }

            if (criterios.precio_min !== undefined) {
                query += " AND p.precio >= ?";
                params.push(criterios.precio_min);
            }

            if (criterios.precio_max !== undefined) {
                query += " AND p.precio <= ?";
                params.push(criterios.precio_max);
            }

            if (criterios.stock_min !== undefined) {
                query += " AND p.stock >= ?";
                params.push(criterios.stock_min);
            }

            query += " ORDER BY p.id_producto DESC";

            const result = await conexion.query(query, params);
            return result;
        } catch (error) {
            console.error("Error al buscar productos:", error);
            return [];
        }
    }

    // 📌 Obtener productos por productor
    public async ObtenerProductosPorProductor(id_usuario: number): Promise<Record<string, unknown>[]> {
        try {
            const result = await conexion.query(`
                SELECT 
                    p.*,
                    c.nombre as ciudad_origen,
                    d.nombre as departamento_origen,
                    r.nombre as region_origen,
                    GROUP_CONCAT(cat.nombre) as categorias
                FROM productos p
                INNER JOIN ciudades c ON p.id_ciudad_origen = c.id_ciudad
                INNER JOIN departamentos d ON c.id_departamento = d.id_departamento
                INNER JOIN regiones r ON d.id_region = r.id_region
                LEFT JOIN categorias cat ON p.id_categoria = cat.id_categoria AND cat.activa = 1
                WHERE p.id_usuario = ?
                ORDER BY p.id_producto DESC
            `, [id_usuario]);
            
            return result;
        } catch (error) {
            console.error("Error al obtener productos por productor:", error);
            return [];
        }
    }

    public async AgregarProducto(imagenData?: string): Promise<{ success: boolean; message: string; producto?: ProductoData }> {
        try {
            if (!this._objProducto) {
                throw new Error("No se proporciono un objeto de producto.");
            }

            const { nombre, descripcion, precio, stock, stock_minimo, id_usuario, id_categoria, id_ciudad_origen, unidad_medida } = this._objProducto;

            if (!nombre || precio === undefined || stock === undefined || !id_usuario) {
                throw new Error("Faltan campos obligatorios: nombre, precio, stock, id_usuario.");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, id_usuario, id_categoria, id_ciudad_origen, unidad_medida, disponible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [nombre, descripcion || null, precio, stock, stock_minimo || 5, id_usuario, id_categoria || null, id_ciudad_origen || null, unidad_medida || 'kg']
            );

            if (!result || !result.affectedRows || result.affectedRows === 0) {
                await conexion.execute("ROLLBACK");
                return { success: false, message: "No se pudo agregar el producto." };
            }

            const queryResult = await conexion.query("SELECT * FROM productos ORDER BY id_producto DESC LIMIT 1");
            const nuevoProducto = queryResult[0] as ProductoData;

            let rutaImagen = null;
            if (imagenData) {
                try {
                    rutaImagen = await this.guardarImagen(nuevoProducto.id_producto, imagenData);
                    
                    await conexion.execute("UPDATE productos SET imagen_principal = ? WHERE id_producto = ?", 
                    [rutaImagen, nuevoProducto.id_producto]
                    );
                } catch (imageError) {
                    console.error("Error al procesar imagen:", imageError);
                }
            }

            await conexion.execute("COMMIT");

            const productoFinal = await conexion.query("SELECT * FROM productos WHERE id_producto = ?", [nuevoProducto.id_producto]);

            return {
                success: true,
                message: "Producto agregado exitosamente.",
                producto: productoFinal[0] as ProductoData
            };

        } catch (error) {
            await conexion.execute("ROLLBACK");
            console.error("Error al agregar producto:", error);
            return { 
                success: false, 
                message: error instanceof Error ? error.message : "Error al agregar producto." 
            };
        }
    }

    public async EditarProducto(imagenData?: string): Promise<{ success: boolean; message: string }> {
        try {
            if (!this._objProducto || !this._objProducto.id_producto) {
                throw new Error("No se proporciono un objeto de producto valido.");
            }
            const { id_producto, nombre, descripcion, precio, stock, stock_minimo, id_usuario, id_categoria, id_ciudad_origen, unidad_medida, disponible } = this._objProducto;

            console.log(`📝 [ProductosModel.EditarProducto] Iniciando edición del producto ${id_producto}`);
            console.log(`📦 [ProductosModel.EditarProducto] Datos a actualizar:`, {
                nombre,
                precio,
                stock,
                stock_minimo,
                id_usuario,
                id_categoria,
                id_ciudad_origen,
                unidad_medida,
                disponible,
                tieneImagenData: !!imagenData
            });

            await conexion.execute("START TRANSACTION");

            // Obtener el producto completo antes de actualizar para comparar cambios
            const productoAnterior = await conexion.query(
                "SELECT nombre, descripcion, precio, stock, stock_minimo, id_usuario, id_categoria, id_ciudad_origen, unidad_medida, imagen_principal, disponible FROM productos WHERE id_producto = ?", 
                [id_producto]
            );
            
            if (productoAnterior.length === 0) {
                await conexion.execute("ROLLBACK");
                console.error(`❌ [ProductosModel.EditarProducto] Producto ${id_producto} no encontrado`);
                return {
                    success: false,
                    message: "Producto no encontrado.",
                };
            }

            const productoActual = productoAnterior[0];
            const precioAnterior = parseFloat(productoActual.precio);

            // Verificar si hay cambios reales en los datos
            const hayCambios = 
                productoActual.nombre !== nombre ||
                (productoActual.descripcion || null) !== (descripcion || null) ||
                parseFloat(productoActual.precio) !== precio ||
                parseInt(productoActual.stock) !== stock ||
                parseInt(productoActual.stock_minimo) !== stock_minimo ||
                parseInt(productoActual.id_usuario) !== id_usuario ||
                (productoActual.id_categoria || null) !== (id_categoria || null) ||
                (productoActual.id_ciudad_origen || null) !== (id_ciudad_origen || null) ||
                productoActual.unidad_medida !== unidad_medida ||
                (productoActual.disponible ? 1 : 0) !== (disponible !== false ? 1 : 0);

            console.log(`🔄 [ProductosModel.EditarProducto] ¿Hay cambios en los datos?`, hayCambios);
            console.log(`🖼️ [ProductosModel.EditarProducto] ¿Hay nueva imagen?`, !!imagenData);

            let rutaImagen = this._objProducto.imagen_principal;
            let imagenGuardada = false;
            
            if (imagenData) {
                console.log(`📸 [ProductosModel.EditarProducto] Procesando nueva imagen...`);
                if (this._objProducto.imagen_principal) {
                    const productDir = join(this.UPLOADS_DIR, "productos", id_producto.toString());
                    try {
                        // @ts-ignore - Deno is a global object in Deno runtime
                        if (await Deno.stat(productDir).then(() => true).catch(() => false)) {
                            // @ts-ignore - Deno.remove is a valid Deno API method
                            await Deno.remove(productDir, { recursive: true });
                            console.log(`🗑️ [ProductosModel.EditarProducto] Imagen anterior eliminada`);
                        }
                    } catch (removeError) {
                        console.warn(`⚠️ [ProductosModel.EditarProducto] Error al eliminar imagen anterior:`, removeError);
                    }
                }
                
                try {
                    rutaImagen = await this.guardarImagen(id_producto, imagenData);
                    imagenGuardada = true;
                    console.log(`✅ [ProductosModel.EditarProducto] Nueva imagen guardada: ${rutaImagen}`);
                } catch (imageError) {
                    console.error(`❌ [ProductosModel.EditarProducto] Error al procesar nueva imagen:`, imageError);
                    throw imageError; // Si falla guardar la imagen, no continuar
                }
            }

            // Solo hacer UPDATE si hay cambios o si se guardó una nueva imagen
            if (hayCambios || imagenGuardada) {
                const result = await conexion.execute(
                    `UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, stock_minimo = ?, id_usuario = ?, id_categoria = ?, id_ciudad_origen = ?, unidad_medida = ?, imagen_principal = ?, disponible = ? WHERE id_producto = ?`,
                    [nombre, descripcion || null, precio, stock, stock_minimo || 5, id_usuario, id_categoria || null, id_ciudad_origen || null, unidad_medida || 'kg', rutaImagen, disponible !== false ? 1 : 0, id_producto]
                );

                console.log(`📊 [ProductosModel.EditarProducto] Resultado del UPDATE:`, {
                    affectedRows: result?.affectedRows,
                    result: result
                });

                // Si el precio cambió, registrar en historial de precios
                if (precioAnterior !== null && precio !== undefined && precioAnterior !== precio) {
                    try {
                        const historialData: HistorialPrecioCreateData = {
                            id_producto,
                            precio_anterior: precioAnterior,
                            precio_nuevo: precio,
                            id_usuario_modifico: id_usuario || null
                        };
                        const historialModel = new HistorialPreciosModel(historialData);
                        await historialModel.RegistrarCambioPrecio();
                        console.log(`📈 [ProductosModel.EditarProducto] Historial de precio registrado`);
                    } catch (historialError) {
                        console.error(`⚠️ [ProductosModel.EditarProducto] Error al registrar historial de precio:`, historialError);
                        // No fallar la actualización del producto si falla el historial
                    }
                }

                // Si el UPDATE se ejecutó sin errores, considerar exitoso
                // MySQL puede devolver affectedRows: 0 si los valores no cambiaron, pero eso no significa error
                if (result) {
                    await conexion.execute("COMMIT");
                    const mensaje = imagenGuardada 
                        ? "Producto e imagen actualizados exitosamente." 
                        : "Producto editado exitosamente.";
                    console.log(`✅ [ProductosModel.EditarProducto] ${mensaje}`);
                    return {
                        success: true,
                        message: mensaje,
                    };
                } else {
                    await conexion.execute("ROLLBACK");
                    console.error(`❌ [ProductosModel.EditarProducto] El UPDATE no devolvió resultado`);
                    return {
                        success: false,
                        message: "No se pudo editar el producto.",
                    };
                }
            } else {
                // No hay cambios y no hay nueva imagen
                await conexion.execute("ROLLBACK");
                console.log(`ℹ️ [ProductosModel.EditarProducto] No hay cambios para actualizar`);
                return {
                    success: true,
                    message: "No se detectaron cambios para actualizar.",
                };
            }
        } catch (error) {
            await conexion.execute("ROLLBACK");
            console.error(`❌ [ProductosModel.EditarProducto] Error inesperado:`, error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Error al editar el producto.",
            };
        }
    }

    public async EliminarProducto(id_producto: number): Promise<{ success: boolean; message: string }> {
        try {
            await conexion.execute("START TRANSACTION");

            const producto = await conexion.query("SELECT * FROM productos WHERE id_producto = ?", [id_producto]);
            
            if (!producto || producto.length === 0) {
                await conexion.execute("ROLLBACK");
                return {
                    success: false,
                    message: "El producto no existe."
                };
            }

            // Eliminar TODOS los detalle_pedidos relacionados (son registros históricos)
            // Los pedidos se mantienen, solo se elimina la referencia al producto
            try {
                const resultDetalles = await conexion.execute(
                    "DELETE FROM detalle_pedidos WHERE id_producto = ?",
                    [id_producto]
                );
                console.log(`✅ Detalles de pedidos eliminados (${resultDetalles.affectedRows || 0} registros)`);
            } catch (detalleError) {
                console.warn("⚠️ Error eliminando detalles de pedidos:", detalleError);
                // Si falla, intentar continuar de todos modos
            }

            // Eliminar o actualizar registros relacionados que tienen restricciones de clave foránea
            try {
                // Establecer id_producto a NULL en mensajes relacionados
                await conexion.execute(
                    "UPDATE mensajes SET id_producto = NULL WHERE id_producto = ?",
                    [id_producto]
                );
                console.log(`✅ Mensajes relacionados actualizados para producto ${id_producto}`);
            } catch (msgError) {
                console.warn("⚠️ Error actualizando mensajes relacionados:", msgError);
                // Continuar con la eliminación aunque falle la actualización de mensajes
            }

            // Eliminar de lista de deseos
            try {
                await conexion.execute(
                    "DELETE FROM lista_deseos WHERE id_producto = ?",
                    [id_producto]
                );
                console.log(`✅ Producto eliminado de listas de deseos`);
            } catch (listaError) {
                console.warn("⚠️ Error eliminando de lista de deseos:", listaError);
            }

            // Eliminar del carrito
            try {
                await conexion.execute(
                    "DELETE FROM carrito WHERE id_producto = ?",
                    [id_producto]
                );
                console.log(`✅ Producto eliminado de carritos`);
            } catch (carritoError) {
                console.warn("⚠️ Error eliminando del carrito:", carritoError);
            }

            // Eliminar reseñas relacionadas
            try {
                await conexion.execute(
                    "DELETE FROM reseñas WHERE id_producto = ?",
                    [id_producto]
                );
                console.log(`✅ Reseñas eliminadas`);
            } catch (resenaError) {
                console.warn("⚠️ Error eliminando reseñas:", resenaError);
            }

            // Eliminar historial de precios (debería tener CASCADE, pero por si acaso)
            try {
                await conexion.execute(
                    "DELETE FROM historial_precios WHERE id_producto = ?",
                    [id_producto]
                );
                console.log(`✅ Historial de precios eliminado`);
            } catch (historialError) {
                console.warn("⚠️ Error eliminando historial de precios:", historialError);
            }


            // Ahora eliminar el producto
            const result = await conexion.execute("DELETE FROM productos WHERE id_producto = ?", [id_producto]);

            if (result && result.affectedRows && result.affectedRows > 0) {
                await this.eliminarCarpetaProducto(id_producto);
                
                await conexion.execute("COMMIT");
                return {
                    success: true,
                    message: "Producto eliminado exitosamente."
                };
            } else {
                await conexion.execute("ROLLBACK");
                return {
                    success: false,
                    message: "No se pudo eliminar el producto."
                };
            }
        } catch (error) {
            await conexion.execute("ROLLBACK");
            console.error("Error al eliminar producto:", error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Error al eliminar el producto."
            };
        }        
    }

    public async ObtenerProductoPorId(id_producto: number): Promise<ProductoData | null> {
        try {
            const result = await conexion.query("SELECT * FROM productos WHERE id_producto = ?", [id_producto]);
            return result.length > 0 ? result[0] as ProductoData : null;
        } catch (error) {
            console.error("Error al obtener producto por ID:", error);
            throw new Error("Error al obtener producto.");
        }
    }

    public construirUrlImagen(rutaImagen: string | null | undefined, baseUrl: string = "http://localhost:8000"): string | null {
        if (!rutaImagen) return null;
        
        // Normalizar la ruta: reemplazar backslashes con forward slashes y eliminar barras duplicadas
        let rutaNormalizada = rutaImagen.replace(/\\/g, '/').replace(/\/+/g, '/');
        
        // Remover cualquier prefijo /uploads/ o uploads/ que ya exista
        rutaNormalizada = rutaNormalizada.replace(/^\/?uploads\//, '');
        
        // Remover cualquier / al inicio
        rutaNormalizada = rutaNormalizada.replace(/^\/+/, '');
        
        // Construir la URL completa con /uploads/ al inicio
        const url = `${baseUrl}/uploads/${rutaNormalizada}`;
        
        console.log(`🔗 [ProductosModel.construirUrlImagen]`, {
            rutaOriginal: rutaImagen,
            rutaNormalizada,
            url
        });
        
        return url;
    }

    private async existeDirectorio(ruta: string): Promise<boolean> {
        try {
            // @ts-ignore - Deno is a global object in Deno runtime
            const stat = await Deno.stat(ruta);
            return stat.isDirectory;
        } catch {
            return false;
        }
    }

    private async crearDirectorio(ruta: string): Promise<void> {
        try {
            // @ts-ignore - Deno is a global object in Deno runtime
            await Deno.mkdir(ruta, { recursive: true });
        } catch (error) {
            // @ts-ignore - Deno is a global object in Deno runtime
            if (!(error instanceof Deno.errors.AlreadyExists)) {
                throw error;
            }
        }
    }

    private async crearCarpetaProducto(idProducto: number): Promise<string> {
        try {
            if (!(await this.existeDirectorio(this.UPLOADS_DIR))) {
                await this.crearDirectorio(this.UPLOADS_DIR);
            }

            // Crear carpeta productos si no existe
            const productosDir = join(this.UPLOADS_DIR, "productos");
            if (!(await this.existeDirectorio(productosDir))) {
                await this.crearDirectorio(productosDir);
            }

            // Crear carpeta específica del producto
            const productDir = join(productosDir, idProducto.toString());
            if (!(await this.existeDirectorio(productDir))) {
                await this.crearDirectorio(productDir);
            }

            return productDir;
        } catch (error) {
            console.error(`Error al crear carpeta para producto`, error);
            throw new Error("Error al crear directorio para la imagen.");
        }
    }

    private async eliminarCarpetaProducto(idProducto: number): Promise<void> {
        try {
            const productDir = join(this.UPLOADS_DIR, "productos", idProducto.toString());
            
            if (await this.existeDirectorio(productDir)) {
                // @ts-ignore - Deno is a global object in Deno runtime
                await Deno.remove(productDir, { recursive: true });
            }

            // Verificar si la carpeta productos está vacía y eliminarla si es necesario
            const productosDir = join(this.UPLOADS_DIR, "productos");
            if (await this.existeDirectorio(productosDir)) {
                try {
                    const items = [];
                    // @ts-ignore - Deno is a global object in Deno runtime
                    for await (const dirEntry of Deno.readDir(productosDir)) {
                        items.push(dirEntry);
                    }
                    if (items.length === 0) {
                        // @ts-ignore - Deno is a global object in Deno runtime
                        await Deno.remove(productosDir);
                    }
                } catch (_readError) {
                    console.log("Directorio productos ya no existe o esta vacio");
                }
            }
        } catch (error) {
            console.error(`Error al eliminar carpeta para producto`, error);
        }
    }

    private detectarTipoImagen(imagenData: string): string {

      if (imagenData.startsWith('data:image/')) {
            const match = imagenData.match(/data:image\/([^;]+)/);
            return match ? match[1] : 'jpg';
        }
        
        // Manejar formato data:image;base64,
        if (imagenData.startsWith('data:image;')) {
            // Intentar detectar el tipo desde el contenido base64 o usar jpg por defecto
            // Para JPEG, el inicio suele ser /9j/4AAQ
            if (imagenData.includes('/9j/')) {
                return 'jpg';
            }
            // Para PNG, el inicio suele ser iVBORw0KGgo
            if (imagenData.includes('iVBORw0KGgo')) {
                return 'png';
            }
            // Por defecto, asumir jpg
            return 'jpg';
        }

        if (imagenData.startsWith('http://') || imagenData.startsWith('https://') || imagenData.startsWith('file://')) {
            const url = new URL(imagenData);
            const pathname = url.pathname.toLowerCase();
            if (pathname.includes('.png')) return 'png';
            if (pathname.includes('.jpg') || pathname.includes('.jpeg')) return 'jpg';
            if (pathname.includes('.gif')) return 'gif';
            if (pathname.includes('.webp')) return 'webp';
            if (pathname.includes('.bmp')) return 'bmp';
            if (pathname.includes('.svg')) return 'svg';
            return 'jpg';
        }
        
        return 'jpg';
    }

    private async procesarImagen(imagenData: string): Promise<Uint8Array> {
        try {
            console.log(`Procesando imagen - Entrada: ${imagenData.substring(0, 50)}...`);
            
            if (imagenData.startsWith('data:image/')) {
                const base64Data = imagenData.split(',')[1];
                if (!base64Data) {
                    throw new Error("Datos base64 invalidos despues del prefijo data:image/");
                }
                return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            }
            
            // Manejar formato data:image;base64,
            if (imagenData.startsWith('data:image;')) {
                const base64Data = imagenData.split(',')[1];
                if (!base64Data) {
                    throw new Error("Datos base64 invalidos despues del prefijo data:image;");
                }
                return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            }
            
            if (imagenData.startsWith('file://')) {
                let rutaArchivo = imagenData.replace('file://', '');
                
                if (rutaArchivo.startsWith('/') && rutaArchivo.match(/^\/[A-Za-z]:/)) {
                    rutaArchivo = rutaArchivo.substring(1);
                }
                                
                try {
                    // @ts-ignore - Deno is a global object in Deno runtime
                    const stat = await Deno.stat(rutaArchivo);
                    if (!stat.isFile) {
                        throw new Error(`La ruta no es un archivo valido: ${rutaArchivo}`);
                    }
                    
                    // @ts-ignore - Deno is a global object in Deno runtime
                    const fileData = await Deno.readFile(rutaArchivo);
                    return fileData;
                } catch (error) {
                    console.error(`Error al leer archivo`, error);
                    throw new Error(`No se pudo leer el archivo: ${rutaArchivo}. Verifica que el archivo existe y tienes permisos de lectura.`);
                }
            }
            
            if (imagenData.startsWith('http://') || imagenData.startsWith('https://')) {
                const response = await fetch(imagenData);
                if (!response.ok) {
                    throw new Error(`Error al descargar imagen: ${response.status} - ${response.statusText}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                return new Uint8Array(arrayBuffer);
            }
            
            if (imagenData.match(/^[A-Za-z0-9+/]+=*$/)) {
                try {
                    return Uint8Array.from(atob(imagenData), c => c.charCodeAt(0));
                } catch (_error) {
                    throw new Error("El texto parece ser base64 pero no se puede decodificar correctamente");
                }
            }
            
            throw new Error(`Formato de imagen no reconocido. Recibido: ${imagenData.substring(0, 100)}`);
            
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Error desconocido al procesar la imagen");
        }
    }

    private async guardarImagen(idProducto: number, imagenData: string): Promise<string> {
        try {
            
            const productDir = await this.crearCarpetaProducto(idProducto);
            
            const timestamp = Date.now();
            const extension = this.detectarTipoImagen(imagenData);
            const nombreArchivo = `imagen_${timestamp}.${extension}`;
            const rutaCompleta = join(productDir, nombreArchivo);

            console.log(`📸 [ProductosModel.guardarImagen] Guardando imagen como: ${rutaCompleta}`);

            const dataToWrite = await this.procesarImagen(imagenData);
                        
            // @ts-ignore - Deno is a global object in Deno runtime
            await Deno.writeFile(rutaCompleta, dataToWrite);
            
            console.log(`✅ [ProductosModel.guardarImagen] Imagen guardada exitosamente`);
            
            // Retornar la ruta relativa normalizada: uploads/productos/5/imagen_xxx.jpg
            // Usar siempre / como separador para compatibilidad con URLs
            const rutaRelativa = `uploads/productos/${idProducto.toString()}/${nombreArchivo}`.replace(/\\/g, '/');
            console.log(`🔗 [ProductosModel.guardarImagen] Ruta relativa retornada: ${rutaRelativa}`);
            return rutaRelativa;
        } catch (error) {
            console.error(`❌ [ProductosModel.guardarImagen] Error al guardar imagen:`, error);
            throw new Error("Error al guardar la imagen: " + (error instanceof Error ? error.message : "Error desconocido"));
        }
    }
}