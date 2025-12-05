import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaMotorcycle, FaTools, FaUsers, FaTag, FaComments, FaEnvelope } from 'react-icons/fa';
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
        Clientes
      </NavLink>
      <NavLink to="/posteadas" className="nav-link cta-link secondary">
        <span className="nav-icon">📄</span>
        Publicaciones
      </NavLink>
      <NavLink to="/comentarios" className="nav-link cta-link secondary">
        <FaComments className="nav-icon" />
        Comentarios
      </NavLink>
      <NavLink to="/mensajes" className="nav-link cta-link secondary">
        <FaEnvelope className="nav-icon" />
        Mensajes
      </NavLink>
    </div>
  );
};

export default AdminNavButtons;