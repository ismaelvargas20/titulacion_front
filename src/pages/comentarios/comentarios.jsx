import React, { useState, useMemo, useEffect } from 'react';
import '../../assets/scss/usuarios.scss';
import '../../assets/scss/comentarios.scss';
import { listarHilos, detalleHilo, eliminarHilo, eliminarRespuesta } from '../../services/comunidad';
import { FaSyncAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

// initialPosts se mantiene como ejemplo en el repo pero por defecto usaremos carga desde API
const initialPosts = [];

// Helper: detectar si una fecha está en el mismo día (considera strings y timestamps)
function isSameDay(dateLike) {
  if (!dateLike) return false;
  const d = typeof dateLike === 'string' ? new Date(dateLike) : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function Comentarios() {
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 4; // items por página
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalComments, setModalComments] = useState([]);
  // Contadores globales (se calculan desde la carga general y no cambian con filtros)
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [answeredCountTotal, setAnsweredCountTotal] = useState(0);
  const [newTodayCountTotal, setNewTodayCountTotal] = useState(0);

  // Cargar datos reales desde backend al montar el componente y al cambiar filtro
  // función reutilizable para cargar hilos (la usaremos desde botones y useEffect)
  async function fetchHilos(whichFilter) {
    let mounted = true;
    try {
      const params = { limit: 100 };
      if (whichFilter === 'deleted' || filter === 'deleted') params.onlyDeleted = 'true';
      const data = await listarHilos(params);
      if (!mounted) return;
      let arr = [];
      if (!Array.isArray(data)) {
        arr = Array.isArray(data.hilos) ? data.hilos : [];
      } else {
        arr = data;
      }
      // Si pedimos 'deleted' pero la respuesta no contiene ningun hilo marcado
      // como 'eliminado', hacemos un fallback: pedimos todo y filtramos en
      // frontend. Esto cubre casos donde el backend ignore el parámetro.
      if (whichFilter === 'deleted' || filter === 'deleted') {
        // Si hay un endpoint dedicado, usarlo (más fiable). Intentamos usarlo
        // en primera instancia; si falla, usamos la respuesta original.
        try {
          // llamar al endpoint especializado (nuevo service `listarHilosEliminados`)
          // lo importamos dinámicamente para evitar ciclos en testing
          const { listarHilosEliminados } = await import('../../services/comunidad');
          const delData = await listarHilosEliminados({ limit: 100 });
          const delArr = Array.isArray(delData) ? delData : (Array.isArray(delData.hilos) ? delData.hilos : []);
          setPosts(delArr.map(mapHiloToPost));
        } catch (eEndpoint) {
          // si no está disponible, caer al comportamiento anterior (usar lo que vino)
          setPosts(arr.map(mapHiloToPost));
        }
      } else {
        const mapped = arr.map(mapHiloToPost);
        setPosts(mapped);
        // actualizar contadores globales basados en el conjunto general
        setTotalQuestionsCount(mapped.length);
        setAnsweredCountTotal(mapped.filter(p => (p.comments || 0) > 0).length);
        setNewTodayCountTotal(mapped.filter(p => p.today).length);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error cargando hilos:', err);
      // mostrar feedback visible en UI si quieres (descomentarlo)
      // Swal.fire({ title: 'Error', text: String(err.message || err), icon: 'error' });
    }
    return () => { mounted = false; };
  }

  // Obtener solo los contadores globales (no altera la lista mostrada)
  async function fetchGlobalCounts() {
    try {
      const data = await listarHilos({ limit: 500 });
      const arr = Array.isArray(data) ? data : (Array.isArray(data.hilos) ? data.hilos : []);
      const mapped = arr.map(mapHiloToPost);
      setTotalQuestionsCount(mapped.length);
      setAnsweredCountTotal(mapped.filter(p => (p.comments || 0) > 0).length);
      setNewTodayCountTotal(mapped.filter(p => p.today).length);
    } catch (err) {
      // no bloquear la UI por fallos en contadores
      // eslint-disable-next-line no-console
      console.warn('No se pudieron actualizar contadores globales:', err && err.message ? err.message : err);
    }
  }

  useEffect(() => {
    fetchHilos(filter);
  }, [filter]);

  // Inicializar contadores al montar y escuchar eventos externos de creación
  // de hilos para refrescar contadores y recargar la lista cuando otra
  // parte de la app cree uno. Dependemos de `filter` para que al cambiar
  // el filtro el listener tenga la versión correcta.
  useEffect(() => {
    // cargar valores iniciales de contadores
    fetchGlobalCounts();

    // listener que otras partes de la app pueden disparar:
    // window.dispatchEvent(new Event('hiloCreado'))
    // Cuando se recibe, refrescamos contadores y la lista actual.
    const onHiloCreado = (ev) => {
      fetchGlobalCounts();
      // refrescar la lista visible (usa el filtro actual)
      try {
        fetchHilos(filter);
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('hiloCreado', onHiloCreado);
    return () => {
      window.removeEventListener('hiloCreado', onHiloCreado);
    };
  }, [filter]);

  // Normalizador: convierte un objeto hilo del backend al formato usado por este componente
  function mapHiloToPost(h) {
    const id = h.id || h.hiloId || h.hilo_id || null;
    const question = h.titulo || h.title || h.question || h.pregunta || 'Sin título';
    const author = h.autor_nombre || (h.cliente && (h.cliente.nombre || h.cliente.nombre_completo)) || h.autor || 'Anónimo';
    // respuestas pueden venir como array o como contador
    const commentsList = Array.isArray(h.respuestas) ? h.respuestas.map(r => ({ id: r.id, author: r.autor_nombre || r.autor || r.cliente_nombre || 'Anónimo', text: r.cuerpo || r.text || r.body || '', date: r.fecha_creacion || r.fecha_modificacion || r.createdAt })) : [];
    // Preferir conteo total si el backend lo provee (respuestasCountAll),
    // luego conteo activo (respuestasCount / respuestas_count), y por último
    // fallback al tamaño del array si está presente.
    const comments = (commentsList.length) || (typeof h.respuestasCountAll === 'number' ? h.respuestasCountAll : (typeof h.respuestas_count === 'number' ? h.respuestas_count : (h.respuestasCount || h.cantidad_respuestas || 0)));
    // el backend expone `ultimaRespuesta` en listarHilos (objeto con autor_nombre y cuerpo)
    const lastResponder = (h.ultimaRespuesta && (h.ultimaRespuesta.autor_nombre || h.ultimaRespuesta.autor)) || (commentsList.length ? commentsList[commentsList.length - 1].author : (h.ultima_respuesta_por || h.lastResponder || null));
    const created = h.fecha_creacion || h.createdAt || h.created_at || null;
    const today = isSameDay(created);
    const reported = Boolean(h.reportado || h.reported || h.estado === 'reportado');
    const estado = h.estado || null;
    return { id, question, author, comments, lastResponder, reported, today, commentsList, estado };
  }

  // Mostrar contadores globales calculados desde la carga general
  const totalQuestions = totalQuestionsCount;
  // Contadores claros: 'Respondidas' = preguntas con al menos 1 comentario
  const answeredCount = answeredCountTotal;
  // 'Nuevas hoy' = posts marcados con la bandera `today` en datos de ejemplo
  const newTodayCount = newTodayCountTotal;
  // Contador de publicaciones reportadas (para acceso rápido)

  const filtered = useMemo(() => {
    let base = posts;
    // Garantía en frontend: si el usuario seleccionó 'Eliminadas', asegurarnos
    // de mostrar sólo hilos cuyo estado sea 'eliminado' aunque el backend
    // devolviera resultados mixtos.
    if (filter === 'deleted') {
      return base.filter(p => p.estado === 'eliminado');
    }
    if (filter === 'most') {
      return [...posts].sort((a, b) => (b.comments || 0) - (a.comments || 0));
    }
    if (filter === 'responded') base = base.filter(p => (p.comments || 0) > 0);
    if (filter === 'unanswered') base = base.filter(p => (p.comments || 0) === 0);
    if (filter === 'new') base = base.filter(p => p.today);
    if (filter === 'reported') base = base.filter(p => p.reported);
    return base;
  }, [filter, posts]);

  // reset página al cambiar filtro
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  async function deletePost(id) {
    const resp = await Swal.fire({
      title: '¿Eliminar pregunta?',
      text: 'Esta acción eliminará la pregunta (y sus respuestas) en el backend.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });
    if (!(resp && resp.isConfirmed)) return;

    // intentar eliminar en backend
    try {
      await eliminarHilo(id);
      // actualizar UI: quitar hilo de la lista
      setPosts(prev => prev.filter(p => p.id !== id));
      // refrescar contadores globales (frontend-only) sin cambiar la vista actual
      fetchGlobalCounts();
      Swal.fire({ title: 'Eliminada', text: 'La pregunta y sus respuestas fueron eliminadas.', icon: 'success', timer: 1400, showConfirmButton: false });
    } catch (err) {
      console.error('Error eliminando hilo:', err);
      const msg = (err && err.response && err.response.data && (err.response.data.error || err.response.data.message)) || err.message || 'Error eliminando en servidor';
      Swal.fire({ title: 'Error', text: String(msg), icon: 'error' });
    }
  }

  async function viewPost(id) {
    console.log('viewPost()', id);
    const p = posts.find(x => x.id === id);
    if (!p) return;
    setSelectedPost(p);
    // solicitar detalle al backend para obtener todas las respuestas
    try {
      // Si estamos viendo hilos eliminados, pedir detalle incluyendo elementos eliminados
      const { detalleHiloAdmin } = await import('../../services/comunidad');
      const res = (filter === 'deleted') ? await detalleHiloAdmin(id) : await detalleHilo(id);
      // res: { hilo, respuestas }
      const respuestas = Array.isArray(res && res.respuestas) ? res.respuestas.map(r => ({ id: r.id, author: r.autor_nombre || r.autor || r.cliente_nombre || 'Anónimo', text: r.cuerpo || r.text || r.body || '', date: r.fecha_creacion || r.fecha_modificacion || r.createdAt })) : [];
      setModalComments(respuestas);
      // actualizar también el entry en la lista (opcional) para reflejar último responder y conteo
      setPosts(prev => prev.map(item => item.id === p.id ? { ...item, comments: respuestas.length || item.comments, lastResponder: respuestas.length ? respuestas[respuestas.length - 1].author : item.lastResponder } : item));
    } catch (err) {
      console.error('Error cargando detalle de hilo:', err);
      // fallback a lo que ya tiene
      setModalComments(p.commentsList ? [...p.commentsList] : []);
    }
  }

  async function deleteComment(responseId) {
    const resp = await Swal.fire({
      title: '¿Eliminar respuesta?',
      text: 'La respuesta será marcada como eliminada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });
    if (!(resp && resp.isConfirmed)) return;

    try {
      await eliminarRespuesta(responseId);
      setModalComments(prev => prev.filter(c => c.id !== responseId));
      setPosts(prev => prev.map(p => {
        if (!selectedPost) return p;
        if (p.id === selectedPost.id) {
          const newCount = Math.max(0, (p.comments || 0) - 1);
          return { ...p, comments: newCount };
        }
        return p;
      }));
      setSelectedPost(s => s ? { ...s, comments: Math.max(0, (s.comments || 0) - 1) } : s);
      fetchGlobalCounts();
      Swal.fire({ title: 'Se ha eliminado la respuesta con éxito.', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch (err) {
      console.error('Error eliminando respuesta:', err);
      const msg = (err && err.response && err.response.data && (err.response.data.error || err.response.data.message)) || err.message || 'Error en servidor';
      Swal.fire({ title: 'Error', text: String(msg), icon: 'error' });
    }
  }

  function closeModal() {
    setSelectedPost(null);
    setModalComments([]);
  }

  // Modal es solo de lectura (sin publicar)

  // cerrar modal con Escape
  useEffect(() => {
    if (!selectedPost) return;
    function onKey(e) {
      if (e.key === 'Escape') closeModal();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPost]);

  return (
    <div className="comentarios-admin-page">
      <main className="usuarios-main">
        <h1 className="usuarios-title">Moderación de Comunidad</h1>
        <p className="usuarios-subtitle">Supervisa y modera el contenido de la comunidad</p>

        <section className="usuarios-summary">
          <div className="sum-card">
            <div className="sum-icon sum-icon-motos"><i className="fas fa-list" aria-hidden="true"></i></div>
            <h3>Total Preguntas</h3>
            <p className="sum-value">{totalQuestions}</p>
          </div>
          <div className="sum-card">
            <div className="sum-icon sum-icon-suspended"><i className="fas fa-reply" aria-hidden="true"></i></div>
            <h3>Respondidas</h3>
            <p className="sum-value sum-orange">{answeredCount}</p>
          </div>
          <div className="sum-card">
            <div className="sum-icon sum-icon-active"><i className="fas fa-calendar-day" aria-hidden="true"></i></div>
            <h3>Nuevas hoy</h3>
            <p className="sum-value sum-green">{newTodayCount}</p>
          </div>
        </section>

        <div className="page-grid">
          <section>
            <h2 className="section-title">Preguntas Recientes</h2>
            <div className="filters-top">
              <div className="filters-row">
                <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
                <button className={`filter-btn ${filter === 'responded' ? 'active' : ''}`} onClick={() => setFilter('responded')}>Respondidas</button>
                <button className={`filter-btn ${filter === 'most' ? 'active' : ''}`} onClick={() => setFilter('most')}>Más interacción</button>
                <button className={`filter-btn ${filter === 'unanswered' ? 'active' : ''}`} onClick={() => setFilter('unanswered')}>Sin responder</button>
                <button className={`filter-btn ${filter === 'new' ? 'active' : ''}`} onClick={() => setFilter('new')}>Nuevas hoy</button>
                <button className={`filter-btn ${filter === 'deleted' ? 'active' : ''}`} onClick={() => { setFilter('deleted'); fetchHilos('deleted'); }}>Eliminadas</button>
                <button className="filter-btn clear" onClick={() => { setFilter('all'); fetchHilos('all'); }} aria-label="Limpiar filtros">
                  <FaSyncAlt style={{ marginRight: 8 }} />Limpiar
                </button>
              </div>
              {/* Debug info removed */}
            </div>

            <div className="usuarios-table-wrap">
              {paginated.map(p => (
                <div key={p.id} className="user-card" style={{ marginBottom: 12 }}>
                  <div className="cm-item-body" style={{ padding: 12 }}>
                    <div className="cm-avatar" aria-hidden>
                      {p.author ? String(p.author).charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: 0 }}>{p.question}</h4>
                          <div style={{ color: '#6b7280', marginTop: 6 }}>Por {p.author}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ color: '#6b7280', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-comment" /> <span className="comment-count">{p.comments}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#6b7280' }}>{p.lastResponder ? `Última respuesta de ${p.lastResponder}` : 'Última respuesta: —'}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" className="btn" onClick={() => viewPost(p.id)} title="Ver"><i className="fas fa-eye" /></button>
                          {filter !== 'deleted' && (
                            <button type="button" className="btn danger" onClick={() => deletePost(p.id)} title="Eliminar"><i className="fas fa-trash" /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
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

            {/* filtros movidos arriba (sticky) */}
          </section>

          <aside>
            {/* Tendencias eliminadas según solicitud del usuario */}
          </aside>
        </div>

        {/* Modal de comentarios (inline) */}
        {selectedPost && (
          <div className="comments-modal-overlay" role="dialog" aria-modal="true" onClick={closeModal}>
            <div className="comments-modal" onClick={e => e.stopPropagation()}>
              <header className="cm-header">
                <div className="cm-title-group">
                  <h3 style={{ margin: 0 }}>{selectedPost.question}</h3>
                  <div className="cm-sub">Por <strong>{selectedPost.author}</strong> · <span className="cm-badge">{selectedPost.comments} comentarios</span></div>
                </div>
                <div className="cm-actions">
                  <button className="cm-close" onClick={closeModal} aria-label="Cerrar">×</button>
                </div>
              </header>

              <div className="cm-body">
                {modalComments.length === 0 ? (
                  <div className="cm-empty">No hay comentarios.</div>
                ) : (
                  <ul className="cm-list">
                    {modalComments.map(c => {
                      const initials = (c.author || 'A').split(' ').map(s => s[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
                      return (
                        <li key={c.id} className="cm-item">
                          <div className="cm-item-body">
                            <div className="cm-avatar">{initials}</div>
                            <div className="cm-content">
                              <div className="cm-item-head">
                                <strong className="cm-author">{c.author}</strong>
                                <span className="cm-date">{c.date}</span>
                              </div>
                              <div className="cm-text">{c.text}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 12 }}>
                              {filter !== 'deleted' && (
                                <button type="button" className="btn danger small" onClick={() => deleteComment(c.id)} title="Eliminar respuesta">
                                  <i className="fas fa-trash" />
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* footer removido: modal solo de visualización */}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
