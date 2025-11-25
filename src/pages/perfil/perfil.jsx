import React, { useState, useRef, useEffect } from 'react';
// useLocation removed — Perfil no longer reads URL hash for publicaciones
import '../../assets/scss/perfil.scss'; // Importamos el SCSS desde assets
import api from '../../api/axios';
import * as clientesService from '../../services/clientes';
import Swal from 'sweetalert2';

// Iconos
import { FaUser, FaMapMarkerAlt, FaUserCircle, FaSave, FaEdit, FaTimes, FaRegCalendarAlt } from 'react-icons/fa';
import { MdEmail, MdPhone } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';

const Perfil = () => {
    // Estado para controlar si el formulario es editable
    // Por defecto mostramos el perfil en modo lectura. Solo cambiar a edición
    // cuando el usuario pulse el botón "Editar perfil".
    const initialEdit = false;
    const [isEditing, setIsEditing] = useState(initialEdit);
    // Mantener Perfil solo con formulario; la gestión de publicaciones vive en /publicaciones

    // Estado para guardar los datos del usuario (se cargan desde backend al montar)
    const [userData, setUserData] = useState({
        fullname: '',
        birthdate: '',
        email: '',
        phone: '',
        city: '',
        // Dejamos las contraseñas vacías por seguridad
        newPassword: '',
        confirmPassword: ''
    });
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [profileError, setProfileError] = useState(null);

    // Identificador y rol del usuario en sesión (si existe)
    const [loggedUser, setLoggedUser] = useState(null);

    // Refs para foco y submit programático
    const firstInputRef = useRef(null);
    const passwordSectionRef = useRef(null);
    const newPasswordRef = useRef(null);
    const formRef = useRef(null);
    const originalDataRef = useRef(null); // Para restaurar al cancelar
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    // Cuando entramos en modo edición, hacemos foco en el primer campo
    useEffect(() => {
        if (isEditing && firstInputRef.current) {
            try { firstInputRef.current.focus(); } catch (e) {}
        }
    }, [isEditing]);

    // Cargar perfil del usuario logueado al montar
    useEffect(() => {
        (async () => {
            try {
                setLoadingProfile(true);
                setProfileError(null);
                const raw = sessionStorage.getItem('currentUser');
                if (!raw) {
                    setProfileError('No hay usuario logueado. Inicia sesión.');
                    return;
                }
                const current = JSON.parse(raw);
                setLoggedUser(current);
                const id = current.id;
                if (!id) {
                    setProfileError('ID de usuario no disponible en sesión.');
                    return;
                }

                // Si el rol es 'cliente' usamos detalleCliente, sino consultamos /usuarios/detalle/:id
                let respData = null;
                if (current.rol && String(current.rol).toLowerCase().includes('cliente')) {
                    const detalle = await clientesService.detalleCliente(id);
                    respData = detalle;
                } else {
                    const r = await api.get(`/usuarios/detalle/${encodeURIComponent(id)}`);
                    respData = r && r.data ? r.data : null;
                }

                if (!respData) {
                    setProfileError('No se pudo obtener datos del perfil.');
                    return;
                }

                // Mapear campos comunes
                setUserData(prev => ({
                    ...prev,
                    fullname: respData.fullname || respData.nombre || '',
                    birthdate: respData.birthdate || respData.fecha_nacimiento || '',
                    email: respData.email || respData.correo_electronico || '',
                    phone: respData.phone || respData.telefono || '',
                    city: respData.city || respData.ciudad || ''
                }));
            } catch (err) {
                console.warn('Error cargando perfil:', err);
                setProfileError((err && err.response && err.response.data && (err.response.data.error || err.response.data.message)) || err.message || 'Error al cargar perfil');
            } finally {
                setLoadingProfile(false);
            }
        })();
    }, []);

    // Cuando se abre la sección de cambio de contraseña, hacer scroll y foco
    useEffect(() => {
        if (showPasswordFields && passwordSectionRef.current) {
            try {
                passwordSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {}
            // pequeño delay para asegurar que el input esté montado
            setTimeout(() => {
                if (newPasswordRef.current) {
                    try { newPasswordRef.current.focus(); } catch (e) {}
                }
            }, 220);
        }
    }, [showPasswordFields]);

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
        (async () => {
            try {
                if (!loggedUser || !loggedUser.id) {
                    alert('No hay usuario en sesión');
                    return;
                }
                // Validar contraseñas locales si están presentes (no aplicarlas aquí)
                if (userData.newPassword && userData.newPassword !== userData.confirmPassword) {
                    alert('Las nuevas contraseñas no coinciden.');
                    return;
                }

                // Preparar payload según tipo de usuario: el controlador de clientes espera
                // los nombres en español ('nombre','fecha_nacimiento','correo_electronico','telefono','ciudad')
                const id = loggedUser.id;
                let res = null;
                if (loggedUser.rol && String(loggedUser.rol).toLowerCase().includes('cliente')) {
                    const payloadCliente = {
                        nombre: userData.fullname,
                        fecha_nacimiento: userData.birthdate,
                        correo_electronico: userData.email,
                        telefono: userData.phone,
                        ciudad: userData.city
                    };
                    res = await api.put(`/clientes/actualizar/${encodeURIComponent(id)}`, payloadCliente);
                } else {
                    const payloadUsuario = {
                        fullname: userData.fullname,
                        birthdate: userData.birthdate,
                        email: userData.email,
                        phone: userData.phone,
                        city: userData.city
                    };
                    res = await api.put(`/usuarios/actualizar/${encodeURIComponent(id)}`, payloadUsuario);
                }

                if (res && (res.status === 200 || res.status === 201)) {
                    // Tomar la respuesta actualizada (clientes devuelven { cliente: { ... } }, usuarios devuelven el objeto directamente)
                    const updated = (res.data && (res.data.cliente || res.data.usuario)) ? (res.data.cliente || res.data.usuario) : (res.data || {});

                    // Mapear la respuesta a userData (manejando aliases)
                    setUserData(prev => ({
                        ...prev,
                        fullname: updated.fullname || updated.nombre || userData.fullname,
                        birthdate: updated.birthdate || updated.fecha_nacimiento || userData.birthdate,
                        email: updated.email || updated.correo_electronico || userData.email,
                        phone: updated.phone || updated.telefono || userData.phone,
                        city: updated.city || updated.ciudad || userData.city
                    }));

                    // Actualizar sesión local si cambió el nombre o email
                    try {
                        const currentRaw = sessionStorage.getItem('currentUser');
                        if (currentRaw) {
                            const cur = JSON.parse(currentRaw);
                            cur.nombre = updated.nombre || updated.fullname || cur.nombre;
                            cur.name = updated.nombre || updated.fullname || cur.name;
                            cur.email = updated.correo_electronico || updated.email || cur.email;
                            sessionStorage.setItem('currentUser', JSON.stringify(cur));
                            setLoggedUser(cur);
                        }
                    } catch (e) { /* noop */ }

                    setIsEditing(false);
                    try { Swal.fire({ icon: 'success', title: 'Perfil actualizado' }); } catch (e) {}
                } else {
                    alert('No se pudo actualizar el perfil.');
                }
            } catch (err) {
                console.error('Error actualizando perfil:', err);
                try {
                    const msg = (err && err.response && (err.response.data && (err.response.data.error || err.response.data.message))) || err.message || String(err);
                    Swal.fire({ icon: 'error', title: 'Error', text: String(msg).slice(0, 300) });
                } catch (e) { alert('Error actualizando perfil'); }
            }
        })();
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
        (async () => {
            try {
                if (!userData.newPassword) {
                    alert('Escribe la nueva contraseña.');
                    return;
                }
                if (userData.newPassword !== userData.confirmPassword) {
                    alert('Las contraseñas no coinciden.');
                    return;
                }
                if (!loggedUser || !loggedUser.id) {
                    alert('No hay usuario en sesión');
                    return;
                }
                const payload = { contrasena: userData.newPassword, password: userData.newPassword, contrasena_hash: undefined };
                const id = loggedUser.id;
                let res = null;
                if (loggedUser.rol && String(loggedUser.rol).toLowerCase().includes('cliente')) {
                    res = await api.put(`/clientes/actualizar/${encodeURIComponent(id)}`, { contrasena: userData.newPassword });
                } else {
                    res = await api.put(`/usuarios/actualizar/${encodeURIComponent(id)}`, { contrasena: userData.newPassword });
                }
                if (res && (res.status === 200 || res.status === 201)) {
                    try { Swal.fire({ icon: 'success', title: 'Contraseña actualizada' }); } catch (e) {}
                    setUserData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
                    setShowPasswordFields(false);
                    setIsEditing(false);
                } else {
                    alert('No se pudo actualizar la contraseña.');
                }
            } catch (err) {
                console.error('Error actualizando contraseña:', err);
                try {
                    const msg = (err && err.response && (err.response.data && (err.response.data.error || err.response.data.message))) || err.message || String(err);
                    Swal.fire({ icon: 'error', title: 'Error', text: String(msg).slice(0, 300) });
                } catch (e) { alert('Error actualizando contraseña'); }
            }
        })();
    };

    const handleCancelPasswordChange = (e) => {
        e.preventDefault();
        // Restaurar campos y cerrar la sección; salir de edición para que la CTA reaparezca
        setUserData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        setShowPasswordFields(false);
        setIsEditing(false);
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

                <div className="perfil-body">
                    <form ref={formRef} className="reg-form" onSubmit={handleSubmit}>
                        <fieldset disabled={!isEditing}>
                            {/* Ocultar la sección principal de "Información Personal" cuando se muestran
                               los campos de cambio de contraseña. Esto hace que al pulsar
                               "Haz click aquí" desaparezca el área encerrada en rojo. */}
                            {!showPasswordFields && (
                                <>
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
                                        <div className="reg-input reg-input--date">
                                            <FaRegCalendarAlt className="reg-icon" />
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
                                </>
                            )}

                            {/* Si la sección de contraseña está abierta, renderizamos los inputs dentro del fieldset
                                (esto permite que los inputs formen parte del form y respeten el atributo disabled) */}
                            {showPasswordFields && (
                                <div ref={passwordSectionRef} className="password-section">
                                    <label>
                                        <span>Nueva Contraseña</span>
                                        <div className="reg-input">
                                            <RiLockPasswordFill className="reg-icon" />
                                            <input
                                                ref={newPasswordRef}
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
                                </div>
                            )}
                        </fieldset>

                        {/* CTA de cambio de contraseña: mostrar título + CTA sólo cuando NO estamos en modo edición y no están visibles los campos de contraseña */}
                        {!isEditing && !showPasswordFields && (
                            <>
                                <h3 className="password-title">Contraseña</h3>
                                <div className="change-pass-cta readonly">
                                    <p className="muted">¿Quieres cambiar tu contraseña?</p>
                                    <button
                                        type="button"
                                        className="perfil-edit-small"
                                        onClick={() => {
                                            // Si no estamos en modo edición, activarlo y luego mostrar campos de contraseña
                                            if (!isEditing) {
                                                originalDataRef.current = { ...userData };
                                                setIsEditing(true);
                                                // esperar un tick para que el fieldset deje de estar disabled
                                                setTimeout(() => setShowPasswordFields(true), 60);
                                            } else {
                                                setShowPasswordFields(true);
                                            }
                                        }}
                                    >
                                        Haz click aquí
                                    </button>
                                </div>
                            </>
                        )}

                        </form>
                </div>

            </div>
        </div>
    );
};

export default Perfil;