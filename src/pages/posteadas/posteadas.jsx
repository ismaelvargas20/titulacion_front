import React, { useState, useMemo, useEffect } from 'react';
import '../../assets/scss/usuarios.scss';
import MotosModal from '../motos/motos_modal';
import RepuestosModal from '../repuestos/repuestos_modal';
import Swal from 'sweetalert2';
import cascosImg from '../../assets/img/cascos.jpg';
import suzuImg from '../../assets/img/suzu.png';
import api from '../../api/axios';
import { listarPublicaciones, eliminarPublicacion } from '../../services/motos';
import { listarRepuestos, eliminarRepuesto } from '../../services/repuestos';

export default function Posteadas() {
	const initialPosts = [
		{ id: 1, title: 'Yamaha MT-09 2022', type: 'Moto', price: '$9,500', location: 'Quito', rating: 5, status: 'Activo', author: 'Juan Pérez', img: suzuImg, description: 'Yamaha MT-09 2022 en excelente estado. Ideal para ciudad y carretera.' , contactPhone: '+593987654321'},
		{ id: 2, title: 'Casco Integral AGV K3', type: 'Repuesto', price: '$120', location: 'Guayaquil', rating: 4, status: 'Suspendido', author: 'María García', img: cascosImg, description: 'Casco AGV K3 talla M, prácticamente nuevo. Certificado de seguridad.' , contactPhone: '+593912345678'},
		{ id: 5, title: 'Casco Integral AGV K3', type: 'Repuesto', price: '$120', location: 'Guayaquil', rating: 4, status: 'Suspendido', author: 'María García', img: cascosImg, description: 'Casco AGV K3 talla M, prácticamente nuevo. Certificado de seguridad.' , contactPhone: '+593912345678'},
		{ id: 3, title: 'Honda CBR600RR', type: 'Moto', price: '$8,200', location: 'Cuenca', rating: 5, status: 'Activo', author: 'Carlos López', img: suzuImg, description: 'CBR600RR con mantenimiento al día y buenos frenos.' , contactPhone: '+593998877665'},
		{ id: 4, title: 'Royal Enfield Classic 350', type: 'Moto', price: '$4,500', location: 'Quito', rating: 4, status: 'Vendido', author: 'Pedro Ruiz', img: suzuImg, description: 'Royal Enfield Classic 350, clásico en buen estado.' , contactPhone: '+593955554444'},
	];

	const [posts, setPosts] = useState(initialPosts);
	const [loading, setLoading] = useState(false);
	// Contadores globales (no deben cambiar al aplicar el filtro local)
	const [totalMotos, setTotalMotos] = useState(0);
	const [totalRepuestos, setTotalRepuestos] = useState(0);
	const [totalEliminados, setTotalEliminados] = useState(0);
	const [nuevos30Global, setNuevos30Global] = useState(0);
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

	useEffect(() => {
		// recargar cuando cambien filtros
		fetchPosts();
		// actualizar contadores globales (independientes del filtro)
		try { fetchGlobalPublicationCounts(); } catch (e) { /* noop */ }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stateFilter, typeFilter]);



// Función para calcular contadores globales (pide listados con incluirEliminados)
const fetchGlobalPublicationCounts = async () => {
	try {
		const includeParams = { includeDetails: 'true', limit: 500, incluirEliminados: 'true' };
		const [motosRes, repuestosRes] = await Promise.all([
			listarPublicaciones({ tipo: 'moto', ...includeParams }).catch(() => []),
			listarRepuestos({ ...includeParams }).catch(() => [])
		]);

		const motosArr = Array.isArray(motosRes) ? motosRes : (Array.isArray(motosRes.publicaciones) ? motosRes.publicaciones : []);
		const repuestosArr = Array.isArray(repuestosRes) ? repuestosRes : (Array.isArray(repuestosRes.publicaciones) ? repuestosRes.publicaciones : []);

		const now = Date.now();
		const ms30 = 30 * 24 * 60 * 60 * 1000;

		const totalM = motosArr.length;
		const totalR = repuestosArr.length;

		const all = [...motosArr, ...repuestosArr];
		const elimin = all.filter(p => {
			const s = ((p.estado || p.status || (p.detalle && p.detalle.estado)) || '').toString().toLowerCase();
			return s === 'eliminado' || s === 'suspendido' || s.includes('elim') || s.includes('rechaz') || s.includes('delete');
		}).length;

		const getCreated = (p) => {
			if (!p) return null;
			const cand = [p.createdAt, p.created_at, p.fecha_registro, p.fecha_creacion, p.created, p.createdDate, (p.detalle && (p.detalle.createdAt || p.detalle.created_at || p.detalle.fecha_registro || p.detalle.fecha_creacion))];
			for (const v of cand) {
				if (!v) continue;
				const d = new Date(v);
				if (!Number.isNaN(d.getTime())) return d.getTime();
			}
			return null;
		};

		let nuevos = 0;
		for (const p of all) {
			const ts = getCreated(p);
			if (ts && (now - ts) <= ms30) nuevos += 1;
		}

		setTotalMotos(totalM);
		setTotalRepuestos(totalR);
		setTotalEliminados(elimin);
		setNuevos30Global(nuevos);
	} catch (err) {
		// no bloquear UI por fallos en contadores
		// eslint-disable-next-line no-console
		console.warn('Error calculando contadores globales posteadas', err);
	}
};

	async function fetchPosts() {
		setLoading(true);
		try {
			// solicitar estados no-publicados cuando el filtro sea "eliminado" o "vendido"
			const includeDeleted = stateFilter === 'eliminado' || stateFilter === 'vendido';
			const [motosRes, repuestosRes] = await Promise.all([
				listarPublicaciones({ tipo: 'moto', includeDetails: 'true', limit: 200, incluirEliminados: includeDeleted ? 'true' : undefined }).catch(() => []),
				listarRepuestos({ includeDetails: 'true', limit: 200, incluirEliminados: includeDeleted ? 'true' : undefined }).catch(() => [])
			]);

			const mappedMotos = Array.isArray(motosRes) ? motosRes.map(p => ({
				id: p.id,
				title: p.titulo || p.title || `Moto ${p.id}`,
				type: 'Moto',
				author: (p.detalle && (p.detalle.autor_nombre || p.detalle.nombre || p.detalle.clienteNombre)) || (p.cliente && (p.cliente.nombre || p.cliente.nombre_completo)) || p.autor_nombre || null,
				clienteId: p.clienteId || p.usuarioId || (p.detalle && (p.detalle.clienteId || p.detalle.usuarioId)) || (p.cliente && (p.cliente.id || p.cliente.clienteId)) || null,
				// conservar el estado crudo desde la BD (p.estado / p.status)
				rawState: p.estado || p.status || (p.detalle && (p.detalle.status || p.detalle.estado)) || null,
				status: p.estado || p.status || (p.detalle && (p.detalle.status || p.detalle.estado)) || 'Desconocido',
				subtitle: p.descripcion || p.subtitle || '',
				img: (() => {
					let imgCandidate = (p.imagenes && p.imagenes[0] && (p.imagenes[0].url || p.imagenes[0].path)) || (p.detalle && p.detalle.imagenes && p.detalle.imagenes[0]) || suzuImg;
					try { if (typeof imgCandidate === 'string' && imgCandidate.startsWith('/uploads')) imgCandidate = `${api.defaults.baseURL}${imgCandidate}`; } catch (e) { /* noop */ }
					return imgCandidate;
				})(),
				price: p.precio || p.price || p.valor || '—',
				location: (p.detalle && (p.detalle.ubicacion || p.detalle.ciudad)) || (p.cliente && (p.cliente.ciudad || p.cliente.ubicacion)) || p.ubicacion || p.location || '—',
				stars: (p.detalle && p.detalle.estrellas) || p.estrellas || p.puntuacion || 0,
				rating: (p.detalle && p.detalle.estrellas) || p.estrellas || p.puntuacion || 0,
				year: (p.detalle && (p.detalle.ano || p.detalle.anio || p.detalle.year || p.detalle['año'])) || p.ano || p.anio || p.year || p['año'] || null,
				kilometraje: (p.detalle && p.detalle.kilometraje) || p.kilometraje || null,
				transmission: (p.detalle && p.detalle.transmision) || p.transmission || null,
				contactPhone: (p.detalle && (p.detalle.telefono_contacto || (p.detalle.contacto && p.detalle.contacto.telefono))) || p.telefono || (p.cliente && (p.cliente.telefono || p.cliente.phone)) || null,
				revision: (p.detalle && p.detalle.revision) || p.revision || null,
				model: (p.detalle && (p.detalle.modelo || p.detalle.model)) || p.modelo || p.model || null,
				condition: (p.detalle && (p.detalle.condicion || (p.detalle.estado && !['publicado','activo','aprobado','vigente'].includes(String(p.detalle.estado).toLowerCase()) ? p.detalle.estado : null))) || p.condicion || ((p.estado && !['publicado','activo','aprobado','vigente'].includes(String(p.estado).toLowerCase())) ? p.estado : null) || null,
				description: p.descripcion || ''
			})) : [];

			const mappedRepuestos = Array.isArray(repuestosRes) ? repuestosRes.map(p => ({
				id: p.id,
				title: p.titulo || p.title || `Repuesto ${p.id}`,
				type: 'Repuesto',
				author: (p.detalle && (p.detalle.autor_nombre || p.detalle.nombre || p.detalle.clienteNombre)) || (p.cliente && (p.cliente.nombre || p.cliente.nombre_completo)) || p.autor_nombre || null,
				clienteId: p.clienteId || p.usuarioId || (p.detalle && (p.detalle.clienteId || p.detalle.usuarioId)) || (p.cliente && (p.cliente.id || p.cliente.clienteId)) || null,
				rawState: p.estado || p.status || (p.detalle && (p.detalle.status || p.detalle.estado)) || null,
				status: p.estado || p.status || (p.detalle && (p.detalle.status || p.detalle.estado)) || 'Desconocido',
				subtitle: p.descripcion || p.subtitle || '',
				img: (() => {
					let imgCandidate = (p.imagenes && p.imagenes[0] && (p.imagenes[0].url || p.imagenes[0].path)) || (p.detalle && p.detalle.imagenes && p.detalle.imagenes[0]) || cascosImg;
					try { if (typeof imgCandidate === 'string' && imgCandidate.startsWith('/uploads')) imgCandidate = `${api.defaults.baseURL}${imgCandidate}`; } catch (e) { /* noop */ }
					return imgCandidate;
				})(),
				price: p.precio || p.price || '—',
				location: (p.detalle && (p.detalle.ubicacion || p.detalle.ciudad)) || (p.cliente && (p.cliente.ciudad || p.cliente.ubicacion)) || p.ubicacion || p.location || '—',
				stars: (p.detalle && p.detalle.estrellas) || p.estrellas || 0,
				rating: (p.detalle && p.detalle.estrellas) || p.estrellas || 0,
				contactPhone: (p.detalle && (p.detalle.telefono_contacto || (p.detalle.contacto && p.detalle.contacto.telefono))) || p.telefono || (p.cliente && (p.cliente.telefono || p.cliente.phone)) || null,
				condition: (p.detalle && (p.detalle.condicion || (p.detalle.estado && !['publicado','activo','aprobado','vigente'].includes(String(p.detalle.estado).toLowerCase()) ? p.detalle.estado : null))) || p.condicion || ((p.estado && !['publicado','activo','aprobado','vigente'].includes(String(p.estado).toLowerCase())) ? p.estado : null) || null,
				year: (p.detalle && (p.detalle.ano || p.detalle.anio || p.detalle.year || p.detalle['año'])) || p.ano || p.anio || p.year || p['año'] || null,
				description: p.descripcion || ''
			})) : [];

			const combined = [...mappedMotos, ...mappedRepuestos];
			const mapByKey = new Map();
			combined.forEach(it => { const key = `${it.type}:${it.id}`; if (!mapByKey.has(key)) mapByKey.set(key, it); });
			const deduped = Array.from(mapByKey.values());

			setPosts(deduped);
		} catch (err) {
			console.debug('Error cargando publicaciones', err?.message || err);
		} finally {
			setLoading(false);
		}
	}

	async function deletePost(item) {
		setOpenMenuId(null);
		try {
			const res = await Swal.fire({
				title: `Eliminar publicación`,
				text: `¿Eliminar "${item.title}"? Esta acción no se puede deshacer.`,
				icon: 'warning',
				showCancelButton: true,
				confirmButtonText: 'Sí, eliminar',
				cancelButtonText: 'Cancelar'
			});
			if (!res.isConfirmed) return;

			setLoading(true);
			if (item.type === 'Repuesto') {
				await eliminarRepuesto(item.id);
			} else {
				await eliminarPublicacion(item.id);
			}
			await fetchPosts();
			// refrescar contadores globales después de eliminar
			try { await fetchGlobalPublicationCounts(); } catch (e) { /* noop */ }
			try { Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Publicación eliminada', showConfirmButton: false, timer: 1500 }); } catch (e) {}
		} catch (err) {
			console.error('Error eliminando publicación', err);
			try { Swal.fire({ icon: 'error', title: 'Error', text: (err && err.response && err.response.data && err.response.data.error) || err.message || 'No se pudo eliminar' }); } catch (e) { alert('No se pudo eliminar la publicación'); }
		} finally {
			setLoading(false);
		}
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
						<h3>Eliminados</h3>
						<p className="sum-value sum-orange">{totalEliminados}</p>
					</div>
					<div className="sum-card">
						<div className="sum-icon sum-icon-new"><i className="fas fa-clock" aria-hidden="true"></i></div>
						<h3>Nuevos (30 días)</h3>
						<p className="sum-value sum-blue">{nuevos30Global}</p>
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
									<option value="publicado">Publicado</option>
									<option value="eliminado">Eliminado</option>
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
									// badgeClass: derivar solo la clase visual a partir del texto del estado (sin transformar el label)
									const stnorm = (p.status || '').toLowerCase();
									let badgeClass;
									if (stnorm.includes('vend')) badgeClass = 'state-sold';
									else if (stnorm.includes('public')) badgeClass = 'state-active';
									else badgeClass = 'state-suspended';
									const label = p.status || '—';

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
															{stateFilter !== 'eliminado' && (
																<li className="action-item" role="menuitem"><button onClick={() => deletePost(p)}>Eliminar</button></li>
															)}
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
									transmission: selected.transmission || null,
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

