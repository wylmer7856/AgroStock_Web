import React from 'react';
import { Link } from 'react-router-dom';
import { BiStore, BiCheckCircle, BiTrendingUp, BiDollarCircle, BiUserPlus, BiShield } from 'react-icons/bi';

const ComoVenderPage: React.FC = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="text-center mb-5">
            <BiStore className="display-1 text-primary mb-3" />
            <h1 className="display-5 fw-bold">Cómo Vender en AgroStock</h1>
            <p className="text-muted lead">Conviértete en productor y comienza a vender tus productos agrícolas</p>
          </div>

          {/* Pasos para Registrarse */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-5">
              <h2 className="h3 fw-bold mb-4 text-primary">
                <BiUserPlus className="me-2" />
                Pasos para Comenzar
              </h2>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="d-flex">
                    <div className="flex-shrink-0">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                        <span className="fw-bold fs-5">1</span>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5 className="fw-bold">Crea tu Cuenta</h5>
                      <p className="text-muted mb-0">
                        Regístrate como productor en nuestra plataforma. El proceso es rápido y gratuito.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <div className="flex-shrink-0">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                        <span className="fw-bold fs-5">2</span>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5 className="fw-bold">Completa tu Perfil</h5>
                      <p className="text-muted mb-0">
                        Agrega información sobre tu finca, experiencia y métodos de producción.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <div className="flex-shrink-0">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                        <span className="fw-bold fs-5">3</span>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5 className="fw-bold">Publica tus Productos</h5>
                      <p className="text-muted mb-0">
                        Sube fotos, descripciones y precios de tus productos agrícolas.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <div className="flex-shrink-0">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                        <span className="fw-bold fs-5">4</span>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5 className="fw-bold">Comienza a Vender</h5>
                      <p className="text-muted mb-0">
                        Recibe pedidos y gestiona tus ventas desde tu panel de productor.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Beneficios */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-5">
              <h2 className="h3 fw-bold mb-4 text-primary">
                <BiTrendingUp className="me-2" />
                ¿Por Qué Vender en AgroStock?
              </h2>
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="text-center">
                    <BiDollarCircle className="display-4 text-success mb-3" />
                    <h5 className="fw-bold">Sin Comisiones Iniciales</h5>
                    <p className="text-muted">
                      Comienza a vender sin costos de registro. Solo pagas cuando vendes.
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <BiShield className="display-4 text-primary mb-3" />
                    <h5 className="fw-bold">Plataforma Segura</h5>
                    <p className="text-muted">
                      Transacciones protegidas y pagos seguros para ti y tus clientes.
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <BiTrendingUp className="display-4 text-warning mb-3" />
                    <h5 className="fw-bold">Alcance Amplio</h5>
                    <p className="text-muted">
                      Llega a miles de consumidores interesados en productos agrícolas frescos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Requisitos */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-5">
              <h2 className="h3 fw-bold mb-4 text-primary">
                <BiCheckCircle className="me-2" />
                Requisitos para Productores
              </h2>
              <ul className="list-unstyled">
                <li className="mb-3">
                  <BiCheckCircle className="text-success me-2" />
                  <strong>Ser productor agrícola</strong> con productos propios para vender
                </li>
                <li className="mb-3">
                  <BiCheckCircle className="text-success me-2" />
                  <strong>Documentación básica</strong> de tu finca o actividad productiva
                </li>
                <li className="mb-3">
                  <BiCheckCircle className="text-success me-2" />
                  <strong>Capacidad de entrega</strong> de productos en las condiciones prometidas
                </li>
                <li className="mb-3">
                  <BiCheckCircle className="text-success me-2" />
                  <strong>Compromiso con la calidad</strong> y frescura de los productos
                </li>
                <li className="mb-3">
                  <BiCheckCircle className="text-success me-2" />
                  <strong>Disponibilidad</strong> para gestionar pedidos y responder a clientes
                </li>
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="card bg-primary text-white border-0">
            <div className="card-body p-5 text-center">
              <h2 className="h3 fw-bold mb-3">¿Listo para Comenzar?</h2>
              <p className="lead mb-4">
                Únete a nuestra comunidad de productores y comienza a vender tus productos hoy mismo
              </p>
              <Link to="/register" className="btn btn-light btn-lg">
                Registrarse como Productor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComoVenderPage;

