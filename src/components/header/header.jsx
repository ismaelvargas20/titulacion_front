import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    FaUserEdit,
    FaSignOutAlt,
    FaTag,
    FaUsers,
    FaMotorcycle,
    FaTools,
    FaComments,
    FaEnvelope,
    FaUser,
    FaBell,
    FaSun,
    FaMoon,
    FaBars,
    FaTimes,
    FaThLarge,
    FaFileAlt,
    FaTrash,
    FaCommentAlt,
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { marcarEliminada, listarNotificaciones, marcarLeida } from '../../services/notificaciones';
import '../../assets/scss/header.scss';
import cascoImg from '../../assets/img/casco.png';

const Header = ({ adminMode = false }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const navigate = useNavigate();

    const [theme, setTheme] = useState(() => {
        try {
            const t = localStorage.getItem('theme');
            if (t === 'dark' || t === 'light') return t;
        } catch (e) {
            // ignore
        }
        return 'light';
    });

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // Estado para el usuario actual (guardado en sessionStorage por el login)
    const [user, setUser] = useState(() => {
        try {
            const raw = sessionStorage.getItem('currentUser');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    });
    const location = useLocation();

    // Refrescar user cuando cambie la ruta (por ejemplo, después del login)
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('currentUser');
            setUser(raw ? JSON.parse(raw) : null);
        } catch (e) {
            setUser(null);
        }
    }, [location]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedInsideProfile = dropdownRef.current && dropdownRef.current.contains(event.target);
            const clickedInsideNotif = notifRef.current && notifRef.current.contains(event.target);
            if (!clickedInsideProfile) setIsDropdownOpen(false);
            if (!clickedInsideNotif) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Cargar notificaciones (intenta endpoint y cae a sessionStorage como fallback)
    const fetchNotifications = async () => {
        setLoadingNotifs(true);
        try {
            // Intentar obtener clienteId desde sessionStorage (igual que en vender.jsx)
            let clienteId = null;
            try { const cur = JSON.parse(sessionStorage.getItem('currentUser') || 'null'); if (cur && cur.id) clienteId = cur.id; } catch (e) {}

            if (clienteId) {
                try {
                    const backendList = await listarNotificaciones({ clienteId, limit: 50 });
                    if (backendList && backendList.length) {
                        const normalized = backendList.map((it, idx) => {
                            const sender = it.senderName || it.fromName || it.userName || (it.user && it.user.name) || it.nombre || (it.cliente && (it.cliente.nombre || (it.cliente.firstName && `${it.cliente.firstName} ${it.cliente.lastName}`))) || it.author || null;
                            const excerpt = (it.excerpt || it.mensaje || it.message || it.body || it.text || '').toString().trim();
                            let inferredSender = null;
                            if (!sender && excerpt) {
                                const match = excerpt.match(/^([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúüñ]+)+)[:\-,\s]/);
                                if (match && match[1]) inferredSender = match[1];
                            }
                            const finalSender = sender || inferredSender;
                            let title = (it.title || it.titulo || '').toString();
                            try {
                                title = title.replace(/respondi[oó]\s+tu\s+hilo/gi, 'te respondió');
                                title = title.replace(/respondi[oó]\s+tu\s+comentario/gi, 'te respondió');
                                title = title.replace(/respondi[oó]s?/gi, 'respondió');
                            } catch (e) { /* noop */ }
                            if (finalSender) {
                                if (it.type === 'comment' || it.type === 'respuesta') title = `${finalSender} te respondió`;
                                else if (it.type === 'chat' || it.type === 'mail') title = `Nuevo mensaje de ${finalSender}`;
                                else if (!title) title = `${finalSender}`;
                            } else if (!title) {
                                if (it.type === 'chat' || it.type === 'mail') title = 'Nuevo mensaje';
                                else if (it.type === 'comment') title = 'Respuesta nueva';
                                else title = 'Notificación';
                            }

                            const to = it.to || it.link || (it.type === 'chat' ? '/chat' : '/comunidad');
                            const time = it.time || it.fecha || it.createdAt || it.created_at || '';
                            return {
                                id: it.id || it._id || `b-${idx}-${Math.random().toString(36).slice(2,8)}`,
                                title,
                                excerpt,
                                to,
                                type: it.type || 'mail',
                                time,
                                _raw: it,
                            };
                        });
                        setNotifications(normalized);
                        setLoadingNotifs(false);
                        return;
                    }
                } catch (err) {
                    // backend call failed, intentamos fallback
                    console.warn('listarNotificaciones fallo:', err && err.message ? err.message : err);
                }
            }

            // Fallback: sessionStorage/localStorage
            const raw = sessionStorage.getItem('inboxItems') || localStorage.getItem('inboxItems');
            const data = raw ? JSON.parse(raw) : [];
            setNotifications(Array.isArray(data) ? data : []);
        } catch (e) {
            setNotifications([]);
        } finally {
            setLoadingNotifs(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // refrescar al cambiar de ruta (por ejemplo tras login)
    }, [location]);

    // Mostrar notificaciones inmediatamente al abrir el dropdown
    const handleNotifToggle = () => {
        try {
            const raw = sessionStorage.getItem('inboxItems') || localStorage.getItem('inboxItems');
            const cached = raw ? JSON.parse(raw) : null;
            if (Array.isArray(cached)) setNotifications(cached);
        } catch (e) {
            // ignore
        }
        setNotifOpen((s) => {
            const willOpen = !s;
            if (willOpen) {
                // refrescar en background pero no bloquear la apertura
                fetchNotifications();
            }
            return willOpen;
        });
    };

    const navForNotification = (n) => {
        try {
            const raw = n._raw || {};
            const possible = [n.to, n.link, raw.link, raw.to];
            const pointsToChat = possible.some(p => !!(p && String(p).match(/\/chats?\//)));

            // Chats: marcar sólo esta notificación
            if ((n && n.type === 'chat') || pointsToChat) {
                try { markNotificationRead(n); } catch (e) { /* ignore */ }
                navigate('/chat');
                return;
            }

            // Publicación: marcar todas las notificaciones relacionadas con esta publicación
            if (n.publicacionId) {
                try {
                    const pubId = n.publicacionId;
                    const next = (notifications || []).map((x) => (String(x.publicacionId) === String(pubId) ? { ...x, leido: true, read: true } : x));
                    setNotifications(next);
                    try { sessionStorage.setItem('inboxItems', JSON.stringify(next)); } catch (e) {}
                    try { window.dispatchEvent(new CustomEvent('inboxUpdated', { detail: next })); } catch (e) {}
                    // notificar backend en background
                    next.forEach((item) => {
                        try {
                            if (item && item.id && String(item.id).startsWith && !String(item.id).startsWith('b-') && String(item.publicacionId) === String(pubId)) {
                                marcarLeida(item.id).catch(() => {});
                            }
                        } catch (err) {}
                    });
                } catch (err) { /* ignore */ }
                navigate(`/publicacion/${n.publicacionId}`);
                return;
            }

            // Buscar /hilos/:id en las posibles rutas y marcar en lote las notificaciones del mismo hilo
                for (let p of possible) {
                if (!p) continue;
                const m = String(p).match(/\/hilos\/(\d+)/);
                if (m && m[1]) {
                    const hiloId = m[1];
                    try {
                        // Eliminar todas las notificaciones relacionadas con este hilo
                        const toRemove = (notifications || []).filter((x) => {
                            try {
                                const search = String((x.to || x.link || (x._raw && (x._raw.link || x._raw.to)) || '')).toString();
                                return (search.indexOf(`/hilos/${hiloId}`) !== -1) || (x._raw && String(x._raw.hiloId) === String(hiloId));
                            } catch (err) { return false; }
                        });

                        const remaining = (notifications || []).filter((x) => !toRemove.includes(x));
                        setNotifications(remaining);
                        try { sessionStorage.setItem('inboxItems', JSON.stringify(remaining)); } catch (e) {}
                        try { window.dispatchEvent(new CustomEvent('inboxUpdated', { detail: remaining })); } catch (e) {}

                        // Enviar eliminación al backend en background para cada notificación eliminada
                        toRemove.forEach((item) => {
                            try {
                                if (item && item.id && String(item.id).startsWith && !String(item.id).startsWith('b-')) {
                                    marcarEliminada(item.id).catch(() => {});
                                }
                            } catch (err) {}
                        });
                    } catch (err) { /* ignore */ }
                    navigate(`/comunidad#hilo-${hiloId}`);
                    return;
                }
            }

            if (n.to) {
                try { markNotificationRead(n); } catch (e) { /* ignore */ }
                navigate(n.to);
                return;
            }

            // fallback: ir a vender (bandeja)
            try { markNotificationRead(n); } catch (e) { /* ignore */ }
            navigate('/vender');
        } catch (e) {
            try { window.location.href = n.publicacionId ? `/publicacion/${n.publicacionId}` : '/vender'; } catch (err) {}
        }
    };

    // Marcar notificación como leída (actualiza estado local y notifica backend en background)
    const markNotificationRead = async (item) => {
        try {
            if (!item || !item.id) return;
            // actualizar estado local inmediatamente
            setNotifications((prev) => {
                const next = (prev || []).map((x) => {
                    if (String(x.id) === String(item.id)) return { ...x, leido: true, read: true };
                    return x;
                });
                try { sessionStorage.setItem('inboxItems', JSON.stringify(next)); } catch (e) {}
                try { window.dispatchEvent(new CustomEvent('inboxUpdated', { detail: next })); } catch (e) {}
                return next;
            });

            // llamar backend para marcar como leída (no bloquear la navegación)
            try {
                if (String(item.id).startsWith && !String(item.id).startsWith('b-')) {
                    await marcarLeida(item.id);
                }
            } catch (err) {
                // ignore backend failure
                console.warn('marcarLeida fallo', err);
            }
        } catch (err) {
            // noop
        }
    };

    const handleDeleteNotification = async (e, item) => {
        if (e && e.stopPropagation) e.stopPropagation();
        try {
            const res = await Swal.fire({ title: 'Eliminar notificación', text: '¿Seguro que deseas eliminarla?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
            if (!res || !res.isConfirmed) return;
            try {
                if (item && item.id && String(item.id).startsWith && !String(item.id).startsWith('b-')) {
                    await marcarEliminada(item.id);
                }
            } catch (err) { /* ignore backend delete failure */ }
            const next = notifications.filter(x => x.id !== item.id);
            setNotifications(next);
            try { sessionStorage.setItem('inboxItems', JSON.stringify(next)); } catch (e) {}
            try { window.dispatchEvent(new CustomEvent('inboxUpdated', { detail: next })); } catch (e) {}
        } catch (err) {
            console.warn('delete notification error', err);
        }
    };

    // Escuchar actualizaciones desde otras partes de la app (ej. `vender.jsx`)
    useEffect(() => {
        const onInboxUpdated = (e) => {
            try {
                const data = (e && e.detail) ? e.detail : null;
                if (Array.isArray(data)) setNotifications(data);
            } catch (err) { /* ignore */ }
        };
        window.addEventListener('inboxUpdated', onInboxUpdated);
        return () => window.removeEventListener('inboxUpdated', onInboxUpdated);
    }, []);

    const handleLogout = (e) => {
        try {
            localStorage.removeItem('theme');
        } catch (err) {}
        try {
            sessionStorage.removeItem('currentUser');
        } catch (err) {}
        setUser(null);
        setTheme('light');
        setIsDropdownOpen(false);
        try { navigate('/login'); } catch (e) {}
    };

    const applyThemeToContent = (t) => {
        try {
            const main = document.querySelector('.app-main');
            if (!main) return;
            if (t === 'dark') main.classList.add('dark-theme');
            else main.classList.remove('dark-theme');
            try {
                if (t === 'dark') document.body.classList.add('global-dark');
                else document.body.classList.remove('global-dark');
            } catch (e) {}
        } catch (e) {
            // ignore
        }
    };

    useEffect(() => {
        applyThemeToContent(theme);
        try { localStorage.setItem('theme', theme); } catch (e) {}
    }, [theme]);


    const toggleTheme = () => setTheme((s) => (s === 'dark' ? 'light' : 'dark'));

    const menuItems = adminMode
        ? [
                        { to: '/dashboard', label: 'Dashboard', icon: FaThLarge },
                        { to: '/usuarios', label: 'Clientes', icon: FaUser },
                        { to: '/posteadas', label: 'Publicaciones', icon: FaFileAlt },
                        { to: '/comentarios', label: 'Comentarios', icon: FaComments },
                        { to: '/mensajes', label: 'Mensajes', icon: FaEnvelope },
          ]
        : [
            { to: '/motos', label: 'Motos', icon: FaMotorcycle },
            { to: '/repuestos', label: 'Repuestos', icon: FaTools },
            { to: '/comunidad', label: 'Comunidad', icon: FaUsers },
            { to: '/vender', label: 'Vender', icon: FaTag },
            { to: '/chat', label: 'Chat', icon: FaComments },
          ];

    return (
        <header className="app-header">
            <div className="header-container">
                
                <NavLink
                    to="/"
                    className="logo"
                    onClick={(e) => {
                        if (adminMode) {
                            // En modo admin el logo no debe navegar a inicio
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }}
                >
                    Motorbikers
                    <span className="logo-image" aria-hidden="true">
                        <img src={cascoImg} alt="Casco Motorbikers" />
                    </span>
                </NavLink>

                {/* Toggle nav móvil */}
                <button
                    type="button"
                    className="nav-toggle"
                    aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={mobileMenuOpen}
                    onClick={() => setMobileMenuOpen(s => !s)}
                >
                    {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>

                {/* --- NAV PRINCIPAL (Igual que antes) --- */}
                <nav className="main-nav">
                    <ul className={`nav-list ${mobileMenuOpen ? 'open' : ''}`}>
                        {menuItems.map(({ to, label, icon: Icon }) => (
                            <li key={to}>
                                <NavLink
                                    to={to}
                                    className={({ isActive }) =>
                                        isActive
                                            ? 'nav-link cta-link secondary active'
                                            : 'nav-link cta-link secondary'
                                    }
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Icon className="nav-icon" />
                                    {label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* --- Perfil de Usuario con Dropdown --- */}
                <div className="user-profile" ref={dropdownRef}>
                    {/* Notificaciones (ahora antes del toggle de tema) - ocultar en modo admin */}
                    {!adminMode && (
                    <div className="notif-container" ref={notifRef}>
                        <button
                            type="button"
                            className="notif-toggle"
                            aria-label="Notificaciones"
                            onClick={handleNotifToggle}
                        >
                            <FaBell />
                            {notifications && notifications.filter(n => !n.leido && !n.read).length > 0 && (
                                <span className="notif-badge">{notifications.filter(n => !n.leido && !n.read).length}</span>
                            )}
                        </button>

                        {notifOpen && (
                            <div className="notif-dropdown">
                                <div className="notif-header"><strong>Notificaciones</strong></div>
                                <div className="notif-body">
                                    {loadingNotifs ? (
                                        <div className="loading">Cargando…</div>
                                    ) : notifications.length === 0 ? (
                                        <div className="empty">No hay notificaciones</div>
                                    ) : (
                                        <ul className="notif-list">
                                            {notifications.slice(0,5).map((n) => (
                                                <li key={n.id} className="notif-item">
                                                    <div className="left">
                                                        <div className="title">{n.title || n.from || 'Mensaje'}</div>
                                                        <div className="excerpt">{n.excerpt || n.text || ''}</div>
                                                    </div>
                                                                <div className="right">
                                                                    <button
                                                                        className="icon-btn comment"
                                                                        title="Abrir"
                                                                        onClick={(ev) => {
                                                                            ev.stopPropagation();
                                                                            try { markNotificationRead(n); } catch (e) { /* ignore */ }
                                                                            setNotifOpen(false);
                                                                            navForNotification(n);
                                                                        }}
                                                                    >
                                                                        <FaCommentAlt />
                                                                    </button>
                                                                    <button
                                                                        className="icon-btn danger"
                                                                        title="Eliminar"
                                                                        onClick={(ev) => handleDeleteNotification(ev, n)}
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="notif-foot">
                                    <NavLink to="/vender" className="view-all" onClick={() => setNotifOpen(false)}>Ver bandeja completa</NavLink>
                                </div>
                            </div>
                        )}
                    </div>
                    )}

                    {/* Toggle de tema: colocado a la derecha de la campana (orden: campana | toggle | perfil) */}
                    <button
                        type="button"
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                    >
                        {theme === 'dark' ? <FaSun /> : <FaMoon />}
                    </button>

                    <FaUser
                        className="profile-icon"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    />

                    {isDropdownOpen && (
                        <div className="profile-dropdown">
                            <div className="dropdown-header">
                                <strong>¡Hola, {user && user.nombre ? user.nombre : 'Invitado'}!</strong>
                                <small>{user && user.email ? user.email : 'No has iniciado sesión'}</small>
                            </div>
                            
                            <ul className="dropdown-menu">
                                <li>
                                    <NavLink
                                        to="/perfil"
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsDropdownOpen(false);
                                            try {
                                                navigate('/perfil', { state: { edit: true } });
                                            } catch (err) {
                                                window.location.href = '/perfil';
                                            }
                                        }}
                                    >
                                        <FaUserEdit className="dropdown-icon" />
                                        Mi Perfil
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/login"
                                        className="dropdown-item danger plain"
                                        onClick={handleLogout}
                                    >
                                        <FaSignOutAlt className="dropdown-icon" />
                                        Cerrar Sesión
                                    </NavLink>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
};

export default Header;