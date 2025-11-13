import React, { useState, useMemo } from 'react';
import '../../assets/scss/usuarios.scss';
import UsuariosModal from './usuarios_modal';

const Usuarios = () => {
  const initialUsers = [
    { id: 1, name: 'Juan Pérez', email: 'juan@example.com', role: 'Usuario', state: 'Activo', pubs: 5 },
    { id: 2, name: 'María García', email: 'maria@example.com', role: 'Admin', state: 'Activo', pubs: 12 },
    { id: 3, name: 'Carlos López', email: 'carlos@example.com', role: 'Usuario', state: 'Suspendido', pubs: 8 },
    { id: 4, name: 'Ana Torres', email: 'ana@example.com', role: 'Usuario', state: 'Activo', pubs: 3 },
    { id: 5, name: 'Pedro Ramírez', email: 'pedro@example.com', role: 'Admin', state: 'Activo', pubs: 15 }
  ];
  const [users, setUsers] = useState(initialUsers);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter(u => {
      if (term) {
        const inName = u.name.toLowerCase().includes(term);
        const inEmail = u.email.toLowerCase().includes(term);
        if (!inName && !inEmail) return false;
      }
      if (roleFilter !== 'all' && u.role.toLowerCase() !== roleFilter) return false;
      if (stateFilter !== 'all' && u.state.toLowerCase() !== stateFilter) return false;
      return true;
    });
  }, [q, roleFilter, stateFilter, users]);
  return (
    <div className="usuarios-page">
      <main className="usuarios-main">
        <h1 className="usuarios-title">Gestión de Usuarios</h1>
        <p className="usuarios-subtitle">Administra todos los usuarios de la plataforma</p>
        {/* Tarjetas resumen (Total, Activos, Suspendidos, Nuevos) */}
        <section className="usuarios-summary">
          <div className="sum-card">
            <div className="sum-icon sum-icon-total"><i className="fas fa-users" aria-hidden="true"></i></div>
            <h3>Total Usuarios</h3>
            <p className="sum-value">1,234</p>
          </div>
          <div className="sum-card">
            <div className="sum-icon sum-icon-active"><i className="fas fa-user-check" aria-hidden="true"></i></div>
            <h3>Usuarios Activos</h3>
            <p className="sum-value sum-green">1,180</p>
          </div>
          <div className="sum-card">
            <div className="sum-icon sum-icon-suspended"><i className="fas fa-user-slash" aria-hidden="true"></i></div>
            <h3>Suspensos</h3>
            <p className="sum-value sum-orange">54</p>
          </div>
          <div className="sum-card">
            <div className="sum-icon sum-icon-new"><i className="fas fa-user-plus" aria-hidden="true"></i></div>
            <h3>Nuevos (30 días)</h3>
            <p className="sum-value sum-blue">127</p>
          </div>
        </section>
        {/* Filtros: búsqueda y selects */}
        <section className="usuarios-filters">
          <div className="usuarios-search-card">
            <div className="search-input" role="search">
              <i className="fas fa-search" aria-hidden="true"></i>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={q}
                onChange={e => setQ(e.target.value)}
                aria-label="Buscar usuarios"
              />
            </div>
            <div className="search-filters">
              <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="all">Todos los roles</option>
                <option value="admin">Admin</option>
                <option value="usuario">Usuario</option>
              </select>
              <select className="filter-select" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
                <option value="all">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
              </select>
              <button className="filter-btn" onClick={() => { setQ(''); setRoleFilter('all'); setStateFilter('all'); }}>Limpiar</button>
            </div>
          </div>
        </section>

        {/* Encabezado de lista */}
        <section className="usuarios-list-header">
          <div className="usuarios-list-card">
            <h2 className="list-title">Lista de Usuarios</h2>
          </div>
        </section>
        {/* Lista de usuarios en formato tabla estilo BD */}
        <section className="usuarios-table-section">
          <div className="usuarios-table-wrap">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Publicaciones</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="usuario-row">
                    <td className="td-user">
                      <div className="td-user-inner">
                        <div className="user-avatar small">{u.name.charAt(0)}</div>
                        <div className="user-meta">
                          <div className="user-name">{u.name}</div>
                          <div className="user-email">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="td-email">{u.email}</td>
                    <td className="td-role"><span className={`role-badge ${u.role === 'Admin' ? 'role-admin' : 'role-user'}`}>{u.role}</span></td>
                    <td className="td-pubs">{u.pubs}</td>
                    <td className="td-state"><span className={`state-badge ${u.state === 'Activo' ? 'state-active' : 'state-suspended'}`}>{u.state}</span></td>
                    <td className="td-actions">
                      <div className="actions-wrap">
                        <button className="action-btn" aria-haspopup="true" aria-expanded={openMenuId === u.id} onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}>⋮</button>
                        {openMenuId === u.id && (
                          <ul className="action-list" role="menu">
                            <li className="action-item" role="menuitem"><button onClick={() => { setOpenMenuId(null); setSelectedUser(u); }}>Ver perfil</button></li>
                            <li className="action-item" role="menuitem"><button onClick={() => { setOpenMenuId(null); if(window.confirm('Eliminar a "' + u.name + '"?')) setUsers(prev => prev.filter(x => x.id !== u.id)); }}>Eliminar</button></li>
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
        {selectedUser && (
          <UsuariosModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </main>
    </div>
  );
};

export default Usuarios;
