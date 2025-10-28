import React, { useState } from 'react';
import '../../assets/scss/registro.scss';
import { FaUser, FaMapMarkerAlt } from 'react-icons/fa';
import { MdEmail, MdCalendarToday, MdPhone } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';

const Registro = ({ isOpen = false, onClose = () => {} }) => {
	const [isClosing, setIsClosing] = useState(false);

	if (!isOpen) return null;

	const handleClose = () => {
		setIsClosing(true);
		// Esperar a que termine la animación antes de cerrar
		setTimeout(() => {
			setIsClosing(false);
			onClose();
		}, 200); // 200ms = duración de la animación
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		console.log('Crear cuenta (datos del formulario)');
		// handleClose(); // descomenta para cerrar con animación al crear cuenta
	};

	return (
		<div className={`reg-modal-overlay ${isClosing ? 'closing' : ''}`} role="dialog" aria-modal="true">
			<div className="reg-modal-card" aria-label="Formulario de registro">
				<button className="reg-close" onClick={handleClose} aria-label="Cerrar registro">✕</button>

				<h2 className="reg-title">Crea tu cuenta</h2>
				<p className="reg-sub">Únete a nuestra comunidad — es rápido y seguro</p>

				<form className="reg-form" onSubmit={handleSubmit}>
					<label>
						<span>Nombre completo</span>
						<div className="reg-input">
							<FaUser className="reg-icon" />
							<input name="fullname" type="text" placeholder="Nombre completo" required />
						</div>
					</label>

					<label>
						<span>Fecha de nacimiento</span>
						<div className="reg-input">
							<MdCalendarToday className="reg-icon" />
							<input name="birthdate" type="date" required />
						</div>
					</label>

					<label>
						<span>Correo electrónico</span>
						<div className="reg-input">
							<MdEmail className="reg-icon" />
							<input name="email" type="email" placeholder="Correo electrónico" required />
						</div>
					</label>

					<label>
						<span>Número de teléfono</span>
						<div className="reg-input">
							<MdPhone className="reg-icon" />
							<input name="phone" type="tel" placeholder="Número de teléfono" />
						</div>
					</label>

					<label>
						<span>Ciudad / Provincia</span>
						<div className="reg-input">
							<FaMapMarkerAlt className="reg-icon" />
							<input name="city" type="text" placeholder="Ciudad / Provincia" />
						</div>
					</label>

					<label>
						<span>Contraseña</span>
						<div className="reg-input">
							<RiLockPasswordFill className="reg-icon" />
							<input name="password" type="password" placeholder="Contraseña" required />
						</div>
					</label>

					<div className="reg-actions">
						<button type="button" className="reg-btn secondary" onClick={handleClose}>Regresar</button>
						<button type="submit" className="reg-btn primary">Crear cuenta</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Registro;
