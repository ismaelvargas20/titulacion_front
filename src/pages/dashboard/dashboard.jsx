import React, { useEffect, useState, useMemo } from 'react';
import '../../assets/scss/dashboard.scss';
import '../../assets/scss/usuarios.scss';
import MotosModal from '../motos/motos_modal';
import RepuestosModal from '../repuestos/repuestos_modal';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import { listarPublicaciones, eliminarPublicacion } from '../../services/motos';
import { listarRepuestos, eliminarRepuesto } from '../../services/repuestos';
import { listarHilos } from '../../services/comunidad';
import cascosImg from '../../assets/img/cascos.jpg';
import suzuImg from '../../assets/img/suzu.png';

const Dashboard = () => {
  const initialAnnouncements = [];

  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalMotos, setTotalMotos] = useState(0);
  const [totalRepuestos, setTotalRepuestos] = useState(0);
  const [totalHilos, setTotalHilos] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 3; // cuando haya 4, la 4ª irá a la página 2
  const totalPages = Math.max(1, Math.ceil(announcements.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return announcements.slice(start, start + pageSize);
  }, [announcements, page]);

  // Determina si un estado debe mostrarse como "activo/publicado" (badge verde)
  const isActiveState = (s) => {
    if (!s) return false;
    const norm = String(s).toLowerCase().trim();
    // valores que consideramos activos/publicados; permitimos contains para tolerancia
    const activeKeywords = ['activo', 'publicado', 'aprobado', 'vigente'];
    return activeKeywords.some(k => norm === k || norm.includes(k));
  };

  // handler para eliminar anuncios desde la tabla (usa Swal para confirmación)
  const handleDelete = async (item) => {
    try {
      const res = await Swal.fire({
        title: `Eliminar anuncio`,
        text: `¿Eliminar "${item.title}"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
      if (res.isConfirmed) {
        // Llamar al backend según tipo
        if (item.type === 'Moto') {
          await eliminarPublicacion(item.id);
          setTotalMotos(t => Math.max(0, t - 1));
        } else {
          await eliminarRepuesto(item.id);
          setTotalRepuestos(t => Math.max(0, t - 1));
        }
        setAnnouncements(prev => prev.filter(x => !(x.type === item.type && Number(x.id) === Number(item.id))));
        try { Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Anuncio eliminado', showConfirmButton: false, timer: 1500 }); } catch (e) {}
      }
    } catch (err) {
      console.error('Error eliminando anuncio', err);
      try { Swal.fire({ icon: 'error', title: 'Error', text: (err && err.response && err.response.data && err.response.data.error) || err.message || 'No se pudo eliminar' }); } catch (e) { alert('No se pudo eliminar'); }
    }
  };

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
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Pedir publicaciones (motos y repuestos) y hilos de comunidad y clientes
        const [motosRes, repuestosRes, hilosRes, clientesRes, usuariosRes] = await Promise.all([
          listarPublicaciones({ tipo: 'moto', includeDetails: 'true', limit: 50 }).catch(() => []),
          listarRepuestos({ includeDetails: 'true', limit: 50 }).catch(() => []),
          listarHilos({ limit: 50 }).catch(() => []),
          api.get('/clientes/listar').then(r => r.data).catch(() => []),
          api.get('/usuarios/listar').then(r => r.data).catch(() => [])
        ]);

        if (cancelled) return;

        // Mapear motos
          const mappedMotos = Array.isArray(motosRes) ? motosRes.map(p => ({
          id: p.id,
          title: p.titulo || p.title || `Moto ${p.id}`,
          type: 'Moto',
          // author and owner id
          author: (p.detalle && (p.detalle.autor_nombre || p.detalle.nombre || p.detalle.clienteNombre)) || (p.cliente && (p.cliente.nombre || p.cliente.nombre_completo)) || p.autor_nombre || null,
          clienteId: p.clienteId || p.usuarioId || (p.detalle && (p.detalle.clienteId || p.detalle.usuarioId)) || (p.cliente && (p.cliente.id || p.cliente.clienteId)) || null,
          // estado/publicación: tomar primero campos de nivel raíz (`p.status` o `p.estado`)
          // porque la tabla `publicaciones` almacena allí 'publicado' en la BD.
          // Fallback a propiedades en `p.detalle` si no existe en raíz.
          state: p.status || p.estado || (p.detalle && (p.detalle.status || p.detalle.estado)) || null,
          subtitle: p.descripcion || p.subtitle || '',
          img: (p.imagenes && p.imagenes[0] && p.imagenes[0].url) ? p.imagenes[0].url : (p.detalle && p.detalle.imagenes && p.detalle.imagenes[0]) || suzuImg,
          price: p.precio || p.price || p.valor || '—',
          // location: prefer detalle.ubicacion, then cliente.ciudad, then fields on publication
          location: (p.detalle && (p.detalle.ubicacion || p.detalle.ciudad)) || (p.cliente && (p.cliente.ciudad || p.cliente.ubicacion)) || p.ubicacion || p.location || '—',
          stars: (p.detalle && p.detalle.estrellas) || p.estrellas || p.puntuacion || 0,
          year: (p.detalle && (p.detalle.ano || p.detalle.anio || p.detalle.year || p.detalle['año'])) || p.ano || p.anio || p.year || p['año'] || null,
          kilometraje: (p.detalle && p.detalle.kilometraje) || p.kilometraje || null,
          transmission: (p.detalle && p.detalle.transmision) || p.transmission || null,
          contactPhone: (p.detalle && (p.detalle.telefono_contacto || (p.detalle.contacto && p.detalle.contacto.telefono))) || p.telefono || (p.cliente && (p.cliente.telefono || p.cliente.phone)) || null,
          revision: (p.detalle && p.detalle.revision) || p.revision || null,
          model: (p.detalle && (p.detalle.modelo || p.detalle.model)) || p.modelo || p.model || p.modelo_repuesto || null,
          // condición física/estado del artículo (Excelente, Muy bueno, Bueno, Regular)
          // Si `p.estado` ya fue usado como estado de publicación, no usarlo como condición.
          condition: (p.detalle && (p.detalle.condicion || (p.detalle.estado && !['publicado','activo','aprobado','vigente'].includes(String(p.detalle.estado).toLowerCase()) ? p.detalle.estado : null))) || p.condicion || ((p.estado && !['publicado','activo','aprobado','vigente'].includes(String(p.estado).toLowerCase())) ? p.estado : null) || null,
          description: p.descripcion || ''
        })) : [];

        // Mapear repuestos
        const mappedRepuestos = Array.isArray(repuestosRes) ? repuestosRes.map(p => ({
          id: p.id,
          title: p.titulo || p.title || `Repuesto ${p.id}`,
          type: 'Repuesto',
          author: (p.detalle && (p.detalle.autor_nombre || p.detalle.nombre || p.detalle.clienteNombre)) || (p.cliente && (p.cliente.nombre || p.cliente.nombre_completo)) || p.autor_nombre || null,
          clienteId: p.clienteId || p.usuarioId || (p.detalle && (p.detalle.clienteId || p.detalle.usuarioId)) || (p.cliente && (p.cliente.id || p.cliente.clienteId)) || null,
          state: p.status || p.estado || (p.detalle && (p.detalle.status || p.detalle.estado)) || null,
          subtitle: p.descripcion || p.subtitle || '',
          img: (p.imagenes && p.imagenes[0] && p.imagenes[0].url) ? p.imagenes[0].url : (p.detalle && p.detalle.imagenes && p.detalle.imagenes[0]) || cascosImg,
          price: p.precio || p.price || '—',
          location: (p.detalle && (p.detalle.ubicacion || p.detalle.ciudad)) || (p.cliente && (p.cliente.ciudad || p.cliente.ubicacion)) || p.ubicacion || p.location || '—',
          stars: (p.detalle && p.detalle.estrellas) || p.estrellas || 0,
          contactPhone: (p.detalle && (p.detalle.telefono_contacto || (p.detalle.contacto && p.detalle.contacto.telefono))) || p.telefono || (p.cliente && (p.cliente.telefono || p.cliente.phone)) || null,
          condition: (p.detalle && (p.detalle.condicion || (p.detalle.estado && !['publicado','activo','aprobado','vigente'].includes(String(p.detalle.estado).toLowerCase()) ? p.detalle.estado : null))) || p.condicion || ((p.estado && !['publicado','activo','aprobado','vigente'].includes(String(p.estado).toLowerCase())) ? p.estado : null) || null,
          year: (p.detalle && (p.detalle.ano || p.detalle.anio || p.detalle.year || p.detalle['año'])) || p.ano || p.anio || p.year || p['año'] || null,
          description: p.descripcion || ''
        })) : [];

        // Unir ambos arrays (motos primero)
        const combined = [...mappedMotos, ...mappedRepuestos];

        // Preparar lookup de clientes/usuarios por id para resolver autores
        const clientsArr = Array.isArray(clientesRes) ? clientesRes : [];
        const usersArr = Array.isArray(usuariosRes) ? usuariosRes : [];

        // Dedupe por type-id (evita duplicados si backend devuelve solapados)
        const mapByKey = new Map();
        const pushUnique = (it) => {
          const key = `${it.type}:${it.id}`;
          if (!mapByKey.has(key)) mapByKey.set(key, it);
        };
        combined.forEach(pushUnique);

        const deduped = Array.from(mapByKey.values());

        // Resolver autor por clienteId/usuarioId si es posible
        const enriched = deduped.map(item => {
          // intentar extraer owner id de campos comunes
          const ownerId = item.clienteId || item.usuarioId || (item.detalle && (item.detalle.clienteId || item.detalle.usuarioId)) || null;
          if (!item.author || item.author === 'Desconocido') {
            if (ownerId) {
              const foundClient = clientsArr.find(c => Number(c.id) === Number(ownerId) || Number(c.clienteId) === Number(ownerId));
              if (foundClient) return { ...item, author: foundClient.nombre || foundClient.nombre_completo || foundClient.email || 'Desconocido' };
              const foundUser = usersArr.find(u => Number(u.id) === Number(ownerId) || Number(u.userId) === Number(ownerId));
              if (foundUser) return { ...item, author: foundUser.nombre || foundUser.name || foundUser.email || 'Desconocido' };
            }
            return { ...item, author: 'Desconocido' };
          }
          return item;
        });

        // Debug: mostrar ejemplo mapeado para verificar presencia de 'year'
        try { console.debug('Dashboard sample enriched item (year check):', enriched[0] || null); } catch (e) { /* noop */ }

        // Totales para summary
        setTotalMotos(Array.isArray(motosRes) ? motosRes.length : 0);
        setTotalRepuestos(Array.isArray(repuestosRes) ? repuestosRes.length : 0);
        setTotalHilos(Array.isArray(hilosRes) ? hilosRes.length : 0);
        // Preferir clientes list si existe, sino usuarios
        const usersCount = (Array.isArray(clientsArr) && clientsArr.length) ? clientsArr.length : ((Array.isArray(usersArr) && usersArr.length) ? usersArr.length : 0);
        setTotalUsers(usersCount);

        setAnnouncements(enriched);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
        setError(err.message || 'Error cargando datos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
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
            <h2>Total Clientes</h2>
            <span className="summary-icon"><i className="fas fa-users" aria-hidden="true"></i></span>
            <p>{totalUsers}</p>
          </div>
          <div className="summary-card">
            <h2>Motos Publicadas</h2>
            <span className="summary-icon"><i className="fas fa-motorcycle" aria-hidden="true"></i></span>
            <p>{totalMotos}</p>
          </div>
          <div className="summary-card">
            <h2>Repuestos Publicados</h2>
            <span className="summary-icon"><i className="fas fa-wrench" aria-hidden="true"></i></span>
            <p>{totalRepuestos}</p>
          </div>
          <div className="summary-card">
            <h2>Preguntas en el Foro</h2>
            <span className="summary-icon"><i className="fas fa-comments" aria-hidden="true"></i></span>
            <p>{totalHilos}</p>
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
                    {
                      (() => {
                        const displayState = a.state || a.condition || '—';
                        return (
                          <td className="td-state"><span className={`state-badge ${isActiveState(displayState) ? 'state-active' : ''}`}>{displayState}</span></td>
                        );
                      })()
                    }
                    <td className="td-actions">
                      <div className="actions-wrap">
                        <button className="btn-view" onClick={() => setSelected(a)}>Ver</button>
                        <button className="btn-reject state-suspended" onClick={() => handleDelete(a)}>Eliminar</button>
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
                    location: selected.location || selected.author || '—',
                    stars: selected.stars || 4,
                    img: selected.img || 'https://via.placeholder.com/800x480?text=Imagen',
                    model: selected.model || selected.title,
                    revision: selected.revision || '—',
                    condition: selected.condition || selected.state || 'Desconocido',
                    contact: { phone: selected.contactPhone || 'consultar' },
                    year: selected.year,
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
                  hideHeaderContact={false}
                  isOwner={(() => {
                    try {
                      const raw = sessionStorage.getItem('currentUser');
                      const cur = raw ? JSON.parse(raw) : null;
                      return cur && cur.id && selected && (Number(cur.id) === Number(selected.clienteId || selected.usuarioId));
                    } catch (e) { return false; }
                  })()}
                />
              ) : (
                <RepuestosModal
                  selectedPart={{
                    id: selected.id,
                    title: selected.title,
                    price: selected.price || '—',
                    location: selected.location || selected.author || '—',
                    category: selected.type || 'Repuesto',
                    stars: selected.stars || 0,
                    img: selected.img || 'https://via.placeholder.com/800x480?text=Imagen',
                    condition: selected.condition || selected.state || 'Consultar',
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
                  hideHeaderContact={false}
                  isOwner={(() => {
                    try {
                      const raw = sessionStorage.getItem('currentUser');
                      const cur = raw ? JSON.parse(raw) : null;
                      return cur && cur.id && selected && (Number(cur.id) === Number(selected.clienteId || selected.usuarioId));
                    } catch (e) { return false; }
                  })()}
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