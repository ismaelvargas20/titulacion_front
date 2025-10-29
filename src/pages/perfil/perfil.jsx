import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../../assets/scss/perfil.scss'; // Importamos el SCSS desde assets

// Importamos los iconos que mencionaste y algunos adicionales
import { FaUser, FaMapMarkerAlt, FaUserCircle, FaSave } from 'react-icons/fa';
import { MdCalendarToday, MdEmail, MdPhone } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';

const Perfil = () => {
    // Estado para controlar si el formulario es editable
    const location = useLocation();
    const initialEdit = Boolean(location && location.state && location.state.edit);
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
        setIsEditing(true);
    };

    return (
        <div className="perfil-page-container">
            <div className="perfil-card">

                {/* --- Cabecera del Perfil --- */}
                <div className="perfil-header">
                    <FaUserCircle className="perfil-avatar" />
                    <h2>{userData.fullname}</h2>
                    <p>{userData.city}</p>
                    
                    {/* Mostramos "Editar" solo si NO estamos editando */}
                    {!isEditing && (
                        <button className="perfil-edit-btn" onClick={handleEditClick}>
                            Editar Perfil
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

                        {/* Mostramos la sección de contraseña SÓLO en modo edición */}
                        {isEditing && (
                            <>
                                <h3 className="password-title">Cambiar Contraseña</h3>
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
                            </>
                        )}
                    </fieldset>

                    {/* Mostramos "Guardar" solo SI estamos editando (botón dentro del form por accesibilidad) */}
                    {isEditing && (
                        <div className="form-actions-inline">
                            <button type="submit" className="perfil-save-btn">
                                <FaSave /> Guardar Cambios
                            </button>
                        </div>
                    )}
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Perfil;