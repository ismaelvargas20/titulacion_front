import React from 'react';
import { Link } from 'react-router-dom';
import { 
    FaFacebook, 
    FaInstagram, 
    FaTwitter, 
    FaYoutube 
} from 'react-icons/fa';
// Importamos la imagen del logo, igual que en el Header
import cascoImg from '../../assets/img/casco.png';
// Importamos el SCSS
import '../../assets/scss/footer.scss';

const Footer = () => {
    return (
        <footer className="app-footer">
            <div className="footer-container">
                
                {/* --- Sección Principal de Columnas --- */}
                <div className="footer-main">
                    
                    {/* Columna 1: Branding y Logo */}
                    <div className="footer-column brand">
                        <Link to="/" className="logo-footer">
                            Motorbikers
                            <span className="logo-image" aria-hidden="true">
                                <img src={cascoImg} alt="Casco Motorbikers" />
                            </span>
                        </Link>
                        <p className="footer-tagline">
                            Tu comunidad y marketplace de confianza para motos y repuestos.
                        </p>
                    </div>

                    {/* Columna 2: Navegación */}
                    <div className="footer-column">
                        <h3>Navegación</h3>
                        <ul className="footer-links">
                            <li><Link to="/motos">Motos</Link></li>
                            <li><Link to="/repuestos">Repuestos</Link></li>
                            <li><Link to="/comunidad">Comunidad</Link></li>
                            <li><Link to="/vender">Vender</Link></li>
                        </ul>
                    </div>

                    {/* Columna 3: Soporte y Legal */}
                    <div className="footer-column">
                        <h3>Soporte</h3>
                        <ul className="footer-links">
                            <li><Link to="/acerca-de">Acerca de Nosotros</Link></li>
                            <li><Link to="/contacto">Contacto</Link></li>
                            <li><Link to="/privacidad">Política de Privacidad</Link></li>
                            <li><Link to="/terminos">Términos y Condiciones</Link></li>
                        </ul>
                    </div>

                    {/* Columna 4: Redes Sociales */}
                    <div className="footer-column">
                        <h3>Síguenos</h3>
                        <p>Únete a nuestra comunidad en redes.</p>
                        <div className="social-links">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <FaFacebook className="social-icon" />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <FaInstagram className="social-icon" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                <FaTwitter className="social-icon" />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                <FaYoutube className="social-icon" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* --- Sección Inferior (Copyright) --- */}
                <div className="footer-bottom">
                    <small>© {new Date().getFullYear()} Motorbikers. Todos los derechos reservados.</small>
                </div>

            </div>
        </footer>
    );
};

export default Footer;