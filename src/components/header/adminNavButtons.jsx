import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaMotorcycle, FaTools, FaUsers, FaTag } from 'react-icons/fa';
import '../../assets/scss/header.scss';

const AdminNavButtons = () => {
  return (
    <div className="admin-nav-buttons">
      <NavLink to="/dashboard" className="nav-link cta-link secondary">
        <span className="nav-icon">▦</span>
        Dashboard
      </NavLink>
      <NavLink to="/usuarios" className="nav-link cta-link secondary">
        <FaUsers className="nav-icon" />
        Usuarios
      </NavLink>
      <NavLink to="/posteadas" className="nav-link cta-link secondary">
        <span className="nav-icon">📄</span>
        Publicaciones
      </NavLink>
      <NavLink to="/comunidad" className="nav-link cta-link secondary">
        <FaUsers className="nav-icon" />
        Comunidad
      </NavLink>
    </div>
  );
};

export default AdminNavButtons;