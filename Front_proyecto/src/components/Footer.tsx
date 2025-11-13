import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BiEnvelope, 
  BiPhone, 
  BiMapPin,
  BiLogoFacebook,
  BiLogoInstagram,
  BiLogoTwitter,
  BiLogoLinkedin
} from 'react-icons/bi';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer py-5 mt-5">
      <div className="container">
        <div className="row">
          {/* Columna 1: Brand y Descripción */}
          <div className="col-lg-4 col-md-6 mb-4 mb-md-0">
            <div className="footer-brand">
              <h3 className="footer-brand-name text-white mb-3">🌾 AgroStock</h3>
            </div>
            <p className="footer-description">
              Conectamos productores locales con consumidores que buscan productos frescos y de calidad.
              Tu plataforma de confianza para el comercio agrícola.
            </p>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <BiLogoFacebook />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <BiLogoInstagram />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <BiLogoTwitter />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <BiLogoLinkedin />
              </a>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div className="col-lg-2 col-md-6 mb-4 mb-md-0">
            <h5 className="footer-title">Enlaces Rápidos</h5>
            <ul className="footer-links">
              <li>
                <Link to="/" className="footer-link">
                  <span className="footer-link-icon">→</span>
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/productos" className="footer-link">
                  <span className="footer-link-icon">→</span>
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/beneficios" className="footer-link">
                  <span className="footer-link-icon">→</span>
                  Beneficios
                </Link>
              </li>
              <li>
                <Link to="/recursos" className="footer-link">
                  <span className="footer-link-icon">→</span>
                  Recursos
                </Link>
              </li>
              <li>
                <Link to="/soporte" className="footer-link">
                  <span className="footer-link-icon">→</span>
                  Soporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Para Productores */}
          <div className="col-lg-2 col-md-6 mb-4 mb-md-0">
            <h5 className="footer-title">Para Productores</h5>
            <ul className="footer-links">
              <li>
                <Link to="/como-vender" className="footer-link">
                  <span className="footer-link-icon">→</span>
                  Cómo Vender
                </Link>
              </li>
              <li>
                <Link to="/register" className="footer-link">
                  <span className="footer-link-icon">→</span>
                  Registrarse
                </Link>
              </li>
              <li>
                <Link to="/recursos" className="footer-link">
                  <span className="footer-link-icon">→</span>
                  Recursos
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div className="col-lg-4 col-md-6">
            <h5 className="footer-title">Contacto</h5>
            <ul className="footer-contact">
              <li className="footer-contact-item">
                <BiEnvelope className="footer-contact-icon" />
                <span>contacto@agrostock.com</span>
              </li>
              <li className="footer-contact-item">
                <BiPhone className="footer-contact-icon" />
                <span>+57 (1) 234 5678</span>
              </li>
              <li className="footer-contact-item">
                <BiMapPin className="footer-contact-icon" />
                <span>Colombia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-copyright">
          <div>
            © {new Date().getFullYear()} AgroStock. Todos los derechos reservados.
          </div>
          <div className="footer-legal">
            <Link to="/terminos-condiciones" className="footer-legal-link">
              Términos y Condiciones
            </Link>
            <span className="footer-legal-separator">|</span>
            <Link to="/privacidad" className="footer-legal-link">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
