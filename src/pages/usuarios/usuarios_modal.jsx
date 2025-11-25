import React from 'react';
import { FaRegCalendarAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { MdPhone } from 'react-icons/md';

import '../../assets/scss/usuarios.scss';

export default function UsuariosModal({ user, onClose }) {
  if (!user) return null;

  const initials = (user.name || 'U').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();

  return (
    <div className="usuarios-modal-overlay" onClick={onClose}>
      <div className="usuarios-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Perfil de ${user.name}`}>
        <button className="usuarios-modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        <div className="usuarios-modal-inner">
          <div className="usuarios-modal-left">
            <div className="usuarios-modal-avatar">{initials}</div>
          </div>
          <div className="usuarios-modal-right">
            <h3 className="usuarios-modal-name">{user.name || '—'}</h3>
            <div className="usuarios-modal-city">{user.city || '—'}</div>

            <div className="usuarios-modal-grid">
                <div className="um-card">
                  <div className="um-icon"><span className="um-icon-inner"><FaRegCalendarAlt /></span></div>
                  <div>
                      <div className="um-label">Fecha de nacimiento</div>
                      <div className="um-value um-value-break">{
                        user.birthdate || user.fecha_nacimiento || user.nacimiento || user.dob || user.fechaNacimiento ||
                        (user.__raw && (user.__raw.fecha_nacimiento || user.__raw.birthdate || user.__raw.nacimiento)) || '—'
                      }</div>
                  </div>
                </div>

              <div className="um-card">
                <div className="um-icon"><span className="um-icon-inner"><FaEnvelope /></span></div>
                <div>
                  <div className="um-label">Correo electrónico</div>
                  <div className="um-value um-value-break">{user.email || user.correo_electronico || user.email_contacto || '—'}</div>
                </div>
              </div>

              <div className="um-card">
                <div className="um-icon"><span className="um-icon-inner"><MdPhone /></span></div>
                <div>
                  <div className="um-label">Número de teléfono</div>
                  <div className="um-value">{
                    user.phone || user.telefono || user.telefono_movil || user.contact_phone ||
                    (user.__raw && (user.__raw.telefono || user.__raw.phone || user.__raw.celular)) || '—'
                  }</div>
                </div>
              </div>

              <div className="um-card">
                <div className="um-icon"><span className="um-icon-inner"><FaMapMarkerAlt /></span></div>
                <div>
                  <div className="um-label">Ciudad / Provincia</div>
                  <div className="um-value">{
                    user.city || user.ciudad || user.provincia || user.distrito ||
                    (user.__raw && (user.__raw.ciudad || user.__raw.city || user.__raw.provincia)) || '—'
                  }</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
