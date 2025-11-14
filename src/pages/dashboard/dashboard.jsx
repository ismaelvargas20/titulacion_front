import React, { useEffect, useState, useMemo } from 'react';
import '../../assets/scss/dashboard.scss';
import '../../assets/scss/usuarios.scss';

const Dashboard = () => {
  const initialAnnouncements = [
    { id: 1, title: 'Yamaha MT-09 2022', type: 'Moto', author: 'Juan Pérez', state: 'Activo', subtitle: 'Detalles de la moto' },
    { id: 2, title: 'Casco Integral AGV K3', type: 'Repuesto', author: 'María García', state: 'Activo', subtitle: 'Repuesto en buen estado' },
    { id: 3, title: 'Honda CBR600RR', type: 'Moto', author: 'Carlos López', state: 'Activo', subtitle: 'Deportivo, buen estado' },
    { id: 4, title: 'Honda CBR600RR', type: 'Moto', author: 'Carlos López', state: 'Activo', subtitle: 'Deportivo, buen estado' }
  ];

  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [page, setPage] = useState(1);
  const pageSize = 3; // cuando haya 4, la 4ª irá a la página 2
  const totalPages = Math.max(1, Math.ceil(announcements.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return announcements.slice(start, start + pageSize);
  }, [announcements, page]);

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // Forzar estilo inline en botones .btn-view para que conserven el gradiente claro
    const apply = () => {
      document.querySelectorAll('.btn-view').forEach(el => {
        // Aplicar con prioridad important para sobreescribir reglas con !important en CSS
        el.style.setProperty('background', 'linear-gradient(90deg,#0b73ff,#4fb8ff)', 'important');
        el.style.setProperty('background-image', 'linear-gradient(90deg,#0b73ff,#4fb8ff)', 'important');
        el.style.setProperty('color', '#ffffff', 'important');
        el.style.setProperty('border', 'none', 'important');
        el.style.setProperty('box-shadow', '0 12px 30px rgba(11,115,255,0.16)', 'important');
        el.style.setProperty('padding', '6px 12px', 'important');
        el.style.setProperty('border-radius', '8px', 'important');
      });
    };

    // Apply immediately and also after a short delay (in case of late renders)
    apply();
    const t = setTimeout(apply, 120);
    return () => clearTimeout(t);
  }, []);
  
  return (
    <div className="dashboard">
      <main className="dashboard-main">
        <h1 className="dashboard-title">Panel de Administración</h1>
        <p className="dashboard-subtitle">Gestiona usuarios, anuncios y la comunidad de la plataforma</p>

        <section className="dashboard-summary">
          <div className="summary-card">
            <h2>Total Usuarios</h2>
            <span className="summary-icon"><i className="fas fa-users" aria-hidden="true"></i></span>
            <p>1,234</p>
          </div>
          <div className="summary-card">
            <h2>Motos Publicadas</h2>
            <span className="summary-icon"><i className="fas fa-motorcycle" aria-hidden="true"></i></span>
            <p>456</p>
          </div>
          <div className="summary-card">
            <h2>Repuestos Publicados</h2>
            <span className="summary-icon"><i className="fas fa-wrench" aria-hidden="true"></i></span>
            <p>789</p>
          </div>
          <div className="summary-card">
            <h2>Preguntas en el Foro</h2>
            <span className="summary-icon"><i className="fas fa-comments" aria-hidden="true"></i></span>
            <p>234</p>
          </div>
        </section>

        {/* Se eliminaron los botones de acción rápido (Gestionar ...) por petición del diseño */}

        <section className="dashboard-recent">
          <h2>Últimos Anuncios Publicados</h2>
          <div className="usuarios-table-wrap">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>Anuncio</th>
                  <th>Tipo</th>
                  <th>Autor</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(a => (
                  <tr key={a.id} className="usuario-row">
                    <td className="td-user">
                      <div className="td-user-inner">
                        <div className="user-avatar small">{a.title.charAt(0)}</div>
                        <div className="user-meta">
                          <div className="user-name">{a.title}</div>
                          <div className="user-email">{a.subtitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="td-type"><span className="role-badge">{a.type}</span></td>
                    <td className="td-author">{a.author}</td>
                    <td className="td-state"><span className={`state-badge ${a.state === 'Activo' ? 'state-active' : ''}`}>{a.state}</span></td>
                    <td className="td-actions">
                      <div className="actions-wrap">
                        <button className="btn-view" onClick={() => setSelected(a)}>Ver</button>
                        <button className="btn-reject state-suspended" onClick={() => { if(window.confirm('Eliminar anuncio "' + a.title + '" ?')) setAnnouncements(prev => prev.filter(x => x.id !== a.id)); }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination-wrap" style={{ marginTop: 14 }}>
                <div className="pagination">
                  <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)} aria-current={page === i + 1 ? 'page' : undefined}>{i + 1}</button>
                  ))}
                  <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente</button>
                </div>
              </div>
            )}

            {selected && (
              <div className="usuarios-modal-overlay">
                <div className="usuarios-modal">
                  <button className="usuarios-modal-close" onClick={() => setSelected(null)}>×</button>
                  <div className="usuarios-modal-inner">
                    <div className="usuarios-modal-left">
                      <div className="usuarios-modal-avatar">{selected.title.charAt(0)}</div>
                    </div>
                    <div className="usuarios-modal-right">
                      <h2 className="usuarios-modal-name">{selected.title}</h2>
                      <div className="usuarios-modal-city">{selected.type} — {selected.author}</div>
                      <p style={{ marginTop: 12 }}>{selected.subtitle}</p>
                      <div style={{ marginTop: 12 }}><strong>Estado:</strong> {selected.state}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;