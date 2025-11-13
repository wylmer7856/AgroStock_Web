import { conexion } from "./Conexion.ts";

interface PedidoData {
  id_pedido: number | null;
  id_consumidor: number;
  id_productor: number;
  total: number;
  estado: "pendiente" | "confirmado" | "en_preparacion" | "en_camino" | "entregado" | "cancelado";
  direccion_entrega: string;
  id_ciudad_entrega?: number | null;
  metodo_pago: "efectivo" | "transferencia" | "nequi" | "daviplata" | "pse" | "tarjeta";
  estado_pago?: "pendiente" | "pagado" | "reembolsado";
  notas?: string | null;
  fecha_pedido?: string | null;
  fecha_entrega?: string | null;
}


export class PedidosModel {
  public _objPedido: PedidoData | null;

  constructor(objPedido: PedidoData | null = null) {
    this._objPedido = objPedido;
  }

  public async ListarPedidos(): Promise<any[]> {
    try {
      const result = await conexion.query(`
        SELECT 
          p.*,
          uc.nombre as nombre_consumidor,
          uc.email as email_consumidor,
          up.nombre as nombre_productor,
          up.email as email_productor,
          c.nombre as ciudad_nombre,
          d.nombre as departamento_nombre
        FROM pedidos p
        LEFT JOIN usuarios uc ON p.id_consumidor = uc.id_usuario
        LEFT JOIN usuarios up ON p.id_productor = up.id_usuario
        LEFT JOIN ciudades c ON p.id_ciudad_entrega = c.id_ciudad
        LEFT JOIN departamentos d ON c.id_departamento = d.id_departamento
        ORDER BY p.fecha_pedido DESC
      `);
      return result as any[];
    } catch (error) {
      console.error("Error al listar pedidos:", error);
      throw new Error("Error al listar pedidos.");
    }
  }

  // 📌 Obtener pedidos por productor con información completa
  public async ObtenerPedidosPorProductor(id_productor: number): Promise<any[]> {
    try {
      const result = await conexion.query(`
        SELECT 
          p.*,
          u.nombre as consumidor_nombre,
          u.email as consumidor_email,
          u.telefono as consumidor_telefono,
          c.nombre as ciudad_nombre,
          d.nombre as departamento_nombre
        FROM pedidos p
        LEFT JOIN usuarios u ON p.id_consumidor = u.id_usuario
        LEFT JOIN ciudades c ON p.id_ciudad_entrega = c.id_ciudad
        LEFT JOIN departamentos d ON c.id_departamento = d.id_departamento
        WHERE p.id_productor = ? 
        ORDER BY p.fecha_pedido DESC
      `, [id_productor]);
      return result as any[];
    } catch (error) {
      console.error("Error al obtener pedidos por productor:", error);
      throw new Error("Error al obtener pedidos del productor.");
    }
  }

  // 📌 Obtener pedidos por consumidor con información completa
  public async ObtenerPedidosPorConsumidor(id_consumidor: number): Promise<any[]> {
    try {
      const result = await conexion.query(`
        SELECT 
          p.*,
          u.nombre as productor_nombre,
          u.email as productor_email,
          u.telefono as productor_telefono,
          c.nombre as ciudad_nombre,
          d.nombre as departamento_nombre
        FROM pedidos p
        LEFT JOIN usuarios u ON p.id_productor = u.id_usuario
        LEFT JOIN ciudades c ON p.id_ciudad_entrega = c.id_ciudad
        LEFT JOIN departamentos d ON c.id_departamento = d.id_departamento
        WHERE p.id_consumidor = ? 
        ORDER BY p.fecha_pedido DESC
      `, [id_consumidor]);
      return result as any[];
    } catch (error) {
      console.error("Error al obtener pedidos por consumidor:", error);
      throw new Error("Error al obtener pedidos del consumidor.");
    }
  }

  public async AgregarPedido(): Promise<{ success: boolean; message: string; pedido?: PedidoData }> {
    try {
      if (!this._objPedido) {
        throw new Error("No se proporcionó un objeto de pedido.");
      }

      const { id_consumidor, id_productor, total, estado, direccion_entrega, id_ciudad_entrega, metodo_pago, estado_pago, notas } = this._objPedido;

      if (!id_consumidor || !id_productor || !total || !direccion_entrega || !metodo_pago) {
        throw new Error("Faltan campos obligatorios para crear el pedido.");
      }

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(`INSERT INTO pedidos (id_consumidor, id_productor, total, estado, direccion_entrega, id_ciudad_entrega, metodo_pago, estado_pago, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_consumidor, id_productor, total, estado || 'pendiente', direccion_entrega, id_ciudad_entrega || null, metodo_pago, estado_pago || 'pendiente', notas || null]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        const queryResult = await conexion.query("SELECT * FROM pedidos ORDER BY id_pedido DESC LIMIT 1");

        await conexion.execute("COMMIT");

        return {
          success: true,
          message: "Pedido agregado exitosamente.",
          pedido: queryResult[0] as PedidoData,
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo agregar el pedido.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al agregar pedido:", error);
      return {
        success: false,
        message: "Error al agregar pedido.",
      };
    }
  }

  public async EditarPedido(id_pedido: number): Promise<{ success: boolean; message: string }> {
    try {
      if (!this._objPedido) {
        throw new Error("No se proporcionó un objeto de pedido.");
      }

      const { id_consumidor, id_productor, total, estado, direccion_entrega, id_ciudad_entrega, metodo_pago, estado_pago, notas, fecha_entrega } = this._objPedido;

      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute(`UPDATE pedidos SET id_consumidor = ?, id_productor = ?, total = ?, estado = ?, direccion_entrega = ?, id_ciudad_entrega = ?, metodo_pago = ?, estado_pago = ?, notas = ?, fecha_entrega = ? WHERE id_pedido = ?`,
        [id_consumidor, id_productor, total, estado, direccion_entrega, id_ciudad_entrega || null, metodo_pago, estado_pago || 'pendiente', notas || null, fecha_entrega || null, id_pedido]
      );

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Pedido editado exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo editar el pedido.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al editar pedido:", error);
      return {
        success: false,
        message: "Error al editar pedido.",
      };
    }
  }

  public async EliminarPedido(id_pedido: number): Promise<{ success: boolean; message: string }> {
    try {
      await conexion.execute("START TRANSACTION");

      const result = await conexion.execute("DELETE FROM pedidos WHERE id_pedido = ?", [id_pedido]);

      if (result && result.affectedRows && result.affectedRows > 0) {
        await conexion.execute("COMMIT");
        return {
          success: true,
          message: "Pedido eliminado exitosamente.",
        };
      } else {
        await conexion.execute("ROLLBACK");
        return {
          success: false,
          message: "No se pudo eliminar el pedido.",
        };
      }
    } catch (error) {
      await conexion.execute("ROLLBACK");
      console.error("Error al eliminar pedido:", error);
      return {
        success: false,
        message: "Error al eliminar pedido.",
      };
    }
  }

  // 📌 Obtener detalles de un pedido con información de productos
  public async ObtenerDetallesPedido(id_pedido: number): Promise<any[]> {
    try {
      const result = await conexion.query(`
        SELECT 
          dp.*,
          p.nombre as producto_nombre,
          p.imagen_principal as producto_imagen,
          p.descripcion as producto_descripcion,
          p.unidad_medida
        FROM detalle_pedidos dp
        LEFT JOIN productos p ON dp.id_producto = p.id_producto
        WHERE dp.id_pedido = ?
        ORDER BY dp.id_detalle
      `, [id_pedido]);
      return result as any[];
    } catch (error) {
      console.error("Error al obtener detalles del pedido:", error);
      throw new Error("Error al obtener detalles del pedido.");
    }
  }
}
