import React, { useState } from 'react';
import '../../assets/scss/login.scss';
import suzu from '../../assets/img/suzu.png';
import { FaStar, FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';
import Registro from '../registro.jsx/registro.jsx';
import { RequestPassword } from '../../components/password/password.jsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { login as loginUser } from '../../services/usuarios';

const Login = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    (async () => {
      if (!email.trim() || !password.trim()) {
        Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: 'Por favor ingresa email y contraseña' });
        return;
      }
      try {
        const res = await loginUser({ email, password });
        const data = res && res.data ? res.data : res;

        // Intentar inferir rol/tipo desde varias posibles propiedades
        let role = null;
        if (data.user && (data.user.rol || data.user.role)) role = data.user.rol || data.user.role;
        else if (data.rol || data.role) role = data.rol || data.role;
        else if (typeof data.is_cliente !== 'undefined') role = data.is_cliente ? 'cliente' : 'usuario';

        // Nombre a mostrar (buscar propiedades comunes)
        let name = null;
        if (data.user) {
          name = data.user.nombre || data.user.name || data.user.fullname || data.user.email || data.user.correo_electronico;
        }
        if (!name) {
          name = data.nombre || data.fullname || data.email || data.correo_electronico || 'Usuario';
        }

        // Mostrar alerta de bienvenida según rol, con HTML personalizado para mejor estilo
        const isAdmin = role && role.toString().toLowerCase().includes('admin');
        const safeName = String(name || 'Usuario');
        // Usar clases para separar estilos (definidas en login.scss)
        const adminHtml = `
          <div class="swal-welcome admin">
            <div class="swal-title">Bienvenido</div>
            <div class="swal-subtitle">Administrador ${safeName}</div>
          </div>`;
        const userHtml = `
          <div class="swal-welcome user">
            <div class="swal-title">¡Hola!</div>
            <div class="swal-subtitle">${safeName}</div>
            <div class="swal-note">Has iniciado sesión correctamente</div>
          </div>`;

        await Swal.fire({
          icon: 'success',
          html: isAdmin ? adminHtml : userHtml,
          showConfirmButton: false,
          timer: 1800,
          timerProgressBar: true,
          background: '#ffffff'
        });

        // Normalizar y redirigir
        if (role && role.toString().toLowerCase().includes('cliente')) {
          navigate('/inicio');
        } else {
          navigate('/dashboard');
        }
        // Guardar usuario mínimo en sessionStorage para que otras páginas puedan usar su id
        try {
          const userObj = (data.user) ? data.user : { id: data.userId || null, nombre: data.nombre || name, email: data.email || data.correo_electronico };
          sessionStorage.setItem('currentUser', JSON.stringify({ id: userObj.id || null, nombre: userObj.nombre || name, email: userObj.email || null, rol: role || null }));
        } catch (e) {
          console.warn('No se pudo guardar currentUser en sessionStorage', e);
        }
      } catch (err) {
        const msg = (err && err.response && err.response.data && err.response.data.message) || err.message || 'Error en autenticación';
        Swal.fire({ icon: 'error', title: 'Error', text: msg });
      }
    })();
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
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <RiLockPasswordFill className="input-icon" aria-hidden="true" />
              <input type={showPassword ? 'text' : 'password'} id="password" name="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 48 }} />
              {password && password.toString().trim().length > 0 && (
                <button type="button" className="password-toggle" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={{ background: 'none', border: 'none', position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 4, cursor: 'pointer', zIndex: 2, color: '#1e90ff', fontSize: 18 }}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              )}
            </div>
          </div>
          <button type="submit" className="login-btn">
            Ingresar
          </button>
          <button type="button" className="forgot-password" onClick={() => setShowRecover(true)} style={{ background: 'none', border: 'none', color: '#1e90ff', cursor: 'pointer', padding: 0 }}>
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      </div>

      {/* Renderizar modal de registro */}
      <Registro isOpen={showRegister} onClose={() => setShowRegister(false)} />
      <RequestPassword isOpen={showRecover} onClose={() => setShowRecover(false)} />
    </div>
  );
};

export default Login;