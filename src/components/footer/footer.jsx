import React from 'react';
// Importamos la imagen del logo, igual que en el Header
import cascoImg from '../../assets/img/casco.png';
// Importamos el SCSS
import '../../assets/scss/footer.scss';

const Footer = () => {
    return (
        <footer className="app-footer">
            <div className="footer-container">
                <div className="footer-bottom" style={{ textAlign: 'center', padding: '14px 0', borderTop: 'none', boxShadow: 'none', background: 'transparent', margin: 0 }}>
                    <small>@2025 motobikers. Todos los derechos son reservados.</small>
                </div>
            </div>
        </footer>
    );
};

export default Footer;