import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTag, FaMotorcycle, FaTools, FaEnvelope, FaTimes, FaRegCommentDots, FaCommentAlt, FaBell, FaTrash, FaSyncAlt, FaStar } from 'react-icons/fa';
import '../../assets/scss/vender.scss';
import Swal from 'sweetalert2';
import { crearPublicacion } from '../../services/motos';
import { crearRepuesto } from '../../services/repuestos';
import { loadLocalNotifications, pushLocalNotification } from '../../utils/notificacion';
import { listarNotificaciones, marcarEliminada } from '../../services/notificaciones';

export default function Vender() {
  const navigate = useNavigate();

  // Modal states
  const [showMotoForm, setShowMotoForm] = useState(false);
  const [showPartForm, setShowPartForm] = useState(false);
  // messages are now a dedicated page (/chat)
  // Form states (complete version mirroring Motos/Repuestos)
  const [motoForm, setMotoForm] = useState({ title: '', model: '', revision: 'Al día', condition: 'Excelente', price: '', location: '', stars: 5, img: '', description: '', contactPhone: '', kilometraje: '', year: '', transmission: 'manual' });
  const [partForm, setPartForm] = useState({ title: '', category: '', condition: 'Nuevo', price: '', location: '', img: '', description: '', contactPhone: '', stars: 5 });
  const [motoPreview, setMotoPreview] = useState(null);
  const [partPreview, setPartPreview] = useState(null);
  const [publishLoadingMoto, setPublishLoadingMoto] = useState(false);
  const [publishSuccessMoto, setPublishSuccessMoto] = useState(false);
  const [publishLoadingPart, setPublishLoadingPart] = useState(false);
  const [publishSuccessPart, setPublishSuccessPart] = useState(false);

  // Inbox mock state (notifications). Each item has id, title, excerpt, time, to, type
  const [inboxItems, setInboxItems] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  const deleteInboxItem = (id) => {
    setInboxItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Eliminar también de localStorage (fallback) si existe
  const removeFromLocalStorage = (id) => {
    try {
      const key = 'localInbox';
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const arr = JSON.parse(raw);
      const filtered = arr.filter(i => String(i.id) !== String(id));
      localStorage.setItem(key, JSON.stringify(filtered.slice(0, 200)));
    } catch (e) { console.warn('removeFromLocalStorage error', e); }
  };

  // Handler con confirmación usando SweetAlert2
  const handleDeleteClick = async (e, item) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      const result = await Swal.fire({
        title: 'Eliminar notificación',
        text: '¿Seguro que quieres eliminar esta notificación?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
      if (result && result.isConfirmed) {
        // Intentar eliminar en backend si el id parece provenir del servidor
        try {
          if (item && item.id && String(item.id).startsWith && !String(item.id).startsWith('b-')) {
            await marcarEliminada(item.id);
          }
        } catch (err) {
          // Si falla, continuamos con el borrado local como fallback
          console.warn('No se pudo eliminar notificación en servidor, se elimina localmente', err && err.message ? err.message : err);
        }
        // quitar del estado
        deleteInboxItem(item.id);
        // quitar del localstorage si aplica
        removeFromLocalStorage(item.id);
      }
    } catch (err) {
      console.warn('Error en confirmación de borrado', err);
    }
  };

  // Función reutilizable para cargar notificaciones (llamada desde useEffect y desde el botón "Refrescar")
  const fetchNotificationsFn = async () => {
    try {
      setLoadingInbox(true);
      // Si hay usuario en sessionStorage intentar obtener su id
      let clienteId = null;
      try { const cur = JSON.parse(sessionStorage.getItem('currentUser') || 'null'); if (cur && cur.id) clienteId = cur.id; } catch (e) {}
      let backendList = [];
      if (clienteId) {
        try {
          backendList = await listarNotificaciones({ clienteId, limit: 50 });
        } catch (err) {
          console.warn('No se pudieron cargar notificaciones desde backend:', err && err.message ? err.message : err);
        }
      }

      if (backendList && backendList.length) {
        // Normalizar estructura que venga del backend para garantizar campos conocidos
        console.debug('Backend notifications raw:', backendList);
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
        console.debug('Backend notifications normalized:', normalized);
        setInboxItems(normalized);
        setLoadingInbox(false);
        return;
      }

      // Si el backend no devolvió notificaciones, intentar cargar local pero NO sembrar ejemplos por defecto
      const local = loadLocalNotifications();
      if (local && local.length) {
        setInboxItems(local);
      } else {
        // Lista vacía: mostrar mensaje informativo en la UI
        setInboxItems([]);
      }
    } catch (e) {
      console.warn('Error cargando notificaciones (backend/local):', e);
      setInboxItems([]);
    } finally {
      setLoadingInbox(false);
    }
  };

  useEffect(() => {
    fetchNotificationsFn();

    return () => {
      if (motoPreview) URL.revokeObjectURL(motoPreview);
      if (partPreview) URL.revokeObjectURL(partPreview);
    };
  }, [motoPreview, partPreview]);

  // Escuchar actualizaciones desde header u otras partes de la app
  useEffect(() => {
    const onInboxUpdated = (e) => {
      try {
        const data = (e && e.detail) ? e.detail : null;
        if (Array.isArray(data)) setInboxItems(data);
      } catch (err) { /* ignore */ }
    };
    window.addEventListener('inboxUpdated', onInboxUpdated);
    return () => window.removeEventListener('inboxUpdated', onInboxUpdated);
  }, []);

  // Mantener sincronizado en sessionStorage y notificar a Header en la misma pestaña
  useEffect(() => {
    try {
      sessionStorage.setItem('inboxItems', JSON.stringify(inboxItems || []));
    } catch (e) {
      // ignore
    }
    try {
      window.dispatchEvent(new CustomEvent('inboxUpdated', { detail: inboxItems || [] }));
    } catch (e) {}
  }, [inboxItems]);

  const handleMotoChange = (e) => {
    const { name, value } = e.target;
    setMotoForm((s) => ({ ...s, [name]: value }));
  };

  const handlePartChange = (e) => {
    const { name, value } = e.target;
    setPartForm((s) => ({ ...s, [name]: value }));
  };

  // Use FileReader like other pages so we store data-URLs (consistent preview & serialization)
  const handleMotoImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return setMotoPreview(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      setMotoPreview(data);
      setMotoForm((s) => ({ ...s, img: data }));
    };
    reader.readAsDataURL(file);
  };

  const handlePartImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return setPartPreview(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      setPartPreview(data);
      setPartForm((s) => ({ ...s, img: data }));
    };
    reader.readAsDataURL(file);
  };

  const submitMoto = (e) => {
    e.preventDefault();
    const payload = new FormData();
    try {
      payload.append('title', motoForm.title || '');
      payload.append('model', motoForm.model || '');
      payload.append('revision', motoForm.revision || 'Al día');
      payload.append('condition', motoForm.condition || 'Excelente');
      payload.append('price', motoForm.price || '0');
      payload.append('location', motoForm.location || '');
      payload.append('stars', String(motoForm.stars || 0));
      payload.append('description', motoForm.description || '');
      payload.append('kilometraje', motoForm.kilometraje || '');
      payload.append('year', motoForm.year || '');
      payload.append('transmission', motoForm.transmission || 'manual');
      payload.append('contactPhone', motoForm.contactPhone || '');
      payload.append('tipo', 'moto');
      // clienteId si está disponible en sessionStorage
      try {
        const cur = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
        if (cur && cur.id) payload.append('clienteId', String(cur.id));
      } catch (err) {}
      // Añadir estrellas/valoración (usamos `motoForm.stars` arriba; no reescribir aquí)

      // convertir dataURL a Blob si existe
      if (motoForm.img && String(motoForm.img).startsWith('data:')) {
        const dataURLtoBlob = (dataurl) => {
          const arr = dataurl.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new Blob([u8arr], { type: mime });
        };
        try {
          const blob = dataURLtoBlob(motoForm.img);
          payload.append('image', blob, 'photo.jpg');
        } catch (e) {
          // no bloquear si falla la conversión
        }
      }

      setPublishLoadingMoto(true);
      crearPublicacion(payload)
        .then((res) => {
          setPublishLoadingMoto(false);
          setPublishSuccessMoto(true);
          try {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Anuncio publicado',
              text: 'Tu moto se publicó correctamente.',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
          } catch (e) {}
          setTimeout(() => setPublishSuccessMoto(false), 1800);
          setShowMotoForm(false);
          setMotoForm({ title: '', model: '', revision: 'Al día', condition: 'Excelente', price: '', location: '', stars: 5, img: '', description: '', contactPhone: '', kilometraje: '', year: '', transmission: 'manual' });
          setMotoPreview(null);
          // redirigir al listado para que recargue publicaciones
          navigate('/motos');
        })
        .catch((err) => {
          setPublishLoadingMoto(false);
          const msg = (err && err.response && err.response.data && err.response.data.message) || 'Error al crear publicación';
          try { Swal.fire({ icon: 'error', title: 'No se pudo publicar', text: msg }); } catch (e) { alert(msg); }
        });
    } catch (err) {
      console.error('Error preparando publicación', err);
    }
  };

  const submitPart = (e) => {
    e.preventDefault();
    const payload = new FormData();
    try {
      payload.append('title', partForm.title || '');
      payload.append('category', partForm.category || '');
      payload.append('condition', partForm.condition || 'Nuevo');
      payload.append('price', partForm.price || '0');
      payload.append('location', partForm.location || '');
      payload.append('description', partForm.description || '');
      payload.append('contactPhone', partForm.contactPhone || '');
      payload.append('tipo', 'repuesto');
      // Añadir estrellas/valoración del repuesto
      try { payload.append('stars', String(partForm.stars || 0)); payload.append('estrellas', String(partForm.stars || 0)); } catch (e) {}
      try {
        const cur = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
        if (cur && cur.id) payload.append('clienteId', String(cur.id));
      } catch (err) {}

      if (partForm.img && String(partForm.img).startsWith('data:')) {
        const dataURLtoBlob = (dataurl) => {
          const arr = dataurl.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new Blob([u8arr], { type: mime });
        };
        try {
          const blob = dataURLtoBlob(partForm.img);
          payload.append('image', blob, 'photo.jpg');
        } catch (e) {}
      }

      setPublishLoadingPart(true);
      crearRepuesto(payload)
        .then((res) => {
          setPublishLoadingPart(false);
          setPublishSuccessPart(true);
          try {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Repuesto publicado',
              text: 'Tu repuesto se publicó correctamente.',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
          } catch (e) {}
          setTimeout(() => setPublishSuccessPart(false), 1800);
          setShowPartForm(false);
          setPartForm({ title: '', category: '', condition: 'Nuevo', price: '', location: '', img: '', description: '', contactPhone: '', stars: 5 });
          setPartPreview(null);
          navigate('/repuestos');
        })
        .catch((err) => {
          setPublishLoadingPart(false);
          const msg = (err && err.response && err.response.data && err.response.data.message) || 'Error al crear repuesto';
          try { Swal.fire({ icon: 'error', title: 'No se pudo publicar', text: msg }); } catch (e) { alert(msg); }
        });
    } catch (err) {
      console.error('Error preparando repuesto', err);
    }
  };

  return (
    <div className="vender-page">
      <main className="vender-main">
        {/* Mover el hero dentro del contenedor principal para que su ancho coincida con motos */}
  <section className="sell-hero" aria-label="Actividades de compra">
          <div className="sell-hero-inner">
            <div className="sell-hero-text">
              <h1>Actividades de compra</h1>
              <p>Aquí puedes consultar tus mensajes de compra, ver la actividad relacionada y publicar tus ventas cuando quieras.</p>
            </div>

            <div className="sell-hero-cta">
              <button type="button" className="hero-sell-btn" onClick={() => navigate('/publicaciones')}>Mis publicaciones</button>
            </div>
          </div>
        </section>
        <div className="section-header">
          <h2><FaTag className="section-icon" /> Tus actividades</h2>
        </div>

        <div className="cards-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div className="activity-card" role="button" onClick={() => setShowMotoForm(true)} style={{ padding: 18, borderRadius: 12, background: 'var(--card-bg, #fff)', boxShadow: '0 8px 26px rgba(2,6,23,0.06)', cursor: 'pointer' }}>
            <h3><FaMotorcycle /> Vender Motos</h3>
            <p>Publica tu motocicleta con fotos, precio y descripción. Haz click para abrir el formulario.</p>
          </div>

          <div className="activity-card" role="button" onClick={() => setShowPartForm(true)} style={{ padding: 18, borderRadius: 12, background: 'var(--card-bg, #fff)', boxShadow: '0 8px 26px rgba(2,6,23,0.06)', cursor: 'pointer' }}>
            <h3><FaTools /> Vender Repuestos</h3>
            <p>Publica repuestos y accesorios: cascos, llantas, escape, etc. Haz click para abrir el formulario.</p>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          {/* Redesigned inbox tray: list of clickable notifications that navigate to /comunidad or /chat */}
          <div className="inbox-card large" role="region" aria-label="Mis bandejas de entrada">
            <div className="inbox-header">
              <h3><FaEnvelope /> Mis bandejas de entrada</h3>
              {Array.isArray(inboxItems) && inboxItems.length > 0 && (
                <div className="inbox-badge">{inboxItems.length} nuevo{inboxItems.length === 1 ? '' : 's'}</div>
              )}
            </div>

            <p className="inbox-sub">Mensajes, notificaciones y respuestas a tus publicaciones</p>

            {loadingInbox ? (
              <div className="inbox-loading">Cargando notificaciones…</div>
            ) : inboxItems && inboxItems.length === 0 ? (
              <div className="inbox-empty" style={{ padding: 18 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Actualmente no tienes notificaciones recibidas</p>
                <p className="muted" style={{ marginTop: 6 }}>Mensajes, notificaciones y respuestas a tus publicaciones aparecerán aquí.</p>
                <div style={{ marginTop: 12 }}>
                  <button className="btn" onClick={() => fetchNotificationsFn()} aria-label="Refrescar bandeja">
                    <FaSyncAlt className="btn-icon" aria-hidden="true" />
                    Refrescar
                  </button>
                  <button className="btn btn-link" style={{ marginLeft: 12 }} onClick={() => navigate('/chat')}>Ver mensajes →</button>
                </div>
              </div>
            ) : (
              <>
              <ul className="inbox-list">
              {inboxItems.map((item) => {
                // Determinar nombre del remitente si existe en la notificación
                const sender = item.senderName || item.fromName || item.userName || (item.user && item.user.name) || item.nombre || item.usuario || (item.cliente && (item.cliente.nombre || (item.cliente.firstName && `${item.cliente.firstName} ${item.cliente.lastName}`))) || item.author || null;
                let title = item.title || '';
                const excerpt = item.excerpt || '';

                // Construir título según tipo: comentarios vs mensajes/chat/mail
                if (sender) {
                  if (item.type === 'comment' || item.type === 'respuesta') {
                    title = `${sender} te respondió`;
                  } else if (item.type === 'chat' || item.type === 'mail') {
                    title = `Nuevo mensaje de ${sender}`;
                  } else if (!title) {
                    title = `${sender}`;
                  }
                } else {
                  // Si no hay sender y no hay title, poner un fallback genérico
                  if (!title) {
                    if (item.type === 'chat' || item.type === 'mail') title = 'Nuevo mensaje';
                    else if (item.type === 'comment' || item.type === 'respuesta') title = 'Te respondieron';
                    else title = 'Notificación';
                  }
                }

                // Determinar destino: nunca navegar directamente a `/hilos/...`.
                // Por defecto `chat` va a `/chat`, todo lo demás a `/comunidad`.
                let target = (item.type === 'chat' ? '/chat' : '/comunidad');
                // Si el backend ha puesto `item.to` explícito y no apunta a /hilos, respetarlo
                if (item.to && !String(item.to).includes('/hilos')) {
                  target = item.to;
                }

                // Si `item.to` (o link/raw.link) apunta a `/hilos/<id>` preferimos construir
                // un hash hacia `/comunidad#hilo-<id>` para mantener la navegación dentro
                // de la página comunidad (esto cubre casos donde el backend marcó `to`
                // con /hilos pero el tipo no es 'comment').
                const extractIdsFrom = (s) => {
                  if (!s) return { hilo: null, resp: null };
                  try {
                    const str = String(s);
                    const mh = str.match(/\/hilos\/(\d+)/);
                    const mr = str.match(/respuestas\/(\d+)/);
                    return { hilo: mh && mh[1] ? mh[1] : null, resp: mr && mr[1] ? mr[1] : null };
                  } catch (e) {
                    return { hilo: null, resp: null };
                  }
                };
                const raw = item._raw || {};
                const candidates = [item.to, item.link, raw.link, raw.to, raw.href];
                for (let c of candidates) {
                  if (!c) continue;
                  const ids = extractIdsFrom(c);
                  if (ids && ids.hilo) {
                    target = `/comunidad#hilo-${ids.hilo}` + (ids.resp ? `-resp-${ids.resp}` : '');
                    break;
                  }
                }

                // Para notificaciones de comentario intentamos construir un hash dentro de /comunidad
                if (item.type === 'comment' || item.type === 'respuesta') {
                  const raw = item._raw || {};
                  const extractHiloFrom = (src) => {
                    if (!src) return null;
                    if (src.hiloId) return src.hiloId;
                    if (src.hilo) return src.hilo;
                    if (src.link) {
                      const m = String(src.link).match(/\/hilos\/(\d+)/);
                      if (m) return m[1];
                    }
                    return null;
                  };
                  const hiloId = extractHiloFrom(item) || extractHiloFrom(raw) || (item.link && (String(item.link).match(/\/hilos\/(\d+)/) || [])[1]) || null;
                  const respId = item.responseId || item.respuestaId || raw.respuestaId || raw.responseId || (item.link && (String(item.link).match(/respuestas\/(\d+)/) || [])[1]) || null;
                  if (hiloId) {
                    target = `/comunidad#hilo-${hiloId}` + (respId ? `-resp-${respId}` : '');
                  } else {
                    target = '/comunidad';
                  }
                }

                return (
                  <li key={item.id} className={`inbox-item ${item.muted ? 'muted' : ''}`} role="button" onClick={() => {
                    // Si es una notificación de chat o apunta a /chats/:id, navegar únicamente a /chat
                    // (no abrir conversación concreta ni pasar estado).
                    try {
                      const raw = item._raw || {};
                      const possible = [item.to, item.link, raw.link, raw.to];
                      const pointsToChat = possible.some(p => !!(p && String(p).match(/\/chats\/(\d+)/)));
                      if ((item && item.type === 'chat') || pointsToChat || (String(target || '').includes('/chats/'))) {
                        navigate('/chat');
                        return;
                      }
                    } catch (e) { /* ignore navigation error */ }

                    // Navegación de notificaciones: respetar `target` calculado.
                    try { console.debug('[Inbox] navigate target:', target, 'item:', item); } catch (e) {}
                    if (target === '/comunidad' && (item.title || item.excerpt)) {
                      const snippet = (item.title || item.excerpt).toString().slice(0, 120);
                      try { console.debug('[Inbox] navigate to /comunidad with scrollQuery:', snippet); } catch (e) {}
                      navigate(target, { state: { scrollQuery: snippet } });
                    } else {
                      navigate(target);
                    }
                  }}>
                    <div className="inbox-token">
                      {item.type === 'comment' ? <FaRegCommentDots /> : item.type === 'chat' ? <FaCommentAlt /> : item.type === 'mail' ? <FaEnvelope /> : <FaBell />}
                    </div>

                    <div className="inbox-content">
                      <div className="inbox-title">{title}</div>
                      <div className="inbox-excerpt">{excerpt}</div>
                    </div>

                    <div className="inbox-right">
                      <div className="inbox-meta">{item.time}</div>
                      <button className="inbox-delete" aria-label="Eliminar notificación" onClick={(e) => { handleDeleteClick(e, item); }}>
                        <FaTrash />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="inbox-footer"><button className="btn btn-link" onClick={() => navigate('/chat')}>Ver todos los mensajes →</button></div>
            </>
            )}
          </div>
        </div>
      </main>

      {/* Moto publish modal (full form like in Motos) */}
      {showMotoForm && (
        <div className="sell-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowMotoForm(false)}>
          <div className="sell-modal" role="document" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Cerrar" onClick={() => setShowMotoForm(false)}>×</button>
            <form className={`sell-form`} onSubmit={submitMoto}>
              <div className="sell-form-grid">
                <div className="sell-form-main">
                  <label>
                    Título
                    <input name="title" value={motoForm.title} onChange={handleMotoChange} placeholder="Ej: Yamaha MT-09 2022" required />
                  </label>

                  <label>
                    Modelo
                    <input name="model" value={motoForm.model} onChange={handleMotoChange} placeholder="Ej: MT-09" />
                  </label>

                  <label>
                    Revisión vehicular
                    <select name="revision" value={motoForm.revision} onChange={handleMotoChange}>
                      <option>Al día</option>
                      <option>Atrasado</option>
                    </select>
                  </label>

                  <label>
                    Estado
                    <select name="condition" value={motoForm.condition} onChange={handleMotoChange}>
                      <option>Excelente</option>
                      <option>Muy bueno</option>
                      <option>Bueno</option>
                      <option>Regular</option>
                    </select>
                  </label>

                  <label>
                    Precio
                    <input name="price" value={motoForm.price} onChange={handleMotoChange} placeholder="Ej: 9500" required />
                  </label>

                  <label>
                    Ubicación
                    <input name="location" value={motoForm.location} onChange={handleMotoChange} placeholder="Ciudad" />
                  </label>

                  <label>
                    Valora tu motocicleta
                    <select name="stars" value={motoForm.stars} onChange={handleMotoChange}>
                      <option value={5}>5 - Excelente</option>
                      <option value={4}>4 - Muy bueno</option>
                      <option value={3}>3 - Bueno</option>
                      <option value={2}>2 - Regular</option>
                      <option value={1}>1 - Malo</option>
                    </select>
                  </label>

                  <label className="full">
                    Descripción
                    <textarea name="description" value={motoForm.description} onChange={handleMotoChange} placeholder="Describe el estado, accesorios, y cualquier detalle relevante" rows={4} />
                  </label>

                  <label>
                    Imagen
                    <input type="file" accept="image/*" onChange={handleMotoImage} />
                  </label>

                  <label>
                    Kilometraje
                    <input name="kilometraje" value={motoForm.kilometraje} onChange={handleMotoChange} placeholder="Ej: 12000 km" />
                  </label>

                  <label>
                    Año
                    <input name="year" value={motoForm.year} onChange={handleMotoChange} placeholder="Ej: 2019" />
                  </label>

                  <label>
                    Transmisión
                    <select name="transmission" value={motoForm.transmission} onChange={handleMotoChange}>
                      <option value="manual">Manual</option>
                      <option value="automatic">Automática</option>
                    </select>
                  </label>

                  <label>
                    Teléfono de contacto
                    <input name="contactPhone" type="tel" value={motoForm.contactPhone} onChange={handleMotoChange} placeholder="0987654321" required />
                  </label>

                  <div className="sell-form-actions">
                    <button type="submit" className={`btn btn-primary ${publishLoadingMoto ? 'loading' : ''}`} disabled={publishLoadingMoto}>
                      {publishLoadingMoto ? 'Publicando...' : 'Publicar moto'}
                    </button>
                    <button type="button" className="btn" onClick={() => setShowMotoForm(false)} disabled={publishLoadingMoto}>Cancelar</button>
                  </div>
                  {publishSuccessMoto && <div className="sell-form-success">Anuncio publicado correctamente.</div>}
                </div>

                <aside className="sell-form-preview">
                  <div className="preview-card">
                    <div className="preview-image">
                      <img src={motoForm.img || 'https://loremflickr.com/640/420/motorcycle'} alt={motoForm.title || 'Vista previa'} />
                      <div className="preview-price">${motoForm.price || '0'}</div>
                    </div>
                    <div className="preview-body">
                      <h4>{motoForm.title || 'Título de la moto'}</h4>
                      <div className="preview-meta">{motoForm.model ? <span className="chip">{motoForm.model}</span> : null} <span className="muted">{motoForm.location}</span></div>
                      <p className="preview-desc">{motoForm.description ? motoForm.description.slice(0, 140) + (motoForm.description.length > 140 ? '…' : '') : 'Aquí verás una vista previa de tu anuncio antes de publicar.'}</p>
                      <div className="preview-meta small">{motoForm.year ? <span>{motoForm.year}</span> : null} {motoForm.kilometraje ? <span>• {motoForm.kilometraje}</span> : null} {motoForm.transmission ? <span>• {motoForm.transmission === 'manual' ? 'Manual' : 'Automática'}</span> : null}</div>
                      <div className="preview-contact">Teléfono: {motoForm.contactPhone || '—'}</div>
                    </div>
                  </div>
                </aside>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Part publish modal */}
      {showPartForm && (
        <div className="sell-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowPartForm(false)}>
          <div className="sell-modal" role="document" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Cerrar" onClick={() => setShowPartForm(false)}><FaTimes /></button>
            <form className="sell-form" onSubmit={submitPart}>
              <div className="sell-form-grid">
                <div className="sell-form-main">
                  <label>
                    Título
                    <input name="title" value={partForm.title} onChange={handlePartChange} placeholder="Ej: Casco Integral AGV" required />
                  </label>

                  <label>
                    Categoría
                    <select name="category" value={partForm.category} onChange={handlePartChange}>
                      <option value="">Seleccionar</option>
                      <option value="Cascos">Cascos</option>
                      <option value="Llantas">Llantas</option>
                      <option value="Transmisión">Transmisión</option>
                      <option value="Ropa">Ropa</option>
                      <option value="Escape">Escape</option>
                      <option value="Accesorios">Accesorios</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </label>

                  <label>
                    Condición
                    <select name="condition" value={partForm.condition} onChange={handlePartChange}>
                      <option>Nuevo</option>
                      <option>Usado - Bueno</option>
                      <option>Usado - Regular</option>
                    </select>
                  </label>

                  <label>
                    Valora este repuesto
                    <select name="stars" value={partForm.stars} onChange={handlePartChange}>
                      <option value={5}>5 - Excelente</option>
                      <option value={4}>4 - Muy bueno</option>
                      <option value={3}>3 - Bueno</option>
                      <option value={2}>2 - Regular</option>
                      <option value={1}>1 - Malo</option>
                    </select>
                  </label>

                  <label>
                    Precio
                    <input name="price" value={partForm.price} onChange={handlePartChange} placeholder="Ej: 120" required />
                  </label>

                  <label>
                    Ubicación
                    <input name="location" value={partForm.location} onChange={handlePartChange} placeholder="Ciudad" />
                  </label>

                  <label className="full">
                    Descripción
                    <textarea name="description" value={partForm.description} onChange={handlePartChange} rows={4} placeholder="Detalles del repuesto" />
                  </label>

                  <label>
                    Imagen
                    <input type="file" accept="image/*" name="image" onChange={handlePartImage} />
                  </label>

                  <label>
                    Teléfono de contacto
                    <input name="contactPhone" value={partForm.contactPhone} onChange={handlePartChange} placeholder="0987654321" required />
                  </label>

                  <div className="sell-form-actions">
                    <button type="submit" className={`btn btn-primary ${publishLoadingPart ? 'loading' : ''}`} disabled={publishLoadingPart}>{publishLoadingPart ? 'Publicando...' : 'Publicar repuesto'}</button>
                    <button type="button" className="btn" onClick={() => setShowPartForm(false)} disabled={publishLoadingPart}>Cancelar</button>
                  </div>
                  {publishSuccessPart && <div className="sell-form-success">Repuesto publicado correctamente.</div>}
                </div>
                <aside className="sell-form-preview">
                  <div className="preview-card">
                    <div className="preview-image">
                      <img src={partForm.img || 'https://loremflickr.com/640/420/motorcycle'} alt={partForm.title || 'Vista previa'} />
                      <div className="preview-price">${partForm.price || '0'}</div>
                    </div>
                    <div className="preview-body">
                      <h4>{partForm.title || 'Título del repuesto'}</h4>
                      <div className="preview-meta">
                        {partForm.category ? <span className="chip">{partForm.category}</span> : <span className="chip">—</span>}
                        <span className="muted">{partForm.location}</span>
                        <span className="stars">{partForm.stars || 0} <FaStar className="star-icon" /></span>
                      </div>
                      <p className="preview-desc">{partForm.description ? partForm.description.slice(0, 140) : 'Aquí verás una vista previa antes de publicar.'}</p>
                      <div className="preview-contact">Teléfono: {partForm.contactPhone || '—'}</div>
                    </div>
                  </div>
                </aside>
              </div>
            </form>
          </div>
        </div>
      )}

  {/* Messages are now handled via the /chat page */}

    </div>
  );
}
