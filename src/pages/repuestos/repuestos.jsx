import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTag, FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaStar } from 'react-icons/fa';
import '../../assets/scss/motos.scss';
import RepuestosModal from './repuestos_modal';
import { listarRepuestos, crearRepuesto, detalleRepuesto } from '../../services/repuestos';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import chatService from '../../services/chat';

const Repuestos = () => {
  const [recentParts, setRecentParts] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [partsError, setPartsError] = useState(null);
  const listRef = useRef(null);
  const location = useLocation();
  const [showSellForm, setShowSellForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', condition: 'Nuevo', price: '', location: '', img: '', imageFile: null, description: '', contactPhone: '', stars: 5 });
    const [publishLoading, setPublishLoading] = useState(false);
    const [publishSuccess, setPublishSuccess] = useState(false);
    const [page, setPage] = useState(0);
  const [selectedPart, setSelectedPart] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  // Usuario actual (para detectar si es el propietario de la publicación)
  const currentRawUI = typeof window !== 'undefined' ? sessionStorage.getItem('currentUser') : null;
  const currentUserUI = currentRawUI ? JSON.parse(currentRawUI) : null;

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return setForm((s) => ({ ...s, img: '', imageFile: null }));
    const reader = new FileReader();
    reader.onload = (ev) => setForm((s) => ({ ...s, img: ev.target.result, imageFile: file }));
    reader.readAsDataURL(file);
  };

  // Formatea precio igual que en `motos.jsx` (quita .00 y mantiene decimales significativos)
  const formatPrice = (val) => {
    if (val === null || val === undefined || String(val).trim() === '') return '—';
    const raw = String(val).replace(/[^0-9.-]+/g, '');
    const n = Number(raw);
    if (Number.isNaN(n)) return String(val);
    let s = String(n);
    if (s.indexOf('.') >= 0) s = s.replace(/\.?0+$/, '');
    return s;
  };

  const handleAddPart = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price.trim() || !form.contactPhone.trim()) {
      alert('Por favor completa título, precio y teléfono de contacto.');
      return;
    }

    setPublishLoading(true);
    // Preparar FormData igual que en `motos.jsx` para cumplir con el backend
    const currentRaw = sessionStorage.getItem('currentUser');
    let current = null;
    try { current = currentRaw ? JSON.parse(currentRaw) : null; } catch (e) { current = null; }
    if (!current || (!current.id && !current.email)) {
      alert('Debes iniciar sesión para publicar.');
      setPublishLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('clienteId', current.id);
    formData.append('tipo', 'repuesto');
    formData.append('titulo', form.title);
    // alias en inglés por compatibilidad
    formData.append('title', form.title);
    formData.append('descripcion', form.description || '');
    formData.append('precio', form.price);
    // campos de detalle que el backend lee directamente
    formData.append('categoria', form.category || '');
    // También enviar alias que el backend podría esperar
    formData.append('categoria_repuesto', form.category || '');
    formData.append('condicion', form.condition || '');
    formData.append('ubicacion', form.location || '');
    formData.append('estrellas', String(Number(form.stars) || 0));
    formData.append('telefono_contacto', form.contactPhone || '');
    // alias en inglés
    formData.append('phone', form.contactPhone || '');

    // Adjuntar imagen si existe (preferir File original)
    try {
      if (form.imageFile) {
        formData.append('image', form.imageFile, form.imageFile.name || 'photo.jpg');
      } else if (form.img && String(form.img).startsWith('data:')) {
        // convertir dataURL a Blob
        const dataURLtoBlob = (dataurl) => {
          const arr = dataurl.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) { u8arr[n] = bstr.charCodeAt(n); }
          return new Blob([u8arr], { type: mime });
        };
        const blob = dataURLtoBlob(form.img);
        formData.append('image', blob, 'photo.jpg');
      }
    } catch (e) {
      // no bloquear si falla la conversión; seguiremos sin imagen
    }

    crearRepuesto(formData).then(async (created) => {
      // El endpoint de creación devuelve { publicacion, imagenes } pero NO siempre incluye el detalle.
      // Para garantizar que vemos `categoria_repuesto`, `condicion` y `ubicacion` tal como quedó en BD,
      // haremos una llamada al detalle de la publicación recién creada y mapearemos el resultado.
      try {
        const createdId = (created && created.publicacion && created.publicacion.id) || created.id || null;
        // Si tenemos id, solicitar detalle completo
        if (createdId) {
          try {
            const detailResp = await detalleRepuesto(createdId);
            // `detalleRepuesto` devuelve un objeto con { publicacion, imagenes, detalle }
            const pub = (detailResp && detailResp.publicacion) ? { ...detailResp.publicacion, imagenes: detailResp.imagenes || detailResp.publicacion.imagenes || [], detalle: detailResp.detalle || detailResp.publicacion.detalle } : null;
            if (pub) {
              const detalle = pub.detalle || {};
              // resolver imagen
              let imgCandidate = null;
              if (pub.imagenes && pub.imagenes.length > 0 && pub.imagenes[0].url) imgCandidate = pub.imagenes[0].url;
              else if (detalle.imagenes && detalle.imagenes[0]) imgCandidate = detalle.imagenes[0];
              else imgCandidate = form.img || 'https://loremflickr.com/640/420/motorcycle';
              let finalImg = imgCandidate;
              try { const s = String(imgCandidate || ''); if (s.startsWith('/uploads')) finalImg = `${api.defaults.baseURL}${s}`; } catch (e) {}

              const mapped = {
                id: pub.id || createdId,
                title: pub.titulo || pub.title || form.title,
                category: detalle.categoria_repuesto || detalle.categoria || form.category || '',
                condition: detalle.condicion || form.condition || '',
                price: formatPrice(pub.precio || pub.price || form.price),
                stars: detalle.estrellas || pub.estrellas || form.stars || 0,
                location: detalle.ubicacion || pub.ubicacion || form.location || '—',
                img: finalImg,
                description: pub.descripcion || pub.description || form.description || '',
                contact: { phone: detalle.telefono_contacto || detalle.phone || form.contactPhone || null },
                ownerId: pub.clienteId || detalle.clienteId || pub.usuarioId || null,
                detalle: detalle
              };
              setRecentParts((prev) => [mapped, ...prev]);
            } else {
              // fallback si no llega detalle
              const fallbackId = createdId || Date.now();
              const fallbackImg = (created && created.imagenes && created.imagenes[0] && (created.imagenes[0].url || created.imagenes[0])) || form.img || 'https://loremflickr.com/640/420/motorcycle';
              let finalImg = fallbackImg;
              try { const s = String(finalImg || ''); if (s.startsWith('/uploads')) finalImg = `${api.defaults.baseURL}${s}`; } catch (e) {}
              const newPart = {
                id: fallbackId,
                title: (created && (created.titulo || created.title)) || form.title,
                category: form.category || '',
                condition: form.condition || '',
                price: formatPrice((created && (created.precio || created.price)) || form.price),
                stars: form.stars || 0,
                location: form.location || '—',
                img: finalImg,
                description: form.description || '',
                contact: { phone: form.contactPhone },
                ownerId: (created && (created.clienteId || created.usuarioId)) || form.clienteId || null
              };
              setRecentParts((prev) => [newPart, ...prev]);
            }
          } catch (detErr) {
            console.warn('No se pudo recuperar detalle tras creación, usando fallback', detErr);
            // fallback similar al anterior
            const fallbackId = (created && created.publicacion && created.publicacion.id) || (created && created.id) || Date.now();
            const fallbackImg = (created && created.imagenes && created.imagenes[0] && (created.imagenes[0].url || created.imagenes[0])) || form.img || 'https://loremflickr.com/640/420/motorcycle';
            let finalImg = fallbackImg;
            try { const s = String(finalImg || ''); if (s.startsWith('/uploads')) finalImg = `${api.defaults.baseURL}${s}`; } catch (e) {}
            const newPart = {
              id: fallbackId,
              title: (created && (created.titulo || created.title)) || form.title,
              category: form.category || '',
              condition: form.condition || '',
              price: formatPrice((created && (created.precio || created.price)) || form.price),
              stars: form.stars || 0,
              location: form.location || '—',
              img: finalImg,
              description: form.description || '',
              contact: { phone: form.contactPhone },
              ownerId: (created && (created.clienteId || created.usuarioId)) || form.clienteId || null
            };
            setRecentParts((prev) => [newPart, ...prev]);
          }
        } else {
          // Si no hay id en la respuesta, usar fallback
          const fallbackImg = (created && created.imagenes && created.imagenes[0] && (created.imagenes[0].url || created.imagenes[0])) || form.img || 'https://loremflickr.com/640/420/motorcycle';
          let finalImg = fallbackImg;
          try { const s = String(finalImg || ''); if (s.startsWith('/uploads')) finalImg = `${api.defaults.baseURL}${s}`; } catch (e) {}
          const newPart = {
            id: (created && created.id) || Date.now(),
            title: (created && (created.titulo || created.title)) || form.title,
            category: form.category || '',
            condition: form.condition || '',
            price: formatPrice((created && (created.precio || created.price)) || form.price),
            stars: form.stars || 0,
            location: form.location || '—',
            img: finalImg,
            description: form.description || '',
            contact: { phone: form.contactPhone },
            ownerId: (created && (created.clienteId || created.usuarioId)) || form.clienteId || null
          };
          setRecentParts((prev) => [newPart, ...prev]);
        }

        setPublishLoading(false);
        setPublishSuccess(true);
        try {
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Repuesto publicado', text: 'Tu repuesto se publicó correctamente.', showConfirmButton: false, timer: 3000, timerProgressBar: true });
        } catch (e) {}
        setTimeout(() => setPublishSuccess(false), 2200);
        setForm({ title: '', category: '', condition: 'Nuevo', price: '', location: '', img: '', imageFile: null, description: '', contactPhone: '', stars: 5 });
        setShowSellForm(false);
      } catch (outerErr) {
        console.error('Error procesando creación del repuesto', outerErr);
        setPublishLoading(false);
        const msg = (outerErr && outerErr.response && outerErr.response.data && outerErr.response.data.message) || 'No fue posible publicar el repuesto. Inténtalo de nuevo.';
        try { Swal.fire({ icon: 'error', title: 'No se pudo publicar', text: msg }); } catch (e) { alert(msg); }
      }
    }).catch((err) => {
      console.error('Error publicando repuesto', err);
      setPublishLoading(false);
      const msg = (err && err.response && err.response.data && err.response.data.message) || 'No fue posible publicar el repuesto. Inténtalo de nuevo.';
      try { Swal.fire({ icon: 'error', title: 'No se pudo publicar', text: msg }); } catch (e) { alert(msg); }
    });
  };

    // Cargar repuestos reales desde el backend
    useEffect(() => {
      let cancelled = false;
      const load = async () => {
        setLoadingParts(true);
        setPartsError(null);
        try {
          const data = await listarRepuestos({ includeDetails: 'true', limit: 50 });
          if (cancelled) return;
          const mapped = (Array.isArray(data) ? data : []).map(p => {
            const detalle = p.detalle || {};
            let imgCandidate = null;
            if (p.imagenes && p.imagenes.length > 0 && p.imagenes[0].url) imgCandidate = p.imagenes[0].url;
            else if (detalle.imagenes && detalle.imagenes[0]) imgCandidate = detalle.imagenes[0];
            else imgCandidate = 'https://loremflickr.com/640/420/motorcycle';

            let finalImg = imgCandidate;
            try {
              const s = String(imgCandidate || '');
              if (s.startsWith('/uploads')) finalImg = `${api.defaults.baseURL}${s}`;
            } catch (e) {}

            return {
              id: p.id,
              title: p.titulo || p.title || '',
              price: formatPrice(p.precio || p.price || ''),
              location: detalle.ubicacion || p.ubicacion || p.location || '—',
              category: detalle.categoria_repuesto || detalle.categoria || p.categoria || p.category || '',
              condition: detalle.condicion || detalle.estado || p.condicion || p.condition || '',
              stars: detalle.estrellas || p.estrellas || 0,
              img: finalImg,
              description: p.descripcion || p.description || '',
              contact: { phone: detalle.telefono_contacto || detalle.phone || null },
              // propietario/autor de la publicación (si viene desde el backend)
              ownerId: p.clienteId || detalle.clienteId || p.usuarioId || null,
              detalle: detalle
            };
          });
          setRecentParts(mapped);
        } catch (err) {
          console.error('Error cargando repuestos', err);
          setPartsError((err && err.response && err.response.data && err.response.data.error) || err.message || 'Error al cargar repuestos');
        } finally {
          if (!cancelled) setLoadingParts(false);
        }
      };
      load();
      return () => { cancelled = true; };
    }, []);

  useEffect(() => {
    if (!showSellForm) return;
    const first = document.querySelector('.sell-form input[name="title"]');
    if (first) setTimeout(() => first.focus(), 40);
    const onKey = (e) => { if (e.key === 'Escape') setShowSellForm(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [showSellForm]);

  // Abrir modal automáticamente si la URL contiene un hash #repuesto-<id>
  useEffect(() => {
    const tryOpenFromHash = async () => {
      try {
        const hash = (location && location.hash) ? String(location.hash) : '';
        const m = hash.match(/^#repuesto-(\d+)$/);
        if (!m) return;
        const id = Number(m[1]);
        if (!id) return;
        // Buscar en los listados cargados primero
        const found = recentParts.find(p => Number(p.id) === Number(id));
        if (found) {
          setSelectedPart(found);
          return;
        }
        // Si no está en la lista, solicitar detalle al backend
        try {
          const resp = await detalleRepuesto(id);
          const publicacion = (resp && resp.publicacion) ? { ...resp.publicacion, detalle: resp.detalle || resp.publicacion.detalle, imagenes: resp.imagenes || resp.publicacion.imagenes || [] } : null;
          if (!publicacion) return;
          const detalle = publicacion.detalle || {};
          let imgCandidate = null;
          if (publicacion.imagenes && publicacion.imagenes.length > 0 && publicacion.imagenes[0].url) imgCandidate = publicacion.imagenes[0].url;
          else if (detalle.imagenes && detalle.imagenes[0]) imgCandidate = detalle.imagenes[0];
          else imgCandidate = 'https://loremflickr.com/640/420/motorcycle';
          let finalImg = imgCandidate;
          try { const s = String(imgCandidate || ''); if (s.startsWith('/uploads')) finalImg = `${api.defaults.baseURL}${s}`; } catch (e) {}
          const mapped = {
            id: publicacion.id,
            title: publicacion.titulo || publicacion.title || '',
            category: detalle.categoria_repuesto || detalle.categoria || publicacion.categoria || publicacion.category || '',
            condition: detalle.condicion || detalle.estado || publicacion.condicion || publicacion.condition || '',
            price: formatPrice(publicacion.precio || publicacion.price || ''),
            stars: detalle.estrellas || publicacion.estrellas || 0,
            location: detalle.ubicacion || publicacion.ubicacion || publicacion.location || '—',
            img: finalImg,
            description: publicacion.descripcion || publicacion.description || '',
            contact: { phone: detalle.telefono_contacto || detalle.phone || null },
            ownerId: publicacion.clienteId || detalle.clienteId || publicacion.usuarioId || null,
            detalle: detalle
          };
          setSelectedPart(mapped);
        } catch (err) {
          console.warn('No se pudo obtener detalle desde hash', err);
        }
      } catch (e) { /* ignore */ }
    };
    tryOpenFromHash();
  }, [location.hash, recentParts]);

  // Si navegamos desde otra página con location.state.editPart, abrir el formulario
  // de publicación y precargar los datos para editar ese repuesto.
  useEffect(() => {
    try {
      if (location && location.state && location.state.editPart) {
        const part = location.state.editPart;
        const resolvedCategory = part.category || part.categoria || (part.detalle && (part.detalle.categoria_repuesto || part.detalle.categoria)) || '';
        const resolvedPhone = (part.contact && part.contact.phone) || part.contactPhone || part.telefono || (part.detalle && (part.detalle.telefono_contacto || part.detalle.phone)) || '';
        setForm((s) => ({
          ...s,
          title: part.title || part.titulo || '',
          category: resolvedCategory,
          condition: part.condition || part.condicion || 'Nuevo',
          stars: part.stars || part.estrellas || 5,
          price: (part.price || part.precio) ? String(part.price || part.precio) : '',
          location: part.location || part.ubicacion || '',
          img: part.img || '',
          description: part.description || part.descripcion || '',
          contactPhone: resolvedPhone
        }));
        setShowSellForm(true);
      }
    } catch (e) {
      console.warn('no se pudo inicializar edición de repuesto desde location.state', e);
    }
  }, [location]);

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((s) => ({ ...s, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.message) return;
    (async () => {
      try {
        const currentRaw = sessionStorage.getItem('currentUser');
        const current = currentRaw ? JSON.parse(currentRaw) : null;
        if (!current || !current.id) {
          Swal.fire({ icon: 'warning', title: 'Inicia sesión', text: 'Debes iniciar sesión para contactar al vendedor.' });
          return;
        }

        // Determinar ownerId de la publicación
        const ownerId = selectedPart && (selectedPart.ownerId || (selectedPart.detalle && selectedPart.detalle.clienteId) || selectedPart.clienteId || selectedPart.usuarioId) ? (selectedPart.ownerId || (selectedPart.detalle && selectedPart.detalle.clienteId) || selectedPart.clienteId || selectedPart.usuarioId) : null;
        if (!ownerId) {
          Swal.fire({ icon: 'error', title: 'No disponible', text: 'No se pudo determinar el vendedor de esta publicación.' });
          return;
        }

        // Evitar que el propietario mensajee su propia publicación
        if (current.id && ownerId && Number(current.id) === Number(ownerId)) {
          Swal.fire({ icon: 'info', title: 'Operación inválida', text: 'No puedes mensajear tu propia publicación.' });
          return;
        }

        // Crear o recuperar chat identificado por la publicación (titulo único)
        // Añadimos un sufijo '-buyer-<id>' para separar chats por comprador y evitar que distintos compradores compartan el mismo chat
        const tituloChat = `publicacion-repuesto-${selectedPart.id}${current && current.id ? `-buyer-${current.id}` : ''}`;
        const chatRes = await chatService.crearChat({ clienteId: ownerId, titulo: tituloChat, tipo: 'one2one' });
        const chatId = chatRes && chatRes.chat && chatRes.chat.id ? chatRes.chat.id : (chatRes && chatRes.chatId) || null;
        if (!chatId) throw new Error('No se pudo crear el chat');

        const msgBody = { remitente: current.nombre || current.name || current.email || `user-${current.id}`, cuerpo: contactForm.message, clienteId: current.id };
        await chatService.enviarMensaje(chatId, msgBody);

        setContactSent(true);
        setTimeout(() => {
          setContactSent(false);
          setShowContactForm(false);
          setContactForm({ name: '', email: '', message: '' });
        }, 3000);

        try { Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Mensaje enviado', showConfirmButton: false, timer: 3000 }); } catch (e) {}

        try { window.dispatchEvent(new CustomEvent('chats:updated', { detail: { chatId } })); } catch (e) {}

      } catch (err) {
        console.error('Error enviando mensaje de contacto (repuesto)', err);
        const msg = (err && err.response && err.response.data && (err.response.data.message || err.response.data.error)) || err.message || 'Error al enviar mensaje';
        try { Swal.fire({ icon: 'error', title: 'No enviado', text: msg }); } catch (e) { alert(msg); }
      }
    })();
  };

  // Paginado: mostrar 12 items por página y navegar entre páginas
  const itemsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(recentParts.length / itemsPerPage));
  useEffect(() => { if (page > totalPages - 1) setPage(0); }, [recentParts.length, totalPages]);
  const scrollCarousel = (_ref, dir = 1) => {
    if (totalPages <= 1) return;
    setPage((p) => {
      const next = (p + dir + totalPages) % totalPages;
      return next;
    });
  };

  return (
    <div className="repuestos-page">
      <main className="motos-main">
        <section className="sell-hero" role="region" aria-label="Vender repuesto">
          <div className="sell-hero-inner">
            <div className="sell-hero-text">
              <h1>¿Tienes repuestos o accesorios?</h1>
              <p>Publica cascos, llantas, escapes y más. Rápido y seguro.</p>
            </div>
            <div className="sell-hero-cta">
              <button type="button" className="btn btn-primary" onClick={() => setShowSellForm(true)}>Vender ahora</button>
            </div>
          </div>
        </section>

        {showSellForm && (
          <div className="sell-modal-overlay" onClick={(e) => { if (e.target.classList && e.target.classList.contains('sell-modal-overlay')) setShowSellForm(false); }}>
            <div className="sell-modal" role="dialog" aria-modal="true">
              <button className="modal-close" aria-label="Cerrar" onClick={() => setShowSellForm(false)}>×</button>
              <form className={`sell-form`} onSubmit={handleAddPart}>
                <div className="sell-form-grid">
                  <div className="sell-form-main">
                    <label>
                      Título
                      <input name="title" value={form.title} onChange={handleFormChange} placeholder="Ej: Casco Integral AGV K3" required />
                    </label>

                    <label>
                      Categoría
                      <select name="category" value={form.category} onChange={handleFormChange}>
                        <option value="">Seleccionar</option>
                        <option value="Cascos">Cascos</option>
                        <option value="Llantas">Llantas</option>
                        <option value="Transmisión">Transmisión</option>
                        <option value="Escape">Escape</option>
                        <option value="Accesorios">Accesorios</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </label>

                    <label>
                      Condición
                      <select name="condition" value={form.condition} onChange={handleFormChange}>
                        <option>Nuevo</option>
                        <option>Usado - Bueno</option>
                        <option>Usado - Regular</option>
                      </select>
                    </label>

                    <label>
                      Valora este repuesto
                      <select name="stars" value={form.stars} onChange={handleFormChange}>
                        <option value={5}>5 - Excelente</option>
                        <option value={4}>4 - Muy bueno</option>
                        <option value={3}>3 - Bueno</option>
                        <option value={2}>2 - Regular</option>
                        <option value={1}>1 - Malo</option>
                      </select>
                    </label>

                    <label>
                      Precio
                      <input name="price" value={form.price} onChange={handleFormChange} placeholder="Ej: 120" required />
                    </label>

                    <label>
                      Ubicación
                      <input name="location" value={form.location} onChange={handleFormChange} placeholder="Ciudad" />
                    </label>

                    <label className="full">
                      Descripción
                      <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Detalles del estado o compatibilidades" rows={4} />
                    </label>

                    <label>
                      Imagen
                      <input type="file" accept="image/*" name="image" onChange={handleImageChange} />
                    </label>

                    <label>
                      Teléfono de contacto
                      <input name="contactPhone" type="tel" value={form.contactPhone} onChange={handleFormChange} placeholder="0987654321" required />
                    </label>

                    <div className="sell-form-actions">
                      <button type="submit" className={`btn btn-primary ${publishLoading ? 'loading' : ''}`} disabled={publishLoading}>{publishLoading ? 'Publicando...' : 'Publicar repuesto'}</button>
                      <button type="button" className="btn" onClick={() => setShowSellForm(false)} disabled={publishLoading}>Cancelar</button>
                    </div>
                    {publishSuccess && <div className="sell-form-success">Repuesto publicado correctamente.</div>}
                  </div>

                  <aside className="sell-form-preview">
                    <div className="preview-card">
                      <div className="preview-image">
                        <img src={form.img || 'https://loremflickr.com/640/420/motorcycle'} alt={form.title || 'Vista previa'} />
                        <div className="preview-price">${form.price ? formatPrice(form.price) : '0'}</div>
                      </div>
                      <div className="preview-body">
                        <h4>{form.title || 'Título del repuesto'}</h4>
                        <div className="preview-meta">{form.category ? <span className="chip">{form.category}</span> : <span className="chip">Hermoso</span>} <span className="muted">{form.location}</span> <span className="stars">{form.stars} <FaStar className="star-icon" /></span></div>
                        <p className="preview-desc">{form.description ? form.description.slice(0, 140) + (form.description.length > 140 ? '…' : '') : 'Aquí verás una vista previa antes de publicar.'}</p>
                        <div className="preview-contact">Teléfono: {form.contactPhone || '—'}</div>
                      </div>
                    </div>
                  </aside>

                </div>
              </form>
            </div>
          </div>
        )}

        <section className="featured-items">
          <div className="section-header">
            <h2><FaMapMarkerAlt className="section-icon" />Repuestos Recientes</h2>
          </div>

          <div className="carousel-wrapper">
            <button className="carousel-button left" aria-label="Anterior" onClick={() => scrollCarousel(listRef, -1)}>
              <FaChevronLeft />
            </button>

            <div className="item-cards-carousel">
              <div className="item-cards-grid" ref={listRef}>
                {recentParts.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((part) => (
                <article key={part.id} id={`repuesto-${part.id}`} className="item-card" tabIndex={0} onClick={() => setSelectedPart(part)} onKeyDown={(e) => { if (e.key === 'Enter') setSelectedPart(part); }}>
                  <div className="card-image">
                    {(() => {
                      const imgSrc = (part.img && String(part.img).startsWith('data:')) ? part.img : `${part.img}?${part.id}`;
                      return <img src={imgSrc} alt={part.title} />;
                    })()}
                    <span className="card-price"><FaTag /> ${part.price}</span>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{part.title}</h3>
                    <div className="card-meta">
                      <span><FaMapMarkerAlt /> {part.location}</span>
                      <span className="muted">{part.category}</span>
                      <span className="stars">{part.stars || 0} <FaStar className="star-icon" /></span>
                    </div>
                  </div>
                </article>
              ))}
              </div>
            </div>

            {/* Modal detalle del repuesto */}
            <RepuestosModal
              selectedPart={selectedPart}
              onClose={() => setSelectedPart(null)}
              showContactForm={showContactForm}
              setShowContactForm={setShowContactForm}
              contactForm={contactForm}
              handleContactChange={handleContactChange}
              handleContactSubmit={handleContactSubmit}
              contactSent={contactSent}
              isOwner={currentUserUI && selectedPart && (Number(currentUserUI.id) === Number(selectedPart.ownerId) || (selectedPart.detalle && Number(currentUserUI.id) === Number(selectedPart.detalle.clienteId)) || Number(currentUserUI.id) === Number(selectedPart.clienteId))}
            />

            <button className="carousel-button right" aria-label="Siguiente" onClick={() => scrollCarousel(listRef, 1)}>
              <FaChevronRight />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Repuestos;
