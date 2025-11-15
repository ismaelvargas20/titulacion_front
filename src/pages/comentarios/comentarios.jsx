import React, { useState, useMemo, useEffect } from 'react';
import '../../assets/scss/usuarios.scss';
import '../../assets/scss/comentarios.scss';

const initialPosts = [
  {
    id: 1,
    question: '¿Cuál es la mejor moto para un principiante en el enduro?',
    author: 'Carlos Mendez',
    comments: 12,
    lastResponder: 'José',
    reported: false,
    today: false,
    commentsList: [
      { id: 101, author: 'José', text: 'Yo recomiendo una 250cc ligera para empezar.', date: '2025-11-10 10:12' },
      { id: 102, author: 'María', text: 'Coincido, y con suspensiones ajustables.', date: '2025-11-11 09:02' },
      { id: 103, author: 'Luis', text: 'También considerar una moto con buen soporte de servicio local.', date: '2025-11-11 11:20' },
      { id: 104, author: 'Ana', text: 'No olvides revisar la ergonomía y el asiento para viajes largos.', date: '2025-11-12 08:45' },
      { id: 105, author: 'Pedro', text: 'Una 250 o 300 suele ser ideal para iniciarse.', date: '2025-11-12 10:05' },
      { id: 106, author: 'Sofía', text: 'Busca repuestos fáciles de conseguir en tu zona.', date: '2025-11-12 12:30' },
      { id: 107, author: 'Carlos', text: 'La relación peso-potencia es clave para practicar enduro.', date: '2025-11-12 13:50' },
      { id: 108, author: 'Mariana', text: 'Asegúrate de llevar protección adecuada y practicar en terrenos seguros.', date: '2025-11-12 15:10' },
      { id: 109, author: 'Diego', text: 'Si vas a salir de ruta, opta por llantas aptas para tierra.', date: '2025-11-12 16:00' },
      { id: 110, author: 'Lucía', text: 'Una moto con suspensión ajustable te ayudará mucho.', date: '2025-11-12 17:22' },
      { id: 111, author: 'Fernando', text: 'Prueba la moto antes de comprarla para sentir la manejabilidad.', date: '2025-11-12 18:05' },
      { id: 112, author: 'Raquel', text: 'Consulta foros locales para recomendaciones de taller.', date: '2025-11-12 19:40' }
    ]
  },
  {
    id: 2,
    question: '¿Qué mantenimiento básico debo hacerle a mi trail antes de un viaje largo por Sudamérica?',
    author: 'Ana Ramírez',
    comments: 8,
    lastResponder: 'María',
    reported: true,
    today: false,
    commentsList: [
      { id: 201, author: 'Luis', text: 'Revisar frenos, cadena y nivel de aceite.', date: '2025-11-09 12:01' }
    ]
  },
  {
    id: 3,
    question: 'Mejor aceite para una moto 2T',
    author: 'Luis Torres',
    comments: 5,
    lastResponder: 'Pedro',
    reported: false,
    today: true,
    commentsList: [{ id: 301, author: 'Pedro', text: 'Usa aceite sintético de buena marca.', date: '2025-11-12 08:30' }]
  },
  {
    id: 4,
    question: '¿Vale la pena la nueva Himalayan 450?',
    author: 'María Fernández',
    comments: 3,
    lastResponder: null,
    reported: false,
    today: false,
    commentsList: []
  },
  {
    id: 5,
    question: '¿Qué casco es mejor para la ciudad?',
    author: 'Diego López',
    comments: 2,
    lastResponder: 'Ana',
    reported: false,
    today: false,
    commentsList: [{ id: 501, author: 'Ana', text: 'Busca homologación y buena visibilidad.', date: '2025-11-08 14:20' }]
  },
  {
    id: 6,
    question: '¿Cómo ajustar la suspensión trasera?',
    author: 'Sofía Ruiz',
    comments: 6,
    lastResponder: 'Carlos',
    reported: true,
    today: false,
    commentsList: [{ id: 601, author: 'Carlos', text: 'Siguiendo el manual y midiendo pre-carga.', date: '2025-11-07 11:44' }]
  },
];

export default function Comentarios() {
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 4; // items por página
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalComments, setModalComments] = useState([]);

  const totalQuestions = posts.length;
  // Contadores claros: 'Respondidas' = preguntas con al menos 1 comentario
  const answeredCount = posts.filter(p => (p.comments || 0) > 0).length;
  // 'Nuevas hoy' = posts marcados con la bandera `today` en datos de ejemplo
  const newTodayCount = posts.filter(p => p.today).length;
  // Contador de publicaciones reportadas (para acceso rápido)

  const filtered = useMemo(() => {
    let base = posts;
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

  function deletePost(id) {
    if (!window.confirm('Eliminar pregunta?')) return;
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  function toggleReport(id) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, reported: !p.reported } : p));
  }

  function viewPost(id) {
    console.log('viewPost()', id);
    const p = posts.find(x => x.id === id);
    if (!p) return;
    setSelectedPost(p);
    setModalComments(p.commentsList ? [...p.commentsList] : []);
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
                <button className={`filter-btn ${filter === 'reported' ? 'active' : ''}`} onClick={() => setFilter('reported')}>Reportadas</button>
                <button className="filter-btn clear" onClick={() => setFilter('all')}>Limpiar</button>
              </div>
            </div>

            <div className="usuarios-table-wrap">
              {paginated.map(p => (
                <div key={p.id} className="user-card" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{p.question}</h4>
                      <div style={{ color: '#6b7280', marginTop: 6 }}>Por {p.author}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ color: '#6b7280', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="fas fa-comment" /> <span className="comment-count">{p.comments}</span>
                      </div>
                      {p.reported && <span className="state-badge state-suspended">Reportada</span>}
                    </div>
                  </div>

                  <div className="card-body" style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#6b7280' }}>{p.lastResponder ? `Última respuesta de ${p.lastResponder}` : 'Última respuesta: —'}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn" onClick={() => { console.log('click ver', p.id); viewPost(p.id); }} title="Ver"><i className="fas fa-eye" /></button>
                      <button type="button" className="btn" onClick={() => toggleReport(p.id)} title="Marcar/Desmarcar reportado"><i className="fas fa-flag" /></button>
                      <button type="button" className="btn danger" onClick={() => deletePost(p.id)} title="Eliminar"><i className="fas fa-trash" /></button>
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
                <div>
                  <h3 style={{ margin: 0 }}>{selectedPost.question}</h3>
                  <div style={{ color: '#6b7280', marginTop: 6 }}>Por {selectedPost.author} · {selectedPost.comments} comentarios</div>
                </div>
                <button className="cm-close" onClick={closeModal} aria-label="Cerrar">×</button>
              </header>

              <div className="cm-body">
                {modalComments.length === 0 ? (
                  <div className="cm-empty">Aún no hay comentarios. Sé el primero en comentar.</div>
                ) : (
                  <ul className="cm-list">
                    {modalComments.map(c => (
                      <li key={c.id} className="cm-item">
                        <div className="cm-item-head">
                          <strong className="cm-author">{c.author}</strong>
                          <span className="cm-date">{c.date}</span>
                        </div>
                        <div className="cm-text">{c.text}</div>
                      </li>
                    ))}
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
