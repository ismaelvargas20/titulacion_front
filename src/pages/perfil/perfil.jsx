import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../../assets/scss/perfil.scss'; // Importamos el SCSS desde assets

// Iconos
import { FaUser, FaMapMarkerAlt, FaUserCircle, FaSave, FaEdit, FaTimes } from 'react-icons/fa';
import { MdCalendarToday, MdEmail, MdPhone } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';

const Perfil = () => {
    // Estado para controlar si el formulario es editable
    const location = useLocation();
    // Por defecto mostramos el perfil en modo lectura. Solo cambiar a edición
    // cuando el usuario pulse el botón "Editar perfil".
    const initialEdit = false;
    const [isEditing, setIsEditing] = useState(initialEdit);

    // Estado para guardar los datos del usuario (puedes cargarlo desde tu backend)
    const [userData, setUserData] = useState({
        fullname: 'Juan Pérez',
        birthdate: '1990-05-15',
        email: 'juan.perez@email.com',
        phone: '0987654321',
        city: 'Quito / Pichincha',
        // Dejamos las contraseñas vacías por seguridad
        newPassword: '',
        confirmPassword: ''
    });

    // Refs para foco y submit programático
    const firstInputRef = useRef(null);
    const formRef = useRef(null);
    const originalDataRef = useRef(null); // Para restaurar al cancelar
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    // Cuando entramos en modo edición, hacemos foco en el primer campo
    useEffect(() => {
        if (isEditing && firstInputRef.current) {
            try { firstInputRef.current.focus(); } catch (e) {}
        }
    }, [isEditing]);

    // Manejador para actualizar el estado cuando el usuario escribe
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Manejador para "guardar" el formulario
    const handleSubmit = (e) => {
        e.preventDefault();
        // Aquí iría la lógica para enviar los datos a tu API
        console.log('Datos guardados:', userData);
        
        // Validar que las contraseñas coincidan (si se escribieron)
        if (userData.newPassword && userData.newPassword !== userData.confirmPassword) {
            alert('Las nuevas contraseñas no coinciden.');
            return;
        }

        // Desactivamos el modo edición después de guardar
        setIsEditing(false);
        alert('¡Perfil actualizado con éxito!');
    };

    // Activa el modo edición
    const handleEditClick = () => {
        // Guardamos snapshot de datos actuales para poder cancelar
        originalDataRef.current = { ...userData };
        setShowPasswordFields(false);
        setIsEditing(true);
    };

    // Cancelar edición y restaurar datos
    const handleCancel = (e) => {
        e.preventDefault();
        if (originalDataRef.current) {
            setUserData(originalDataRef.current);
        }
        setIsEditing(false);
        setShowPasswordFields(false);
    };

    // Manejar actualización de contraseña separada del submit general
    const handlePasswordUpdate = (e) => {
        e.preventDefault();
        if (!userData.newPassword) {
            alert('Escribe la nueva contraseña.');
            return;
        }
        if (userData.newPassword !== userData.confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }
        // Aquí iría la petición al backend para cambiar la contraseña
        console.log('Contraseña actualizada a:', userData.newPassword);
        alert('Contraseña actualizada con éxito.');
        // Limpiamos campos y ocultamos sección
        setUserData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        setShowPasswordFields(false);
    };

    const handleCancelPasswordChange = (e) => {
        e.preventDefault();
        setUserData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        setShowPasswordFields(false);
    };

    return (
        <div className="perfil-page-container">
            <div className="perfil-card">

                {/* --- Cabecera del Perfil --- */}
                <div className="perfil-header">
                    <FaUserCircle className="perfil-avatar" aria-hidden="true" />
                    <h2>{userData.fullname}</h2>
                    <p>{userData.city}</p>

                    {/* Mostramos "Editar" solo si NO estamos editando */}
                    {!isEditing && (
                        <button className="perfil-edit-btn" onClick={handleEditClick} aria-label="Editar perfil">
                            <FaEdit className="edit-icon" />
                            <span>Editar perfil</span>
                        </button>
                    )}
                </div>

                {/* --- Formulario del Perfil --- */}
                {/* Usamos tu clase "reg-form". El <fieldset> con 'disabled'
                  es clave para la UX de "solo lectura".
                */}
                <div className="perfil-body">
                    <form ref={formRef} className="reg-form" onSubmit={handleSubmit}>
                    <fieldset disabled={!isEditing}>
                        <h3>Información Personal</h3>
                        
                        <label>
                            <span>Nombre completo</span>
                            <div className="reg-input">
                                <FaUser className="reg-icon" />
                                <input 
                                    ref={firstInputRef}
                                    name="fullname" 
                                    type="text" 
                                    placeholder="Nombre completo" 
                                    value={userData.fullname}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </label>

                        <label>
                            <span>Fecha de nacimiento</span>
                            <div className="reg-input">
                                <MdCalendarToday className="reg-icon" />
                                <input 
                                    name="birthdate" 
                                    type="date" 
                                    value={userData.birthdate}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </label>

                        <label>
                            <span>Correo electrónico</span>
                            <div className="reg-input">
                                <MdEmail className="reg-icon" />
                                <input 
                                    name="email" 
                                    type="email" 
                                    placeholder="Correo electrónico" 
                                    value={userData.email}
                                    onChange={handleChange}
                                    required 
                                />
                            </div>
                        </label>

                        <label>
                            <span>Número de teléfono</span>
                            <div className="reg-input">
                                <MdPhone className="reg-icon" />
                                <input 
                                    name="phone" 
                                    type="tel" 
                                    placeholder="Número de teléfono" 
                                    value={userData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </label>

                        <label>
                            <span>Ciudad / Provincia</span>
                            <div className="reg-input">
                                <FaMapMarkerAlt className="reg-icon" />
                                <input 
                                    name="city" 
                                    type="text" 
                                    placeholder="Ciudad / Provincia" 
                                    value={userData.city}
                                    onChange={handleChange}
                                />
                            </div>
                        </label>

                        {/* Acciones (Guardar + Cancelar) colocadas debajo de Ciudad / Provincia, alineadas a la izquierda */}
                        {isEditing && (
                            <div className="form-actions-inline left">
                                <button type="submit" className="perfil-save-btn" aria-label="Guardar cambios">
                                    <FaSave /> Guardar
                                </button>
                                <button type="button" className="perfil-cancel-btn" onClick={handleCancel} aria-label="Cancelar edición">
                                    <FaTimes /> Cancelar
                                </button>
                            </div>
                        )}

                        {/* Mostramos la sección de contraseña SÓLO en modo edición */}
                        {isEditing && (
                            <>
                                <h3 className="password-title">Contraseña</h3>
                                {!showPasswordFields ? (
                                    <div className="change-pass-cta">
                                        <p className="muted">¿Quieres cambiar tu contraseña?</p>
                                        <button type="button" className="perfil-edit-small" onClick={() => setShowPasswordFields(true)}>
                                            Haz click aquí
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <label>
                                            <span>Nueva Contraseña</span>
                                            <div className="reg-input">
                                                <RiLockPasswordFill className="reg-icon" />
                                                <input 
                                                    name="newPassword" 
                                                    type="password" 
                                                    placeholder="Nueva Contraseña" 
                                                    value={userData.newPassword}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </label>
                                        <label>
                                            <span>Confirmar Contraseña</span>
                                            <div className="reg-input">
                                                <RiLockPasswordFill className="reg-icon" />
                                                <input 
                                                    name="confirmPassword" 
                                                    type="password" 
                                                    placeholder="Confirmar Contraseña" 
                                                    value={userData.confirmPassword}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </label>

                                        <div className="change-pass-actions">
                                            <button type="button" className="perfil-pass-update-btn" onClick={handlePasswordUpdate}>
                                                Actualizar contraseña
                                            </button>
                                            <button type="button" className="perfil-pass-cancel-small" onClick={handleCancelPasswordChange}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </fieldset>

                    
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Perfil;