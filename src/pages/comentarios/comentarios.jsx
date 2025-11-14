import React, { useState, useMemo, useEffect } from 'react';
import '../../assets/scss/usuarios.scss';
import '../../assets/scss/comentarios.scss';

const initialPosts = [
  { id: 1, question: '¿Cuál es la mejor moto para un principiante en el enduro?', author: 'Carlos Mendez', comments: 12, lastResponder: 'José', reported: false, today: false },
  { id: 2, question: '¿Qué mantenimiento básico debo hacerle a mi trail antes de un viaje largo por Sudamérica?', author: 'Ana Ramírez', comments: 8, lastResponder: 'María', reported: true, today: false },
  { id: 3, question: 'Mejor aceite para una moto 2T', author: 'Luis Torres', comments: 5, lastResponder: 'Pedro', reported: false, today: true },
  { id: 4, question: '¿Vale la pena la nueva Himalayan 450?', author: 'María Fernández', comments: 3, lastResponder: null, reported: false, today: false },
  { id: 5, question: '¿Qué casco es mejor para la ciudad?', author: 'Diego López', comments: 2, lastResponder: 'Ana', reported: false, today: false },
  { id: 6, question: '¿Cómo ajustar la suspensión trasera?', author: 'Sofía Ruiz', comments: 6, lastResponder: 'Carlos', reported: true, today: false },
];

export default function Comentarios() {
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 4; // items por página

  const totalQuestions = posts.length;
  // Contadores claros: 'Respondidas' = preguntas con al menos 1 comentario
  const answeredCount = posts.filter(p => (p.comments || 0) > 0).length;
  // 'Nuevas hoy' = posts marcados con la bandera `today` en datos de ejemplo
  const newTodayCount = posts.filter(p => p.today).length;
  // Contador de publicaciones reportadas (para acceso rápido)
  const reportedCount = posts.filter(p => p.reported).length;

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
    const p = posts.find(x => x.id === id);
    if (!p) return;
    alert(`Ver pregunta:\n\n${p.question}\n\nPor: ${p.author}\nComentarios: ${p.comments}  Likes: ${p.likes}`);
  }

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
                      <button className="btn" onClick={() => viewPost(p.id)} title="Ver"><i className="fas fa-eye" /></button>
                      <button className="btn" onClick={() => toggleReport(p.id)} title="Marcar/Desmarcar reportado"><i className="fas fa-flag" /></button>
                      <button className="btn danger" onClick={() => deletePost(p.id)} title="Eliminar"><i className="fas fa-trash" /></button>
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
      </main>
    </div>
  );
}
