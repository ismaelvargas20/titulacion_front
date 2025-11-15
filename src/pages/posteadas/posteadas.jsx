import React, { useState, useMemo, useEffect } from 'react';
import '../../assets/scss/usuarios.scss';
import MotosModal from '../motos/motos_modal';
import RepuestosModal from '../repuestos/repuestos_modal';
import cascosImg from '../../assets/img/cascos.jpg';
import suzuImg from '../../assets/img/suzu.png';

export default function Posteadas() {
	const initialPosts = [
		{ id: 1, title: 'Yamaha MT-09 2022', type: 'Moto', price: '$9,500', location: 'Quito', rating: 5, status: 'Activo', author: 'Juan Pérez', img: suzuImg, description: 'Yamaha MT-09 2022 en excelente estado. Ideal para ciudad y carretera.' , contactPhone: '+593987654321'},
		{ id: 2, title: 'Casco Integral AGV K3', type: 'Repuesto', price: '$120', location: 'Guayaquil', rating: 4, status: 'Suspendido', author: 'María García', img: cascosImg, description: 'Casco AGV K3 talla M, prácticamente nuevo. Certificado de seguridad.' , contactPhone: '+593912345678'},
		{ id: 5, title: 'Casco Integral AGV K3', type: 'Repuesto', price: '$120', location: 'Guayaquil', rating: 4, status: 'Suspendido', author: 'María García', img: cascosImg, description: 'Casco AGV K3 talla M, prácticamente nuevo. Certificado de seguridad.' , contactPhone: '+593912345678'},
		{ id: 3, title: 'Honda CBR600RR', type: 'Moto', price: '$8,200', location: 'Cuenca', rating: 5, status: 'Activo', author: 'Carlos López', img: suzuImg, description: 'CBR600RR con mantenimiento al día y buenos frenos.' , contactPhone: '+593998877665'},
		{ id: 4, title: 'Royal Enfield Classic 350', type: 'Moto', price: '$4,500', location: 'Quito', rating: 4, status: 'Vendido', author: 'Pedro Ruiz', img: suzuImg, description: 'Royal Enfield Classic 350, clásico en buen estado.' , contactPhone: '+593955554444'},
	];

	const [posts, setPosts] = useState(initialPosts);
	const [selected, setSelected] = useState(null);
	// contact form state similar to other pages (used by the modals)
	const [showContactForm, setShowContactForm] = useState(false);
	const [contactForm, setContactForm] = useState({ message: '' });
	const [contactSent, setContactSent] = useState(false);
	const [q, setQ] = useState('');
	const [typeFilter, setTypeFilter] = useState('all');
	const [stateFilter, setStateFilter] = useState('all');
	const [openMenuId, setOpenMenuId] = useState(null);

	const filtered = useMemo(() => {
		const term = q.trim().toLowerCase();
		return posts.filter(p => {
			const matchesTerm = !term || p.title.toLowerCase().includes(term) || p.author.toLowerCase().includes(term);
			if (!matchesTerm) return false;
			if (typeFilter !== 'all' && p.type.toLowerCase() !== typeFilter) return false;
			if (stateFilter !== 'all' && p.status.toLowerCase() !== stateFilter) return false;
			return true;
		});
	}, [q, posts, typeFilter, stateFilter]);

	// Paginación local (igual que en comentarios/publicaciones)
	const [page, setPage] = useState(1);
	const pageSize = 4;
	const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
	const paginated = useMemo(() => {
		const start = (page - 1) * pageSize;
		return filtered.slice(start, start + pageSize);
	}, [filtered, page]);

	useEffect(() => {
		setPage(p => Math.min(p, totalPages));
	}, [totalPages]);


	const totalMotos = posts.filter(p => p.type === 'Moto').length;
	const totalRepuestos = posts.filter(p => p.type === 'Repuesto').length;
	const nuevos30 = posts.filter(p => p.status === 'Activo').length; // considerados nuevos (30 días) - ahora contamos 'Activo'
	const suspensos = posts.filter(p => p.status === 'Suspendido' || p.status === 'Rechazado').length;

	function deletePost(id) {
		if (!window.confirm('Eliminar publicación?')) return;
		setPosts(prev => prev.filter(p => p.id !== id));
		setOpenMenuId(null);
	}

	const handleContactChange = (e) => {
		const { name, value } = e.target;
		setContactForm(prev => ({ ...prev, [name]: value }));
	};

	const handleContactSubmit = (e) => {
		e.preventDefault();
		setContactSent(true);
		setTimeout(() => {
			setShowContactForm(false);
			setContactSent(false);
			setContactForm({ message: '' });
		}, 1200);
	};

	return (
		<div className="posteadas-page">
			<main className="usuarios-main">
				<h1 className="usuarios-title">Gestión de Publicaciones</h1>
				<p className="usuarios-subtitle">Revisa y modera todas las publicaciones</p>

				<section className="usuarios-summary">
					<div className="sum-card">
						<div className="sum-icon sum-icon-motos"><i className="fas fa-motorcycle" aria-hidden="true"></i></div>
						<h3>Total Motos</h3>
						<p className="sum-value">{totalMotos}</p>
					</div>
					<div className="sum-card">
						<div className="sum-icon sum-icon-repuestos"><i className="fas fa-tools" aria-hidden="true"></i></div>
						<h3>Total Repuestos</h3>
						<p className="sum-value">{totalRepuestos}</p>
					</div>
					<div className="sum-card">
						<div className="sum-icon sum-icon-suspended"><i className="fas fa-ban" aria-hidden="true"></i></div>
						<h3>Suspensos</h3>
						<p className="sum-value sum-orange">{suspensos}</p>
					</div>
					<div className="sum-card">
						<div className="sum-icon sum-icon-new"><i className="fas fa-clock" aria-hidden="true"></i></div>
						<h3>Nuevos (30 días)</h3>
						<p className="sum-value sum-blue">{nuevos30}</p>
					</div>
				</section>

				<section className="usuarios-filters">
					<div className="usuarios-search-card">
						<div className="search-input" role="search">
							<i className="fas fa-search" aria-hidden="true"></i>
							<input type="text" placeholder="Buscar publicaciones..." value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar publicaciones" />
						</div>
						<div className="search-filters">
							<select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} aria-label="Filtrar por tipo">
								<option value="all">Todos los tipos</option>
								<option value="moto">Moto</option>
								<option value="repuesto">Repuesto</option>
							</select>
							<select className="filter-select" value={stateFilter} onChange={e => setStateFilter(e.target.value)} aria-label="Filtrar por estado">
								<option value="all">Todos los estados</option>
								<option value="activo">Activo</option>
								<option value="suspendido">Suspendido</option>
								<option value="vendido">Vendido</option>
							</select>
							<button className="filter-btn" onClick={() => { setQ(''); setTypeFilter('all'); setStateFilter('all'); }}>Limpiar</button>
						</div>
					</div>
				</section>

				<section className="usuarios-list-header">
					<div className="usuarios-list-card">
						<h2 className="list-title">Publicaciones</h2>
					</div>
				</section>

				<section className="usuarios-table-section">
					<div className="usuarios-table-wrap">
						<table className="usuarios-table">
							<thead>
								<tr>
									<th>Motos / Repuestos</th>
									<th>Precio</th>
									<th>Ubicación</th>
									<th>Valoración</th>
									<th>Estado</th>
									<th>Acciones</th>
								</tr>
							</thead>
							<tbody>
													{paginated.map(p => {
									const isSold = p.status === 'Aprobado' || p.status === 'Vendido';
									let badgeClass;
									if (isSold) badgeClass = 'state-sold';
									else if (p.status === 'Activo') badgeClass = 'state-active';
									else badgeClass = 'state-suspended';
									const label = isSold ? 'Vendido' : (p.status === 'Activo' ? 'Activo' : 'Suspendido');

									return (
										<tr key={p.id} className="usuario-row">
											<td className="td-user">
												<div className="td-user-inner">
													<div className="user-avatar small">{p.title.charAt(0)}</div>
													<div className="user-meta">
														<div className="user-name">{p.title}</div>
														<div className="user-email">{p.author}</div>
													</div>
												</div>
											</td>
											<td className="td-price">{p.price}</td>
											<td className="td-location">{p.location}</td>
											<td className="td-rating">⭐ {p.rating}</td>
											<td className="td-state">
												<span className={`state-badge ${badgeClass}`}>
													{label}
												</span>
											</td>
											<td className="td-actions">
												<div className="actions-wrap">
													<button className="action-btn" aria-haspopup="true" aria-expanded={openMenuId === p.id} onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}>⋮</button>
													{openMenuId === p.id && (
														<ul className="action-list" role="menu">
															<li className="action-item" role="menuitem"><button onClick={() => { setOpenMenuId(null); setSelected(p); }}>Ver</button></li>
															<li className="action-item" role="menuitem"><button onClick={() => deletePost(p.id)}>Eliminar</button></li>
														</ul>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

					</div>
				</section>

					{/* Modales reutilizados: mostrar según tipo */}
					{selected && (
						selected.type === 'Moto' ? (
							<MotosModal
								selectedMoto={{
									id: selected.id,
									title: selected.title,
									price: selected.price ? selected.price.replace('$','') : '—',
									location: selected.location || selected.author || '—',
									stars: selected.rating || 4,
									img: selected.img,
									model: selected.title,
									revision: selected.title,
									condition: selected.status || 'Desconocido',
									contact: { phone: selected.contactPhone || 'consultar' },
									year: selected.year || '—',
									kilometraje: selected.kilometraje || '—',
									transmission: selected.transmission || null,
									description: selected.description || ''
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
									price: selected.price ? selected.price.replace('$','') : '—',
									location: selected.location || selected.author || '—',
									category: selected.type || 'Repuesto',
									stars: selected.rating || 0,
									img: selected.img,
									condition: selected.status || 'Consultar',
									contact: { phone: selected.contactPhone || 'consultar' },
									description: selected.description || ''
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
			</main>
		</div>
	);
}

