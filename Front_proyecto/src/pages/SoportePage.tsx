import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BiSupport, BiEnvelope, BiPhone, BiMessage, BiQuestionMark, BiSearch } from 'react-icons/bi';

const SoportePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordion, setOpenAccordion] = useState<{ [key: string]: boolean }>({});

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: '¿Qué es AgroStock?',
          a: 'AgroStock es una plataforma que conecta productores agrícolas con consumidores, permitiendo la venta directa de productos frescos del campo.'
        },
        {
          q: '¿Cómo me registro?',
          a: 'Haz clic en "Registrarse" en la parte superior de la página y completa el formulario con tus datos. Puedes registrarte como consumidor o productor.'
        },
        {
          q: '¿Es gratuito registrarse?',
          a: 'Sí, el registro es completamente gratuito. Solo pagas comisiones cuando realizas ventas (para productores).'
        }
      ]
    },
    {
      category: 'Productores',
      questions: [
        {
          q: '¿Cómo publico mis productos?',
          a: 'Una vez registrado como productor, accede a tu panel y haz clic en "Agregar Producto". Completa la información y sube fotos de calidad.'
        },
        {
          q: '¿Cuánto cuesta vender en AgroStock?',
          a: 'No hay costos de registro. Solo pagas una pequeña comisión por cada venta exitosa, que se descuenta automáticamente.'
        },
        {
          q: '¿Cómo recibo los pagos?',
          a: 'Los pagos se procesan de forma segura y se transfieren a tu cuenta bancaria en un plazo de 3-5 días hábiles después de la entrega.'
        }
      ]
    },
    {
      category: 'Consumidores',
      questions: [
        {
          q: '¿Cómo realizo una compra?',
          a: 'Navega por los productos, agrega al carrito los que te interesen y procede al checkout. Puedes pagar con varios métodos disponibles.'
        },
        {
          q: '¿Cuáles son los métodos de pago?',
          a: 'Aceptamos efectivo, transferencia bancaria, Nequi, Daviplata, PSE y tarjetas de crédito/débito.'
        },
        {
          q: '¿Puedo devolver un producto?',
          a: 'Sí, puedes solicitar devoluciones dentro de los 7 días posteriores a la recepción, siempre que el producto esté en su estado original.'
        }
      ]
    }
  ];

  const filteredFAQs = React.useMemo(() => {
    return faqs.map(category => ({
      ...category,
      questions: category.questions.filter(faq => 
        faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(category => category.questions.length > 0);
  }, [searchTerm]);

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="text-center mb-5">
            <BiSupport className="display-1 text-primary mb-3" />
            <h1 className="display-5 fw-bold">Centro de Soporte</h1>
            <p className="text-muted lead">Estamos aquí para ayudarte</p>
          </div>

          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-4">
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-light">
                  <BiSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar en preguntas frecuentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Preguntas Frecuentes */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="h4 fw-bold mb-0">
                <BiQuestionMark className="me-2" />
                Preguntas Frecuentes
              </h2>
            </div>
            <div className="card-body p-5">
              {filteredFAQs.map((category, idx) => (
                <div key={idx} className="mb-5">
                  <h3 className="h5 fw-bold text-primary mb-3">{category.category}</h3>
                  <div className="accordion" id={`accordion${idx}`}>
                    {category.questions.map((faq, qIdx) => {
                      const accordionKey = `${idx}-${qIdx}`;
                      const isOpen = openAccordion[accordionKey] || false;
                      return (
                        <div key={qIdx} className="accordion-item">
                          <h2 className="accordion-header">
                            <button
                              className={`accordion-button ${isOpen ? '' : 'collapsed'}`}
                              type="button"
                              onClick={() => setOpenAccordion(prev => ({
                                ...prev,
                                [accordionKey]: !prev[accordionKey]
                              }))}
                            >
                              {faq.q}
                            </button>
                          </h2>
                          <div
                            className={`accordion-collapse collapse ${isOpen ? 'show' : ''}`}
                          >
                            <div className="accordion-body">
                              {faq.a}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body p-4">
                  <BiEnvelope className="display-4 text-primary mb-3" />
                  <h5 className="fw-bold">Email</h5>
                  <p className="text-muted mb-0">soporte@agrostock.com</p>
                  <p className="text-muted small">Respuesta en 24 horas</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body p-4">
                  <BiPhone className="display-4 text-success mb-3" />
                  <h5 className="fw-bold">Teléfono</h5>
                  <p className="text-muted mb-0">+57 (1) 234 5678</p>
                  <p className="text-muted small">Lun - Vie: 8:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body p-4">
                  <BiMessage className="display-4 text-info mb-3" />
                  <h5 className="fw-bold">Chat en Vivo</h5>
                  <p className="text-muted mb-0">Disponible 24/7</p>
                  <button className="btn btn-info btn-sm mt-2">
                    Iniciar Chat
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0 mt-4">
            <div className="card-body p-5">
              <h2 className="h4 fw-bold mb-4">Envíanos un Mensaje</h2>
              <form>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Nombre</label>
                    <input type="text" className="form-control" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Asunto</label>
                    <select className="form-select" required>
                      <option value="">Selecciona un asunto</option>
                      <option>Consulta General</option>
                      <option>Problema Técnico</option>
                      <option>Pregunta sobre Productos</option>
                      <option>Problema con Pedido</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Mensaje</label>
                    <textarea className="form-control" rows={5} required></textarea>
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-primary btn-lg">
                      <BiEnvelope className="me-2" />
                      Enviar Mensaje
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoportePage;
