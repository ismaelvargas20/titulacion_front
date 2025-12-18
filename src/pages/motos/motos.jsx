import React, { useRef, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaTag, FaMapMarkerAlt, FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../assets/scss/motos.scss';
import MotosModal from './motos_modal';
import Swal from 'sweetalert2';
import { listarPublicaciones, crearPublicacion, actualizarPublicacion } from '../../services/motos';
import api from '../../api/axios';
import chatService from '../../services/chat';

const Motos = () => {
  // Formatea precio: quita ".00" cuando corresponde y mantiene decimales significativos
  const formatPrice = (val) => {
    if (val === null || val === undefined || String(val).trim() === '') return '—';
    // eliminar símbolos y espacios
    const raw = String(val).replace(/[^0-9.-]+/g, '');
    const n = Number(raw);
    if (Number.isNaN(n)) return String(val);
    let s = String(n);
    if (s.indexOf('.') >= 0) s = s.replace(/\.?0+$/, '');
    return s;
  };
  const initialMotos = [
    { id: 1, title: 'Yamaha MT-09 2022', price: '9,500', location: 'Quito', stars: 5, img: 'https://loremflickr.com/640/420/motorcycle,yamaha' },
    { id: 2, title: 'Honda CBR600RR', price: '8,200', location: 'Guayaquil', stars: 4, img: 'https://loremflickr.com/640/420/motorcycle,honda' },
    { id: 3, title: 'Suzuki V-Strom 650', price: '7,800', location: 'Cuenca', stars: 5, img: 'https://loremflickr.com/640/420/motorcycle,suzuki' },
    { id: 4, title: 'Royal Enfield Classic 350', price: '4,500', location: 'Quito', stars: 4, img: 'https://loremflickr.com/640/420/motorcycle,classic' },
    { id: 5, title: 'Kawasaki Z900', price: '10,100', location: 'Manta', stars: 5, img: 'https://loremflickr.com/640/420/motorcycle,kawasaki' },
    { id: 6, title: 'Ducati Scrambler', price: '11,000', location: 'Guayaquil', stars: 5, img: 'https://loremflickr.com/640/420/motorcycle,ducati' },
  ];
  const [recentMotos, setRecentMotos] = useState([]);
  const [page, setPage] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState(null);
  

  const listRef = useRef(null);
  const [showSellForm, setShowSellForm] = useState(false);
  const [form, setForm] = useState({ title: '', model: '', revision: 'Al día', condition: 'Excelente', price: '', location: '', stars: 5, img: '', description: '', contactPhone: '', kilometraje: '', year: '', transmission: 'manual' });
  const [editId, setEditId] = useState(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [selectedMoto, setSelectedMoto] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  // Usuario actual (para detectar si es el propietario de la publicación)
  const currentRawUI = typeof window !== 'undefined' ? sessionStorage.getItem('currentUser') : null;
  const currentUserUI = currentRawUI ? JSON.parse(currentRawUI) : null;

  // helper: ids marcadas como removidas/vendidas en esta sesión (persistencia local)
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // Si la URL contiene un hash como #moto-123 navegando desde Chat, localizar y abrir la tarjeta
  const location = useLocation();
  // Cargar publicaciones reales desde el backend
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingList(true);
      setListError(null);
      try {
        const data = await listarPublicaciones({ tipo: 'moto', includeDetails: 'true', limit: 50 });
        if (cancelled) return;
        // data puede ser array de publicaciones con posible .detalle
        const mapped = (Array.isArray(data) ? data : []).map(p => {
          const detalle = p.detalle || {};
          // elegir la URL de la imagen (puede venir en p.imagenes[0].url o en detalle.imagenes)
          let imgCandidate = null;
          if (p.imagenes && p.imagenes.length > 0 && p.imagenes[0].url) imgCandidate = p.imagenes[0].url;
          else if (detalle.imagenes && detalle.imagenes[0]) imgCandidate = detalle.imagenes[0];
          else imgCandidate = 'https://loremflickr.com/640/420/motorcycle';

          // Si la ruta es relativa y apunta a /uploads, añadir el host/baseURL del backend
          let finalImg = imgCandidate;
          try {
            const s = String(imgCandidate || '');
            if (s.startsWith('/uploads')) {
              finalImg = `${api.defaults.baseURL}${s}`;
            }
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
            // Detalle específico de moto (si existe) — pasamos campos para que el modal pueda mostrarlos
            model: detalle.modelo || p.modelo || null,
            revision: detalle.revision || null,
            condition: detalle.condicion || detalle.estado || null,
            kilometraje: detalle.kilometraje || p.kilometraje || null,
            year: detalle.anio || p.anio || p.year || null,
            transmission: detalle.transmision || p.transmision || detalle.transmission || p.transmission || null,
            ubicacion: detalle.ubicacion || p.ubicacion || p.location || null,
            contact: { phone: detalle.telefono_contacto || detalle.phone || null },
            // propietario / autor de la publicación (si viene desde el backend)
            ownerId: p.clienteId || detalle.clienteId || p.usuarioId || null,
            // mantener el detalle crudo por si se necesita
            detalle: detalle
          };
        });
        // filtrar items removidos/localmente marcados como vendidos para no mostrar en la lista
        try {
          const removed = getRemovedIds();
          const filtered = mapped.filter(m => !removed.includes(Number(m.id)) && !isSoldItem(m));
          setRecentMotos(filtered);
        } catch (e) {
          setRecentMotos(mapped);
        }
      } catch (err) {
        console.error('Error cargando publicaciones', err);
        setListError((err && err.response && err.response.data && err.response.data.error) || err.message || 'Error al cargar publicaciones');
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!location || !location.hash) return;
    const id = location.hash.replace('#', '');
    if (!id.startsWith('moto-')) return;
    const numeric = Number(id.replace('moto-', ''));
    const found = recentMotos.find(m => Number(m.id) === numeric);
    if (found) {
      // abrir modal con la moto y scrollear hacia la tarjeta
      setSelectedMoto(found);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight');
          setTimeout(() => el.classList.remove('highlight'), 2200);
        }
      }, 120);
    }
  }, [location, recentMotos]);

  // Si navegamos desde otra página con location.state.editMoto, abrir el formulario
  // de publicación y precargar los datos para editar esa moto.
  useEffect(() => {
    try {
      if (location && location.state && location.state.editMoto) {
        const moto = location.state.editMoto;
        // si el anuncio está marcado como vendido, no permitir edición
        const sold = isSoldItem(moto) || (moto && (moto.status === 'Vendido' || moto.status === 'vendido'));
        if (sold) {
          try { Swal.fire({ icon: 'warning', title: 'No editable', text: 'Este anuncio está marcado como vendido y no puede editarse.' }); } catch (e) {}
          return;
        }
        // Registrar que estamos en modo edición y guardar el id para la actualización
        setEditId(moto.id || null);
        // Resolver teléfono usando varios alias posibles (contact.phone, contactPhone, detalle.telefono_contacto, telefono)
        const resolvedPhone = (moto && (
          (moto.contact && moto.contact.phone) ||
          moto.contactPhone ||
          (moto.detalle && (moto.detalle.telefono_contacto || moto.detalle.phone)) ||
          moto.telefono ||
          moto.phone ||
          ''
        ));
        setForm((s) => ({
          ...s,
          title: moto.title || '',
          model: moto.model || '',
          revision: moto.revision || 'Al día',
          condition: moto.condition || 'Excelente',
          price: moto.price ? String(moto.price) : '',
          location: moto.location || moto.ubicacion || '',
          stars: moto.stars || 5,
          img: moto.img || '',
          description: moto.description || moto.descripcion || '',
          contactPhone: resolvedPhone || '',
          kilometraje: moto.kilometraje || moto.kilometraje || '',
          year: moto.year || moto.anio || '',
          transmission: moto.transmission || 'manual'
        }));
        setShowSellForm(true);
      }
    } catch (e) {
      // no bloquear la app si algo no existe
      console.warn('no se pudo inicializar edición desde location.state', e);
    }
  }, [location]);

  // Escuchar eventos globales de publicación removida/actualizada para actualizar la lista en esta vista
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
  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return setForm((s) => ({ ...s, img: '', imageFile: null }));
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Guardar preview (dataURL) y el File original para enviar como FormData
      setForm((s) => ({ ...s, img: ev.target.result, imageFile: file }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddMoto = (e) => {
    e.preventDefault();
    // validation: required fields
    if (!form.title.trim() || !form.price.trim() || !form.contactPhone.trim()) {
      alert('Por favor completa título, precio y teléfono de contacto.');
      return;
    }
    // Preparar payload para backend
    const currentRaw = sessionStorage.getItem('currentUser');
    let current = null;
    try { current = currentRaw ? JSON.parse(currentRaw) : null; } catch (e) { current = null; }
    if (!current || (!current.id && !current.email)) {
      alert('Debes iniciar sesión para publicar.');
      return;
    }

    // Preparar FormData para enviar como multipart/form-data
    const formData = new FormData();
    formData.append('clienteId', current.id);
    formData.append('tipo', 'moto');
    formData.append('titulo', form.title);
    formData.append('descripcion', form.description || '');
    formData.append('precio', form.price);
    formData.append('model', form.model || form.title);
    formData.append('revision', form.revision);
    formData.append('condition', form.condition);
    formData.append('location', form.location || '');
    formData.append('stars', String(Number(form.stars) || 0));
    formData.append('contactPhone', form.contactPhone);
    formData.append('kilometraje', form.kilometraje || '');
    formData.append('year', form.year || '');
    formData.append('transmission', form.transmission || 'manual');

    // Adjuntar imagen: preferir el File original si existe (imageFile), sino convertir dataURL a Blob
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

    setPublishLoading(true);
    // Si estamos en modo edición, actualizar la publicación en lugar de crear una nueva
    if (editId) {
      actualizarPublicacion(editId, formData)
        .then(res => {
          const updated = res && res.publicacion ? res.publicacion : null;
          // Preferir la imagen devuelta por el backend si existe
          let returnedImg = null;
          try {
            const imgs = res && res.imagenes ? res.imagenes : (updated && updated.imagenes ? updated.imagenes : null);
            if (Array.isArray(imgs) && imgs.length > 0) {
              const first = imgs[0];
              returnedImg = first.url || first;
            }
          } catch (e) { returnedImg = null; }

          let finalImg = returnedImg || form.img || 'https://loremflickr.com/640/420/motorcycle';
          try { const s = String(finalImg || ''); if (s.startsWith('/uploads')) finalImg = `${api.defaults.baseURL}${s}`; } catch (e) {}

          const updatedMoto = {
            id: updated ? updated.id : editId,
            title: form.title,
            model: form.model,
            revision: form.revision,
            condition: form.condition,
            price: formatPrice(form.price),
            location: form.location || 'Sin especificar',
            stars: Number(form.stars) || 0,
            img: finalImg,
            description: form.description || '',
            contact: { phone: form.contactPhone },
            kilometraje: form.kilometraje || '',
            year: form.year || '',
            transmission: form.transmission || 'manual',
            ownerId: (current && current.id) || (updated && (updated.clienteId || updated.usuarioId)) || null,
          };
          setRecentMotos((prev) => prev.map(m => (m.id === updatedMoto.id ? updatedMoto : m)));
          try {
            const curRaw = typeof window !== 'undefined' ? sessionStorage.getItem('currentUser') : null;
            const cur = curRaw ? JSON.parse(curRaw) : null;
            const key = cur && cur.id ? `removedPublicaciones_user_${cur.id}` : 'removedPublicaciones';
            const raw = localStorage.getItem(key) || '[]';
            const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
            const filtered = arr.filter(x => Number(x) !== Number(updatedMoto.id));
            localStorage.setItem(key, JSON.stringify(filtered));
          } catch (e) { /* noop */ }
          setPublishLoading(false);
          setPublishSuccess(true);
          try {
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Anuncio actualizado', showConfirmButton: false, timer: 2000 });
          } catch (e) {}
          setTimeout(() => setPublishSuccess(false), 2200);
          setForm({ title: '', model: '', revision: 'Al día', condition: 'Excelente', price: '', location: '', stars: 5, img: '', description: '', contactPhone: '', kilometraje: '', year: '', transmission: 'manual' });
          setShowSellForm(false);
          setEditId(null);
        })
        .catch(err => {
          console.error('Error actualizando publicación', err);
          setPublishLoading(false);
          const msg = (err && err.response && err.response.data && err.response.data.message) || 'Error al actualizar publicación';
          setListError(msg);
          try { Swal.fire({ icon: 'error', title: 'No se pudo actualizar', text: msg }); } catch (e) { alert(msg); }
        });
      return;
    }

    crearPublicacion(formData)
      .then(res => {
        const nueva = res && res.publicacion ? res.publicacion : null;
        // Preferir la imagen devuelta por el backend si existe
        let returnedImg = null;
        try {
          const imgs = res && res.imagenes ? res.imagenes : (nueva && nueva.imagenes ? nueva.imagenes : null);
          if (Array.isArray(imgs) && imgs.length > 0) {
            const first = imgs[0];
            returnedImg = first.url || first;
          }
        } catch (e) { returnedImg = null; }

        let finalImg = returnedImg || form.img || 'https://loremflickr.com/640/420/motorcycle';
        // Si es una ruta relativa, añadir baseURL del API
        try {
          const s = String(finalImg || '');
          if (s.startsWith('/uploads')) finalImg = `${api.defaults.baseURL}${s}`;
        } catch (e) {}

        const newMoto = {
          id: nueva ? nueva.id : Date.now(),
          title: form.title,
          model: form.model,
          revision: form.revision,
          condition: form.condition,
          price: formatPrice(form.price),
          location: form.location || 'Sin especificar',
          stars: Number(form.stars) || 0,
          img: finalImg,
          description: form.description || '',
          contact: { phone: form.contactPhone },
          kilometraje: form.kilometraje || '',
          year: form.year || '',
          transmission: form.transmission || 'manual',
          ownerId: (current && current.id) || (nueva && (nueva.clienteId || nueva.usuarioId)) || null,
        };
        setRecentMotos((prev) => [newMoto, ...prev]);
        try {
          const curRaw = typeof window !== 'undefined' ? sessionStorage.getItem('currentUser') : null;
          const cur = curRaw ? JSON.parse(curRaw) : null;
          const key = cur && cur.id ? `removedPublicaciones_user_${cur.id}` : 'removedPublicaciones';
          const raw = localStorage.getItem(key) || '[]';
          const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
          const filtered = arr.filter(x => Number(x) !== Number(newMoto.id));
          localStorage.setItem(key, JSON.stringify(filtered));
          // limpieza realizada (debug removido)
          try { window.dispatchEvent(new CustomEvent('publicacion:created', { detail: { id: newMoto.id } })); } catch (e) {}
        } catch (e) { /* noop */ }
        setPublishLoading(false);
        setPublishSuccess(true);
        // Mostrar notificación bonita con SweetAlert2
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
        } catch (e) {
          // si falla Swal no bloqueamos la app
          console.warn('Swal error', e);
        }
        setTimeout(() => setPublishSuccess(false), 2200);
        setForm({ title: '', model: '', revision: 'Al día', condition: 'Excelente', price: '', location: '', stars: 5, img: '', description: '', contactPhone: '', kilometraje: '', year: '', transmission: 'manual' });
        setShowSellForm(false);
      })
      .catch(err => {
        console.error('Error creando publicación', err);
        setPublishLoading(false);
        const msg = (err && err.response && err.response.data && err.response.data.message) || 'Error al crear publicación';
        setListError(msg);
        try {
          Swal.fire({ icon: 'error', title: 'No se pudo publicar', text: msg });
        } catch (e) {
          // fallback
          alert(msg);
        }
      });
  };

  // cuando el modal de publicar está abierto: foco y escape + bloquear scroll
  useEffect(() => {
    if (!showSellForm) return;
    const first = document.querySelector('.sell-form input[name="title"]');
    if (first) setTimeout(() => first.focus(), 40);
    const onKey = (e) => { if (e.key === 'Escape') setShowSellForm(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [showSellForm]);

  // cerrar modal con Escape y bloquear scroll cuando esté abierto
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedMoto(null);
    };
    if (selectedMoto) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [selectedMoto]);

  // Mostrar siempre 12 items por página (se adaptan en columnas/filas vía CSS)
  // Cambiado a 12 para mostrar 12 cartas en la primera pantalla; el resto irá al paginado siguiente
  const itemsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(recentMotos.length / itemsPerPage));
  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [recentMotos.length, totalPages]);
  const scrollCarousel = (_ref, dir = 1) => {
    if (totalPages <= 1) return;
    setPage((p) => {
      const next = (p + dir + totalPages) % totalPages;
      return next;
    });
  };

  // NOTE: columns are handled by CSS breakpoints; itemsPerPage is fixed at 8

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((s) => ({ ...s, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // validación mínima: solo mensaje requerido ahora
    if (!contactForm.message) return;
    (async () => {
      try {
        const currentRaw = sessionStorage.getItem('currentUser');
        const current = currentRaw ? JSON.parse(currentRaw) : null;
        if (!current || !current.id) {
          Swal.fire({ icon: 'warning', title: 'Inicia sesión', text: 'Debes iniciar sesión para contactar al vendedor.' });
          return;
        }

        // Asegurar que tenemos el ownerId (propietario de la publicación)
        const ownerId = selectedMoto && (selectedMoto.ownerId || (selectedMoto.detalle && selectedMoto.detalle.clienteId)) ? (selectedMoto.ownerId || selectedMoto.detalle.clienteId) : null;
        if (!ownerId) {
          Swal.fire({ icon: 'error', title: 'No disponible', text: 'No se pudo determinar el vendedor de esta publicación.' });
          return;
        }

        // Si el usuario actual es el propietario, evitar enviar el mensaje
        if (current.id && ownerId && Number(current.id) === Number(ownerId)) {
          Swal.fire({ icon: 'info', title: 'Operación inválida', text: 'No puedes mensajear tu propia publicación.' });
          return;
        }

        // Crear o recuperar chat identificado por la publicación (titulo único)
        // Añadimos un sufijo '-buyer-<id>' para separar chats por comprador y evitar que distintos compradores compartan el mismo chat
        const tituloChat = `publicacion-${selectedMoto.id}${current && current.id ? `-buyer-${current.id}` : ''}`;
        const chatRes = await chatService.crearChat({ clienteId: ownerId, titulo: tituloChat, tipo: 'one2one' });
        const chatId = chatRes && chatRes.chat && chatRes.chat.id ? chatRes.chat.id : (chatRes && chatRes.chatId) || null;
        if (!chatId) {
          throw new Error('No se pudo crear el chat');
        }

        // Enviar mensaje al chat
        // Si el usuario es un "cliente" (frontend guarda clientes en sessionStorage), enviar solo `clienteId`.
        const msgBody = { remitente: current.nombre || current.name || current.email || `user-${current.id}`, cuerpo: contactForm.message, clienteId: current.id };
        await chatService.enviarMensaje(chatId, msgBody);

        // Feedback al usuario
        setContactSent(true);
        setTimeout(() => {
          setContactSent(false);
          setShowContactForm(false);
          setContactForm({ name: '', email: '', message: '' });
        }, 3000);

        // Opcional: mostrar notificación (duración aumentada)
        try { Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Mensaje enviado', showConfirmButton: false, timer: 3000 }); } catch (e) {}

        // Emitir evento para que la vista de chats actualice su lista
        try { window.dispatchEvent(new CustomEvent('chats:updated', { detail: { chatId } })); } catch (e) {}

      } catch (err) {
        console.error('Error enviando mensaje de contacto', err);
        const msg = (err && err.response && err.response.data && (err.response.data.message || err.response.data.error)) || err.message || 'Error al enviar mensaje';
        try { Swal.fire({ icon: 'error', title: 'No enviado', text: msg }); } catch (e) { alert(msg); }
      }
    })();
  };

  return (
    <div className="motos-page">
      <main className="motos-main">
        <section className="sell-hero" role="region" aria-label="Vender motocicleta">
          <div className="sell-hero-inner">
            <div className="sell-hero-text">
              <h1>¿Quieres vender tu motocicleta?</h1>
              <p>Publica tu anuncio en segundos y llega a miles de compradores. Fácil, rápido y seguro.</p>
            </div>
            <div className="sell-hero-cta">
              {/* mantenemos la misma apariencia; convertimos a botón para abrir el formulario */}
              <button type="button" className="btn btn-primary" onClick={() => setShowSellForm(true)}>
                Vender ahora
              </button>
            </div>
          </div>
        </section>
        {/* Modal de detalle de moto (componente separado) */}
        <MotosModal
          selectedMoto={selectedMoto}
          onClose={() => setSelectedMoto(null)}
          showContactForm={showContactForm}
          setShowContactForm={setShowContactForm}
          contactForm={contactForm}
          handleContactChange={handleContactChange}
          handleContactSubmit={handleContactSubmit}
          contactSent={contactSent}
          isOwner={currentUserUI && selectedMoto && (Number(currentUserUI.id) === Number(selectedMoto.ownerId) || (selectedMoto.detalle && Number(currentUserUI.id) === Number(selectedMoto.detalle.clienteId)))}
        />
        {/* Formulario ahora en modal/popup (mismo contenido que antes) */}
        {showSellForm && (
          <div className="sell-modal-overlay" onClick={(e) => { if (e.target.classList && e.target.classList.contains('sell-modal-overlay')) { setShowSellForm(false); setEditId(null); } }}>
            <div className="sell-modal" role="dialog" aria-modal="true">
              <button className="modal-close" aria-label="Cerrar" onClick={() => { setShowSellForm(false); setEditId(null); }}>×</button>
              <form className={`sell-form`} onSubmit={handleAddMoto}>
                <div className="sell-form-grid">
                  <div className="sell-form-main">
                    <label>
                      Título
                      <input name="title" value={form.title} onChange={handleFormChange} placeholder="Ej: Yamaha MT-09 2022" required />
                    </label>

                    <label>
                      Modelo
                      <input name="model" value={form.model} onChange={handleFormChange} placeholder="Ej: MT-09" />
                    </label>

                    <label>
                      Revisión vehicular
                      <select name="revision" value={form.revision} onChange={handleFormChange}>
                        <option>Al día</option>
                        <option>Atrasado</option>
                      </select>
                    </label>

                    <label>
                      Estado
                      <select name="condition" value={form.condition} onChange={handleFormChange}>
                        <option>Excelente</option>
                        <option>Muy bueno</option>
                        <option>Bueno</option>
                        <option>Regular</option>
                      </select>
                    </label>

                    <label>
                      Precio
                      <input name="price" value={form.price} onChange={handleFormChange} placeholder="Ej: 9500" required />
                    </label>

                    <label>
                      Ubicación
                      <input name="location" value={form.location} onChange={handleFormChange} placeholder="Ciudad" />
                    </label>

                    <label>
                      Valora tu motocicleta
                      <select name="stars" value={form.stars} onChange={handleFormChange}>
                        <option value={5}>5 - Excelente</option>
                        <option value={4}>4 - Muy bueno</option>
                        <option value={3}>3 - Bueno</option>
                        <option value={2}>2 - Regular</option>
                        <option value={1}>1 - Malo</option>
                      </select>
                    </label>

                    <label className="full">
                      Descripción
                      <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Describe el estado, accesorios, y cualquier detalle relevante" rows={4} />
                    </label>

                    <label>
                      Imagen
                      <input type="file" accept="image/*" name="image" onChange={handleImageChange} />
                    </label>

                    <label>
                      Kilometraje
                      <input name="kilometraje" value={form.kilometraje} onChange={handleFormChange} placeholder="Ej: 12000 km" />
                    </label>

                    <label>
                      Año
                      <input name="year" value={form.year} onChange={handleFormChange} placeholder="Ej: 2019" />
                    </label>

                    <label>
                      Transmisión
                      <select name="transmission" value={form.transmission} onChange={handleFormChange}>
                        <option value="manual">Manual</option>
                        <option value="automatic">Automática</option>
                      </select>
                    </label>

                    <label>
                      Teléfono de contacto
                      <input name="contactPhone" type="tel" value={form.contactPhone} onChange={handleFormChange} placeholder="0987654321" required />
                    </label>

                    <div className="sell-form-actions">
                      <button type="submit" className={`btn btn-primary ${publishLoading ? 'loading' : ''}`} disabled={publishLoading}>
                        {publishLoading ? 'Publicando...' : 'Publicar moto'}
                      </button>
                      <button type="button" className="btn" onClick={() => { setShowSellForm(false); setEditId(null); }} disabled={publishLoading}>Cancelar</button>
                    </div>
                    {publishSuccess && <div className="sell-form-success">Anuncio publicado correctamente.</div>}
                  </div>

                  <aside className="sell-form-preview">
                    <div className="preview-card">
                        <div className="preview-image">
                        <img src={form.img || 'https://loremflickr.com/640/420/motorcycle'} alt={form.title || 'Vista previa'} />
                        <div className="preview-price">${form.price ? formatPrice(form.price) : '0'}</div>
                      </div>
                      <div className="preview-body">
                        <h4>{form.title || 'Título de la moto'}</h4>
                        <div className="preview-meta">{form.model ? <span className="chip">{form.model}</span> : null} <span className="muted">{form.location}</span></div>
                        <p className="preview-desc">{form.description ? form.description.slice(0, 140) + (form.description.length > 140 ? '…' : '') : 'Aquí verás una vista previa de tu anuncio antes de publicar.'}</p>
                        <div className="preview-meta small">{form.year ? <span>{form.year}</span> : null} {form.kilometraje ? <span>• {form.kilometraje}</span> : null} {form.transmission ? <span>• {form.transmission === 'manual' ? 'Manual' : 'Automática'}</span> : null}</div>
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
            <h2><FaMapMarkerAlt className="section-icon" />Motos Recién Publicadas</h2>
          </div>

          <div className="carousel-wrapper">
            <button className="carousel-button left" aria-label="Anterior" onClick={() => scrollCarousel(listRef, -1)}>
              <FaChevronLeft />
            </button>

            <div className="item-cards-carousel">
              <div className="item-cards-grid" ref={listRef}>
                {recentMotos.slice(page * itemsPerPage, (page + 1) * itemsPerPage).map((moto) => (
                <article id={`moto-${moto.id}`} key={moto.id} className="item-card" tabIndex={0} onClick={() => setSelectedMoto(moto)} onKeyDown={(e) => { if (e.key === 'Enter') setSelectedMoto(moto); }}>
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
            </div>

            <button className="carousel-button right" aria-label="Siguiente" onClick={() => scrollCarousel(listRef, 1)}>
              <FaChevronRight />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Motos;
