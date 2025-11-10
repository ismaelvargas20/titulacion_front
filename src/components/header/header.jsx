import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    FaUserEdit,
    FaSignOutAlt,
    FaTag,
    FaUsers,
    FaMotorcycle,
    FaTools,
    FaComments,
    FaUser,
    FaSun,
    FaMoon,
    FaBars,
    FaTimes,
} from 'react-icons/fa';
import '../../assets/scss/header.scss';
import cascoImg from '../../assets/img/casco.png';

const Header = () => {
    // ... (toda la lógica de useState, useEffect, useRef se queda igual) ...
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Tema aplicado a la zona de contenido (.app-main)
    // El tema por defecto será siempre 'light' a menos que el usuario haya guardado
    // explícitamente una preferencia en localStorage. Esto evita que la app abra
    // en modo oscuro por preferencia del sistema al cerrar sesión.
    const [theme, setTheme] = useState(() => {
        try {
            const t = localStorage.getItem('theme');
            if (t === 'dark' || t === 'light') return t;
        } catch (e) {
            // ignore
        }
        // Forzamos 'light' como valor por defecto
        return 'light';
    });

    // Menú móvil
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    const handleLogout = (e) => {
        // Al cerrar sesión no queremos que quede guardado el tema oscuro.
        // Eliminamos únicamente la key 'theme' y forzamos tema claro.
        try {
            localStorage.removeItem('theme');
            // NO limpiamos todo el localStorage para no borrar otras prefs del usuario
        } catch (err) {}
        // Forzamos tema claro en la UI
        setTheme('light');
        setIsDropdownOpen(false);
    };

    // Toggle theme: apply class to the .app-main element so header remains unchanged.
    const applyThemeToContent = (t) => {
        try {
            const main = document.querySelector('.app-main');
            if (!main) return;
            if (t === 'dark') main.classList.add('dark-theme');
            else main.classList.remove('dark-theme');
            // also set a global body class to avoid white gaps when main does not cover full page
            try {
                if (t === 'dark') document.body.classList.add('global-dark');
                else document.body.classList.remove('global-dark');
            } catch (e) {}
        } catch (e) {
            // ignore
        }
    };

    useEffect(() => {
        applyThemeToContent(theme);
        try { localStorage.setItem('theme', theme); } catch (e) {}
    }, [theme]);


    const toggleTheme = () => setTheme((s) => (s === 'dark' ? 'light' : 'dark'));


    return (
        <header className="app-header">
            <div className="header-container">
                
                <NavLink to="/" className="logo">
                    Motorbikers
                    <span className="logo-image" aria-hidden="true">
                        <img src={cascoImg} alt="Casco Motorbikers" />
                    </span>
                </NavLink>

                {/* Toggle nav móvil */}
                <button
                    type="button"
                    className="nav-toggle"
                    aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={mobileMenuOpen}
                    onClick={() => setMobileMenuOpen(s => !s)}
                >
                    {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>

                {/* --- NAV PRINCIPAL (Igual que antes) --- */}
                <nav className="main-nav">
                    <ul className={`nav-list ${mobileMenuOpen ? 'open' : ''}`}>
                        <li>
                            <NavLink 
                                to="/motos" 
                                className={({ isActive }) => (isActive ? 'nav-link cta-link secondary active' : 'nav-link cta-link secondary')}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <FaMotorcycle className="nav-icon" />
                                Motos
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/repuestos" 
                                className={({ isActive }) => (isActive ? 'nav-link cta-link secondary active' : 'nav-link cta-link secondary')}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <FaTools className="nav-icon" />
                                Repuestos
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/comunidad" 
                                className={({ isActive }) => (isActive ? 'nav-link cta-link secondary active' : 'nav-link cta-link secondary')}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <FaUsers className="nav-icon" />
                                Comunidad
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/vender" 
                                className={({ isActive }) => (isActive ? 'nav-link cta-link secondary active' : 'nav-link cta-link secondary')}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <FaTag className="nav-icon" />
                                Vender
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/chat"
                                className={({ isActive }) => (isActive ? 'nav-link cta-link secondary active' : 'nav-link cta-link secondary')}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <FaComments className="nav-icon" />
                                Chat
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                {/* --- Perfil de Usuario con Dropdown --- */}
                <div className="user-profile" ref={dropdownRef}>
                    {/* Toggle de tema: colocado a la izquierda del perfil (orden: toggle | perfil) */}
                    <button
                        type="button"
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                    >
                        {theme === 'dark' ? <FaSun /> : <FaMoon />}
                    </button>

                    <FaUser
                        className="profile-icon"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    />

                    {isDropdownOpen && (
                        // ... (El dropdown se queda exactamente igual) ...
                        <div className="profile-dropdown">
                            <div className="dropdown-header">
                                <strong>¡Hola, Luna!</strong>
                                <small>tuemail@ejemplo.com</small>
                            </div>
                            
                            <ul className="dropdown-menu">
                                <li>
                                    <NavLink
                                        to="/perfil"
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            // Cerramos el dropdown y navegamos al perfil en modo edición
                                            e.preventDefault();
                                            setIsDropdownOpen(false);
                                            try {
                                                navigate('/perfil', { state: { edit: true } });
                                            } catch (err) {
                                                // fallback: usar href
                                                window.location.href = '/perfil';
                                            }
                                        }}
                                    >
                                        <FaUserEdit className="dropdown-icon" />
                                        Mi Perfil
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/login" className="dropdown-item danger plain" onClick={handleLogout}>
                                        <FaSignOutAlt className="dropdown-icon" />
                                        Cerrar Sesión
                                    </NavLink>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
};

export default Header;