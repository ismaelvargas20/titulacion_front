import React, { useState, useMemo, useEffect, useRef } from 'react';
import '../../assets/scss/usuarios.scss';
import UsuariosModal from './usuarios_modal';
import UsuariosCrearModal from './usuarios_crear_modal';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const Usuarios = () => {
  const initialUsers = [
    { id: 1, name: 'Juan Pérez', email: 'juan@example.com', role: 'Usuario', state: 'Activo', pubs: 5 },
    { id: 2, name: 'María García', email: 'maria@example.com', role: 'Usuario', state: 'Activo', pubs: 12 },
    { id: 3, name: 'Carlos López', email: 'carlos@example.com', role: 'Cliente', state: 'Eliminado', pubs: 8 },
    { id: 4, name: 'Ana Torres', email: 'ana@example.com', role: 'Usuario', state: 'Activo', pubs: 3 },
    { id: 5, name: 'Pedro Ramírez', email: 'pedro@example.com', role: 'Usuario', state: 'Activo', pubs: 15 }
  ];
  const [users, setUsers] = useState(initialUsers);
  const [showCreate, setShowCreate] = useState(false);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Derivar etiqueta de rol desde la respuesta del backend
  const deriveRole = (u) => {
    const parts = [];
    if (!u) return 'Usuario';
    if (u.role) parts.push(u.role);
    if (u.rol) parts.push(u.rol);
    if (u.roles) {
      if (Array.isArray(u.roles)) parts.push(...u.roles.map(r => (r && (r.name || r)) || ''));
      else parts.push(u.roles);
    }
    if (u.usuarios_roles) {
      if (Array.isArray(u.usuarios_roles)) parts.push(...u.usuarios_roles.map(r => (r && (r.name || r.role || r)) || ''));
    }
    const txt = parts.join(' ').toLowerCase();
    if (txt.includes('admin')) return 'Usuario';
    if (txt.includes('cliente') || txt.includes('client')) return 'Cliente';
    return 'Usuario';
  };

  const normalizeState = (s) => {
    if (!s) return 'Activo';
    const txt = String(s).toLowerCase();
    if (txt.includes('suspend')) return 'Eliminado';
    if (txt.includes('elimin') || txt.includes('delete') || txt.includes('borrado')) return 'Eliminado';
    if (txt.includes('activo') || txt.includes('active')) return 'Activo';
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  };

  // Normalizar perfil/response del backend para siempre pasar al modal la misma shape
  const normalizeProfile = (raw, preferClientFlag = false) => {
    if (!raw) return null;
    // Si es un array tomar el primer elemento
    const src = Array.isArray(raw) && raw.length > 0 ? raw[0] : raw;

    // Fusionar capas comunes (respuesta plana + posibles objetos anidados) en un solo objeto
    const merged = Object.assign({},
      typeof src === 'object' && src ? src : {},
      typeof src.data === 'object' && src.data ? src.data : {},
      typeof src.user === 'object' && src.user ? src.user : {},
      typeof src.usuario === 'object' && src.usuario ? src.usuario : {},
      typeof src.profile === 'object' && src.profile ? src.profile : {},
      typeof src.persona === 'object' && src.persona ? src.persona : {},
      typeof src.cliente === 'object' && src.cliente ? src.cliente : {},
      typeof src.contact === 'object' && src.contact ? src.contact : {}
    );

    const getFirst = (obj, keys) => {
      for (const k of keys) {
        if (!obj) continue;
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          const v = obj[k];
          if (v !== undefined && v !== null && String(v).trim() !== '') return v;
        }
      }
      return null;
    };

    const name = getFirst(merged, ['fullname', 'fullName', 'full_name', 'nombre', 'nombre_completo', 'razon_social', 'name', 'username', 'displayName']) || '';
    const email = getFirst(merged, ['email', 'correo_electronico', 'correo', 'contacto_email']) || '';
    const phone = getFirst(merged, ['phone', 'telefono', 'celular', 'telefono_movil', 'telefono_celular', 'contact_phone', 'telefono_contacto', 'mobile']) || '';
    const city = getFirst(merged, ['city', 'ciudad', 'provincia', 'direccion', 'address_city', 'localidad']) || '';
    const birthdate = getFirst(merged, ['birthdate', 'fecha_nacimiento', 'nacimiento', 'fechaNacimiento', 'dob', 'fecha_nac']) || '';
    const id = merged.id || merged._id || merged.userId || merged.cliente_id || merged.id_usuario || null;
    const pubs = merged.publicaciones_count || merged.pubs || merged.posts_count || 0;
    const rawState = getFirst(merged, ['estado', 'status', 'state']) || merged.state || null;
    const role = preferClientFlag ? 'Cliente' : deriveRole(merged);

    // Mapear aliases también para que el modal encuentre claves como 'telefono' o 'fecha_nacimiento'
    const normalized = {
      id,
      name,
      nombre: name,
      email,
      correo_electronico: email,
      phone,
      telefono: phone,
      city,
      ciudad: city,
      birthdate,
      fecha_nacimiento: birthdate,
      pubs,
      state: normalizeState(rawState),
      role,
      // mantengo referencia al objeto original por si se necesita
      __raw: src
    };

    return normalized;
  };

  const filteredUsers = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter(u => {
      // normalizar valores antes de comparar
      const nameVal = (u.name || u.nombre || '').toString().toLowerCase();
      const emailVal = (u.email || u.correo_electronico || '').toString().toLowerCase();
      const stateVal = normalizeState(u.state || u.estado || '');
      const roleVal = (u.role || u.rol || deriveRole(u) || '').toString().toLowerCase();

      if (term) {
        const inName = nameVal.includes(term);
        const inEmail = emailVal.includes(term);
        if (!inName && !inEmail) return false;
      }
      if (roleFilter !== 'all' && roleVal !== roleFilter) return false;
      if (stateFilter !== 'all' && stateVal.toLowerCase() !== stateFilter) return false;
      return true;
    });
  }, [q, roleFilter, stateFilter, users]);

  // Cuando se cambian filtros o búsqueda, llevar a la primera página
  useEffect(() => {
    setPage(1);
  }, [q, roleFilter, stateFilter]);
  // Paginación local (mismo comportamiento que en comentarios/publicaciones)
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page]);

  useEffect(() => {
    setPage(p => Math.min(p, totalPages));
  }, [totalPages]);

  // Cargar usuarios reales desde el backend cuando el componente monte
  const mountedRef = useRef(true);

  const fetchUsers = async () => {
    try {
      const includeDeleted = stateFilter === 'eliminado';
      const usuariosUrl = `/usuarios/listar${includeDeleted ? '?incluirEliminados=true' : ''}`;
      const clientesUrl = `/clientes/listar${includeDeleted ? '?incluirEliminados=true' : ''}`;
      const [uRes, cRes] = await Promise.allSettled([
        api.get(usuariosUrl),
        api.get(clientesUrl)
      ]);
      const uData = uRes.status === 'fulfilled' && uRes.value && uRes.value.data ? uRes.value.data : [];
      const cData = cRes.status === 'fulfilled' && cRes.value && cRes.value.data ? cRes.value.data : [];
      if (!mountedRef.current) return;
      const mappedUsers = Array.isArray(uData) ? uData.map(u => ({
        id: u.id,
        name: u.fullname || u.nombre || u.name || u.email || u.correo_electronico,
        email: u.email || u.correo_electronico || '',
        role: deriveRole(u),
        state: normalizeState(u.estado || u.status),
        pubs: u.publicaciones_count || 0,
        createdAt: u.createdAt || u.created_at || u.fecha_registro || u.fecha_creacion || u.created || u.createdDate || null,
        isClient: false
      })) : [];
      const mappedClients = Array.isArray(cData) ? cData.map(c => ({
        id: `c-${c.id}`,
        name: c.fullname || c.nombre || c.name || c.razon_social || c.email || c.correo_electronico || '',
        email: c.email || c.correo_electronico || c.contacto_email || '',
        role: 'Cliente',
        state: normalizeState(c.estado || c.status),
        pubs: c.publicaciones_count || 0,
        createdAt: c.createdAt || c.created_at || c.fecha_registro || c.fecha_creacion || c.created || c.createdDate || null,
        isClient: true
      })) : [];
      setUsers([...mappedUsers, ...mappedClients]);
    } catch (err) {
      console.debug('No se pudieron cargar usuarios/clientes desde backend', err?.message || err);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchUsers();
    return () => { mountedRef.current = false; };
  }, []);

  // Si el filtro de estado cambia a 'eliminado', pedir también los eliminados al servidor
  useEffect(() => {
    if (stateFilter === 'eliminado') fetchUsers();
  }, [stateFilter]);
  
  // Resumen calculado a partir de los datos cargados
  const summary = useMemo(() => {
    const now = Date.now();
    const ms30 = 30 * 24 * 60 * 60 * 1000;
    const usuariosActivos = users.filter(u => (u.role === 'Usuario' || (u.role && String(u.role).toLowerCase().includes('admin'))) && String(u.state) === 'Activo').length;
    const clientesActivos = users.filter(u => u.role === 'Cliente' && String(u.state) === 'Activo').length;
    const eliminados = users.filter(u => {
      const s = String(u.state || '').toLowerCase();
      return s.includes('elimin') || s.includes('delete');
    }).length;
    const nuevos30 = users.filter(u => {
      if (u.role !== 'Cliente') return false;
      const d = u.createdAt ? new Date(u.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return (now - d.getTime()) <= ms30;
    }).length;
    return { usuariosActivos, clientesActivos, eliminados, nuevos30 };
  }, [users]);
  return (
    <div className="usuarios-page">
      <main className="usuarios-main">
        <h1 className="usuarios-title">Gestión de Usuarios</h1>
        <p className="usuarios-subtitle">Administra todos los usuarios de la plataforma</p>
        {/* Tarjetas resumen (Total, Activos, Suspendidos, Nuevos) */}
        <section className="usuarios-summary">
          <div className="sum-card">
            <div className="sum-icon sum-icon-total"><i className="fas fa-users" aria-hidden="true"></i></div>
            <h3>Usuarios Activos</h3>
            <p className="sum-value sum-blue">{summary.usuariosActivos.toLocaleString()}</p>
          </div>
          <div className="sum-card">
              <div className="sum-icon sum-icon-client"><i className="fas fa-user-check" aria-hidden="true"></i></div>
              <h3>Clientes Activos</h3>
              <p className="sum-value sum-client">{summary.clientesActivos.toLocaleString()}</p>
          </div>
          <div className="sum-card">
            <div className="sum-icon sum-icon-suspended"><i className="fas fa-user-slash" aria-hidden="true"></i></div>
            <h3>Clientes Eliminados</h3>
            <p className="sum-value sum-orange">{summary.eliminados.toLocaleString()}</p>
          </div>
          <div className="sum-card">
            <div className="sum-icon sum-icon-new"><i className="fas fa-user-plus" aria-hidden="true"></i></div>
            <h3>Nuevos (30 días)</h3>
            <p className="sum-value sum-new">{summary.nuevos30.toLocaleString()}</p>
          </div>
        </section>
        {/* Filtros: búsqueda y selects */}
        <section className="usuarios-filters">
          <div className="usuarios-search-card">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <button className="reg-btn primary" onClick={() => setShowCreate(true)}>Crear usuario</button>
            </div>
            <div className="search-row">
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
              <div className="search-filters" style={{ alignItems: 'center' }}>
                <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                  <option value="all">Todos los roles</option>
                  <option value="usuario">Usuario</option>
                  <option value="cliente">Cliente</option>
                </select>
                <select className="filter-select" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
                  <option value="all">Todos los estados</option>
                  <option value="activo">Activo</option>
                  <option value="eliminado">Eliminado</option>
                </select>
                <button className="filter-btn" onClick={() => { setQ(''); setRoleFilter('all'); setStateFilter('all'); }}>Limpiar</button>
              </div>
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
                {paginatedUsers.map(u => (
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
                    <td className="td-role"><span className={`role-badge ${u.role === 'Usuario' ? 'role-user' : (u.role === 'Cliente' ? 'role-client' : 'role-user')}`}>{u.role}</span></td>
                    <td className="td-pubs">{u.pubs}</td>
                    <td className="td-state"><span className={`state-badge ${u.state === 'Activo' ? 'state-active' : 'state-suspended'}`}>{u.state}</span></td>
                    <td className="td-actions">
                      <div className="actions-wrap">
                        <button className="action-btn" aria-haspopup="true" aria-expanded={openMenuId === u.id} onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}>⋮</button>
                        {openMenuId === u.id && (
                          <ul className="action-list" role="menu">
                                <li className="action-item" role="menuitem"><button onClick={async () => {
                                  setOpenMenuId(null);
                                  // intentar obtener perfil completo desde backend y normalizarlo
                                  try {
                                    setLoadingProfile(true);
                                    let resp;
                                    let normalized = null;
                                    if (u.isClient || (String(u.id).startsWith('c-'))) {
                                      const rawId = String(u.id).startsWith('c-') ? String(u.id).slice(2) : u.id;
                                      // El backend expone /clientes/detalle/:id
                                      resp = await api.get(`/clientes/detalle/${rawId}`);
                                      normalized = normalizeProfile(resp && resp.data ? resp.data : u, true);
                                    } else {
                                      // El backend expone /usuarios/detalle/:id
                                      resp = await api.get(`/usuarios/detalle/${u.id}`);
                                      normalized = normalizeProfile(resp && resp.data ? resp.data : u, false);
                                    }
                                    if (normalized) {
                                      console.debug('Perfil normalizado:', normalized);
                                      setSelectedUser(normalized);
                                    } else setSelectedUser(normalizeProfile(u));
                                  } catch (err) {
                                    console.debug('No se pudo cargar perfil completo, usando datos locales', err?.message || err);
                                    setSelectedUser(normalizeProfile(u));
                                  } finally {
                                    setLoadingProfile(false);
                                  }
                                }}>Ver perfil</button></li>
                            <li className="action-item" role="menuitem"><button onClick={async () => {
                                  setOpenMenuId(null);
                                  const confirm = await Swal.fire({
                                    title: `Eliminar a "${u.name}"?`,
                                    text: 'Esta acción marcará al usuario como eliminado en el servidor. ¿Deseas continuar?',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: 'Sí, eliminar',
                                    cancelButtonText: 'Cancelar'
                                  });
                                  if (!confirm.isConfirmed) return;
                                  try {
                                    // Llamar al backend según tipo (cliente/usuario)
                                    if (u.isClient || (String(u.id).startsWith('c-'))) {
                                      const rawId = String(u.id).startsWith('c-') ? String(u.id).slice(2) : u.id;
                                      await api.delete(`/clientes/eliminar/${rawId}`);
                                    } else {
                                      await api.delete(`/usuarios/eliminar/${u.id}`);
                                    }
                                    // Refrescar lista desde el servidor para mantener coherencia
                                    await fetchUsers();
                                    try { await Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1400, showConfirmButton: false }); } catch (e) {}
                                  } catch (err) {
                                    console.error('Error eliminando usuario/cliente', err);
                                    try { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar en el servidor.' }); } catch (e) { alert('No se pudo eliminar'); }
                                  }
                                }}>Eliminar</button></li>
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
        {/* Paginación */}
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
        {selectedUser && (
          <UsuariosModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
        {showCreate && (
          <UsuariosCrearModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={async () => {
            try {
              await fetchUsers();
            } catch (e) {
              console.debug('Error refrescando usuarios/clientes', e?.message || e);
            } finally {
              setShowCreate(false);
            }
          }} />
        )}
      </main>
    </div>
  );
};

export default Usuarios;
