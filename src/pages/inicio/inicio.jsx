import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaStar, 
  FaMapMarkerAlt, 
  FaTag, 
  FaUserCircle, 
  FaRegCommentAlt,
  FaArrowRight, // Icono para "Ver todas"
  FaReply,     // Icono para "Responder"
  FaMotorcycle,
  FaTools,
  FaFire
} from 'react-icons/fa';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';
import '../../assets/scss/inicio.scss';
import MotosModal from '../motos/motos_modal.jsx';
import RepuestosModal from '../repuestos/repuestos_modal.jsx';
import api from '../../api/axios';
import { listarPublicaciones } from '../../services/motos';
import { listarRepuestos } from '../../services/repuestos';
import { listarHilos, crearRespuesta } from '../../services/comunidad';
import chatService from '../../services/chat';
import Swal from 'sweetalert2';

const Inicio = () => {
  const navigate = useNavigate();
  const [selectedMoto, setSelectedMoto] = useState(null);
  const [showMotoModal, setShowMotoModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [showPartModal, setShowPartModal] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ message: '' });
  const [contactSent, setContactSent] = useState(false);

  

  // estados donde cargaremos los 5 más recientes desde la API
  const [recentMotos, setRecentMotos] = useState([]);
  const [featuredParts, setFeaturedParts] = useState([]);
  const [loadingInicio, setLoadingInicio] = useState(false);
  const [inicioError, setInicioError] = useState(null);

  // formatea precio (quita .00 cuando corresponde)
  const formatPrice = (val) => {
    if (val === null || val === undefined || String(val).trim() === '') return '—';
    const raw = String(val).replace(/[^0-9.-]+/g, '');
    const n = Number(raw);
    if (Number.isNaN(n)) return String(val);
    let s = String(n);
    if (s.indexOf('.') >= 0) s = s.replace(/\.?0+$/, '');
    return s;
  };

  const initialForum = [
    { id: 1, topic: '¿Vale la pena la nueva Himalayan 450?', lastReplyBy: 'Carlos', time: 'hace 5m', responses: [
      { id: 101, user: 'EnduroPro', text: '¡Excelente recomendación! Añadiría la Honda CRF250F también, es muy dócil para aprender.' }
    ] },
    { id: 2, topic: 'Mejor aceite para una moto 2T', lastReplyBy: 'Ana', time: 'hace 22m', responses: [
      { id: 201, user: 'AventureroMX', text: '¡No olvides revisar los rodamientos de rueda y dirección! Un fallo ahí te puede arruinar el viaje.' }
    ] },
    { id: 3, topic: 'Consejos para primer viaje largo', lastReplyBy: 'David', time: 'hace 1h', responses: [] },
  ];

  const [forumPosts, setForumPosts] = useState(initialForum);
  const [openReplyFor, setOpenReplyFor] = useState(null); // id of post with reply form open

  const [trending, setTrending] = useState([]);

  // Usuario actual (para detectar si es el propietario de la publicación)
  const currentRawUI = typeof window !== 'undefined' ? sessionStorage.getItem('currentUser') : null;
  const currentUser = currentRawUI ? JSON.parse(currentRawUI) : null;

  // Comprueba si el item pertenece al usuario actual comparando varios posibles campos de owner
  const isOwnerOf = (item) => {
    if (!item || !currentUser) return false;
    const detalle = item.detalle || {};
    const possibleOwnerIds = [
      detalle.usuarioId, detalle.usuario_id, detalle.clienteId, detalle.cliente_id,
      item.usuarioId, item.usuario_id, item.clienteId, item.cliente_id, item.ownerId, item.userId, item.user_id
    ];
    return possibleOwnerIds.some(id => id !== undefined && id !== null && String(id) === String(currentUser.id));
  };

  // Helper: intenta convertir un campo de fecha/ts en número ms
  const getTimestamp = (v) => {
    if (!v) return 0;
    // If it's already a number, decide whether it's seconds or milliseconds
    if (typeof v === 'number') {
      if (v > 1e12) return v; // already ms
      if (v > 1e9) return v * 1000; // seconds -> ms
      return 0; // too small, probably an id
    }
    // If it's a string, try parse as ISO date first
    const asDate = Date.parse(String(v));
    if (!Number.isNaN(asDate)) return asDate;
    // If it's numeric string, treat similarly to number
    const asNum = Number(String(v).trim());
    if (Number.isFinite(asNum)) {
      if (asNum > 1e12) return asNum;
      if (asNum > 1e9) return asNum * 1000;
    }
    return 0;
  };

  // Helper: tiempo relativo simplificado (hace 5m, hace 1h, hace 2d)
  const toRelative = (dateLike) => {
    try {
      const t = getTimestamp(dateLike);
      if (!t) return '';
      const diff = Date.now() - t;
      const sec = Math.floor(diff / 1000);
      if (sec < 60) return `hace ${sec}s`;
      const min = Math.floor(sec / 60);
      if (min < 60) return `hace ${min}m`;
      const hrs = Math.floor(min / 60);
      if (hrs < 24) return `hace ${hrs}h`;
      const days = Math.floor(hrs / 24);
      return `hace ${days}d`;
    } catch (e) { return ''; }
  };

  // Refs para controlar el scroll de los carruseles
  const motosRef = useRef(null);
  const partsRef = useRef(null);

  const getRemovedIds = () => {
    try {
      const curRaw = typeof window !== 'undefined' ? sessionStorage.getItem('currentUser') : null;
      const cur = curRaw ? JSON.parse(curRaw) : null;
      const key = cur && cur.id ? `removedPublicaciones_user_${cur.id}` : 'removedPublicaciones';
      const raw = localStorage.getItem(key) || '[]';
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.map((v) => (typeof v === 'string' && !isNaN(Number(v)) ? Number(v) : v)) : [];
    } catch (e) { return []; }
  };
  const isSoldItem = (item) => {
    if (!item) return false;
    if (item.status === 'Vendido' || item.status === 'vendido') return true;
    if (item.vendido) return true;
    if (item.detalle && (item.detalle.vendido || item.detalle.estado === 'Vendido' || item.detalle.estado === 'vendido')) return true;
    return false;
  };

  // Cargar 5 motos y 5 repuestos más recientes al montar Inicio
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingInicio(true);
      setInicioError(null);
      try {
        const [motosData, repuestosData, hilosData] = await Promise.all([
          listarPublicaciones({ tipo: 'moto', includeDetails: 'true', limit: 5 }),
          listarRepuestos({ includeDetails: 'true', limit: 5 }),
          listarHilos({ limit: 50 })
        ]);

        if (cancelled) return;

        const mapPub = (p) => {
          const detalle = p.detalle || {};
          let imgCandidate = null;
          if (p.imagenes && p.imagenes.length > 0 && p.imagenes[0].url) imgCandidate = p.imagenes[0].url;
          else if (detalle.imagenes && detalle.imagenes[0]) imgCandidate = detalle.imagenes[0];
          else imgCandidate = 'https://loremflickr.com/640/420/motorcycle';

          let finalImg = imgCandidate;
          try {
            const s = String(imgCandidate || '');
            if (s.startsWith('/uploads')) finalImg = `${api.defaults.baseURL}${s}`;
          } catch (e) {
            finalImg = imgCandidate;
          }

          return {
            id: p.id,
            title: p.titulo || p.title || '',
            price: formatPrice(p.precio || p.price || ''),
            location: detalle.ubicacion || p.ubicacion || p.location || '—',
            stars: detalle.estrellas || p.estrellas || 0,
            img: finalImg,
            description: p.descripcion || p.description || '',
            detalle,
            // propietario/autor de la publicación (si viene desde el backend)
            ownerId: p.clienteId || detalle.clienteId || p.usuarioId || null
          };
        };

        const motosMapped = Array.isArray(motosData) ? motosData.map(mapPub) : [];
        const partsMapped = Array.isArray(repuestosData) ? repuestosData.map((p) => {
          const base = mapPub(p);
          const detalle = p.detalle || {};
          return {
            ...base,
            category: detalle.categoria_repuesto || detalle.categoria || p.categoria || p.category || '',
            condition: detalle.condicion || p.condicion || p.condition || '',
            contact: { phone: detalle.telefono_contacto || detalle.phone || null },
            description: p.descripcion || p.description || ''
          };
        }) : [];

        // Procesar hilos: 3 más recientes y 3 trending por número de respuestas
        try {
          const threads = Array.isArray(hilosData) ? hilosData : [];
          const recentThreads = threads.slice().sort((a, b) => getTimestamp(b.updatedAt || b.createdAt || b.fecha || b.created_at) - getTimestamp(a.updatedAt || a.createdAt || a.fecha || a.created_at)).slice(0, 3).map((p) => {
            // Preferir respuestas que vengan en `p.responses`.
            // Si no hay `responses` pero el backend devuelve `ultimaRespuesta` (o `ultima_respuesta`), usarla.
            const rawResponses = Array.isArray(p.responses) && p.responses.length ? p.responses : (p.ultimaRespuesta ? [p.ultimaRespuesta] : (p.ultima_respuesta ? [p.ultima_respuesta] : []));
            // resolver nombre del autor de la pregunta desde varios posibles lugares
            const author = p.autor_nombre || p.user || p.autor || (p.cliente && (p.cliente.nombre || p.cliente.nombre_completo || p.cliente.nombreCompleto)) || (p.usuario && (p.usuario.nombre || p.usuario.nombre_completo)) || p.clienteNombre || p.nombre || p.autorNombre || 'Usuario';
            // tomar la última respuesta conocida (bien sea del array o de campo resumen del hilo)
            const lastResp = rawResponses.length ? rawResponses[rawResponses.length - 1] : null;
            // resolver nombre del autor de la última respuesta (si existe) buscando objetos anidados también
            const lastBy = lastResp ? (lastResp.autor_nombre || lastResp.user || lastResp.autor || (lastResp.cliente && (lastResp.cliente.nombre || lastResp.cliente.nombre_completo)) || (lastResp.usuario && (lastResp.usuario.nombre || lastResp.usuario.nombre_completo)) || lastResp.nombre || lastResp.clienteNombre || author) : author;
            const lastTimeRaw = lastResp ? (lastResp.createdAt || lastResp.fecha || lastResp.created_at || lastResp.fecha_creacion || lastResp.fechaCreacion) : (p.updatedAt || p.createdAt || p.fecha || p.created_at || p.fecha_creacion);
            const lastTime = toRelative(lastTimeRaw) || 'hace un momento';
            return {
              id: p.id,
              topic: p.question || p.titulo || p.title || '',
              lastReplyBy: lastBy,
              time: lastTime,
              responses: rawResponses
            };
          });
          setForumPosts(recentThreads);

          const trendingThreads = threads.slice().sort((a, b) => (Array.isArray(b.responses) ? b.responses.length : (b.respuestasCount || 0)) - (Array.isArray(a.responses) ? a.responses.length : (a.respuestasCount || 0))).slice(0, 3).map(p => ({ id: p.id, title: p.question || p.titulo || p.title || '', count: (Array.isArray(p.responses) ? p.responses.length : (p.respuestasCount || 0)) }));
          if (trendingThreads.length) setTrending(trendingThreads);
        } catch (e) {
          console.warn('No se pudieron procesar hilos para inicio', e);
        }

        try {
          const removed = getRemovedIds();
          const filtered = motosMapped.filter(m => !removed.includes(Number(m.id)) && !isSoldItem(m));
          setRecentMotos(filtered.slice(0, 5));
        } catch (e) {
          setRecentMotos(motosMapped.slice(0, 5));
        }
        setFeaturedParts(partsMapped.slice(0, 5));
      } catch (err) {
        console.error('Error cargando inicio:', err);
        setInicioError((err && err.response && err.response.data && err.response.data.error) || err.message || 'Error al cargar datos');
      } finally {
        if (!cancelled) setLoadingInicio(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // escuchar eventos de publicaciones removidas para actualizar el carrusel en tiempo real
  useEffect(() => {
    const handler = (ev) => {
      try {
        const id = ev && ev.detail && ev.detail.id ? Number(ev.detail.id) : null;
        if (!id) return;
        setRecentMotos(prev => prev.filter(m => Number(m.id) !== Number(id)));
      } catch (e) { /* noop */ }
    };
    window.addEventListener('publicacion:removed', handler);
    return () => window.removeEventListener('publicacion:removed', handler);
  }, []);

  // --- Componentes locales para Respuestas (adaptado de comunidad.jsx) ---
  function Response({ response }) {
    return (
      <div className="response-item">
        <FaUserCircle className="icon" />
        <div>
          <span className="response-user">@{response.user}</span>
          <p className="response-text">{response.text}</p>
        </div>
      </div>
    );
  }

  function AddResponseForm({ postId, onAddResponse, onClose }) {
    const [responseText, setResponseText] = useState('');
    const handleSubmit = (e) => {
      e.preventDefault();
      if (responseText.trim() === '') return;

      (async () => {
        let payload = { cuerpo: responseText };
        try {
          const currentRaw = sessionStorage.getItem('currentUser');
          const current = currentRaw ? JSON.parse(currentRaw) : null;
          if (current && current.id) {
            payload.usuarioId = current.id;
            payload.clienteId = current.id;
            if (current.nombre || current.name) payload.autor_nombre = current.nombre || current.name;
          }

          console.debug('[AddResponseForm] Enviando crearRespuesta', { postId, payload });
          const json = await crearRespuesta(postId, payload);
          console.debug('[AddResponseForm] Respuesta crearRespuesta', json);

          if (json && json.respuesta) {
            const r = json.respuesta;
            const authorName = r.autor_nombre || (current && (current.nombre || current.name)) || 'Respondedor';
            onAddResponse(postId, { id: r.id, user: authorName, text: r.cuerpo, clienteId: r.clienteId || (current && current.id), createdAt: r.createdAt || r.created_at || Date.now() });
            try { Swal.fire({ icon: 'success', title: 'Respuesta enviada', toast: true, position: 'top-end', timer: 1200, showConfirmButton: false }); } catch (e) {}
          } else {
            const fallbackUser = (sessionStorage.getItem('currentUser') && (JSON.parse(sessionStorage.getItem('currentUser')).nombre || JSON.parse(sessionStorage.getItem('currentUser')).name)) || 'Respondedor';
            onAddResponse(postId, { id: Date.now(), user: fallbackUser, text: responseText, clienteId: (sessionStorage.getItem('currentUser') && JSON.parse(sessionStorage.getItem('currentUser')).id) || null, createdAt: Date.now() });
          }
        } catch (err) {
          console.warn('No se pudo enviar respuesta al servidor, fallback local:', err);
          try {
            const msg = (err && err.response && (err.response.data && (err.response.data.error || err.response.data.message))) || err.message || String(err);
            Swal.fire({ icon: 'error', title: 'Error al enviar respuesta', text: String(msg).slice(0, 300) });
          } catch (e) {}
          console.debug('[AddResponseForm] Ejecutando fallback local y onAddResponse');
          const fallbackUser = (sessionStorage.getItem('currentUser') && (JSON.parse(sessionStorage.getItem('currentUser')).nombre || JSON.parse(sessionStorage.getItem('currentUser')).name)) || 'Respondedor';
          const fallbackClienteId = (sessionStorage.getItem('currentUser') && JSON.parse(sessionStorage.getItem('currentUser')).id) || null;
          onAddResponse(postId, { id: Date.now(), user: fallbackUser, text: responseText, clienteId: fallbackClienteId, createdAt: Date.now() });
        }

        setResponseText('');
        if (onClose) onClose();
      })();
    };

    return (
      <form onSubmit={handleSubmit} className="add-response-form">
        <input
          type="text"
          className="input-response"
          placeholder="Tu respuesta..."
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
        />
        <button type="submit" className="btn small-send" title="Enviar respuesta" aria-label="Enviar respuesta">
          {/* reuse small paper plane icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-send" width="16" height="16"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </form>
    );
  }

  const scrollCarousel = (ref, dir = 1) => {
    if (!ref || !ref.current) return;
    const container = ref.current;
    const card = container.querySelector('.item-card');
    const style = window.getComputedStyle(container);
    const gap = parseInt(style.gap) || 24;
    const cardWidth = card ? card.clientWidth : 300;
    const scrollAmount = Math.round((cardWidth + gap) * 1.5);
    container.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
  };

  const openPartModal = (part) => {
    // reuse same contact form state/handlers
    setSelectedPart(part);
    setShowPartModal(true);
    setShowContactForm(false);
    setContactForm({ message: '' });
    setContactSent(false);
  };

  const closePartModal = () => {
    setShowPartModal(false);
    setSelectedPart(null);
    setShowContactForm(false);
    setContactForm({ message: '' });
    setContactSent(false);
  };

  const openMotoModal = (moto) => {
    setSelectedMoto(moto);
    setShowMotoModal(true);
    setShowContactForm(false);
    setContactForm({ message: '' });
    setContactSent(false);
  };

  const closeMotoModal = () => {
    setShowMotoModal(false);
    setSelectedMoto(null);
    setShowContactForm(false);
    setContactForm({ message: '' });
    setContactSent(false);
  };

  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Envío real: crear/recuperar chat y enviar mensaje (soporta moto o repuesto)
    if (!contactForm.message) return;
    (async () => {
      try {
        const currentRaw = sessionStorage.getItem('currentUser');
        const current = currentRaw ? JSON.parse(currentRaw) : null;
        if (!current || !current.id) {
          Swal.fire({ icon: 'warning', title: 'Inicia sesión', text: 'Debes iniciar sesión para contactar al vendedor.' });
          return;
        }

        // Soporta tanto motos como repuestos
        const item = selectedMoto || selectedPart || null;
        const ownerId = item && (item.ownerId || (item.detalle && item.detalle.clienteId) || item.clienteId || item.usuarioId) ? (item.ownerId || (item.detalle && item.detalle.clienteId) || item.clienteId || item.usuarioId) : null;
        if (!ownerId) {
          Swal.fire({ icon: 'error', title: 'No disponible', text: 'No se pudo determinar el vendedor de esta publicación.' });
          return;
        }

        if (current.id && ownerId && Number(current.id) === Number(ownerId)) {
          Swal.fire({ icon: 'info', title: 'Operación inválida', text: 'No puedes mensajear tu propia publicación.' });
          return;
        }

        const isPart = !!selectedPart;
        const tituloChat = isPart ? `publicacion-repuesto-${item.id}${current && current.id ? `-buyer-${current.id}` : ''}` : `publicacion-${item.id}${current && current.id ? `-buyer-${current.id}` : ''}`;
        const chatRes = await chatService.crearChat({ clienteId: ownerId, titulo: tituloChat, tipo: 'one2one' });
        const chatId = chatRes && chatRes.chat && chatRes.chat.id ? chatRes.chat.id : (chatRes && chatRes.chatId) || null;
        if (!chatId) throw new Error('No se pudo crear el chat');

        const msgBody = { remitente: current.nombre || current.name || current.email || `user-${current.id}`, cuerpo: contactForm.message, clienteId: current.id };
        await chatService.enviarMensaje(chatId, msgBody);

        setContactSent(true);
        setTimeout(() => {
          setContactSent(false);
          setShowContactForm(false);
          setContactForm({ message: '' });
        }, 3000);
        try { Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Mensaje enviado', showConfirmButton: false, timer: 3000 }); } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('chats:updated', { detail: { chatId } })); } catch (e) {}
      } catch (err) {
        console.error('Error enviando mensaje de contacto (Inicio)', err);
        const msg = (err && err.response && err.response.data && (err.response.data.message || err.response.data.error)) || err.message || 'Error al enviar mensaje';
        try { Swal.fire({ icon: 'error', title: 'No enviado', text: msg }); } catch (e) { alert(msg); }
      }
    })();
  };

  // Añadir respuesta a un post del bloque 'Actividad Reciente' en Inicio
  const addResponse = (postId, newResponse) => {
    setForumPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const responses = [...(p.responses || []), newResponse];
        const lastReplyBy = newResponse.user || newResponse.autor_nombre || p.lastReplyBy || 'Usuario';
        const when = newResponse.createdAt || newResponse.created_at || newResponse.fecha || Date.now();
        const time = toRelative(when) || 'hace un momento';
        return { ...p, responses, lastReplyBy, time };
      }
      return p;
    }));
  };

  return (
    <div className="inicio-page">
      <main className="inicio-main">
        {/* --- Sección Hero --- */}
        <section className="hero">
          <div className="hero-content">
            <h1>¡Bienvenido a la comunidad!</h1>
            <p className="hero-sub">Donde la aventura comienza — Conecta, Compra y Rodamos Juntos</p>
            <button className="cta-join" onClick={() => {}}>¡Únete a la tribu!</button>
          </div>
          <div className="hero-visual"><FaFire className="hero-fire" /></div>
        </section>

        {/* --- 1. Motos Recién Publicadas (Carrusel) --- */}
        <section className="featured-items">
          <div className="section-header">
            <h2><FaMotorcycle className="section-icon icon-moto" />Motos Recién Publicadas</h2>
            <NavLink to="/motos" className="view-all-link">
              Ver todas <FaArrowRight />
            </NavLink>
          </div>
          <div className="carousel-wrapper">
            <button
              className="carousel-button left"
              aria-label="Anterior"
              onClick={() => scrollCarousel(motosRef, -1)}
              title="Anterior"
            >
              <FaChevronLeft />
            </button>
            <div className="item-cards-carousel" ref={motosRef}> {/* CAMBIO: Ahora es carrusel */}
              {recentMotos.map((moto) => (
              <article key={moto.id} className="item-card" onClick={() => openMotoModal(moto)} style={{ cursor: 'pointer' }}>
                <div className="card-image">
                  {(() => {
                    const imgSrc = (moto.img && String(moto.img).startsWith('data:')) ? moto.img : `${moto.img}?${moto.id}`;
                    return <img src={imgSrc} alt={moto.title} />;
                  })()}
                  <span className="card-price"><FaTag /> ${moto.price}</span>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{moto.title}</h3>
                  <div className="card-meta">
                    <span><FaMapMarkerAlt /> {moto.location}</span>
                    <span>{moto.stars} <FaStar className="star-icon" /></span>
                  </div>
                </div>
              </article>
            ))}
            </div>
            <button
              className="carousel-button right"
              aria-label="Siguiente"
              onClick={() => scrollCarousel(motosRef, 1)}
              title="Siguiente"
            >
              <FaChevronRight />
            </button>
          </div>
        </section>
        
        {/* --- 2. Repuestos Destacados (Carrusel) --- */}
        <section className="featured-items">
          <div className="section-header">
            <h2><FaTools className="section-icon icon-tools" />Repuestos Recién Publicados</h2>
            <NavLink to="/repuestos" className="view-all-link">
              Ver todos <FaArrowRight />
            </NavLink>
          </div>
          <div className="carousel-wrapper">
            <button
              className="carousel-button left"
              aria-label="Anterior"
              onClick={() => scrollCarousel(partsRef, -1)}
              title="Anterior"
            >
              <FaChevronLeft />
            </button>
            <div className="item-cards-carousel" ref={partsRef}> {/* CAMBIO: Ahora es carrusel */}
              {featuredParts.map((part) => (
              <article key={part.id} className="item-card" onClick={() => openPartModal(part)} style={{ cursor: 'pointer' }}>
                <div className="card-image">
                  {(() => {
                    const imgSrc = (part.img && String(part.img).startsWith('data:')) ? part.img : `${part.img}?${part.id}`;
                    return <img src={imgSrc} alt={part.title} />;
                  })()}
                  <span className="card-price"><FaTag /> ${part.price}</span>
                </div>
                <div className="card-content">
                  <span className="card-category">{part.category}</span>
                  <h3 className="card-title">{part.title}</h3>
                  <div className="card-meta">
                    <span className="muted">{part.category}</span>
                    <span className="stars">{part.stars || 0} <FaStar className="star-icon" /></span>
                  </div>
                </div>
              </article>
            ))}
            </div>
            <button
              className="carousel-button right"
              aria-label="Siguiente"
              onClick={() => scrollCarousel(partsRef, 1)}
              title="Siguiente"
            >
              <FaChevronRight />
            </button>
          </div>
        </section>

        {/* --- Grid de Comunidad (Foros y Temas) --- */}
        <div className="community-grid">
          {/* --- 3. Actividad Reciente (con botón Responder) --- */}
          <section className="recent-posts">
            <div className="section-header">
              <h2><FaRegCommentAlt className="section-icon icon-forum" />Actividad Reciente</h2>
              <NavLink to="/comunidad" className="view-all-link">
                Ver foros <FaArrowRight />
              </NavLink>
            </div>
            <div className="post-list">
              {forumPosts.map((post) => (
                <React.Fragment key={post.id}>
                <div className="post-item">
                  <FaUserCircle className="post-avatar" />
                  <div className="post-content">
                    {/* Navegar a la página Comunidad y pasar el id del post en state para que Comunidad pueda hacer scroll al post */}
                    <NavLink to="/comunidad" state={{ postId: post.id }} className="post-topic">{post.topic}</NavLink>
                    <span className="post-meta">Último comentario por <strong>{post.lastReplyBy}</strong></span>
                    {/* Botón de Responder: abre formulario inline igual que en Comunidad */}
                    <button type="button" className="post-reply-link" onClick={() => setOpenReplyFor(openReplyFor === post.id ? null : post.id)}>
                      <FaReply /> Responder
                    </button>
                  </div>
                  <span className="post-time">{post.time}</span>
                </div>

                {/* Reply row: mostramos el input DEBAJO de la publicación cuando se pulsa Responder */}
                {openReplyFor === post.id && (
                  <div className="post-reply-row">
                    <AddResponseForm postId={post.id} onAddResponse={addResponse} onClose={() => setOpenReplyFor(null)} />
                  </div>
                )}

                </React.Fragment>
              ))}
            </div>
          </section>

          {/* --- 4. Temas Trending --- */}
      <section className="trending-topics">
        <h2><FaFire className="section-icon icon-fire" /> Tendencias</h2>
            <ul className="topic-list">
              {trending.map((t) => (
                <li key={t.id || t.title}>
                  <NavLink to="/comunidad" state={{ fromTrending: true, id: t.id }}>
                    <FaRegCommentAlt className="topic-icon" /> {t.title} <span className="muted">({t.count})</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Mapa eliminado según indicación del cliente */}

        {/* Login/Registro removidos desde Inicio (el botón conserva animación y ahora es no-op) */}

        {/* Modal de detalle de moto: se muestra al hacer click en una tarjeta */}
        {showMotoModal && (
          <MotosModal
            selectedMoto={selectedMoto}
            onClose={closeMotoModal}
            showContactForm={showContactForm}
            setShowContactForm={setShowContactForm}
            contactForm={contactForm}
            handleContactChange={handleContactChange}
            handleContactSubmit={handleContactSubmit}
            contactSent={contactSent}
            isOwner={isOwnerOf(selectedMoto)}
          />
        )}

        {/* Modal de detalle de repuesto: se muestra al hacer click en una tarjeta de repuestos */}
        {showPartModal && (
          <RepuestosModal
            selectedPart={selectedPart}
            onClose={closePartModal}
            showContactForm={showContactForm}
            setShowContactForm={setShowContactForm}
            contactForm={contactForm}
            handleContactChange={handleContactChange}
            handleContactSubmit={handleContactSubmit}
            contactSent={contactSent}
            isOwner={isOwnerOf(selectedPart)}
          />
        )}

      </main>
    </div>
  );
};

export default Inicio;