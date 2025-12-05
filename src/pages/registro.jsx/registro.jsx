import React, { useState } from 'react';
import '../../assets/scss/registro.scss';
import { FaUser, FaMapMarkerAlt, FaRegCalendarAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdEmail, MdPhone } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';
import { registerClient } from '../../services/clientes';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const Registro = ({ isOpen = false, onClose = () => {} }) => {
	// Hooks: always declared in the same order, before any conditional return
	const [isClosing, setIsClosing] = useState(false);
	const [fullname, setFullname] = useState('');
	const [birthdate, setBirthdate] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [city, setCity] = useState('');
	const [password, setPassword] = useState('');
	const [isAdmin, setIsAdmin] = useState(false);
	const [adminCode, setAdminCode] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const handleClose = () => {
		setIsClosing(true);
		// Esperar a que termine la animación antes de cerrar
		setTimeout(() => {
			setIsClosing(false);
			// Limpiar el formulario antes de notificar al padre
			setFullname('');
			setBirthdate('');
			setEmail('');
			setPhone('');
			setCity('');
			setPassword('');
			setError(null);
			onClose();
		}, 200); // 200ms = duración de la animación
	};

	if (!isOpen) return null;

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
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

			// Si el usuario marca que quiere registrarse como admin, validar que haya ingresado un código
			if (isAdmin) {
				if (!adminCode || !adminCode.trim()) {
					setError('Si desea registrarse como administrador debe ingresar el código de invitación');
					setLoading(false);
					await Swal.fire({ icon: 'warning', title: 'Código requerido', text: 'Por favor ingresa el código de invitación para registrarte como administrador' });
					return;
				}
				const codeTrim = adminCode.trim();
				// Enviar el código con varios alias por compatibilidad con el backend
				payload.adminCode = codeTrim;
				payload.codigo_admin = codeTrim;
				payload.admin_code = codeTrim;
			}
			// Log temporal para depuración (quita en producción)
			console.log('Registro payload:', payload);
			const result = await registerClient(payload);
			// Cerrar modal primero para evitar que su overlay o z-index esconda la alerta
			handleClose();
			// Muestra una alerta bonita con SweetAlert2
			await Swal.fire({
				icon: 'success',
				title: 'Registro exitoso',
				text: (result && result.message) ? result.message : 'Cuenta creada correctamente',
				timer: 3000,
				timerProgressBar: true,
				showConfirmButton: false
			});
		} catch (err) {
			console.error('Error registrando cliente', err);
			const msg = err?.response?.data?.message || err.message || 'Error en el registro';
			setError(msg);
			// Mostrar error con SweetAlert2 además del mensaje inline
			await Swal.fire({
				icon: 'error',
				title: 'No se pudo registrar',
				text: msg
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={`reg-modal-overlay ${isClosing ? 'closing' : ''}`} role="dialog" aria-modal="true">
			<div className="reg-modal-card" aria-label="Formulario de registro">
				<button className="reg-close" onClick={handleClose} aria-label="Cerrar registro">✕</button>

				<h2 className="reg-title">Crea tu cuenta</h2>
				<p className="reg-sub">Únete a nuestra comunidad — es rápido y seguro</p>

				<form id="regForm" className="reg-form" onSubmit={handleSubmit}>
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
							<input name="birthdate" value={birthdate} onChange={e => setBirthdate(e.target.value)} type="date" required />
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

					{/* --- Opciones de administrador --- */}
					{/* --- Opciones de administrador (estilizado) --- */}
					<label
						className="reg-admin-row"
						htmlFor="adminCheck"
						style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}
						role="switch"
						aria-checked={isAdmin}
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === ' ' || e.key === 'Enter') {
								e.preventDefault();
								setIsAdmin(s => !s);
							}
						}}
						onClick={() => setIsAdmin(s => !s)}
						>
						<input
							id="adminCheck"
							type="checkbox"
							checked={isAdmin}
							onChange={e => setIsAdmin(e.target.checked)}
							style={{ margin: 0, zIndex: 3 }}
						/>
						<span className={`admin-icon ${isAdmin ? 'active' : ''}`} aria-hidden="true">
							<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 2l7 3v5c0 5-3.5 9.7-7 11-3.5-1.3-7-6-7-11V5l7-3z" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</span>
						<span className="admin-label">Registrarme como Administrador</span>
					</label>

					<label className={`reg-admin-code ${isAdmin ? 'visible' : 'hidden'}`} style={{ gridColumn: '1 / -1', marginTop: 8 }}>
						<span>Código de Administrador</span>
						<div className="reg-input">
							<span className="admin-input-icon" aria-hidden="true">
								<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 2l7 3v5c0 5-3.5 9.7-7 11-3.5-1.3-7-6-7-11V5l7-3z" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</span>
							<input name="adminCode" value={adminCode} onChange={e => setAdminCode(e.target.value)} type="text" placeholder="Ingresa el código de invitación" />
						</div>
						<div className="reg-admin-note">Se requiere un código válido para registrarse como administrador</div>
					</label>

				</form>

				{/* Zona de acciones fuera del formulario para evitar que el scroll interno
				   mueva los botones: así siempre quedan en la parte inferior de la tarjeta */}
				<div className="reg-actions">
					<button type="button" className="reg-btn secondary" onClick={handleClose} disabled={loading}>Regresar</button>
					<button type="submit" form="regForm" className="reg-btn primary" disabled={loading}>{loading ? 'Creando...' : 'Crear cuenta'}</button>
				</div>
				{error && <div style={{ color: 'crimson', marginTop: 10 }}>{error}</div>}
			</div>
		</div>
	);
};

export default Registro;
