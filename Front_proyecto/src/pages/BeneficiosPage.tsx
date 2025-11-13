import React from 'react';
import { Link } from 'react-router-dom';
import { BiCheckCircle, BiTrendingUp, BiShield, BiDollarCircle, BiUser, BiStore } from 'react-icons/bi';

const BeneficiosPage: React.FC = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="text-center mb-5">
            <BiTrendingUp className="display-1 text-primary mb-3" />
            <h1 className="display-5 fw-bold">Beneficios de AgroStock</h1>
            <p className="text-muted lead">Descubre todas las ventajas de ser parte de nuestra plataforma</p>
          </div>

          {/* Beneficios para Productores */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="h4 fw-bold mb-0">
                <BiStore className="me-2" />
                Para Productores
              </h2>
            </div>
            <div className="card-body p-5">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="d-flex align-items-start">
                    <BiCheckCircle className="text-success fs-3 me-3 flex-shrink-0" />
                    <div>
                      <h5 className="fw-bold">Alcance Nacional</h5>
                      <p className="text-muted mb-0">
                        Llega a consumidores en todo el paÃ­s sin necesidad de intermediarios costosos.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start">
                    <BiDollarCircle className="text-success fs-3 me-3 flex-shrink-0" />
                    <div>
                      <h5 className="fw-bold">Precios Justos</h5>
                      <p className="text-muted mb-0">
                        Establece tus propios precios y obtÃ©n mejores mÃ¡rgenes de ganancia.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start">
                    <BiShield className="text-success fs-3 me-3 flex-shrink-0" />
                    <div>
                      <h5 className="fw-bold">Pagos Seguros</h5>
                      <p className="text-muted mb-0">
                        Recibe pagos de forma segura y oportuna por cada venta realizada.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start">
                    <BiTrendingUp className="text-success fs-3 me-3 flex-shrink-0" />
                    <div>
                      <h5 className="fw-bold">Herramientas de GestiÃ³n</h5>
                      <p className="text-muted mb-0">
                        Panel intuitivo para gestionar productos, pedidos e inventario.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start">
                    <BiUser className="text-success fs-3 me-3 flex-shrink-0" />
                    <div>
                      <h5 className="fw-bold">Comunidad de Productores</h5>
                      <p className="text-muted mb-0">
                        Conecta con otros productores y comparte experiencias y mejores prÃ¡cticas.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start">
                    <BiCheckCircle className="text-success fs-3 me-3 flex-shrink-0" />
                    <div>
                      <h5 className="fw-bold">Soporte Dedicado</h5>
                      <p className="text-muted mb-0">
                        Equipo de soporte especializado para ayudarte en todo momento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Beneficios para Consumidores */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-success text-white">
              <h2 className="h4 fw-bold mb-0">
                <BiUser className="me-2" />
                Para Consumidores
              </h2>
            </div>
            <div className="card-body p-5">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="d-flex align-items-start">
                    <BiCheckCircle className="text-primary fs-3 me-3 flex-shrink-0" />
                    <div>
                      <h5 className="fw-bold">Productos Frescos</h5>
                      <p className="text-muted mb-0">
                        Accede directamente a productos frescos del campo, sin intermediarios.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start">
                    <BiDollarCircle className="text-primary fs-3 me-3 flex-shrink-0" />
                    <div>
                      <h5 className="fw-bold">Mejores Precios</h5>
                      <p className="text-muted mb-0">
                        ObtÃ©n productos de calidad a precios justos, directamente del productor.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start">
                    <BiShield className="text-primary fs-3 me-3 flex-shrink-0" />
                    <div>
                      <h5 className="fw-bold">Transparencia</h5>
                      <p className="text-muted mb-0">
                        Conoce el origen de tus productos y los mÃ©todos de producciÃ³n utilizados.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start">
                    <BiTrendingUp className="text-primary fs-3 me-3 flex-shrink-0" />
                    <div>
                      <h5 className="fw-bold">Variedad de Productos</h5>
                      <p className="text-muted mb-0">
                        Amplia selecciÃ³n de productos agrÃ­colas de diferentes productores.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start">
                    <BiCheckCircle className="text-primary fs-3 me-3 flex-shrink-0" />
                    <div>
                      <h5 className="fw-bold">Compra Segura</h5>
                      <p className="text-muted mb-0">
                        Sistema de pagos seguro y protecciÃ³n al consumidor garantizada.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-start">
                    <BiUser className="text-primary fs-3 me-3 flex-shrink-0" />
                    <div>
                      <h5 className="fw-bold">Apoyo Local</h5>
                      <p className="text-muted mb-0">
                        Apoya a productores locales y contribuye al desarrollo de la agricultura colombiana.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-5">
            <Link to="/register" className="btn btn-primary btn-lg me-3">
              Registrarse Ahora
            </Link>
            <Link to="/productos" className="btn btn-outline-primary btn-lg">
              Explorar Productos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeneficiosPage;
