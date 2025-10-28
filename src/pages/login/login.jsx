import React, { useState } from 'react';
import '../../assets/scss/login.scss';
import suzu from '../../assets/img/suzu.png';
import { FaStar } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';
import Registro from '../registro.jsx/registro.jsx';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Login simple: permitir cualquier dato no vacío
    if (email.trim() && password.trim()) {
      navigate('/');
    } else {
      // mensaje simple; puede reemplazarse por UI de error
      alert('Por favor ingresa email y contraseña');
    }
  };

  return (
    <div className="login-container">
      
      {/* ----- PANEL IZQUIERDO (INFORMACIÓN) ----- */}
      <div className="info-panel">
        <h2 className="background-text">Tu mejor Opción</h2>
        
        <div className="info-content">
                    <h1>Bienvenido<br/>Somos motorbikers</h1>
          <div className="rating">
            <FaStar />
            <FaStar />
            <FaStar />
            <FaStar />
            <FaStar className="star-empty" />
          </div>
        </div>
      </div> {/* <-- EL INFO-PANEL SE CIERRA AQUÍ */}

      {/* --- IMAGEN DE LA MOTO --- */}
      {/* ¡ESTE ES EL CAMBIO MÁS IMPORTANTE!
        La imagen AHORA ESTÁ AFUERA del info-panel
        y es hija directa de "login-container".
      */}
      <img 
        src={suzu}
        alt="Motocicleta" 
        className="motorcycle-img"
      />
      
      {/* ----- PANEL DERECHO (FORMULARIO) ----- */}
      <div className="form-panel">
        <button className="register-btn" onClick={() => setShowRegister(true)}>
          Registrate &gt;
        </button>

        <form className="login-form" onSubmit={handleLogin}>
          <h2>Iniciar Sesión</h2>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <MdEmail className="input-icon" aria-hidden="true" />
              <input type="email" id="email" name="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-with-icon">
              <RiLockPasswordFill className="input-icon" aria-hidden="true" />
              <input type="password" id="password" name="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="login-btn">
            Ingresar
          </button>
          <a href="#" className="forgot-password">
            ¿Olvidaste tu contraseña?
          </a>
        </form>
      </div>

      {/* Renderizar modal de registro */}
      <Registro isOpen={showRegister} onClose={() => setShowRegister(false)} />
    </div>
  );
};

export default Login;