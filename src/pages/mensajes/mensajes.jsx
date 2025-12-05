import React, { useEffect, useState, useRef } from 'react';
import '../../assets/scss/mensajes.scss';
import reportsService from '../../services/reports';
import chatService from '../../services/chat';
import { FaCalendarAlt, FaCheck, FaTimesCircle, FaUserSlash, FaExclamationTriangle, FaTrash, FaSyncAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

// Etiqueta usada como autor cuando un mensaje fue eliminado
const DELETED_AUTHOR = 'Eliminado';

const EstadoBadge = ({ estado }) => {
  const map = {
    abierto: { text: 'Pendiente', cls: 'badge-pending' },
    pendiente: { text: 'Pendiente', cls: 'badge-pending' },
    en_revision: { text: 'En revisión', cls: 'badge-review' },
    resuelto: { text: 'Revisado', cls: 'badge-resolved' },
    rechazado: { text: 'Descartado', cls: 'badge-rejected' }
  };
  const v = map[estado] || { text: estado || 'Pendiente', cls: 'badge-pending' };
  return <span className={`estado-badge ${v.cls}`}>{v.text}</span>;
};

const Mensajes = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [hiddenReports, setHiddenReports] = useState(() => {
    try {
      const raw = sessionStorage.getItem('mensajes.hiddenReports');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) { return new Set(); }
  });
  const listRef = useRef(null);
  const convRef = useRef(null);
  const [noPermission, setNoPermission] = useState(false);

  // Persistir clientes marcados como eliminados localmente para mantener UI consistente
  const [deletedClients, setDeletedClients] = useState(() => {
    try {
      const raw = sessionStorage.getItem('mensajes.deletedClients');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) { return new Set(); }
  });

  const markClientDeletedLocal = (clientId) => {
    try {
      if (!clientId) return;
      setDeletedClients(prev => {
        const next = new Set(prev);
        next.add(String(clientId));
        try { sessionStorage.setItem('mensajes.deletedClients', JSON.stringify(Array.from(next))); } catch (e) {}
        return next;
      });
    } catch (e) { /* ignore */ }
  };

  

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await reportsService.listReports({ page: 1, limit: 100 });
      // debug removed for production
      // Normalizar formas de respuesta posibles: array | { rows } | { reports } | { data }
      let arr = [];
      if (Array.isArray(data)) arr = data;
      else if (data && Array.isArray(data.rows)) arr = data.rows;
      else if (data && Array.isArray(data.reports)) arr = data.reports;
      else if (data && Array.isArray(data.data)) arr = data.data;
      else if (data && Array.isArray(data.hits)) arr = data.hits; // por si usan otro wrapper
      else arr = [];

      // Mapear a una forma consistente (asegura campos usados en UI)
      const mapped = arr.map(mapReportToItem);
      // Añadir campos de display seguros para evitar pasar objetos como children
      const safe = mapped.map(m => ({ ...m, cliente_display: asText(m.cliente), reportado_display: asText(m.reportado) }));
      // Filtrar reportes que el admin haya decidido 'retirar' localmente
      const visible = safe.filter(r => !hiddenReports.has(String(r.id)));
      setReports(visible);
      setNoPermission(false);
    } catch (err) {
      console.error('Error cargando reportes', err);
      // distinguir falta de permisos
      if (err && err.response && err.response.status === 403) {
        // marcar estado para mostrar aviso inline en lugar de un modal intrusivo
        console.warn('Acceso denegado a /reports/admin (403)');
        setNoPermission(true);
        setReports([]);
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los reportes' });
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadReports(); }, []);

  const selectReport = async (r) => {
    // obtener detalle del reporte para tener relaciones actualizadas
    setSelected(null);
    setConversation([]);
    setDetailLoading(true);
    try {
    const detail = await reportsService.getReport(r.id);
    // debug: log raw detail returned by the service
    console.log('[Mensajes] selectReport detail (raw from service):', detail);
    const repRaw = detail || r;
      const rep = mapReportToItem(repRaw);
    setSelected(rep);
    // debug: log the normalized report object we set as selected
    console.log('[Mensajes] selectReport mapped rep:', rep);

      // determinar chatId en varias formas
      const chatId = rep.chatId || rep.chat || (rep.chats && rep.chats.id) || (rep.chat && rep.chat.id) || (rep.mensajes && rep.mensajes.chatId) || rep.mensaje && rep.mensaje.chatId || null;
      if (chatId) {
        const msgs = await chatService.listarMensajes(chatId);
        const mapped = Array.isArray(msgs) ? msgs.map(m => {
          const pickName = (obj) => {
            if (!obj) return null;
            if (typeof obj === 'string') return obj;
            if (typeof obj === 'object') {
              return obj.nombre || obj.name || obj.email || null;
            }
            return null;
          };

          // try common places for author info inside the message
          const authorFromObject = pickName(m.cliente) || pickName(m.usuario) || pickName(m.remitente) || pickName(m.author) || pickName(m.autor) || null;
          const authorFromFields = pickName(m.remitente_nombre) || pickName(m.remitenteName) || pickName(m.senderName) || pickName(m.from) || null;
          const authorNameRaw = authorFromObject || authorFromFields || null;

          const authorId = m.clienteId || m.usuarioId || m.remitenteId || m.fromId || m.senderId || null;

          // Determine a sensible display name. Prefer the message's own author name.
          let authorDisplay = null;
          if (authorNameRaw) authorDisplay = authorNameRaw;

          // If we still don't have a name, but the id matches known participants, use their display
          if (!authorDisplay && authorId) {
            if (rep && rep.clienteId && String(authorId) === String(rep.clienteId)) {
              authorDisplay = rep.cliente_display || asText(rep.cliente) || 'Usuario';
            } else if (rep && rep.reportado && rep.reportado.id && String(authorId) === String(rep.reportado.id)) {
              authorDisplay = asText(rep.reportado.nombre || rep.reportado.name) || 'Usuario';
            }
          }

          // Final fallback
          if (!authorDisplay) authorDisplay = 'Usuario';

          // Determine sender side: prefer 'them' when authorId matches the reported client,
          // otherwise treat as 'you' (admin) when authorId exists but doesn't match the report's client.
          let senderSide = 'them';
          if (authorId && rep) {
            if (rep.clienteId && String(authorId) === String(rep.clienteId)) {
              senderSide = 'them';
            } else {
              // authorId exists but it's not the reported client => likely admin/other participant => show on right
              senderSide = 'you';
            }
          } else {
            // fallback: try flags that might indicate admin/you
            if (m.remitente === 'admin' || m.source === 'admin' || m.from === 'admin' || m.isAdmin) senderSide = 'you';
            else senderSide = 'them';
          }

          // Detectar borrado lógico en el mensaje y normalizar la presentación
          const isDeletedMsg = (m.estado && String(m.estado).toLowerCase() === 'eliminado') || (m.cuerpo && String(m.cuerpo).includes('[Mensaje eliminado'));
          const textContent = isDeletedMsg ? '[Mensaje eliminado]' : (m.cuerpo || m.texto || m.body || '');

          return {
            id: m.id,
            text: textContent,
            sender: senderSide,
            time: m.fecha_creacion || m.created_at,
            // Mantener el nombre real del autor; mostrar el placeholder dentro del bubble
            author: authorDisplay,
            authorId: authorId,
            isDeleted: !!isDeletedMsg
          };
        }) : [];
        setConversation(mapped);
        // Removed automatic scroll to bottom so the user keeps control of the scrollbar with the mouse.
        // If you want a smart autoscroll (only when user is near bottom), we can add that later.
      } else {
        setConversation([]);
      }
    } catch (e) {
      console.error('Error cargando detalle/mensajes del reporte', e);
      if (e && e.response && e.response.status === 403) {
        console.warn('Acceso denegado a detalle de reporte (403)');
        setNoPermission(true);
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el reporte' });
      }
      // conservar el item mínimo mientras arreglamos permisos
      setSelected(mapReportToItem(r));
    } finally {
      setDetailLoading(false);
    }
  };

  // Convertir un posible valor (string|object|number) a texto seguro para render
  const asText = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'object') {
      // Si es un objeto usuario/cliente, preferir propiedades legibles
      const pick = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string') return obj;
        if (typeof obj === 'object') {
          if (obj.nombre && typeof obj.nombre !== 'object') return obj.nombre;
          if (obj.name && typeof obj.name !== 'object') return obj.name;
          if (obj.email && typeof obj.email !== 'object') return obj.email;
          if (obj.correo_electronico && typeof obj.correo_electronico !== 'object') return obj.correo_electronico;
          if (obj.correo && typeof obj.correo !== 'object') return obj.correo;
          if (obj.id) return String(obj.id);
          // buscar propiedades anidadas comunes
          if (obj.usuario && (obj.usuario.nombre || obj.usuario.name)) return obj.usuario.nombre || obj.usuario.name;
          if (obj.autor && (obj.autor.nombre || obj.autor.name)) return obj.autor.nombre || obj.autor.name;
        }
        return null;
      };
      const p = pick(v);
      if (p) return p;
      try { return JSON.stringify(v); } catch (e) { return String(v); }
    }
    return String(v);
  };

  // Obtener iniciales legibles a partir de un nombre/valor (para avatar)
  const getInitials = (v) => {
    try {
      const name = asText(v || '') || '';
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length === 0) return '?';
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } catch (e) {
      return '?';
    }
  };

  // Formatear fechas en formato local legible
  const formatDate = (d) => {
    if (!d) return '';
    try {
      const dt = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d;
      if (isNaN(dt.getTime && dt.getTime())) return String(d);
      return dt.toLocaleString();
    } catch (e) { return String(d); }
  };

  // Formato compacto para encabezados: "4 dic 2025 · 00:32"
  const formatDateCompact = (d) => {
    if (!d) return '';
    try {
      const dt = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d;
      if (isNaN(dt.getTime && dt.getTime())) return String(d);
      const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
      const day = dt.getDate();
      const month = months[dt.getMonth()];
      const year = dt.getFullYear();
      const pad = n => String(n).padStart(2,'0');
      const hours = pad(dt.getHours());
      const mins = pad(dt.getMinutes());
      return `${day} ${month} ${year} · ${hours}:${mins}`;
    } catch (e) { return String(d); }
  };

  // Helper: normalizar un objeto de reporte a campos usados en UI
  function mapReportToItem(raw) {
    if (!raw) return {};
    // Merge layers like in usuarios.normalizeProfile to be robust
    const src = Array.isArray(raw) && raw.length > 0 ? raw[0] : raw;
    const merged = Object.assign({},
      typeof src === 'object' && src ? src : {},
      typeof src.data === 'object' && src.data ? src.data : {},
      typeof src.report === 'object' && src.report ? src.report : {},
      typeof src.reporte === 'object' && src.reporte ? src.reporte : {},
      typeof src.mensaje === 'object' && src.mensaje ? src.mensaje : {},
      typeof src.mensajes === 'object' && src.mensajes ? src.mensajes : {},
      typeof src.cliente === 'object' && src.cliente ? src.cliente : {},
      typeof src.user === 'object' && src.user ? src.user : {},
      typeof src.reporter === 'object' && src.reporter ? src.reporter : {}
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

    // Preferir el id original del objeto fuente `src` (el id del reporte) antes
    // de aceptar que propiedades anidadas (p. ej. `mensajes.id`) sobrescriban `id`.
    const id = (src && (src.id || src.reportId || src.reporteId || src.reporte)) || merged.id || merged.reportId || merged.reporteId || merged.reporte || null;
    const motivo = getFirst(merged, ['motivo', 'reason', 'razon', 'reason_text']) || '';
    // mensaje_snapshot: puede venir como objeto (ej. el mensaje completo). Normalizar a string.
    let mensaje_snapshot = getFirst(merged, ['mensaje_snapshot', 'snapshot', 'mensaje', 'cuerpo', 'body']) || '';
    if (mensaje_snapshot && typeof mensaje_snapshot === 'object') {
      // intentar extraer campos comunes
      mensaje_snapshot = mensaje_snapshot.cuerpo || mensaje_snapshot.body || mensaje_snapshot.text || mensaje_snapshot.mensaje || JSON.stringify(mensaje_snapshot);
    }
    mensaje_snapshot = typeof mensaje_snapshot === 'string' ? mensaje_snapshot : String(mensaje_snapshot || '');
    // Preferir el estado del objeto original `src` (reported_messages) para evitar
    // que propiedades anidadas (cliente.estado) lo sobrescriban.
    const estado = (src && getFirst(src, ['estado', 'status', 'state'])) || getFirst(merged, ['estado', 'status', 'state']) || 'abierto';
    // Priorizar la fecha del objeto raíz `src` si existe; solo usar valores anidados
    // cuando la raíz no provea la fecha. Esto evita que fechas dentro de `mensaje`
    // o `chat` reemplacen la fecha real del reporte.
    const fecha_creacion = (src && getFirst(src, ['fecha_creacion', 'createdAt', 'created_at', 'created'])) || getFirst(merged, ['fecha_creacion', 'createdAt', 'created_at', 'created']) || null;

    const clienteObj = merged.cliente || merged.user || merged.reporter || (merged.clienteId ? { id: merged.clienteId, nombre: getFirst(merged, ['reporter_nombre', 'reporterName', 'nombre']) } : null);
    const clienteId = merged.clienteId || (clienteObj && clienteObj.id) || merged.reporterId || merged.usuarioId || null;

    // Extraer el usuario reportado (el autor del mensaje) si está disponible
    const mensajeObj = merged.mensaje || merged.mensajes || merged.message || null;
    let reportedNombre = null;
    let reportedId = null;
    if (mensajeObj) {
      // 1) Si el mensaje trae un objeto cliente/usuario enlazado, preferirlo
      if (mensajeObj.cliente && (mensajeObj.cliente.nombre || mensajeObj.cliente.name)) {
        reportedNombre = mensajeObj.cliente.nombre || mensajeObj.cliente.name;
        reportedId = mensajeObj.cliente.id || mensajeObj.cliente.usuarioId || null;
      } else if (mensajeObj.usuario && (mensajeObj.usuario.nombre || mensajeObj.usuario.name)) {
        reportedNombre = mensajeObj.usuario.nombre || mensajeObj.usuario.name;
        reportedId = mensajeObj.usuario.id || mensajeObj.usuario.userId || null;
      } else if (mensajeObj.remitente && typeof mensajeObj.remitente === 'object' && (mensajeObj.remitente.nombre || mensajeObj.remitente.name)) {
        reportedNombre = mensajeObj.remitente.nombre || mensajeObj.remitente.name;
        reportedId = mensajeObj.remitente.id || mensajeObj.remitente.usuarioId || null;
      } else {
        // 2) intentar múltiples aliases planos
        reportedNombre = getFirst(mensajeObj, [
          'remitente_nombre','remitenteName','remitenteNombre','nombre_remitente',
          'autor_nombre','autorName','autor_nombre','autor',
          'senderName','sender','author_name','authorName',
          'nombre','name','usuario_nombre','usuarioName','cliente_nombre'
        ]);
        reportedId = mensajeObj.clienteId || mensajeObj.usuarioId || mensajeObj.userId || mensajeObj.remitenteId || null;
      }
    }
    // Si reportedNombre es un objeto (por ej. {id,nombre,...}), extraer su nombre
    if (reportedNombre && typeof reportedNombre === 'object') {
      reportedNombre = (reportedNombre.nombre || reportedNombre.name || reportedNombre.email || JSON.stringify(reportedNombre)) || null;
    }
    const reportadoObj = reportedNombre || reportedId ? { id: reportedId, nombre: reportedNombre || null } : null;

    const mensajes = merged.mensajes || merged.mensaje || merged.message || null;
    const chatId = merged.chatId || merged.chat_id || (merged.chats && merged.chats.id) || (mensajes && mensajes.chatId) || null;

    // Heurística: detectar valores que parecen hashes (bcrypt/base64) y no mostrarlos tal cual
    const looksLikeHash = (s) => {
      if (!s) return false;
      if (typeof s !== 'string') s = String(s);
      // bcrypt hashes start with $2a$ or $2b$ etc
      if (/^\$2[aby]\$/.test(s)) return true;
      // long base64-like strings
      if (/^[A-Za-z0-9+/=]{30,}$/.test(s)) return true;
      return false;
    };

    // sanitize cliente nombre
    if (clienteObj && clienteObj.nombre && looksLikeHash(clienteObj.nombre)) {
      clienteObj.nombre = null;
    }
    // sanitize reported nombre
    if (reportadoObj && reportadoObj.nombre && looksLikeHash(reportadoObj.nombre)) {
      reportadoObj.nombre = null;
    }
    // sanitize remitente dentro de mensajes
    try {
      if (mensajes && mensajes.remitente && looksLikeHash(mensajes.remitente)) {
        if (typeof mensajes === 'object') mensajes.remitente = null;
      }
    } catch (e) {}

    return { ...merged, id, motivo, mensaje_snapshot, estado, fecha_creacion, cliente: clienteObj, clienteId, mensajes, chatId, reportado: reportadoObj };
  }

  const updateEstado = async (id, estado, comentario = '') => {
    try {
      await reportsService.updateReport(id, { estado, comentario_admin: comentario });
      Swal.fire({ icon: 'success', title: 'Hecho', text: 'Estado actualizado' });
      await loadReports();
      if (selected && String(selected.id) === String(id)) {
        const updated = reports.find(x => String(x.id) === String(id));
        setSelected({ ...(selected || {}), estado });
      }
    } catch (err) {
      console.error('Error actualizando estado', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el estado' });
    }
  };

  const performAdminAction = async (id, accion, comentario = '') => {
    try {
      // For actions we call updateReport with the accion field
      await reportsService.updateReport(id, { accion, comentario_admin: comentario });
      Swal.fire({ icon: 'success', title: 'Hecho', text: 'Acción ejecutada' });
      // Si el admin eliminó al cliente, actualizar el estado localmente para que
      // la UI refleje inmediatamente que el cliente está eliminado y muestre
      // sólo el botón "Retirar Conversación".
      if (accion === 'eliminar_cliente') {
        try {
          setSelected(prev => {
            if (!prev) return prev;
            const nextCliente = { ...(prev.cliente || {}), estado: 'eliminado', deleted: true, isDeleted: true, removed: true };
            return { ...prev, cliente: nextCliente };
          });
        } catch (e) { /* ignore local update errors */ }
        // marcar localmente para persistir la UI incluso si el backend tarda en propagar
        try {
          const clientIdLocal = selected && selected.cliente && (selected.cliente.id || selected.clienteId) ? (selected.cliente.id || selected.clienteId) : null;
          if (clientIdLocal) markClientDeletedLocal(clientIdLocal);
        } catch (e) { /* ignore */ }
      }
      // refresh list and detail
      await loadReports();
      if (selected && String(selected.id) === String(id)) {
        // reload detail to reflect changes, but preserve local 'cliente eliminado' flag
        try {
          const detail = await reportsService.getReport(id);
          let updated = mapReportToItem(detail || selected);
          if (accion === 'eliminar_cliente') {
            updated = { ...(updated || {}), cliente: { ...(updated && updated.cliente ? updated.cliente : {}), estado: 'eliminado', deleted: true, isDeleted: true, removed: true } };
          }
          setSelected(updated);
          // If the action was deleting the reported message, refresh the chat messages
          // so the UI shows the updated message state (e.g. '[Mensaje eliminado]') instead
          // of clearing the conversation. Also preserve the conversation when cliente is deleted.
          if (updated && updated.chatId) {
            try {
              const msgs = await chatService.listarMensajes(updated.chatId);
              const mapped = Array.isArray(msgs) ? msgs.map(m => {
                const pickName = (obj) => {
                  if (!obj) return null;
                  if (typeof obj === 'string') return obj;
                  if (typeof obj === 'object') {
                    return obj.nombre || obj.name || obj.email || null;
                  }
                  return null;
                };

                const authorFromObject = pickName(m.cliente) || pickName(m.usuario) || pickName(m.remitente) || pickName(m.author) || pickName(m.autor) || null;
                const authorFromFields = pickName(m.remitente_nombre) || pickName(m.remitenteName) || pickName(m.senderName) || pickName(m.from) || null;
                const authorNameRaw = authorFromObject || authorFromFields || null;

                const authorId = m.clienteId || m.usuarioId || m.remitenteId || m.fromId || m.senderId || null;

                let authorDisplay = null;
                if (authorNameRaw) authorDisplay = authorNameRaw;
                if (!authorDisplay && authorId) {
                  if (updated && updated.clienteId && String(authorId) === String(updated.clienteId)) {
                    authorDisplay = updated.cliente_display || asText(updated.cliente) || 'Usuario';
                  } else if (updated && updated.reportado && updated.reportado.id && String(authorId) === String(updated.reportado.id)) {
                    authorDisplay = asText(updated.reportado.nombre || updated.reportado.name) || 'Usuario';
                  }
                }
                if (!authorDisplay) authorDisplay = 'Usuario';

                let senderSide = 'them';
                if (authorId && updated) {
                  if (updated.clienteId && String(authorId) === String(updated.clienteId)) {
                    senderSide = 'them';
                  } else {
                    senderSide = 'you';
                  }
                } else {
                  if (m.remitente === 'admin' || m.source === 'admin' || m.from === 'admin' || m.isAdmin) senderSide = 'you';
                  else senderSide = 'them';
                }

                const isDeletedMsg = (m.estado && String(m.estado).toLowerCase() === 'eliminado') || (m.cuerpo && String(m.cuerpo).includes('[Mensaje eliminado'));
                const textContent = isDeletedMsg ? '[Mensaje eliminado]' : (m.cuerpo || m.texto || m.body || '');

                return {
                  id: m.id,
                  text: textContent,
                  sender: senderSide,
                  time: m.fecha_creacion || m.created_at,
                  author: authorDisplay,
                  authorId: authorId,
                  isDeleted: !!isDeletedMsg
                };
              }) : [];
              setConversation(mapped);
            } catch (e) {
              // if fetching messages fails, do not clear existing conversation
              console.warn('No se pudieron recargar mensajes del chat tras acción administrativa', e);
            }
          }
        } catch (e) { /* ignore */ }
        // Only clear the conversation for actions that remove/retire the conversation from view.
        // When the admin deletes the cliente or a message, we want to KEEP showing the conversation (and not clear it),
        // so the moderator can still review messages even if the client is marked deleted or a message was removed.
        if (accion !== 'eliminar_cliente' && accion !== 'eliminar_mensaje') {
          setConversation([]);
        }
      }
    } catch (err) {
      console.error('Error ejecutando acción administrativa', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo ejecutar la acción' });
    }
  };

  // Ocultar localmente un reporte para esta sesión/admin (no afecta al cliente ni al backend)
  const hideReportLocally = (id) => {
    try {
      const key = String(id);
      const next = new Set(hiddenReports);
      next.add(key);
      setHiddenReports(next);
      sessionStorage.setItem('mensajes.hiddenReports', JSON.stringify(Array.from(next)));
      // quitar del listado inmediatamente y limpiar detalle
      setReports(prev => prev.filter(r => String(r.id) !== key));
      if (selected && String(selected.id) === key) setSelected(null);
      Swal.fire({ icon: 'success', title: 'Hecho', text: 'Conversación retirada de tu vista' });
    } catch (e) {
      console.error('No se pudo ocultar localmente el reporte', e);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo retirar la conversación localmente' });
    }
  };

  // Compute selected display name and avatar URL to avoid using the global `name` variable
  const selectedName = selected ? (
    (selected.reportado && (selected.reportado.nombre || selected.reportado.name)) ? asText(selected.reportado.nombre || selected.reportado.name)
    : (selected.cliente && (selected.cliente.nombre || selected.cliente.name)) ? asText(selected.cliente.nombre || selected.cliente.name)
    : 'Usuario'
  ) : '';

  const selectedAvatar = selected ? (
    (selected.cliente && (selected.cliente.avatar || selected.cliente.avatarUrl || selected.cliente.imagen)) ||
    (selected.reportado && (selected.reportado.avatar || selected.reportado.avatarUrl)) || null
  ) : null;

  // Calcular fecha para el header con varios fallbacks comunes
  const headerDate = selected ? (
    selected.fecha_creacion || selected.createdAt || selected.created_at || selected.created ||
    (selected.mensajes && (selected.mensajes.created_at || selected.mensajes.createdAt || selected.mensajes.fecha_creacion)) ||
    (selected.mensaje && (selected.mensaje.created_at || selected.mensaje.createdAt || selected.mensaje.fecha_creacion)) ||
    null
  ) : null;

  // debug: log selection/date resolution to help diagnose inconsistent date fields
  console.log('[Mensajes] headerDate debug', {
    selectedId: selected && selected.id,
    fecha_creacion: selected && selected.fecha_creacion,
    createdAt: selected && selected.createdAt,
    created_at: selected && selected.created_at,
    mensaje_created: selected && selected.mensaje && (selected.mensaje.createdAt || selected.mensaje.created_at || selected.mensaje.fecha_creacion),
    mensajes_created: selected && selected.mensajes && (selected.mensajes.createdAt || selected.mensajes.created_at || selected.mensajes.fecha_creacion),
    headerDate
  });

  // Detectar si el cliente asociado al reporte está marcado como eliminado (varias señales posibles)
  const client = selected && selected.cliente ? selected.cliente : null;
  const clientDeleted = (client && (
    (client.estado && String(client.estado).toLowerCase() === 'eliminado') ||
    client.deleted === true || client.isDeleted === true || client.removed === true ||
    String(client.estado || '').toLowerCase() === 'deleted'
  )) || (client && deletedClients && deletedClients.has(String(client.id || client.clienteId || '')));
  // estado normalizado del reporte
  const status = String((selected && selected.estado) || '').toLowerCase();
  const isPending = status === 'abierto' || status === 'pendiente';

  return (
    <div className="admin-page mensajes-page">
      <div className="mensajes-header">
        <h2>Gestión de Mensajes</h2>
        <p className="muted">Aquí podrás revisar los mensajes reportados y administrar acciones sobre ellos.</p>
      </div>

      <div className="mensajes-grid">
        <aside className="mensajes-list">
          <div className="mensajes-list-header">
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%'}}>
              <strong>Reportes de Mensajes</strong>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <button className="btn small" onClick={loadReports} title="Actualizar"><FaSyncAlt /></button>
                <div className="muted small">{reports.filter(r => {
                    const s = String((r && r.estado) || '').toLowerCase();
                    return s === 'abierto' || s === 'pendiente';
                  }).length} pendientes</div>
              </div>
            </div>
            </div>
            {noPermission && (
              <div style={{padding:12, marginTop:12, borderRadius:8, background:'#fff3cd', color:'#856404', border:'1px solid #ffeeba'}}>
                <strong>Sin permisos para listar reportes.</strong>
                <div className="muted small" style={{marginTop:6}}>Tu sesión parece no tener privilegios administrativos para acceder a `/reports/admin`.</div>
                <div style={{marginTop:8, display:'flex', gap:8}}>
                  <button className="btn small" onClick={() => { setNoPermission(false); loadReports(); }}>Reintentar</button>
                  <button className="btn small" onClick={() => window.location.href = '/usuarios'}>Ir a Usuarios</button>
                </div>
              </div>
            )}
          <div className="mensajes-items" ref={listRef}>
            {loading ? <div className="loading">Cargando...</div> : (
              reports.length === 0 ? <div className="muted" style={{padding:12}}>No hay reportes.</div> : (
                reports.map(r => {
                  const titleText = r && r.reportado ? (r.reportado_display || asText(r.reportado)) : (r && r.cliente ? (r.cliente_display || asText(r.cliente)) : `Report #${r.id}`);
                  const bodyText = asText(r.mensaje_snapshot && r.mensaje_snapshot.length ? r.mensaje_snapshot : (r.motivo || ''));
                  const reporterText = r && r.cliente ? (r.cliente_display || asText(r.cliente)) : 'Usuario';
                  // intentar detectar URL de avatar en posibles campos
                  const avatarUrl = (r && r.cliente && (r.cliente.avatar || r.cliente.avatarUrl || r.cliente.imagen)) || (r && r.reportado && (r.reportado.avatar || r.reportado.avatarUrl)) || null;
                  return (
                  <button key={r.id} title={`${titleText}`} className={`report-item ${selected && String(selected.id)===String(r.id) ? 'active' : ''}`} onClick={() => selectReport(r)}>
                    <div className="ri-left">
                      {avatarUrl ? (
                        <div className="ri-avatar" title={reporterText}>
                          <img src={avatarUrl} alt={reporterText} />
                        </div>
                      ) : (
                        <div className="ri-avatar" aria-hidden title={reporterText}>{getInitials(reporterText)}</div>
                      )}
                    </div>
                    <div style={{flex:1}}>
                      <div className="ri-top">
                        <div style={{display:'flex', alignItems:'center', gap:10}}>
                          <div className="ri-title">{ titleText }</div>
                        </div>
                        <EstadoBadge estado={r.estado} />
                      </div>
                      <div className="ri-body">{ bodyText.length>140 ? bodyText.slice(0,137)+'...' : bodyText }</div>
                      <div className="ri-meta">
                        <span className="small muted">Reportado por { reporterText }</span>
                        <span className="small muted" style={{marginLeft:8}}>{r.fecha_creacion ? formatDate(r.fecha_creacion) : ''}</span>
                      </div>
                    </div>
                  </button>
                  );
                })
              )
            )}
          </div>
        </aside>

        <section className="mensajes-detail">
          {!selected ? (
            <div className="empty-state">Selecciona un reporte para ver la conversación completa</div>
          ) : (
            <>
              <div className="detail-header report-header">
                <div style={{display:'flex', alignItems:'center', gap:12, justifyContent:'space-between'}}>
                  <div style={{display:'flex', alignItems:'center', gap:12, minWidth:0}}>
                    {/* Avatar del sujeto reportado o del reporter */}
                    {selectedAvatar ? (
                      <div className="report-avatar" title={selectedName}><img src={selectedAvatar} alt={selectedName} /></div>
                    ) : (
                      <div className="report-avatar" title={selectedName}>{getInitials(selectedName)}</div>
                    )}
                    <div style={{minWidth:0}}>
                      <div style={{display:'flex', alignItems:'center', gap:8}}>
                        <h3 className="report-title" style={{margin:0}}>{`Reporte #${selected.id}`}</h3>
                        <EstadoBadge estado={selected.estado} />
                      </div>
                      <div className="report-sub">
                        <div className="report-motive" title={asText(selected.motivo)}>{ asText(selected.motivo).slice ? asText(selected.motivo).slice(0,240) : asText(selected.motivo) }</div>
                        {selected && selected.cliente && (
                          <div className="report-reporter" title={asText(selected.cliente)}>
                            Reportado por { selected.cliente_display || asText(selected.cliente) }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="report-meta" title={headerDate ? formatDate(headerDate) : ''}>
                    <FaCalendarAlt style={{marginRight:8, color:'#6b7280'}} />
                    <span className="report-time">{ headerDate ? formatDateCompact(headerDate) : '' }</span>
                  </div>
                </div>
              </div>

              <div className="detail-quote">
                <div className="report-banner" role="status" aria-live="polite">
                  <FaExclamationTriangle style={{color:'#b91c1c', flexShrink:0}} />
                  <div className="report-body">
                      <strong>Mensaje reportado:</strong>
                      <span className="report-text">"{asText(selected.mensaje_snapshot || selected.motivo)}"</span>
                    </div>
                </div>
              </div>

              <div className="conversation" id="conversation" ref={convRef}>
                {conversation.length === 0 ? <div className="muted">No hay mensajes en esta conversación.</div> : (
                  conversation.map(m => {
                    const isMe = m.sender === 'you';
                    const authorName = selected && (selected.reportado && (selected.reportado.nombre || selected.reportado.name)) ? asText(selected.reportado.nombre || selected.reportado.name) : (selected && selected.cliente && (selected.cliente.nombre || selected.cliente.name) ? asText(selected.cliente.nombre || selected.cliente.name) : 'Usuario');
                    return (
                      <div key={m.id} className={`conv-row ${isMe ? 'row-me' : 'row-them'}`}>
                        {!isMe && (
                          <div className="conv-avatar" title={authorName}>{getInitials(authorName)}</div>
                        )}
                        <div className={`conv-msg ${isMe ? 'me' : 'them'}`}>
                          <div className="conv-author">{m.author}</div>
                          <div className={`conv-text ${m.isDeleted ? 'deleted' : ''}`}>
                            {m.isDeleted ? m.text : asText(m.text)}
                          </div>
                          <div className="time">{m.time ? formatDate(m.time) : ''}</div>
                        </div>
                        {isMe && <div style={{width:40}} />}
                      </div>
                    );
                  })
                )}
                </div>

                {/* Footer with moderator actions moved here (below the conversation) */}
                <div className="detail-footer">
                  <div className="detail-actions">
                    {(clientDeleted && !isPending) ? (
                      // Si el cliente está eliminado y el reporte NO está en 'abierto'/'pendiente', mostrar SOLO 'Retirar Conversación'
                      <button className="btn btn-secondary" onClick={() => {
                        Swal.fire({
                          title: 'Retirar conversación',
                          text: 'Quitar la conversación de TU vista de reportes (acción reversible).',
                          icon: 'question',
                          showCancelButton: true,
                          confirmButtonText: 'Sí, retirar'
                        }).then(result => { if (result.isConfirmed) hideReportLocally(selected.id); });
                      }}><FaTimesCircle /> Retirar Conversación</button>
                    ) : (
                      <>
                        {/* Mostrar 'Marcar Resuelto': si el estado es 'abierto'/'pendiente' siempre mostrar; si no, mostrar solo cuando no esté resuelto y no haya mensaje eliminado */}
                        {(() => {
                          const s = String((selected && selected.estado) || '').toLowerCase();
                          // En estado pendiente/abierto siempre mostrar la acción
                          if (isPending) return true;
                          // Si el cliente fue marcado eliminado y NO estamos en pendiente, ocultar
                          if (clientDeleted) return false;
                          return !(selected && (s === 'resuelto' || (selected.mensaje_snapshot && String(selected.mensaje_snapshot).includes('[Mensaje eliminado]')) || (Array.isArray(conversation) && conversation.some(m => m.isDeleted))));
                        })() && (
                          <button className="btn btn-success" onClick={() => {
                            Swal.fire({
                              title: 'Marcar como resuelto',
                              text: 'Marcar el reporte como revisado sin tomar medidas.',
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonText: 'Sí, marcar resuelto'
                            }).then(result => { if (result.isConfirmed) updateEstado(selected.id, 'resuelto'); });
                          }}><FaCheck /> Marcar Resuelto</button>
                        )}

                        {/* Eliminar mensaje reportado - en pendiente debe mostrarse; de lo contrario ocultar si ya está eliminado */}
                        {(() => {
                          const s = String((selected && selected.estado) || '').toLowerCase();
                          // En estado pendiente/abierto siempre mostrar la acción
                          if (isPending) return true;
                          // Si el cliente fue marcado eliminado y NO estamos en pendiente, ocultar
                          if (clientDeleted) return false;
                          return !(selected && (selected.mensaje_snapshot && String(selected.mensaje_snapshot).includes('[Mensaje eliminado]')) || (Array.isArray(conversation) && conversation.some(m => m.isDeleted)));
                        })() && (
                          <button className="btn btn-warning" onClick={() => {
                            Swal.fire({
                              title: 'Eliminar mensaje reportado',
                              text: 'Esta acción eliminará el mensaje reportado.',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonText: 'Sí, eliminar mensaje'
                            }).then(result => { if (result.isConfirmed) performAdminAction(selected.id, 'eliminar_mensaje'); });
                          }}><FaTrash /> Eliminar Mensaje</button>
                        )}

                        {/* Si el mensaje ya está eliminado, mostrar botón para 'Retirar conversación' (ocultar de la vista)
                            Pero si el reporte está en estado 'abierto'/'pendiente' preferimos mostrar las acciones principales. */}
                        {(() => {
                          if (!selected) return null;
                          const s = String((selected && selected.estado) || '').toLowerCase();
                          const hasDeleted = (selected.mensaje_snapshot && String(selected.mensaje_snapshot).includes('[Mensaje eliminado]')) || (Array.isArray(conversation) && conversation.some(m => m.isDeleted));
                          // Mostrar 'Retirar Conversación' también cuando el reporte fue marcado como 'resuelto'
                          if ((hasDeleted || s === 'resuelto') && !(s === 'abierto' || s === 'pendiente')) {
                            return (
                              <button className="btn btn-secondary" onClick={() => {
                                Swal.fire({
                                  title: 'Retirar conversación',
                                  text: 'Quitar la conversación de TU vista de reportes (acción reversible).',
                                  icon: 'question',
                                  showCancelButton: true,
                                  confirmButtonText: 'Sí, retirar'
                                }).then(result => { if (result.isConfirmed) hideReportLocally(selected.id); });
                              }}><FaTimesCircle /> Retirar Conversación</button>
                            );
                          }
                          return null;
                        })()}

                        {/* Eliminar cliente (borrado lógico) -- ocultar si ya está marcado como eliminado */}
                        {!(selected && selected.cliente && ((selected.cliente.estado && String(selected.cliente.estado).toLowerCase() === 'eliminado') || selected.cliente.deleted === true || selected.cliente.isDeleted === true || String(selected.cliente.estado || '').toLowerCase() === 'deleted')) && (
                          <button className="btn btn-danger" onClick={() => {
                            Swal.fire({
                              title: 'Eliminar Cliente',
                              text: 'Esta acción marcará al cliente como eliminado.',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonText: 'Sí, eliminar cliente'
                            }).then(result => { if (result.isConfirmed) performAdminAction(selected.id, 'eliminar_cliente'); });
                          }}><FaUserSlash /> Eliminar Cliente</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Mensajes;
