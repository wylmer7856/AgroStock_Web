import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { productosService, pedidosService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { 
  BiBarChart, 
  BiPackage, 
  BiReceipt, 
  BiDollar, 
  BiTrendingUp, 
  BiTrendingDown,
  BiCheckCircle,
  BiTime,
  BiShoppingBag,
  BiDownload
} from 'react-icons/bi';

const ProductorEstadisticasPage: React.FC = () => {
  const { user } = useAuth();

  // Obtener productos del productor
  const { data: productos, isLoading: loadingProductos } = useQuery({
    queryKey: ['productos', 'productor', user?.id_usuario],
    queryFn: async () => {
      if (!user?.id_usuario) return [];
      const response = await productosService.obtenerProductosPorUsuario(user.id_usuario);
      if (!response.success) {
        console.error('Error obteniendo productos:', response.message);
        return [];
      }
      return response.data || [];
    },
    enabled: !!user?.id_usuario,
  });

  // Obtener pedidos del productor
  const { data: pedidos, isLoading: loadingPedidos } = useQuery({
    queryKey: ['pedidos', 'productor', user?.id_usuario],
    queryFn: async () => {
      if (!user?.id_usuario) return [];
      const response = await pedidosService.obtenerMisPedidos('productor', user.id_usuario);
      if (!response.success) {
        console.error('Error obteniendo pedidos:', response.message);
        return [];
      }
      return response.data || [];
    },
    enabled: !!user?.id_usuario,
  });

  if (loadingProductos || loadingPedidos) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando estadísticas...</span>
          </div>
        </div>
      </div>
    );
  }

  const productosList = productos || [];
  const pedidosList = pedidos || [];

  // Estadísticas de productos
  const totalProductos = productosList.length;
  const productosActivos = productosList.filter((p: any) => p.disponible).length;
  const productosInactivos = totalProductos - productosActivos;
  const productosStockBajo = productosList.filter((p: any) => 
    p.stock !== null && p.stock_minimo !== null && p.stock <= p.stock_minimo
  ).length;
  const productosAgotados = productosList.filter((p: any) => 
    p.stock !== null && p.stock === 0
  ).length;

  // Estadísticas de pedidos
  const totalPedidos = pedidosList.length;
  const pedidosPendientes = pedidosList.filter((p: any) => p.estado === 'pendiente').length;
  const pedidosConfirmados = pedidosList.filter((p: any) => p.estado === 'confirmado').length;
  const pedidosEnPreparacion = pedidosList.filter((p: any) => p.estado === 'en_preparacion').length;
  const pedidosEnCamino = pedidosList.filter((p: any) => p.estado === 'en_camino').length;
  const pedidosEntregados = pedidosList.filter((p: any) => p.estado === 'entregado').length;
  const pedidosCancelados = pedidosList.filter((p: any) => p.estado === 'cancelado').length;

  // Estadísticas financieras
  const totalVentas = pedidosList
    .filter((p: any) => p.estado === 'entregado' && p.total)
    .reduce((sum: number, p: any) => sum + (Number(p.total) || 0), 0);
  
  const ventasPendientes = pedidosList
    .filter((p: any) => ['pendiente', 'confirmado', 'en_preparacion', 'en_camino'].includes(p.estado) && p.total)
    .reduce((sum: number, p: any) => sum + (Number(p.total) || 0), 0);

  // Calcular promedio de pedidos por mes (últimos 3 meses)
  const ahora = new Date();
  const hace3Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 3, 1);
  const pedidosUltimos3Meses = pedidosList.filter((p: any) => {
    const fechaPedido = new Date(p.fecha_pedido || p.fecha_creacion || 0);
    return fechaPedido >= hace3Meses;
  }).length;
  const promedioMensual = pedidosUltimos3Meses / 3;

  // Función para exportar a Excel
  const exportarAExcel = () => {
    try {
      // Crear datos para Excel
      const datosExcel = [
        // Encabezados
        ['ESTADÍSTICAS DEL PRODUCTOR', '', '', ''],
        ['Fecha de exportación:', new Date().toLocaleString('es-CO'), '', ''],
        ['', '', '', ''],
        ['ESTADÍSTICAS DE PRODUCTOS', '', '', ''],
        ['Total Productos', totalProductos, '', ''],
        ['Productos Activos', productosActivos, '', ''],
        ['Productos Inactivos', productosInactivos, '', ''],
        ['Stock Bajo', productosStockBajo, '', ''],
        ['Agotados', productosAgotados, '', ''],
        ['', '', '', ''],
        ['ESTADÍSTICAS DE PEDIDOS', '', '', ''],
        ['Total Pedidos', totalPedidos, '', ''],
        ['Pendientes', pedidosPendientes, '', ''],
        ['Confirmados', pedidosConfirmados, '', ''],
        ['En Preparación', pedidosEnPreparacion, '', ''],
        ['En Camino', pedidosEnCamino, '', ''],
        ['Entregados', pedidosEntregados, '', ''],
        ['Cancelados', pedidosCancelados, '', ''],
        ['', '', '', ''],
        ['ESTADÍSTICAS FINANCIERAS', '', '', ''],
        ['Ventas Totales', `$${totalVentas.toLocaleString('es-CO')}`, '', ''],
        ['Ventas Pendientes', `$${ventasPendientes.toLocaleString('es-CO')}`, '', ''],
        ['', '', '', ''],
        ['MÉTRICAS ADICIONALES', '', '', ''],
        ['Promedio Mensual (últimos 3 meses)', promedioMensual.toFixed(1), '', ''],
        ['Pedidos últimos 3 meses', pedidosUltimos3Meses, '', ''],
        ['Tasa de Entrega', `${totalPedidos > 0 ? ((pedidosEntregados / totalPedidos) * 100).toFixed(1) : 0}%`, '', ''],
        ['', '', '', ''],
        ['DETALLE DE PRODUCTOS', '', '', ''],
        ['ID', 'Nombre', 'Precio', 'Stock', 'Estado'],
        ...productosList.map((p: any) => [
          p.id_producto || '',
          p.nombre || '',
          `$${Number(p.precio || 0).toLocaleString('es-CO')}`,
          p.stock || 0,
          p.disponible ? 'Activo' : 'Inactivo'
        ]),
        ['', '', '', ''],
        ['DETALLE DE PEDIDOS', '', '', ''],
        ['ID', 'Fecha', 'Estado', 'Total', 'Consumidor'],
        ...pedidosList.map((p: any) => [
          p.id_pedido || '',
          p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString('es-CO') : '',
          p.estado || '',
          `$${Number(p.total || 0).toLocaleString('es-CO')}`,
          p.consumidor_nombre || 'N/A'
        ])
      ];

      // Convertir a CSV (compatible con Excel)
      const csvContent = datosExcel.map(row => 
        row.map(cell => {
          // Escapar comillas y envolver en comillas si contiene comas
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ).join('\n');

      // Agregar BOM para UTF-8 (Excel)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `estadisticas_productor_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('✅ Estadísticas exportadas correctamente');
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      toast.error('Error al exportar estadísticas');
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <div>
            <h1 className="display-6 fw-bold mb-2">
              <BiBarChart className="me-2" />
              Estadísticas
            </h1>
            <p className="text-muted">Análisis de tu actividad como productor</p>
          </div>
          <button
            className="btn btn-success"
            onClick={exportarAExcel}
            style={{ height: 'fit-content' }}
          >
            <BiDownload className="me-2" />
            Descargar Excel
          </button>
        </div>
      </div>

      {/* Estadísticas de Productos */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <BiPackage className="me-2" />
                Estadísticas de Productos
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <div className="text-center p-3 bg-light rounded">
                    <BiPackage className="display-4 text-primary mb-2" />
                    <h3 className="mb-0">{totalProductos}</h3>
                    <p className="text-muted mb-0">Total Productos</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <BiCheckCircle className="display-4 text-success mb-2" />
                    <h3 className="mb-0">{productosActivos}</h3>
                    <p className="text-muted mb-0">Productos Activos</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                    <BiTime className="display-4 text-warning mb-2" />
                    <h3 className="mb-0">{productosStockBajo}</h3>
                    <p className="text-muted mb-0">Stock Bajo</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-danger bg-opacity-10 rounded">
                    <BiShoppingBag className="display-4 text-danger mb-2" />
                    <h3 className="mb-0">{productosAgotados}</h3>
                    <p className="text-muted mb-0">Agotados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas de Pedidos */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <BiReceipt className="me-2" />
                Estadísticas de Pedidos
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div className="text-center p-3 bg-light rounded">
                    <BiReceipt className="display-4 text-primary mb-2" />
                    <h3 className="mb-0">{totalPedidos}</h3>
                    <p className="text-muted mb-0">Total Pedidos</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                    <BiTime className="display-4 text-warning mb-2" />
                    <h3 className="mb-0">{pedidosPendientes}</h3>
                    <p className="text-muted mb-0">Pendientes</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                    <BiTime className="display-4 text-info mb-2" />
                    <h3 className="mb-0">{pedidosEnPreparacion}</h3>
                    <p className="text-muted mb-0">En Preparación</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <BiCheckCircle className="display-4 text-success mb-2" />
                    <h3 className="mb-0">{pedidosEntregados}</h3>
                    <p className="text-muted mb-0">Entregados</p>
                  </div>
                </div>
              </div>

              {/* Distribución de estados */}
              <div className="row">
                <div className="col-md-6">
                  <h6 className="mb-3">Distribución por Estado</h6>
                  <div className="list-group">
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <span>Pendientes</span>
                      <span className="badge bg-warning rounded-pill">{pedidosPendientes}</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <span>Confirmados</span>
                      <span className="badge bg-info rounded-pill">{pedidosConfirmados}</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <span>En Preparación</span>
                      <span className="badge bg-primary rounded-pill">{pedidosEnPreparacion}</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <span>En Camino</span>
                      <span className="badge bg-secondary rounded-pill">{pedidosEnCamino}</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <span>Entregados</span>
                      <span className="badge bg-success rounded-pill">{pedidosEntregados}</span>
                    </div>
                    {pedidosCancelados > 0 && (
                      <div className="list-group-item d-flex justify-content-between align-items-center">
                        <span>Cancelados</span>
                        <span className="badge bg-danger rounded-pill">{pedidosCancelados}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="mb-3">Métricas Adicionales</h6>
                  <div className="list-group">
                    <div className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <span>Promedio Mensual (últimos 3 meses)</span>
                        <strong>{promedioMensual.toFixed(1)}</strong>
                      </div>
                    </div>
                    <div className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <span>Pedidos últimos 3 meses</span>
                        <strong>{pedidosUltimos3Meses}</strong>
                      </div>
                    </div>
                    <div className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <span>Tasa de Entrega</span>
                        <strong>
                          {totalPedidos > 0 
                            ? ((pedidosEntregados / totalPedidos) * 100).toFixed(1) 
                            : 0}%
                          </strong>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Financieras */}
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <BiDollar className="me-2" />
                Ventas Totales
              </h5>
            </div>
            <div className="card-body text-center py-5">
              <BiTrendingUp className="display-1 text-success mb-3" />
              <h2 className="display-4 fw-bold text-success">
                ${totalVentas.toLocaleString('es-CO')}
              </h2>
              <p className="text-muted">Total de ventas entregadas</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-warning text-white">
              <h5 className="mb-0">
                <BiTime className="me-2" />
                Ventas Pendientes
              </h5>
            </div>
            <div className="card-body text-center py-5">
              <BiTrendingDown className="display-1 text-warning mb-3" />
              <h2 className="display-4 fw-bold text-warning">
                ${ventasPendientes.toLocaleString('es-CO')}
              </h2>
              <p className="text-muted">Pedidos en proceso</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductorEstadisticasPage;

