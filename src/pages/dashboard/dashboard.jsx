import React, { useEffect, useState, useMemo } from 'react';
import '../../assets/scss/dashboard.scss';
import '../../assets/scss/usuarios.scss';
import MotosModal from '../motos/motos_modal';
import RepuestosModal from '../repuestos/repuestos_modal';
import cascosImg from '../../assets/img/cascos.jpg';
import suzuImg from '../../assets/img/suzu.png';

const Dashboard = () => {
  const initialAnnouncements = [
    {
      id: 1,
      title: 'Yamaha MT-09 2022',
      type: 'Moto',
      author: 'Juan Pérez',
      state: 'Activo',
      subtitle: 'Detalles de la moto',
      img: suzuImg,
      price: 8200,
      location: 'Quito',
      stars: 4,
      year: 2022,
      kilometraje: '8,500 km',
      transmission: 'manual',
      contactPhone: '+593987654321',
      revision: 'Honda MT-09 2022',
      description: 'Excelente para trayectos urbanos y escapadas de fin de semana. Pregunta por mantenimiento y accesorios antes de comprar.'
    },
    {
      id: 2,
      title: 'Casco Integral AGV K3',
      type: 'Repuesto',
      author: 'María García',
      state: 'Activo',
      subtitle: 'Detalles de la moto',
      img: cascosImg,
      price: 250,
      location: 'Guayaquil',
      stars: 5,
      contactPhone: '+593912345678',
      condition: 'Nuevo',
      description: 'Casco integral talla M, nuevo, con certificación de seguridad. Ideal para uso urbano y pista.'
    },
    {
      id: 3,
      title: 'Honda CBR600RR',
      type: 'Moto',
      author: 'Carlos López',
      state: 'Activo',
      subtitle: 'Detalles de la moto',
      img: suzuImg,
      price: 9200,
      location: 'Quito',
      stars: 4,
      year: 2018,
      kilometraje: '22,000 km',
      transmission: 'manual',
      contactPhone: '+593998877665',
      revision: 'CBR600RR',
      description: 'Mantenimiento al día, muy buen estado mecánico y estético. Ideal para track days.'
    },
    {
      id: 4,
      title: 'Juego de Pastillas de Freno',
      type: 'Repuesto',
      author: 'Taller MotoPlus',
      state: 'Activo',
      subtitle: 'Detalles de la moto',
      img: cascosImg,
      price: 45,
      location: 'Cuenca',
      stars: 4,
      contactPhone: '+593999001122',
      condition: 'Nuevo',
      description: 'Juego de pastillas de freno semi-metal con alta durabilidad. Incluye piezas para instalación.'
    }
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
  // Shared contact form state used by the reusable modals
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ message: '' });
  const [contactSent, setContactSent] = useState(false);

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Simple client-side behaviour: mark sent and reset shortly after
    setContactSent(true);
    setTimeout(() => {
      setShowContactForm(false);
      setContactSent(false);
      setContactForm({ message: '' });
    }, 1200);
  };

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
              selected.type === 'Moto' ? (
                <MotosModal
                  selectedMoto={{
                    id: selected.id,
                    title: selected.title,
                    price: selected.price || '—',
                    location: selected.author || '—',
                    stars: selected.stars || 4,
                    img: selected.img || 'https://via.placeholder.com/800x480?text=Imagen',
                    model: selected.title,
                    revision: selected.revision || '—',
                    condition: selected.state || 'Desconocido',
                    contact: { phone: selected.contactPhone || 'consultar' },
                    year: selected.year || '—',
                    kilometraje: selected.kilometraje || '—',
                    transmission: selected.transmission || null
                    ,
                    description: selected.description || selected.subtitle || ''
                  }}
                  onClose={() => setSelected(null)}
                  showContactForm={showContactForm}
                  setShowContactForm={setShowContactForm}
                  contactForm={contactForm}
                  handleContactChange={handleContactChange}
                  handleContactSubmit={handleContactSubmit}
                  contactSent={contactSent}
                  hideHeaderContact={true}
                />
              ) : (
                <RepuestosModal
                  selectedPart={{
                    id: selected.id,
                    title: selected.title,
                    price: selected.price || '—',
                    location: selected.author || '—',
                    category: selected.type || 'Repuesto',
                    stars: selected.stars || 0,
                    img: selected.img || 'https://via.placeholder.com/800x480?text=Imagen',
                    condition: selected.state || 'Consultar',
                    contact: { phone: selected.contactPhone || 'consultar' },
                    description: selected.description || selected.subtitle || ''
                  }}
                  onClose={() => setSelected(null)}
                  showContactForm={showContactForm}
                  setShowContactForm={setShowContactForm}
                  contactForm={contactForm}
                  handleContactChange={handleContactChange}
                  handleContactSubmit={handleContactSubmit}
                  contactSent={contactSent}
                  hideHeaderContact={true}
                />
              )
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;