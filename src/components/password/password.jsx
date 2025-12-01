import React, { useState, useEffect, useRef } from 'react';
import '../../assets/scss/password.scss';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { requestPasswordReset, verifyPasswordToken, confirmPasswordReset } from '../../services/auth';
import { FaPaperPlane, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';

export const RequestPassword = ({ isOpen = true, onClose = null }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const firstInputRef = useRef(null);
  const previousActiveRef = useRef(null);
  const closeModal = () => {
    try { localStorage.removeItem('passwordResetEmail'); } catch (e) {}
    if (onClose) onClose(); else navigate('/login');
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    if (!email.trim()) {
      setEmailError('Ingresa tu correo electrónico');
      return;
    }
    try {
      setLoading(true);
      const cleaned = email.trim().toLowerCase();
      await requestPasswordReset(cleaned);
      Swal.fire({ icon: 'success', title: 'Revisa tu correo', text: 'Si la cuenta existe, recibirás un email con instrucciones.' });
      // close modal / navigate and ensure stored email is removed
      closeModal();
    } catch (err) {
      const msg = (err && err.response && err.response.data && err.response.data.message) || err.message || 'Error';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Accessibility: focus management, ESC to close and focus trap
  useEffect(() => {
    if (!isOpen) return;
    previousActiveRef.current = document.activeElement;
    // Small timeout so element is mounted
    setTimeout(() => {
      try {
        const saved = localStorage.getItem('passwordResetEmail');
        setEmail(saved || '');
      } catch (e) { setEmail(''); }
      firstInputRef.current?.focus();
    }, 20);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
      if (e.key === 'Tab') {
        // Trap focus inside the card
        const node = cardRef.current;
        if (!node) return;
        const focusable = node.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      // restore focus
      try { previousActiveRef.current?.focus(); } catch (e) { }
    };
  }, [isOpen, navigate, onClose]);

  if (!isOpen) return null;
  return (
    <div className="password-page">
      <div className="password-card" role="dialog" aria-modal="true" aria-labelledby="request-title" ref={cardRef}>
        <button type="button" className="password-close" aria-label="Cerrar" onClick={closeModal}>✕</button>
        <div className="card-banner">Motorbikers</div>
        <h2 id="request-title">Recuperar Contraseña</h2>
        <p>Ingresa tu correo para recibir instrucciones.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Correo electrónico</label>
          <div className="input-with-icon">
            <span className="icon"><MdEmail /></span>
            <input id="request-email" ref={firstInputRef} name="email" autoComplete="email" aria-label="Correo electrónico" required aria-required="true" aria-invalid={!!emailError} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {emailError && <div className="error-message" role="alert">{emailError}</div>}
          <button type="submit" disabled={loading} className="with-icon primary" aria-busy={loading}>{loading ? (<><span className="spinner" aria-hidden="true" /> Enviando...</>) : (<><FaPaperPlane style={{ marginRight: 8 }} />Enviar Código</>)}</button>
          <button type="button" className="with-icon secondary back-btn" onClick={closeModal}><FaArrowLeft style={{ marginRight: 8 }} />Volver al login</button>
        </form>
      </div>
    </div>
  );
};

export const ResetPassword = ({ onClose = null }) => {
  const [search] = useSearchParams();
  const token = search.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [valid, setValid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const firstInputRef = useRef(null);
  const previousActiveRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setValid(false);
      return;
    }
    (async () => {
      try {
        const res = await verifyPasswordToken(token);
        if (res && res.data && res.data.success) setValid(true);
        else setValid(false);
      } catch (e) {
        setValid(false);
      }
    })();
  }, [token]);

  // Accessibility: focus, ESC and trap focus for reset view
  useEffect(() => {
    previousActiveRef.current = document.activeElement;
    setTimeout(() => firstInputRef.current?.focus(), 20);
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { if (onClose) onClose(); else navigate('/login'); }
      if (e.key === 'Tab') {
        const node = cardRef.current;
        if (!node) return;
        const focusable = node.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); try { previousActiveRef.current?.focus(); } catch (e) {} };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmError('');
    if (!password || password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setConfirmError('Las contraseñas no coinciden');
      return;
    }
    try {
      setLoading(true);
      await confirmPasswordReset(token, password);
      Swal.fire({ icon: 'success', title: 'Contraseña cambiada', text: 'Ahora puedes iniciar sesión con tu nueva contraseña' });
      navigate('/login');
    } catch (err) {
      const msg = (err && err.response && err.response.data && err.response.data.message) || err.message || 'Error';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) {
    return <div className="password-page"><div className="password-card"><p>Verificando token...</p></div></div>;
  }
  if (!valid) {
    return (
      <div className="password-page">
        <div className="password-card" role="dialog" aria-modal="true" aria-labelledby="invalid-title" ref={cardRef}>
          <button type="button" className="password-close" aria-label="Cerrar" onClick={() => { if (onClose) onClose(); else navigate('/login'); }}>✕</button>
          <div className="card-banner">Motorbikers</div>
          <h2 id="invalid-title">Token inválido o expirado</h2>
          <p>Solicita nuevamente la recuperación de contraseña.</p>
          <div className="actions">
            <button type="button" className="with-icon primary" onClick={() => { if (onClose) onClose(); else navigate('/login'); }}>
              Aceptar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="password-page">
      <div className="password-card" role="dialog" aria-modal="true" aria-labelledby="reset-title" ref={cardRef}>
        <button type="button" className="password-close" aria-label="Cerrar" onClick={() => { if (onClose) onClose(); else navigate('/login'); }}>✕</button>
        <div className="card-banner">Motorbikers</div>
        <h2 id="reset-title">Cambiar Contraseña</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="new-password">Nueva contraseña</label>
          <div className="input-with-icon">
            <span className="icon"><RiLockPasswordFill /></span>
            <input id="new-password" ref={firstInputRef} name="new-password" autoComplete="new-password" aria-label="Nueva contraseña" aria-invalid={!!passwordError} required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="eye-btn" onClick={() => setShowPassword(s => !s)} aria-label="Mostrar contraseña">{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
          </div>
          {passwordError && <div className="error-message" role="alert">{passwordError}</div>}
          <label htmlFor="confirm-password">Confirmar contraseña</label>
          <div className="input-with-icon">
            <span className="icon"><RiLockPasswordFill /></span>
            <input id="confirm-password" name="confirm-password" autoComplete="new-password" aria-label="Confirmar contraseña" aria-invalid={!!confirmError} required type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <button type="button" className="eye-btn" onClick={() => setShowConfirm(s => !s)} aria-label="Mostrar confirmación">{showConfirm ? <FaEyeSlash /> : <FaEye />}</button>
          </div>
          {confirmError && <div className="error-message" role="alert">{confirmError}</div>}
          <button type="submit" disabled={loading} className="with-icon primary" aria-busy={loading}>{loading ? (<><span className="spinner" aria-hidden="true" /> Guardando...</>) : (<><FaPaperPlane style={{ marginRight: 8 }} />Cambiar contraseña</>)}</button>
          <button type="button" className="with-icon secondary back-btn" onClick={() => navigate('/login')}><FaArrowLeft style={{ marginRight: 8 }} />Volver al login</button>
        </form>
      </div>
    </div>
  );
};

export default RequestPassword;
  