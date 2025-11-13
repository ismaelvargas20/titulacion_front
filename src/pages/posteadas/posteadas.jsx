import React, { useState, useMemo } from 'react';
import '../../assets/scss/usuarios.scss';

export default function Posteadas() {
	const initialPosts = [
		{ id: 1, title: 'Yamaha MT-09 2022', type: 'Moto', price: '$9,500', location: 'Quito', rating: 5, status: 'Pendiente', author: 'Juan Pérez' },
		{ id: 2, title: 'Casco Integral AGV K3', type: 'Repuesto', price: '$120', location: 'Guayaquil', rating: 4, status: 'Pendiente', author: 'María García' },
		{ id: 3, title: 'Honda CBR600RR', type: 'Moto', price: '$8,200', location: 'Cuenca', rating: 5, status: 'Aprobado', author: 'Carlos López' },
		{ id: 4, title: 'Royal Enfield Classic 350', type: 'Moto', price: '$4,500', location: 'Quito', rating: 4, status: 'Aprobado', author: 'Pedro Ruiz' },
	];

	const [posts, setPosts] = useState(initialPosts);
	const [q, setQ] = useState('');
	const [openMenuId, setOpenMenuId] = useState(null);

	const filtered = useMemo(() => {
		const term = q.trim().toLowerCase();
		if (!term) return posts;
		return posts.filter(p => p.title.toLowerCase().includes(term) || p.author.toLowerCase().includes(term));
	}, [q, posts]);

	const totalMotos = posts.filter(p => p.type === 'Moto').length;
	const totalRepuestos = posts.filter(p => p.type === 'Repuesto').length;
	const pendientes = posts.filter(p => p.status === 'Pendiente').length;

	function approvePost(id) {
		setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'Aprobado' } : p));
		setOpenMenuId(null);
	}

	function deletePost(id) {
		if (!window.confirm('Eliminar publicación?')) return;
		setPosts(prev => prev.filter(p => p.id !== id));
		setOpenMenuId(null);
	}

	return (
		<div className="posteadas-page">
			<main className="usuarios-main">
				<h1 className="usuarios-title">Gestión de Publicaciones</h1>
				<p className="usuarios-subtitle">Revisa y modera todas las publicaciones</p>

				<section className="usuarios-summary">
					<div className="sum-card">
						<div className="sum-icon sum-icon-total"><i className="fas fa-motorcycle" aria-hidden="true"></i></div>
						<h3>Total Motos</h3>
						<p className="sum-value">{totalMotos}</p>
					</div>
					<div className="sum-card">
						<div className="sum-icon sum-icon-total"><i className="fas fa-tools" aria-hidden="true"></i></div>
						<h3>Total Repuestos</h3>
						<p className="sum-value">{totalRepuestos}</p>
					</div>
					<div className="sum-card">
						<div className="sum-icon sum-icon-new"><i className="fas fa-clock" aria-hidden="true"></i></div>
						<h3>Pendientes</h3>
						<p className="sum-value sum-orange">{pendientes}</p>
					</div>
					<div className="sum-card">
						<div className="sum-icon sum-icon-suspended"><i className="fas fa-ban" aria-hidden="true"></i></div>
						<h3>Rechazadas (30d)</h3>
						<p className="sum-value sum-orange">0</p>
					</div>
				</section>

				<section className="usuarios-filters">
					<div className="usuarios-search-card">
						<div className="search-input" role="search">
							<i className="fas fa-search" aria-hidden="true"></i>
							<input type="text" placeholder="Buscar publicaciones..." value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar publicaciones" />
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
									<th>Moto</th>
									<th>Precio</th>
									<th>Ubicación</th>
									<th>Valoración</th>
									<th>Estado</th>
									<th>Acciones</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map(p => (
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
										<td className="td-state"><span className={`state-badge ${p.status === 'Aprobado' ? 'state-active' : 'state-suspended'}`}>{p.status}</span></td>
										<td className="td-actions">
											<div className="actions-wrap">
												<button className="action-btn" aria-haspopup="true" aria-expanded={openMenuId === p.id} onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}>⋮</button>
												{openMenuId === p.id && (
													<ul className="action-list" role="menu">
														<li className="action-item" role="menuitem"><button onClick={() => { setOpenMenuId(null); alert('Ver publicación: ' + p.title); }}>Ver</button></li>
														<li className="action-item" role="menuitem"><button onClick={() => approvePost(p.id)}>Aprobar</button></li>
														<li className="action-item" role="menuitem"><button onClick={() => deletePost(p.id)}>Eliminar</button></li>
													</ul>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			</main>
		</div>
	);
}

