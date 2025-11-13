import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services';
import { BiUserCircle, BiPackage, BiReceipt, BiFile, BiBarChart, BiShield } from 'react-icons/bi';

const AdminDashboard: React.FC = () => {
  // Queries para estadísticas
  const { data: estadisticas } = useQuery({
    queryKey: ['admin', 'estadisticas'],
    queryFn: async () => {
      const response = await adminService.getEstadisticasGenerales();
      return response.data;
    },
  });

  const stats = estadisticas || {
    total_usuarios: 0,
    total_productos: 0,
    total_pedidos: 0,
    ingresos_totales: 0,
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-6 fw-bold mb-2">
            <BiShield className="me-2" />
            Panel de Administración
          </h1>
          <p className="text-muted">Gestiona toda la plataforma AgroStock</p>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <BiUserCircle className="fs-2 text-primary" />
                </div>
                <div>
                  <h6 className="text-muted mb-0">Usuarios</h6>
                  <h4 className="fw-bold mb-0">{stats.total_usuarios || 0}</h4>
                  <small className="text-muted">Total registrados</small>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0">
              <Link to="/admin/usuarios" className="btn btn-sm btn-primary w-100">
                Gestionar Usuarios
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <BiPackage className="fs-2 text-success" />
                </div>
                <div>
                  <h6 className="text-muted mb-0">Productos</h6>
                  <h4 className="fw-bold mb-0">{stats.total_productos || 0}</h4>
                  <small className="text-muted">En la plataforma</small>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0">
              <Link to="/admin/productos" className="btn btn-sm btn-success w-100">
                Gestionar Productos
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                  <BiReceipt className="fs-2 text-warning" />
                </div>
                <div>
                  <h6 className="text-muted mb-0">Pedidos</h6>
                  <h4 className="fw-bold mb-0">{stats.total_pedidos || 0}</h4>
                  <small className="text-muted">Total realizados</small>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0">
              <Link to="/admin/pedidos" className="btn btn-sm btn-warning w-100">
                Ver Pedidos
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                  <BiBarChart className="fs-2 text-info" />
                </div>
                <div>
                  <h6 className="text-muted mb-0">Ingresos</h6>
                  <h4 className="fw-bold mb-0">${(stats.ingresos_totales || 0).toLocaleString()}</h4>
                  <small className="text-muted">Totales</small>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent border-0">
              <Link to="/admin/estadisticas" className="btn btn-sm btn-info w-100">
                Ver Estadísticas
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Accesos Rápidos</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to="/admin/usuarios" className="btn btn-outline-primary">
                  <BiUserCircle className="me-2" />
                  Gestionar Usuarios
                </Link>
                <Link to="/admin/productos" className="btn btn-outline-success">
                  <BiPackage className="me-2" />
                  Gestionar Productos
                </Link>
                <Link to="/admin/reportes" className="btn btn-outline-warning">
                  <BiFile className="me-2" />
                  Ver Reportes
                </Link>
                <Link to="/admin/estadisticas" className="btn btn-outline-info">
                  <BiBarChart className="me-2" />
                  Ver Estadísticas
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Información del Sistema</h5>
            </div>
            <div className="card-body">
              <p className="text-muted mb-2">
                <strong>Versión:</strong> 1.0.0
              </p>
              <p className="text-muted mb-2">
                <strong>Estado:</strong> <span className="badge bg-success">Operativo</span>
              </p>
              <p className="text-muted mb-0">
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

