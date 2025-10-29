import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    FaUserEdit,
    FaSignOutAlt,
    FaTag,
    FaUsers,
    FaMotorcycle,
    FaTools,
    FaUser,
    FaSun,
    FaMoon,
} from 'react-icons/fa';
import '../../assets/scss/header.scss';
import cascoImg from '../../assets/img/casco.png';

const Header = () => {
    // ... (toda la lógica de useState, useEffect, useRef se queda igual) ...
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Tema aplicado a la zona de contenido (.app-main)
    const [theme, setTheme] = useState(() => {
        try {
            const t = localStorage.getItem('theme');
            if (t) return t;
        } catch (e) {
            // ignore
        }
        // preferencia del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
    });

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
        // limpiar almacenamiento (ajusta según tus keys si lo prefieres)
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (err) {
            // ignore
        }
        // cerramos el dropdown; la navegación la hace el NavLink
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

                {/* --- NAV PRINCIPAL (Igual que antes) --- */}
                <nav className="main-nav">
                    <ul className="nav-list">
                        <li>
                            <NavLink 
                                to="/motos" 
                                className={({ isActive }) => (isActive ? 'nav-link cta-link secondary active' : 'nav-link cta-link secondary')}
                            >
                                <FaMotorcycle className="nav-icon" />
                                Motos
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/repuestos" 
                                className={({ isActive }) => (isActive ? 'nav-link cta-link secondary active' : 'nav-link cta-link secondary')}
                            >
                                <FaTools className="nav-icon" />
                                Repuestos
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/comunidad" 
                                className={({ isActive }) => (isActive ? 'nav-link cta-link secondary active' : 'nav-link cta-link secondary')}
                            >
                                <FaUsers className="nav-icon" />
                                Comunidad
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/vender" 
                                className={({ isActive }) => (isActive ? 'nav-link cta-link secondary active' : 'nav-link cta-link secondary')}
                            >
                                <FaTag className="nav-icon" />
                                Vender
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