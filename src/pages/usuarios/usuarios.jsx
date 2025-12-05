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
  // Contadores globales (no dependen del filtro visible)
  const [totalUsuariosActivos, setTotalUsuariosActivos] = useState(0);
  const [totalClientesActivos, setTotalClientesActivos] = useState(0);
  const [totalClientesEliminados, setTotalClientesEliminados] = useState(0);
  const [totalNuevos30, setTotalNuevos30] = useState(0);

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

  // Heurística para detectar si un usuario actúa como administrador
  const detectIsAdmin = (u) => {
    try {
      if (!u) return false;
      // bandera explícita
      if (u.isAdmin === true || u.is_admin === true) return true;
      // propiedades simples
      const candidates = [];
      if (u.role) candidates.push(u.role);
      if (u.rol) candidates.push(u.rol);
      if (u.roles) {
        if (Array.isArray(u.roles)) candidates.push(...u.roles.map(r => (r && (r.name || r)) || ''));
        else candidates.push(u.roles);
      }
      if (u.usuarios_roles) {
        if (Array.isArray(u.usuarios_roles)) candidates.push(...u.usuarios_roles.map(r => (r && (r.name || r.role || r)) || ''));
        else candidates.push(u.usuarios_roles);
      }
      if (u.__raw) {
        candidates.push(JSON.stringify(u.__raw));
      }
      if (u.email) candidates.push(u.email);
      const txt = candidates.join(' ').toLowerCase();
      if (!txt) return false;
      // Si aparece 'admin' consideramos admin
      if (txt.includes('admin')) return true;
      // algunos proyectos usan 'super' o 'root' para cuentas especiales
      if (txt.includes('super') || txt.includes('root')) return true;
      return false;
    } catch (e) { return false; }
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
      isAdmin: detectIsAdmin(merged),
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

  // Helper: extraer recuento de publicaciones desde múltiples aliases/estructuras
  const getPublicationsCount = (obj) => {
    try {
      if (!obj) return 0;
      // campos directos que podrían representar el recuento (agregar aliases comunes)
      const direct = [
        obj.publicaciones_count, obj.posts_count, obj.pubs, obj.count_publicaciones, obj.publicaciones_total, obj.total_publicaciones,
        obj.publicacionesTotal, obj.publicacionesTotalCount, obj.cantidad_publicaciones, obj.total_posts, obj.posts_total, obj.numero_publicaciones,
        obj.totalPublicaciones, obj.totalPublicacionesCount
      ];
      for (const v of direct) {
        if (typeof v === 'number') return v;
        if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
      }

      // arrays que representan publicaciones
      if (Array.isArray(obj.publicaciones) && obj.publicaciones.length >= 0) return obj.publicaciones.length;
      if (Array.isArray(obj.posts) && obj.posts.length >= 0) return obj.posts.length;

      // revisar propiedades anidadas comunes y buscar recuentos de forma recursiva (profundidad limitada)
      const pubNameRe = /publica|publicaciones|posts|post|cantidad|total|imagenes_publicaciones|imagenes|items|list/i;

      const inspectCandidate = (o) => {
        if (!o || typeof o !== 'object') return null;
        // chequear campos directos conocidos
        const directFields = [
          'publicaciones_count', 'posts_count', 'pubs', 'publicacionesTotal', 'cantidad_publicaciones', 'total_posts', 'posts_total',
          'publicaciones_total', 'total_publicaciones', 'totalPublicaciones', 'totalPublicacionesCount', 'numero_publicaciones', 'count_publicaciones'
        ];
        for (const f of directFields) {
          if (Object.prototype.hasOwnProperty.call(o, f)) {
            const v = o[f];
            if (typeof v === 'number') return v;
            if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
          }
        }
        // arrays que probablemente contengan publicaciones
        for (const k of Object.keys(o)) {
          const v = o[k];
          if (Array.isArray(v) && pubNameRe.test(k)) return v.length;
          if (typeof v === 'number' && pubNameRe.test(k)) return v;
          if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)) && pubNameRe.test(k)) return Number(v);
        }
        return null;
      };

      const seen = new Set();
      const recurse = (o, depth = 0, maxDepth = 2) => {
        if (!o || typeof o !== 'object' || depth > maxDepth) return null;
        if (seen.has(o)) return null;
        seen.add(o);
        const direct = inspectCandidate(o);
        if (direct !== null) return direct;
        for (const k of Object.keys(o)) {
          try {
            const v = o[k];
            if (v && typeof v === 'object') {
              const r = recurse(v, depth + 1, maxDepth);
              if (r !== null) return r;
            }
          } catch (e) { /* ignore */ }
        }
        return null;
      };

      const found = recurse(obj, 0, 2);
      if (found !== null) return found;

      // Último recurso: escanear todas las propiedades del objeto buscando números o arrays que parezcan publicaciones
      for (const key of Object.keys(obj || {})) {
        const val = obj[key];
        if (typeof val === 'number') {
          if (pubNameRe.test(key)) return val;
        }
        if (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val))) {
          if (pubNameRe.test(key)) return Number(val);
        }
        if (Array.isArray(val)) {
          if (pubNameRe.test(key)) return val.length;
        }
      }

      return 0;
    } catch (e) { return 0; }
  };

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
      // Intentar obtener recuentos de publicaciones en bloque para mapear a usuarios/clientes
      let countsByUser = {};
      let countsByClient = {};
      try {
        const pubsRes = await api.get('/publicaciones/listar?limit=500').catch(() => ({ data: [] }));
        const pubs = pubsRes && pubsRes.data ? (Array.isArray(pubsRes.data) ? pubsRes.data : (Array.isArray(pubsRes.data.publicaciones) ? pubsRes.data.publicaciones : [])) : [];
        const userAliases = ['userId','usuario_id','usuarioId','usuario','authorId','autor_id','autorId','autor','ownerId','owner_id','owner','created_by'];
        const clientAliases = ['clienteId','cliente_id','cliente','clientId','client_id','client'];
        const tryExtractId = (val) => {
          if (!val && val !== 0) return null;
          if (typeof val === 'number') return String(val);
          if (typeof val === 'string' && val.trim() !== '') {
            if (!Number.isNaN(Number(val))) return String(Number(val));
            return val;
          }
          if (typeof val === 'object') {
            if (val.id) return String(val.id);
            if (val._id) return String(val._id);
          }
          return null;
        };
        for (const p of pubs) {
          let foundClient = null;
          for (const k of clientAliases) {
            if (Object.prototype.hasOwnProperty.call(p, k)) {
              const id = tryExtractId(p[k]);
              if (id) { foundClient = id; break; }
            }
          }
          if (foundClient) {
            countsByClient[foundClient] = (countsByClient[foundClient] || 0) + 1;
            continue;
          }
          let foundUser = null;
          for (const k of userAliases) {
            if (Object.prototype.hasOwnProperty.call(p, k)) {
              const id = tryExtractId(p[k]);
              if (id) { foundUser = id; break; }
            }
          }
          if (foundUser) {
            countsByUser[foundUser] = (countsByUser[foundUser] || 0) + 1;
            continue;
          }
          try {
            for (const key of Object.keys(p || {})) {
              const v = p[key];
              if (v && typeof v === 'object') {
                const id = tryExtractId(v.id || v._id || v.usuario_id || v.cliente_id || v.userId || v.clientId);
                if (id) {
                  if (/cliente|client/i.test(key)) countsByClient[id] = (countsByClient[id] || 0) + 1;
                  else countsByUser[id] = (countsByUser[id] || 0) + 1;
                  break;
                }
              }
            }
          } catch (e) { /* ignore */ }
        }
      } catch (e) {
        // no bloquear si falla el conteo adicional
      }
      // temporal debug removed: no imprimir JSON en producción
      if (!mountedRef.current) return;
      // Depuración: mostrar muestras crudas antes de mapear para identificar aliases inesperados
      // removed verbose raw-keys debug

      const mappedUsers = Array.isArray(uData) ? uData.map(u => ({
        id: u.id,
        name: u.fullname || u.nombre || u.name || u.email || u.correo_electronico,
        email: u.email || u.correo_electronico || '',
        role: deriveRole(u),
        state: normalizeState(u.estado || u.status),
        pubs: getPublicationsCount(u) || (countsByUser[String(u.id)] || countsByUser[String(u._id)] || 0),
        // Opción A: considerar todos los usuarios (no clientes) como admin para ocultar conteo
        isAdmin: true,
        createdAt: u.createdAt || u.created_at || u.fecha_registro || u.fecha_creacion || u.created || u.createdDate || null,
        isClient: false
      })) : [];
      const mappedClients = Array.isArray(cData) ? cData.map(c => ({
        id: `c-${c.id}`,
        name: c.fullname || c.nombre || c.name || c.razon_social || c.email || c.correo_electronico || '',
        email: c.email || c.correo_electronico || c.contacto_email || '',
        role: 'Cliente',
        state: normalizeState(c.estado || c.status),
        pubs: getPublicationsCount(c) || (countsByClient[String(c.id)] || countsByClient[String(c._id)] || 0),
        isAdmin: detectIsAdmin(c) || false,
        __raw: c,
        createdAt: c.createdAt || c.created_at || c.fecha_registro || c.fecha_creacion || c.created || c.createdDate || null,
        isClient: true
      })) : [];
      setUsers([...mappedUsers, ...mappedClients]);
      // removed mappedClients debug output
      // removed mappedUsers debug output
    } catch (err) {
      console.debug('No se pudieron cargar usuarios/clientes desde backend', err?.message || err);
    }
  };

  // Calcular contadores globales independientemente del filtro
  const fetchGlobalUserCounts = async () => {
    try {
      const usuariosRes = await api.get('/usuarios/listar?limit=500&incluirEliminados=true').catch(() => ({ data: [] }));
      const clientesRes = await api.get('/clientes/listar?limit=500&incluirEliminados=true').catch(() => ({ data: [] }));
      const uData = usuariosRes && usuariosRes.data ? usuariosRes.data : [];
      const cData = clientesRes && clientesRes.data ? clientesRes.data : [];

      const allUsers = Array.isArray(uData) ? uData : (Array.isArray(uData.usuarios) ? uData.usuarios : []);
      const allClients = Array.isArray(cData) ? cData : (Array.isArray(cData.clientes) ? cData.clientes : []);

      // Normalizar como en fetchUsers para garantizar que el campo createdAt esté presente
      const mappedUsers = Array.isArray(allUsers) ? allUsers.map(u => ({
        id: u.id,
        createdAt: u.createdAt || u.created_at || u.fecha_registro || u.fecha_creacion || u.created || u.createdDate || null,
        state: normalizeState(u.estado || u.status || u.state)
      })) : [];

      const mappedClients = Array.isArray(allClients) ? allClients.map(c => ({
        id: c.id,
        createdAt: c.createdAt || c.created_at || c.fecha_registro || c.fecha_creacion || c.created || c.createdDate || null,
        state: normalizeState(c.estado || c.status || c.state)
      })) : [];

      const usuariosActivos = mappedUsers.filter(u => String(u.state).toLowerCase() === 'activo').length;
      const clientesActivos = mappedClients.filter(c => String(c.state).toLowerCase() === 'activo').length;
      const clientesEliminados = mappedClients.filter(c => {
        const s = String(c.state).toLowerCase();
        return s.includes('elimin') || s.includes('delete') || s.includes('suspend');
      }).length;

      const now = Date.now();
      const ms30 = 30 * 24 * 60 * 60 * 1000;

      // Contar nuevos en los últimos 30 días entre usuarios y clientes combinados (evita duplicados por id)
      const seen = new Set();
      let nuevos30Count = 0;
      for (const u of mappedUsers) {
        if (!u || !u.id) continue;
        const key = `u:${u.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const ts = u.createdAt ? new Date(u.createdAt).getTime() : null;
        if (ts && (now - ts) <= ms30) nuevos30Count += 1;
      }
      for (const c of mappedClients) {
        if (!c || !c.id) continue;
        const key = `c:${c.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const ts = c.createdAt ? new Date(c.createdAt).getTime() : null;
        if (ts && (now - ts) <= ms30) nuevos30Count += 1;
      }

      // Depuración: registrar detalles para entender por qué 'Nuevos (30 días)' queda en 2
      try {
        // contar cuántos tienen createdAt y cuántos cumplen 30d
        const validUsers = mappedUsers.filter(u => u && u.createdAt);
        const validClients = mappedClients.filter(c => c && c.createdAt);
        const validUsersCount = validUsers.length;
        const validClientsCount = validClients.length;
        const usersNew = mappedUsers.filter(u => u && u.createdAt && ((now - new Date(u.createdAt).getTime()) <= ms30)).length;
        const clientsNew = mappedClients.filter(c => c && c.createdAt && ((now - new Date(c.createdAt).getTime()) <= ms30)).length;
        console.debug('[DEBUG] fetchGlobalUserCounts: totals -> usuarios:', mappedUsers.length, 'clientes:', mappedClients.length);
        console.debug('[DEBUG] fetchGlobalUserCounts: con createdAt -> usuarios:', validUsersCount, 'clientes:', validClientsCount);
        console.debug('[DEBUG] fetchGlobalUserCounts: nuevos30 -> usuarios:', usersNew, 'clientes:', clientsNew, 'combinedCount:', nuevos30Count);
        // mostrar hasta 10 ejemplos de fechas (no PII sensible)
        console.debug('[DEBUG] fetchGlobalUserCounts: muestras usuarios(createdAt):', validUsers.slice(0,10).map(u => ({ id: u.id, createdAt: u.createdAt })));
        console.debug('[DEBUG] fetchGlobalUserCounts: muestras clientes(createdAt):', validClients.slice(0,10).map(c => ({ id: c.id, createdAt: c.createdAt })));
      } catch (dbgErr) {
        console.debug('DEBUG error:', dbgErr);
      }

      setTotalUsuariosActivos(usuariosActivos);
      setTotalClientesActivos(clientesActivos);
      setTotalClientesEliminados(clientesEliminados);
      // Mantener extractor robusto de fecha y contar SOLO usuarios nuevos en 30 días
      const getCreatedTsRobust = (obj) => {
        if (!obj) return null;
        const candidates = [
          obj.createdAt, obj.created_at, obj.fecha_registro, obj.fecha_creacion, obj.created, obj.createdDate,
        ];
        const nested = ['data', 'cliente', 'detalle', 'user', 'usuario', 'profile', 'persona'];
        for (const k of nested) {
          if (obj[k]) {
            const v = obj[k].createdAt || obj[k].created_at || obj[k].fecha_registro || obj[k].fecha_creacion || obj[k].created || obj[k].createdDate;
            if (v) candidates.push(v);
          }
        }
        for (const key of Object.keys(obj || {})) {
          if (/fecha|created|createdat|created_at/i.test(key) && obj[key]) candidates.push(obj[key]);
        }
        for (const v of candidates) {
          if (!v) continue;
          const d = new Date(v);
          if (!Number.isNaN(d.getTime())) return d.getTime();
        }
        return null;
      };

      let usersOnlyNew = 0;
      const validUserDates = [];
      for (const u of mappedUsers) {
        const ts = getCreatedTsRobust(u);
        if (ts) validUserDates.push({ id: u.id, ts });
        if (ts && (now - ts) <= ms30) usersOnlyNew += 1;
      }

      console.debug('[DEBUG] fetchGlobalUserCounts: usuarios totales:', mappedUsers.length, 'con fecha válida:', validUserDates.length, 'nuevosUsuarios30:', usersOnlyNew);
      if (validUserDates.length > 0) console.debug('[DEBUG] fetchGlobalUserCounts: muestra usuarios(createdAt):', validUserDates.slice(0,10).map(x => ({ id: x.id, createdAt: new Date(x.ts).toISOString() })));

      setTotalNuevos30(usersOnlyNew);
    } catch (err) {
      // no bloquear UI por fallos en contadores
      // eslint-disable-next-line no-console
      console.warn('No se pudieron actualizar contadores globales de usuarios:', err);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchUsers();
    // inicializar contadores globales
    fetchGlobalUserCounts();
    return () => { mountedRef.current = false; };
  }, []);

  // Si el filtro de estado cambia a 'eliminado', pedir también los eliminados al servidor
  useEffect(() => {
    if (stateFilter === 'eliminado') fetchUsers();
  }, [stateFilter]);
  
  // Estados locales para la pestaña de Invitaciones y helpers mínimos
  const [activeTab, setActiveTab] = useState('list');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invites, setInvites] = useState([]);
  // Persistencia local simple: cargar invites previos generados
  useEffect(() => {
    try {
      const raw = localStorage.getItem('invites_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setInvites(parsed);
      }
    } catch (e) { /* ignore malformed data */ }
  }, []);

  // Intentar cargar invites existentes desde el backend y mezclarlos con lo local
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/admin/invite/list');
        if (!mounted) return;
        const server = Array.isArray(res && res.data) ? res.data.map(it => ({
          id: it.id,
          code: it.code || null,
          email: it.email || null,
          createdAt: it.createdAt || it.createdAt || it.created_at || it.createdAt || (it.createdAt ? it.createdAt : null) || it.createdAt || it.createdAt,
          active: !it.consumed,
          createdBy: it.createdBy || null
        })) : [];
        // Combinar: priorizar invites locales (tienen código en claro)
        try {
          const raw = localStorage.getItem('invites_v1');
          const local = raw ? JSON.parse(raw) : [];
          const mergedMap = new Map();
          // local first
          if (Array.isArray(local)) for (const l of local) mergedMap.set(String(l.id), l);
          for (const s of server) if (!mergedMap.has(String(s.id))) mergedMap.set(String(s.id), s);
          const merged = Array.from(mergedMap.values()).sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setInvites(merged);
          try { localStorage.setItem('invites_v1', JSON.stringify(merged)); } catch (e) {}
        } catch (e) {
          setInvites(server);
        }
      } catch (e) {
        // si falla, mantener lo que haya en local
        console.debug('No se pudieron cargar invites desde el servidor:', e && e.message ? e.message : e);
      }
    })();
    return () => { mounted = false; };
  }, []);
  // Paginación para invitaciones (independiente de la tabla de usuarios)
  const [invitePage, setInvitePage] = useState(1);
  const invitePageSize = 4;
  // Solo mostrar invites activos (ocultar consumidos) y filtrar seeds/fechas futuras
  const visibleInvites = useMemo(() => {
    try {
      if (!Array.isArray(invites)) return [];
      const now = Date.now();
      const futureTolerance = 60 * 1000; // 1 minute tolerance for clock skew
      return invites.filter(i => {
        if (!i) return false;
        // Solo mostrar invites activos (no consumidos)
        let isActive = true;
        if (typeof i.active === 'boolean') isActive = i.active === true;
        else if (typeof i.consumed === 'boolean') isActive = i.consumed === false;
        // Evitar mostrar entradas "vacías" que no tienen código, fecha ni creador
        const hasMeaningfulData = Boolean(i.code || i.createdAt || i.createdBy || i.email);
        if (!hasMeaningfulData) return false;

        // Excluir invites con fecha de creación en el futuro (probables datos quemados/seed)
        if (i.createdAt) {
          const ts = Date.parse(i.createdAt);
          if (!Number.isNaN(ts) && ts > (now + futureTolerance)) return false;
        }

        return isActive;
      });
    } catch (e) { return []; }
  }, [invites]);

  const inviteTotalPages = Math.max(1, Math.ceil(visibleInvites.length / invitePageSize));
  const paginatedInvites = useMemo(() => {
    const start = (invitePage - 1) * invitePageSize;
    return visibleInvites.slice(start, start + invitePageSize);
  }, [visibleInvites, invitePage]);

  useEffect(() => {
    // Si la lista de invites visibles cambia, asegurarnos que la página actual sigue en rango
    setInvitePage(p => Math.min(p, Math.max(1, Math.ceil(visibleInvites.length / invitePageSize) || 1)));
  }, [visibleInvites]);

  const generateInvite = async () => {
    try {
      const payload = { email: inviteEmail || null, role: 'admin' };
      console.debug('[Invite] Generando invite, payload:', payload);
      const res = await api.post('/admin/invite/create', payload);
      console.debug('[Invite] Respuesta create:', res && res.data ? res.data : res);
      const code = res && res.data && res.data.code ? res.data.code : null;
      const id = res && res.data && res.data.id ? res.data.id : null;
      if (code) {
        const nowIso = new Date().toISOString();
        // intentar leer el usuario actualmente logueado desde sessionStorage
        let authorName = null;
        try {
          const raw = sessionStorage.getItem('currentUser');
          if (raw) {
            const cu = JSON.parse(raw);
            authorName = cu && (cu.nombre || cu.name || cu.fullname || cu.email) ? (cu.nombre || cu.name || cu.fullname || cu.email) : null;
          }
        } catch (e) {
          // silent
        }
        const newInvite = { id: id || (`local-${Date.now()}`), code, email: inviteEmail || null, createdAt: nowIso, active: true, createdBy: authorName };
        setInvites(prev => {
          const next = [newInvite, ...prev];
          try { localStorage.setItem('invites_v1', JSON.stringify(next)); } catch (e) { /* ignore */ }
          return next;
        });
        setInviteEmail('');
        try { await navigator.clipboard.writeText(code); } catch (e) { /* fallback silently */ }
        try { await Swal.fire({ icon: 'success', title: 'Código generado', text: 'Código copiado al portapapeles', showConfirmButton: false, timer: 1200 }); } catch (e) { /* ignore */ }
      } else {
        try { await Swal.fire({ icon: 'success', title: 'Código generado', timer: 900, showConfirmButton: false }); } catch (e) {}
      }
    } catch (err) {
      console.error('Error generando invite', err);
      try { await Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el código' }); } catch (e) { /* ignore */ }
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      try { await Swal.fire({ icon: 'success', title: 'Copiado', showConfirmButton: false, timer: 900 }); } catch (e) {}
    } catch (e) {
      console.debug('No se pudo copiar', e);
      alert(text);
    }
  };

  const revokeInvite = async (idx) => {
    const target = invites[idx];
    // Si el invite viene del servidor (id numérico), intentar borrarlo en backend
    if (target && target.id && String(target.id).match(/^\d+$/)) {
      try {
        await api.delete(`/admin/invite/${target.id}`);
      } catch (e) {
        console.debug('No se pudo eliminar invite en servidor:', e && e.message ? e.message : e);
        // continuar limpiando local para evitar duplicados visibles
      }
    }
    setInvites(prev => {
      const next = prev.filter((_, i) => i !== idx);
      try { localStorage.setItem('invites_v1', JSON.stringify(next)); } catch (e) { /* ignore */ }
      return next;
    });
  };

  // Nota: la función para limpiar invites locales fue retirada por petición del usuario
  
  // Resumen calculado a partir de los datos cargados
  const summary = useMemo(() => ({
    usuariosActivos: totalUsuariosActivos,
    clientesActivos: totalClientesActivos,
    eliminados: totalClientesEliminados,
    nuevos30: totalNuevos30
  }), [totalUsuariosActivos, totalClientesActivos, totalClientesEliminados, totalNuevos30]);
  return (
    <div className="usuarios-page">
      <main className="usuarios-main">
        <h1 className="usuarios-title">Gestión de Usuarios</h1>
        <p className="usuarios-subtitle">Administra todos los usuarios de la plataforma</p>
        {/* (Tabs movidas al encabezado de la lista según diseño solicitado) */}
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

        {/* Pestañas inline siempre visibles (Lista / Códigos) */}
        <section className="usuarios-tabs-wrap usuarios-tabs-inline" style={{ marginTop: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" className={`tab-item ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
              <i className="fas fa-user-friends" aria-hidden="true" style={{ color: activeTab === 'list' ? '#0b73ff' : '#6b7280' }}></i>
              <span>Lista de Usuarios</span>
            </button>
            <span className="tab-sep">/</span>
            <button type="button" className={`tab-item ${activeTab === 'invites' ? 'active' : ''}`} onClick={() => setActiveTab('invites')}>
              <i className="fas fa-user-plus" aria-hidden="true" style={{ marginRight: 8 }}></i>
              <span>Códigos de Invitación</span>
            </button>
          </div>
        </section>

        {/* Encabezado de lista y tabla (contenido) */}
        {activeTab === 'list' && (
          <>
            <section className="usuarios-list-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                </div>
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
                    <td className="td-pubs">{u.isAdmin ? '#' : u.pubs}</td>
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
                                    // si el filtro actual o el estado del usuario indican 'eliminado', pedir detalle incluyendo eliminados
                                    const includeDeleted = stateFilter === 'eliminado' || (u && String(u.state || '').toLowerCase() === 'eliminado');
                                    if (u.isClient || (String(u.id).startsWith('c-'))) {
                                      const rawId = String(u.id).startsWith('c-') ? String(u.id).slice(2) : u.id;
                                      // El backend expone /clientes/detalle/:id
                                      resp = await api.get(`/clientes/detalle/${rawId}${includeDeleted ? '?incluirEliminados=true' : ''}`);
                                      normalized = normalizeProfile(resp && resp.data ? resp.data : u, true);
                                    } else {
                                      // El backend expone /usuarios/detalle/:id
                                      resp = await api.get(`/usuarios/detalle/${u.id}${includeDeleted ? '?incluirEliminados=true' : ''}`);
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
                                {stateFilter !== 'eliminado' && (
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
                                      // actualizar contadores globales sin cambiar filtros
                                      await fetchGlobalUserCounts();
                                      try { await Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1400, showConfirmButton: false }); } catch (e) {}
                                    } catch (err) {
                                      console.error('Error eliminando usuario/cliente', err);
                                      try { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar en el servidor.' }); } catch (e) { alert('No se pudo eliminar'); }
                                    }
                                  }}>Eliminar</button></li>
                                )}
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
          </>
        )}

        {/* Panel de Códigos de Invitación (UI inicial) */}
        {activeTab === 'invites' && (
          <section className="usuarios-invites-panel">
            <div className="um-card" style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="filter-btn active" onClick={generateInvite} style={{ whiteSpace: 'nowrap' }}>+ Generar Código</button>
              <div style={{ flex: 1 }} />
            </div>
            <div className="invites-list">
              {visibleInvites.length === 0 && (
                <div className="um-card invites-empty">No hay códigos activos. Usa "Generar Código" para crear uno.</div>
              )}
              {paginatedInvites.map((it, idx) => {
                const globalIdx = (invitePage - 1) * invitePageSize + idx;
                return (
                  <div className="um-card" key={globalIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0b73ff' }}>
                        {it.code} <span className={`state-badge ${it.active ? 'state-active' : 'state-used-invite'}`} style={{ marginLeft: 8 }}>{it.active ? 'Activo' : 'Usado'}</span>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Creado: {it.createdAt}{it.createdBy && <span> por {it.createdBy}</span>}</div>
                      {it.email && <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Para: {it.email}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="icon-btn copy" onClick={() => copyToClipboard(it.code)} title="Copiar código" aria-label="Copiar código">
                        <i className="fas fa-clipboard" aria-hidden="true"></i>
                      </button>
                      <button className="icon-btn danger" onClick={async () => {
                        const result = await Swal.fire({
                          title: 'Eliminar código?',
                          text: '¿Deseas eliminar este código de invitación? Esta acción no se puede deshacer.',
                          icon: 'warning',
                          showCancelButton: true,
                          confirmButtonText: 'Sí, eliminar',
                          cancelButtonText: 'Cancelar'
                        });
                        if (result && result.isConfirmed) {
                          revokeInvite(globalIdx);
                          try { await Swal.fire({ icon: 'success', title: 'Eliminado', showConfirmButton: false, timer: 1100 }); } catch (e) {}
                        }
                      }} title="Eliminar" aria-label="Eliminar">
                        <i className="fas fa-trash-alt" aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Paginación de invitaciones (solo en la pestaña 'invites') */}
            {activeTab === 'invites' && inviteTotalPages > 1 && (
              <div className="pagination-wrap" style={{ marginTop: 14 }}>
                <div className="pagination">
                  <button className="page-btn" onClick={() => setInvitePage(p => Math.max(1, p - 1))} disabled={invitePage === 1}>Anterior</button>
                  {Array.from({ length: inviteTotalPages }).map((_, i) => (
                    <button key={i} className={`page-btn ${invitePage === i + 1 ? 'active' : ''}`} onClick={() => setInvitePage(i + 1)} aria-current={invitePage === i + 1 ? 'page' : undefined}>{i + 1}</button>
                  ))}
                  <button className="page-btn" onClick={() => setInvitePage(p => Math.min(inviteTotalPages, p + 1))} disabled={invitePage === inviteTotalPages}>Siguiente</button>
                </div>
              </div>
            )}
          </section>
        )}
        {/* Paginación de usuarios (solo en la pestaña 'Lista') */}
        {activeTab === 'list' && totalPages > 1 && (
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
              await fetchGlobalUserCounts();
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
  