import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
    FaUserEdit, 
    FaSignOutAlt, 
    FaTag,        
    FaUsers,      
    FaMotorcycle, 
    FaTools,
    FaUser // <-- CAMBIO: Importamos FaUser
} from 'react-icons/fa';
import '../../assets/scss/header.scss'; 
import cascoImg from '../../assets/img/casco.png';

const Header = () => {
    // ... (toda la lógica de useState, useEffect, useRef se queda igual) ...
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

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
                    
                    {/* vvv CAMBIO AQUÍ vvv */}
                    <FaUser // <-- Usamos el nuevo icono
                        className="profile-icon" 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    />
                    {/* ^^^ CAMBIO AQUÍ ^^^ */}

                    {isDropdownOpen && (
                        // ... (El dropdown se queda exactamente igual) ...
                        <div className="profile-dropdown">
                            <div className="dropdown-header">
                                <strong>¡Hola, Luna!</strong>
                                <small>tuemail@ejemplo.com</small>
                            </div>
                            
                            <ul className="dropdown-menu">
                                <li>
                                    <NavLink to="/perfil/editar" className="dropdown-item">
                                        <FaUserEdit className="dropdown-icon" />
                                        Editar Perfil
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