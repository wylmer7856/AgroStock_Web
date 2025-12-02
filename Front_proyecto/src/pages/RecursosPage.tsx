import React from 'react';
import { Link } from 'react-router-dom';
import { BiBook, BiVideo, BiFile, BiQuestionMark, BiDownload, BiLinkExternal } from 'react-icons/bi';

const RecursosPage: React.FC = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="text-center mb-5">
            <BiBook className="display-1 text-primary mb-3" />
            <h1 className="display-5 fw-bold">Recursos y Guías</h1>
            <p className="text-muted lead">Todo lo que necesitas para aprovechar al máximo AgroStock</p>
          </div>

          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="h4 fw-bold mb-0">
                <BiBook className="me-2" />
                Guías para Productores
              </h2>
            </div>
            <div className="card-body p-5">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card h-100 border">
                    <div className="card-body">
                      <BiFile className="fs-1 text-primary mb-3" />
                      <h5 className="fw-bold">Guía de Inicio Rápido</h5>
                      <p className="text-muted">
                        Aprende a configurar tu cuenta, publicar productos y gestionar tus primeras ventas.
                      </p>
                      <button className="btn btn-outline-primary btn-sm">
                        <BiDownload className="me-1" />
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100 border">
                    <div className="card-body">
                      <BiVideo className="fs-1 text-danger mb-3" />
                      <h5 className="fw-bold">Tutorial en Video</h5>
                      <p className="text-muted">
                        Video tutorial paso a paso para dominar todas las funcionalidades de la plataforma.
                      </p>
                      <button className="btn btn-outline-danger btn-sm">
                        <BiLinkExternal className="me-1" />
                        Ver Video
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100 border">
                    <div className="card-body">
                      <BiFile className="fs-1 text-success mb-3" />
                      <h5 className="fw-bold">Mejores Prácticas</h5>
                      <p className="text-muted">
                        Consejos y estrategias para maximizar tus ventas y satisfacer a tus clientes.
                      </p>
                      <button className="btn btn-outline-success btn-sm">
                        <BiDownload className="me-1" />
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100 border">
                    <div className="card-body">
                      <BiQuestionMark className="fs-1 text-warning mb-3" />
                      <h5 className="fw-bold">Preguntas Frecuentes</h5>
                      <p className="text-muted">
                        Respuestas a las preguntas más comunes sobre cómo usar la plataforma.
                      </p>
                      <Link to="/soporte" className="btn btn-outline-warning btn-sm">
                        <BiLinkExternal className="me-1" />
                        Ver FAQ
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-success text-white">
              <h2 className="h4 fw-bold mb-0">
                <BiBook className="me-2" />
                Guías para Consumidores
              </h2>
            </div>
            <div className="card-body p-5">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card h-100 border">
                    <div className="card-body">
                      <BiFile className="fs-1 text-primary mb-3" />
                      <h5 className="fw-bold">Cómo Comprar</h5>
                      <p className="text-muted">
                        Guía completa sobre cómo navegar, buscar productos y realizar compras seguras.
                      </p>
                      <button className="btn btn-outline-primary btn-sm">
                        <BiDownload className="me-1" />
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card h-100 border">
                    <div className="card-body">
                      <BiFile className="fs-1 text-info mb-3" />
                      <h5 className="fw-bold">Guía de Productos</h5>
                      <p className="text-muted">
                        Aprende a identificar productos de calidad y entender las descripciones.
                      </p>
                      <button className="btn btn-outline-info btn-sm">
                        <BiDownload className="me-1" />
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-body p-5">
              <h2 className="h4 fw-bold mb-4">Enlaces Útiles</h2>
              <div className="row g-3">
                <div className="col-md-4">
                  <Link to="/terminos-condiciones" className="text-decoration-none d-block p-3 border rounded">
                    <BiFile className="text-primary me-2" />
                    <strong>Términos y Condiciones</strong>
                  </Link>
                </div>
                <div className="col-md-4">
                  <a href="#" className="text-decoration-none d-block p-3 border rounded" onClick={(e) => e.preventDefault()}>
                    <BiFile className="text-primary me-2" />
                    <strong>Política de Privacidad</strong>
                  </a>
                </div>
                <div className="col-md-4">
                  <Link to="/soporte" className="text-decoration-none d-block p-3 border rounded">
                    <BiQuestionMark className="text-primary me-2" />
                    <strong>Centro de Soporte</strong>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecursosPage;
