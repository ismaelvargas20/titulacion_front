import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
    FaThLarge,
    FaFileAlt,
} from 'react-icons/fa';
import '../../assets/scss/header.scss';
import cascoImg from '../../assets/img/casco.png';

const Header = ({ adminMode = false }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const [theme, setTheme] = useState(() => {
        try {
            const t = localStorage.getItem('theme');
            if (t === 'dark' || t === 'light') return t;
        } catch (e) {
            // ignore
        }
        return 'light';
    });

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // Estado para el usuario actual (guardado en sessionStorage por el login)
    const [user, setUser] = useState(() => {
        try {
            const raw = sessionStorage.getItem('currentUser');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    });
    const location = useLocation();

    // Refrescar user cuando cambie la ruta (por ejemplo, después del login)
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('currentUser');
            setUser(raw ? JSON.parse(raw) : null);
        } catch (e) {
            setUser(null);
        }
    }, [location]);

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
        try {
            localStorage.removeItem('theme');
        } catch (err) {}
        try {
            sessionStorage.removeItem('currentUser');
        } catch (err) {}
        setUser(null);
        setTheme('light');
        setIsDropdownOpen(false);
        try { navigate('/login'); } catch (e) {}
    };

    const applyThemeToContent = (t) => {
        try {
            const main = document.querySelector('.app-main');
            if (!main) return;
            if (t === 'dark') main.classList.add('dark-theme');
            else main.classList.remove('dark-theme');
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

    const menuItems = adminMode
        ? [
                        { to: '/dashboard', label: 'Dashboard', icon: FaThLarge },
                        { to: '/usuarios', label: 'Clientes', icon: FaUser },
                        { to: '/posteadas', label: 'Publicaciones', icon: FaFileAlt },
                        { to: '/comentarios', label: 'Comentarios', icon: FaComments },
          ]
        : [
            { to: '/motos', label: 'Motos', icon: FaMotorcycle },
            { to: '/repuestos', label: 'Repuestos', icon: FaTools },
            { to: '/comunidad', label: 'Comunidad', icon: FaUsers },
            { to: '/vender', label: 'Vender', icon: FaTag },
            { to: '/chat', label: 'Chat', icon: FaComments },
          ];

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
                        {menuItems.map(({ to, label, icon: Icon }) => (
                            <li key={to}>
                                <NavLink
                                    to={to}
                                    className={({ isActive }) =>
                                        isActive
                                            ? 'nav-link cta-link secondary active'
                                            : 'nav-link cta-link secondary'
                                    }
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Icon className="nav-icon" />
                                    {label}
                                </NavLink>
                            </li>
                        ))}
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
                        <div className="profile-dropdown">
                            <div className="dropdown-header">
                                <strong>¡Hola, {user && user.nombre ? user.nombre : 'Invitado'}!</strong>
                                <small>{user && user.email ? user.email : 'No has iniciado sesión'}</small>
                            </div>
                            
                            <ul className="dropdown-menu">
                                <li>
                                    <NavLink
                                        to="/perfil"
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsDropdownOpen(false);
                                            try {
                                                navigate('/perfil', { state: { edit: true } });
                                            } catch (err) {
                                                window.location.href = '/perfil';
                                            }
                                        }}
                                    >
                                        <FaUserEdit className="dropdown-icon" />
                                        Mi Perfil
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/login"
                                        className="dropdown-item danger plain"
                                        onClick={handleLogout}
                                    >
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