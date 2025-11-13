import React from 'react';
import { Link } from 'react-router-dom';
import { BiShield, BiCheckCircle, BiFile } from 'react-icons/bi';
import './TerminosCondicionesPage.css';

const TerminosCondicionesPage: React.FC = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="text-center mb-5">
            <BiFile className="display-1 text-primary mb-3" />
            <h1 className="display-5 fw-bold">Términos y Condiciones</h1>
            <p className="text-muted">Última actualización: {new Date().toLocaleDateString('es-CO')}</p>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-body p-5">
              <section className="mb-5">
                <h2 className="h4 fw-bold mb-3">
                  <BiCheckCircle className="me-2 text-primary" />
                  1. Aceptación de los Términos
                </h2>
                <p className="text-muted">
                  Al acceder y utilizar AgroStock, usted acepta cumplir con estos Términos y Condiciones. 
                  Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestra plataforma.
                </p>
                <p className="text-muted">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones 
                  entrarán en vigor inmediatamente después de su publicación en la plataforma.
                </p>
              </section>

              <section className="mb-5">
                <h2 className="h4 fw-bold mb-3">
                  <BiShield className="me-2 text-primary" />
                  2. Uso de la Plataforma
                </h2>
                <h5 className="fw-bold mt-4 mb-3">2.1. Cuentas de Usuario</h5>
                <p className="text-muted">
                  Para utilizar ciertas funcionalidades de AgroStock, debe crear una cuenta. Usted es responsable de:
                </p>
                <ul className="text-muted">
                  <li>Mantener la confidencialidad de su contraseña</li>
                  <li>Proporcionar información precisa y actualizada</li>
                  <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                  <li>Ser responsable de todas las actividades que ocurran bajo su cuenta</li>
                </ul>

                <h5 className="fw-bold mt-4 mb-3">2.2. Conducta del Usuario</h5>
                <p className="text-muted">Usted se compromete a:</p>
                <ul className="text-muted">
                  <li>No utilizar la plataforma para fines ilegales o no autorizados</li>
                  <li>No publicar contenido falso, engañoso o fraudulento</li>
                  <li>No interferir con el funcionamiento de la plataforma</li>
                  <li>Respetar los derechos de otros usuarios</li>
                  <li>No realizar actividades que puedan dañar la reputación de AgroStock</li>
                </ul>
              </section>

              <section className="mb-5">
                <h2 className="h4 fw-bold mb-3">
                  <BiFile className="me-2 text-primary" />
                  3. Productos y Servicios
                </h2>
                <h5 className="fw-bold mt-4 mb-3">3.1. Publicación de Productos</h5>
                <p className="text-muted">
                  Los productores son responsables de la exactitud de la información de sus productos, incluyendo:
                </p>
                <ul className="text-muted">
                  <li>Descripción precisa del producto</li>
                  <li>Precios correctos y actualizados</li>
                  <li>Disponibilidad real del stock</li>
                  <li>Calidad y estado de los productos</li>
                </ul>

                <h5 className="fw-bold mt-4 mb-3">3.2. Compras</h5>
                <p className="text-muted">
                  Al realizar una compra, usted acepta pagar el precio indicado más los costos de envío aplicables. 
                  Los precios pueden cambiar sin previo aviso, pero los pedidos confirmados mantendrán el precio acordado.
                </p>
              </section>

              <section className="mb-5">
                <h2 className="h4 fw-bold mb-3">
                  <BiShield className="me-2 text-primary" />
                  4. Política de Devoluciones
                </h2>
                <p className="text-muted">
                  Las devoluciones deben solicitarse dentro de los 7 días posteriores a la recepción del producto. 
                  Los productos deben estar en su estado original, sin usar y con el empaque original.
                </p>
                <p className="text-muted">
                  AgroStock se reserva el derecho de rechazar devoluciones que no cumplan con estos requisitos. 
                  Los costos de envío de devolución corren por cuenta del cliente, excepto en casos de productos defectuosos.
                </p>
              </section>

              <section className="mb-5">
                <h2 className="h4 fw-bold mb-3">
                  <BiCheckCircle className="me-2 text-primary" />
                  5. Propiedad Intelectual
                </h2>
                <p className="text-muted">
                  Todo el contenido de AgroStock, incluyendo textos, gráficos, logos, iconos, imágenes y software, 
                  es propiedad de AgroStock o de sus proveedores de contenido y está protegido por las leyes de 
                  propiedad intelectual.
                </p>
                <p className="text-muted">
                  Usted no puede reproducir, distribuir, modificar o crear obras derivadas del contenido de la 
                  plataforma sin nuestro consentimiento previo por escrito.
                </p>
              </section>

              <section className="mb-5">
                <h2 className="h4 fw-bold mb-3">
                  <BiShield className="me-2 text-primary" />
                  6. Limitación de Responsabilidad
                </h2>
                <p className="text-muted">
                  AgroStock actúa como intermediario entre productores y consumidores. No somos responsables de:
                </p>
                <ul className="text-muted">
                  <li>La calidad de los productos vendidos por terceros</li>
                  <li>Disputas entre compradores y vendedores</li>
                  <li>Daños resultantes del uso de productos comprados en la plataforma</li>
                  <li>Interrupciones en el servicio debido a causas fuera de nuestro control</li>
                </ul>
              </section>

              <section className="mb-5">
                <h2 className="h4 fw-bold mb-3">
                  <BiFile className="me-2 text-primary" />
                  7. Privacidad
                </h2>
                <p className="text-muted">
                  Su privacidad es importante para nosotros. Consulte nuestra 
                  <Link to="/politica-privacidad" className="text-primary text-decoration-none ms-1">
                    Política de Privacidad
                  </Link> para obtener información sobre cómo recopilamos, usamos y protegemos su información personal.
                </p>
              </section>

              <section className="mb-5">
                <h2 className="h4 fw-bold mb-3">
                  <BiCheckCircle className="me-2 text-primary" />
                  8. Modificaciones del Servicio
                </h2>
                <p className="text-muted">
                  Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio 
                  en cualquier momento, con o sin previo aviso. No seremos responsables ante usted ni ante ningún 
                  tercero por cualquier modificación, suspensión o discontinuación del servicio.
                </p>
              </section>

              <section className="mb-5">
                <h2 className="h4 fw-bold mb-3">
                  <BiShield className="me-2 text-primary" />
                  9. Ley Aplicable
                </h2>
                <p className="text-muted">
                  Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Cualquier 
                  disputa relacionada con estos términos será resuelta en los tribunales competentes de Colombia.
                </p>
              </section>

              <section>
                <h2 className="h4 fw-bold mb-3">
                  <BiFile className="me-2 text-primary" />
                  10. Contacto
                </h2>
                <p className="text-muted">
                  Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos a través de:
                </p>
                <ul className="text-muted">
                  <li>Email: legal@agrostock.com</li>
                  <li>Teléfono: +57 (1) 234 5678</li>
                  <li>Dirección: Boyacá, Colombia</li>
                </ul>
              </section>

              <div className="mt-5 pt-4 border-top text-center">
                <Link to="/" className="btn btn-primary">
                  Volver al Inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminosCondicionesPage;

