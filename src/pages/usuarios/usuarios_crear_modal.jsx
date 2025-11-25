import React, { useState } from 'react';
import '../../assets/scss/registro.scss';
import { FaUser, FaMapMarkerAlt, FaRegCalendarAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdEmail, MdPhone } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export default function UsuariosCrearModal({ isOpen = false, onClose = () => {}, onCreated = () => {} }) {
  const [isClosing, setIsClosing] = useState(false);
  const [fullname, setFullname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setFullname(''); setBirthdate(''); setEmail(''); setPhone(''); setCity(''); setPassword(''); setShowPassword(false);
      onClose();
    }, 180);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nombre: fullname,
        fecha_nacimiento: birthdate,
        email,
        telefono: phone,
        ciudad: city,
        password
      };
      await api.post('/usuarios/registro', payload);
      handleClose();
      await Swal.fire({ icon: 'success', title: 'Usuario creado', text: 'Cuenta creada correctamente', timer: 2000, timerProgressBar: true, showConfirmButton: false });
      onCreated();
    } catch (err) {
      console.error('Error creando usuario', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Error creando usuario';
      await Swal.fire({ icon: 'error', title: 'No se pudo crear', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`reg-modal-overlay ${isClosing ? 'closing' : ''}`} role="dialog" aria-modal="true">
      <div className="reg-modal-card" aria-label="Crear nuevo usuario">
        <button className="reg-close" onClick={handleClose} aria-label="Cerrar">✕</button>

        <h2 className="reg-title">Crear nuevo usuario</h2>
        <p className="reg-sub">Rellena los datos para crear una cuenta</p>

        <form id="createUserForm" className="reg-form" onSubmit={handleSubmit}>
          <label>
            <span>Nombre completo</span>
            <div className="reg-input">
              <FaUser className="reg-icon" />
              <input name="fullname" value={fullname} onChange={e => setFullname(e.target.value)} type="text" placeholder="Nombre completo" required />
            </div>
          </label>

          <label>
            <span>Fecha de nacimiento</span>
            <div className="reg-input reg-input--date">
              <FaRegCalendarAlt className="reg-icon" />
              <input name="birthdate" value={birthdate} onChange={e => setBirthdate(e.target.value)} type="date" />
            </div>
          </label>

          <label>
            <span>Correo electrónico</span>
            <div className="reg-input">
              <MdEmail className="reg-icon" />
              <input name="email" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Correo electrónico" required />
            </div>
          </label>

          <label>
            <span>Número de teléfono</span>
            <div className="reg-input">
              <MdPhone className="reg-icon" />
              <input name="phone" value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="Número de teléfono" />
            </div>
          </label>

          <label>
            <span>Ciudad / Provincia</span>
            <div className="reg-input">
              <FaMapMarkerAlt className="reg-icon" />
              <input name="city" value={city} onChange={e => setCity(e.target.value)} type="text" placeholder="Ciudad / Provincia" />
            </div>
          </label>

          <label>
            <span>Contraseña</span>
            <div className="reg-input" style={{ position: 'relative' }}>
              <RiLockPasswordFill className="reg-icon" />
              <input name="password" value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Contraseña" required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={{ background: 'none', border: 'none', position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', padding: 4, cursor: 'pointer' }}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>

        </form>

        <div className="reg-actions">
          <button type="button" className="reg-btn secondary" onClick={handleClose} disabled={loading}>Cancelar</button>
          <button type="submit" form="createUserForm" className="reg-btn primary" disabled={loading}>{loading ? 'Creando...' : 'Crear usuario'}</button>
        </div>
      </div>
    </div>
  );
}

