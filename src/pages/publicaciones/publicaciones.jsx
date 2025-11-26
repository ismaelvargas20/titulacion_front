import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/scss/publicaciones.scss';
import { FaEdit, FaTimes, FaCheck } from 'react-icons/fa';
import * as publicacionesService from '../../services/motos';
import Swal from 'sweetalert2';

export default function Publicaciones() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Nota: los contadores globales se muestran y gestionan en `posteadas.jsx`.

  const removePost = async (id) => {
    // localizar la publicación completa en el estado para saber si está vendida
    const target = posts.find(x => x.id === id);
    const confirmOptions = target && isSold(target) ? {
      title: 'Eliminar este anuncio vendido?',
      text: '¿Deseas continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    } : {
      title: '¿Eliminar publicación?',
      text: 'Esta acción marcará la publicación como eliminada. ¿Deseas continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    };

    const confirm = await Swal.fire(confirmOptions);
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      // Si la publicación ya está vendida, NO cambiar su estado en servidor: solo ocultarla localmente
      if (target && isSold(target)) {
        // ocultar localmente sin tocar la BD (estado seguirá siendo 'Vendido')
        setPosts((p) => p.filter(x => x.id !== id));
        try {
          const curRaw = typeof window !== 'undefined' ? sessionStorage.getItem('currentUser') : null;
          const cur = curRaw ? JSON.parse(curRaw) : null;
          const key = cur && cur.id ? `removedPublicaciones_user_${cur.id}` : 'removedPublicaciones';
          const raw = localStorage.getItem(key) || '[]';
          const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
          if (!arr.includes(id)) arr.push(id);
          localStorage.setItem(key, JSON.stringify(arr));
          window.dispatchEvent(new CustomEvent('publicacion:removed', { detail: { id } }));
        } catch (e) { /* noop */ }
        try { Swal.fire({ icon: 'success', title: 'Eliminada', text: 'La publicación se eliminó correctamente.', timer: 1600, showConfirmButton: false }); } catch(e){}
      } else {
        // comportamiento existente: llamar al backend para eliminar
        await publicacionesService.eliminarPublicacion(id);
        // eliminar del estado local
        setPosts((p) => p.filter(x => x.id !== id));
        // almacenar id en localStorage para que otras páginas lo filtren
        try {
          const curRaw = typeof window !== 'undefined' ? sessionStorage.getItem('currentUser') : null;
          const cur = curRaw ? JSON.parse(curRaw) : null;
          const key = cur && cur.id ? `removedPublicaciones_user_${cur.id}` : 'removedPublicaciones';
          const raw = localStorage.getItem(key) || '[]';
          const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
          if (!arr.includes(id)) arr.push(id);
          localStorage.setItem(key, JSON.stringify(arr));
          // emitir evento global para actualización inmediata en otras vistas
          window.dispatchEvent(new CustomEvent('publicacion:removed', { detail: { id } }));
        } catch (e) { /* noop */ }
        try { Swal.fire({ icon: 'success', title: 'Eliminada', text: 'La publicación se eliminó correctamente.', timer: 1600, showConfirmButton: false }); } catch(e){}
      }
    } catch (err) {
      console.error('Error al eliminar publicación', err);
      setError('No se pudo eliminar la publicación.');
      try { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la publicación.' }); } catch(e){}
    } finally {
      setLoading(false);
    }
  };

  const isSold = (p) => {
    if (!p) return false;
    const status = (p.status || p.estado || (p.detalle && p.detalle.estado) || '').toString().toLowerCase();
    if (status.includes('vend')) return true;
    if (p.vendido === true) return true;
    if (p.detalle && (p.detalle.vendido === true || (p.detalle.estado && p.detalle.estado.toString().toLowerCase().includes('vend')))) return true;
    return false;
  };

  const markSold = async (id) => {
    const confirm = await Swal.fire({
      title: 'Marcar como vendido?',
      text: 'La publicación cambiará su estado a VENDIDO.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar',
      cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;
    try {
      setLoading(true);
      await publicacionesService.actualizarPublicacion(id, { estado: 'Vendido' });
      // actualizar localmente el estado a "Vendido" para que aparezca la etiqueta
      setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'Vendido' } : p));
      // notificar a otras vistas para que retiren la publicación de sus listados (p.ej. carrusel)
      try { window.dispatchEvent(new CustomEvent('publicacion:removed', { detail: { id } })); } catch (e) {}
      try { Swal.fire({ icon: 'success', title: 'Listo', text: 'La publicación fue marcada como vendida.', timer: 1400, showConfirmButton: false }); } catch(e){}
    } catch (err) {
      console.error('Error marcando vendido', err);
      setError('No se pudo marcar como vendido.');
      try { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo marcar como vendido.' }); } catch(e){}
    } finally {
      setLoading(false);
    }
  };

  // Helper para obtener ids removidos desde localStorage (clave por usuario si hay sesión)
  const getRemovedIds = () => {
    try {
      const curRaw = typeof window !== 'undefined' ? sessionStorage.getItem('currentUser') : null;
      const cur = curRaw ? JSON.parse(curRaw) : null;
      const key = cur && cur.id ? `removedPublicaciones_user_${cur.id}` : 'removedPublicaciones';
      const raw = localStorage.getItem(key) || '[]';
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.map((v) => (typeof v === 'string' && !isNaN(Number(v)) ? Number(v) : v));
    } catch (e) { return []; }
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // obtener id del usuario en sesión y pedir solo sus publicaciones
        let currentRaw = null;
        try { currentRaw = typeof window !== 'undefined' ? sessionStorage.getItem('currentUser') : null; } catch(e) { currentRaw = null; }
        let clienteId = null;
        try {
          const cur = currentRaw ? JSON.parse(currentRaw) : null;
          clienteId = cur && (cur.id || cur.clienteId || cur.userId) ? (cur.id || cur.clienteId || cur.userId) : null;
        } catch (e) { clienteId = null; }
        const params = { includeDetails: 'true' };
        if (clienteId) params.clienteId = clienteId;
        const data = await publicacionesService.listarPublicaciones(params);
        if (!mounted) return;
        const mapped = (Array.isArray(data) ? data : []).map((p) => {
          const detalle = p.detalle || {};
          const contactPhone = detalle.telefono_contacto || detalle.phone || p.telefono || p.phone || null;
          return {
            id: p.id || (p.publicacion && p.publicacion.id),
            type: p.tipo || detalle.tipo || 'publicacion',
            title: p.titulo || (p.publicacion && p.publicacion.titulo) || p.title || '',
            price: p.precio || (p.publicacion && p.publicacion.precio) || p.price || 0,
            stars: detalle.estrellas || p.estrellas || 0,
            status: p.estado || (p.publicacion && p.publicacion.estado) || 'Activa',
            img: (p.imagenes && p.imagenes[0] && (p.imagenes[0].url || p.imagenes[0].path)) || (p.publicacion && p.publicacion.imagenes && p.publicacion.imagenes[0] && p.publicacion.imagenes[0].url) || 'https://loremflickr.com/320/200/motorcycle',
            // campos adicionales para edición
            model: detalle.modelo || p.modelo || null,
            revision: detalle.revision || p.revision || null,
            condition: detalle.condicion || detalle.estado || p.condicion || null,
            location: detalle.ubicacion || p.ubicacion || p.location || null,
            description: p.descripcion || p.description || '',
            kilometraje: detalle.kilometraje || p.kilometraje || null,
            year: detalle.anio || p.anio || p.year || null,
            transmission: detalle.transmision || p.transmision || detalle.transmission || null,
            contactPhone: contactPhone,
            contact: { phone: contactPhone },
            detalle: detalle,
            imagenes: p.imagenes || (p.publicacion && p.publicacion.imagenes) || []
          };
        });
        // Ocultar por defecto las publicaciones marcadas como eliminadas en la BD
        const visibleByEstado = (Array.isArray(mapped) ? mapped : []).filter((p) => {
          const st = (p.status || p.estado || (p.detalle && p.detalle.estado) || '').toString().toLowerCase();
          return st !== 'eliminado';
        });
        // aplicar filtrado inicial por ids removidos (persistencia local, por usuario si aplica)
        try {
          const removed = getRemovedIds();
          let final = visibleByEstado;
          if (Array.isArray(removed) && removed.length > 0) {
            final = final.filter(p => !removed.includes(Number(p.id)));
          }
          setPosts(final);
        } catch (e) {
          setPosts(visibleByEstado);
        }
        // contadores globales gestionados en `posteadas.jsx`; no inicializamos aquí
      } catch (err) {
        console.error('Error cargando publicaciones', err);
        if (mounted) setError('Error cargando publicaciones');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Contadores globales: la implementación y visualización quedan en `posteadas.jsx`.

  const [page, setPage] = useState(1);
  const pageSize = 4; // coincidir con comentarios

  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return posts.slice(start, start + pageSize);
  }, [posts, page]);

  useEffect(() => {
    setPage(p => Math.min(p, totalPages));
  }, [totalPages]);

  return (
    <div className="publicaciones-page">
      <main className="publicaciones-main">
        <section className="publicaciones-hero" aria-label="Tus publicaciones">
          <div className="publicaciones-hero-inner">
            <div className="publicaciones-hero-text">
              <h1>Mis publicaciones</h1>
              <p>Aquí puedes ver las publicaciones que hayas subido: motocicletas o repuestos. Desde esta sección puedes editar o eliminar tus anuncios.</p>
            </div>
            <div className="publicaciones-hero-cta">
              <button type="button" className="hero-sell-btn" onClick={() => navigate('/')}>Ir a inicio</button>
            </div>
          </div>
        </section>

            {/* Resumen global eliminado: se muestra en `posteadas.jsx` para evitar duplicación */}

        <div className="section-header">
          <h2>Mis publicaciones</h2>
        </div>

        <div className="posts-grid">
          {loading && <p className="muted">Cargando publicaciones...</p>}
          {!loading && posts.length === 0 && <p className="muted">No tienes publicaciones todavía.</p>}
          {error && <p className="error muted">{error}</p>}
          {paginated.map((p) => (
            <div key={p.id} className={`post-card ${isSold(p) ? 'sold' : ''}`}>
              <img src={p.img} alt={p.title} className="post-image" />
                  <div className="post-body">
                <strong className="post-title">{p.title}</strong>
                <div className="post-meta muted">{p.type === 'moto' ? 'Moto' : 'Repuesto'} • ${p.price} • {p.stars} ⭐</div>
                    {isSold(p) && <div className="sold-label">VENDIDO</div>}
              </div>
                  <div className="post-actions">
                    {!isSold(p) && (
                      <button className="btn" onClick={() => {
                          // Normalizar objeto que enviamos a la ruta de edición para asegurar que
                          // el teléfono y otros aliases siempre estén presentes.
                          const normalized = {
                            ...p,
                            contactPhone: p.contactPhone || (p.detalle && (p.detalle.telefono_contacto || p.detalle.phone)) || p.telefono || p.phone || '',
                            contact: { phone: p.contactPhone || (p.detalle && (p.detalle.telefono_contacto || p.detalle.phone)) || p.telefono || p.phone || '' },
                            detalle: p.detalle || {}
                          };
                          if (p.type === 'moto') {
                            // Navegar a la página de Motos y solicitar que abra el formulario de edición
                            navigate('/motos', { state: { editMoto: normalized } });
                          } else {
                            // Navegar a la página de Repuestos y solicitar que abra el formulario de edición
                            navigate('/repuestos', { state: { editPart: normalized } });
                          }
                        }}>
                        <FaEdit /> Editar
                      </button>
                    )}
                {!isSold(p) ? (
                  <button className="btn btn-sold" onClick={() => markSold(p.id)}><FaCheck className="btn-icon" />Marcar como vendido</button>
                ) : (
                  <button className="btn btn-sold" disabled><FaCheck className="btn-icon" />Vendido</button>
                )}
                <button className="btn btn-danger" onClick={() => removePost(p.id)}><FaTimes /> Eliminar</button>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación (igual diseño que en comentarios) */}
        {totalPages > 1 && (
          <div className="pagination-wrap" style={{ marginTop: 14 }}>
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
