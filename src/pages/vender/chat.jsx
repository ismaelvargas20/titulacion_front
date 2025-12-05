import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaArrowLeft, FaEnvelope, FaTimes, FaRegCalendarAlt, FaMapMarkerAlt, FaFlag, FaEllipsisH } from 'react-icons/fa';
import { MdPhone } from 'react-icons/md';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../assets/scss/chat.scss';
import chatService from '../../services/chat';
import reportsService from '../../services/reports';
import MotosModal from '../motos/motos_modal';
import RepuestosModal from '../repuestos/repuestos_modal';
import Swal from 'sweetalert2';

export default function Chat() {
  const [conversations, setConversations] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const goToAd = (id, type = 'moto') => {
    if (!id) return;
    // navegar según tipo: motos o repuestos
    if (type === 'repuesto') navigate(`/repuestos#repuesto-${id}`);
    else navigate(`/motos#moto-${id}`);
  };
  

  const [activeId, setActiveId] = useState(null);
  const activeIdRef = useRef(null);
  // identificador único de esta pestaña/instancia para evitar reaccionar a nuestros propios eventos storage
  const instanceIdRef = useRef((Math.random().toString(36).slice(2) + Date.now()).slice(0, 24));
  const [input, setInput] = useState('');
  const listRef = useRef(null);
  const storageTimeoutRef = useRef(null);
  const [activeRelated, setActiveRelated] = useState(null);
  const [selectedMoto, setSelectedMoto] = useState(null);
  const [showMotoModal, setShowMotoModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [showRepuestoModal, setShowRepuestoModal] = useState(false);
  // Estado para vista previa de perfil (peek)
  const [profilePeek, setProfilePeek] = useState(null);
  const [messages, setMessages] = useState([]);
  // Report message UI
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSelected, setReportSelected] = useState(null); // { id, text }
  const [reportReason, setReportReason] = useState('');
  const [reportSending, setReportSending] = useState(false);
  // menú de opciones (puntos) para cada mensaje
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      try {
        if (!openMenuId) return;
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setOpenMenuId(null);
        }
      } catch (err) { /* ignore */ }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [openMenuId]);

  const getCurrentUser = () => {
    try {
      const raw = sessionStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  };

// Helpers para subtítulos y extractos (nivel componente)
function excerpt(text, max = 140) {
  if (!text) return '';
  try {
    const s = String(text).replace(/\s+/g, ' ').trim();
    return s.length > max ? s.slice(0, max - 3) + '...' : s;
  } catch (e) { return String(text).slice(0, max); }
}

function deriveChatSubtitle(c, current) {
  const last = c && c.ultima ? c.ultima : null;
  const lastText = last && (last.cuerpo || '') ? last.cuerpo : '';
  const ownerId = (c && (c.clienteId || (c.raw && (c.raw.clienteId || (c.raw.publicacion && (c.raw.publicacion.clienteId || c.raw.publicacion.ownerId)))))) || null;
  const isOwner = current && ownerId && Number(current.id) === Number(ownerId);
  const title = String(c.titulo || '');
  const pubMatch = title.match(/^publicacion(-repuesto)?-(\d+)/);

  if (pubMatch) {
    if (isOwner) {
      if (last && last.clienteId && Number(last.clienteId) !== Number(current.id)) {
        return { subtitle: 'Le interesa tu publicación', lastMessage: lastText };
      }
      return { subtitle: lastText ? excerpt(lastText, 140) : 'Sin mensajes aún', lastMessage: lastText };
    } else {
      if (last && last.clienteId && ownerId && Number(last.clienteId) === Number(ownerId)) {
        return { subtitle: 'Te respondió', lastMessage: lastText };
      }
      return { subtitle: lastText ? excerpt(lastText, 140) : 'Sin mensajes aún', lastMessage: lastText };
    }
  }

  return { subtitle: lastText ? excerpt(lastText, 140) : '', lastMessage: lastText };
}

  // Cargar lista de chats
  const loadChats = async () => {
    try {
      const current = getCurrentUser();
      const clienteId = current && current.id ? current.id : null;
      const data = await chatService.listarChats({ clienteId });
      console.debug('[chat] listarChats raw:', data);
      // mapear a formato de UI
      const mapped = (Array.isArray(data) ? data : []).map(c => {
        // Determinar información del último mensaje y participantes
        const ultima = c.ultima || null;
        const ultimaTexto = (ultima && (ultima.cuerpo || '')) ? (ultima.cuerpo || '') : '';
        const lastFromCurrent = current && ultima && ((ultima.remitenteId && String(ultima.remitenteId) === String(current.id)) || (ultima.clienteId && String(ultima.clienteId) === String(current.id)));

        // Nombre mostrado en la lista: preferimos mostrar siempre el otro participante.
        // Si el último mensaje fue enviado por el propio usuario, NO usar el nombre del remitente (que sería usted mismo).
        // En su lugar, preferimos `ownerName` u otros campos conocidos del objeto de la conversación.
        // intentar extraer nombre del propietario/autor desde distintos campos posibles que pueda traer el backend
          const ownerName = (c && (c.ownerName || c.owner || c.clienteNombre || c.cliente_nombre || c.vendedor_nombre || c.sellerName || c.vendedor_nombre)) || (c && c.raw && (c.raw.ownerName || c.raw.owner || c.raw.clienteNombre || c.raw.cliente_nombre || c.raw.vendedor_nombre || c.raw.sellerName || (c.raw.publicacion && (c.raw.publicacion.clienteNombre || c.raw.publicacion.cliente_nombre || c.raw.publicacion.ownerName)))) || null; // solo como fallback
        // si la conv está ligada a una publicación, extraer id y tipo (moto/repuesto) desde varias fuentes
        let relatedMotoId = null;
        let relatedType = null;
        // 1) intentar desde el título con patrones conocidos
        if (c.titulo) {
          const tStr = String(c.titulo).trim();
          // aceptar títulos con sufijo opcional '-buyer-<id>' => 'publicacion-123' o 'publicacion-123-buyer-45'
          const m1 = tStr.match(/^publicacion-(\d+)(?:-buyer-(\d+))?$/);
          const m2 = tStr.match(/^publicacion-repuesto-(\d+)(?:-buyer-(\d+))?$/);
          if (m1 && m1[1]) {
            relatedMotoId = Number(m1[1]);
            relatedType = 'moto';
          } else if (m2 && m2[1]) {
            relatedMotoId = Number(m2[1]);
            relatedType = 'repuesto';
          }
        }
        // Si no se detectó desde c.titulo, intentar desde c.raw.titulo (algunos backends devuelven el campo en raw)
        try {
          if (!relatedType && c && c.raw && c.raw.titulo) {
            const rt = String(c.raw.titulo).trim();
            const rm2 = rt.match(/^publicacion-repuesto-(\d+)(?:-buyer-(\d+))?$/);
            const rm1 = rt.match(/^publicacion-(\d+)(?:-buyer-(\d+))?$/);
            if (rm1 && rm1[1]) {
              relatedMotoId = Number(rm1[1]);
              relatedType = 'moto';
            } else if (rm2 && rm2[1]) {
              relatedMotoId = Number(rm2[1]);
              relatedType = 'repuesto';
            }
          }
        } catch (e) { /* ignore */ }
        // 2) intentar desde propiedades conocidas en raw
        try {
          const raw = c.raw || {};
          if (!relatedMotoId) {
            const maybe = raw.publicacionId || raw.publicacion_id || raw.publicacionId || raw.publicacionId || raw.publicacionId || raw.publicacionId;
            if (maybe) relatedMotoId = Number(maybe);
          }
          if (!relatedMotoId && raw.publicacion && (raw.publicacion.id || raw.publicacionId)) {
            relatedMotoId = Number(raw.publicacion.id || raw.publicacionId);
          }
          if (!relatedType && raw.tipo) {
            relatedType = raw.tipo === 'repuesto' ? 'repuesto' : (raw.tipo === 'moto' ? 'moto' : relatedType);
          }
          if (!relatedType && raw.publicacion && raw.publicacion.type) {
            relatedType = raw.publicacion.type === 'repuesto' ? 'repuesto' : (raw.publicacion.type === 'moto' ? 'moto' : relatedType);
          }
        } catch (e) { /* ignore */ }

        // decidir título: resolver de forma determinística quién es "la otra persona"
        // ownerId: dueño de la publicación / propietario del chat (si existe)
        const ownerId = (c && (c.clienteId || (c.raw && (c.raw.clienteId || (c.raw.publicacion && (c.raw.publicacion.clienteId || c.raw.publicacion.ownerId)))))) || null;
        // intentar extraer buyerId desde el sufijo '-buyer-<id>' del título o desde el último mensaje
        let buyerId = null;
        try {
          if (c && c.titulo) {
            const t = String(c.titulo || '').trim();
            const mb = t.match(/-buyer-(\d+)$/);
            if (mb && mb[1]) buyerId = Number(mb[1]);
          }
          if (!buyerId && ultima) {
            if (ultima.clienteId && ownerId && String(ultima.clienteId) !== String(ownerId)) buyerId = Number(ultima.clienteId);
            else if (ultima.remitenteId && ownerId && String(ultima.remitenteId) !== String(ownerId)) buyerId = Number(ultima.remitenteId);
          }
        } catch (e) {}

        // Si el backend ya nos dio un título/displayTitle determinista, usarlo directamente
        if (c && (c.displayTitle || c.otherParticipantName || c.otherParticipantNombre)) {
          const otherNameBackend = c.displayTitle || c.otherParticipantName || c.otherParticipantNombre;
          return {
            id: c.id,
            title: otherNameBackend,
            subtitle: '',
            lastMessage: ultimaTexto,
            relatedId: relatedMotoId,
            relatedType: relatedType,
            unread: Number((c.unreadCount || c.unread || c.unread_count) || 0),
            avatar: (c.buyerProfile && c.buyerProfile.avatar) || (c.profile && c.profile.avatar) || null,
            raw: c,
            needOwnerName: false,
            ownerDetailId: c.otherParticipantId || null,
          };
        }

        // Helpers para extraer nombres
        const extractNameFrom = (obj) => {
          if (!obj) return null;
          if (typeof obj === 'string') return obj;
          return obj.nombre || obj.name || obj.fullname || obj.usuario || null;
        };

        // Si soy el owner (vendedor) mostrar siempre el comprador; si soy comprador, mostrar siempre el owner
        let titulo = c.titulo || `Chat ${c.id}`;
        let ownerDetailId = null;
        let needOtherName = false;
        // identificador y perfil de la otra persona (para abrir modal)
        let otherParticipantId = null;
        let otherParticipantProfile = null;
        if (ownerId && current && String(current.id) === String(ownerId)) {
          // yo soy el vendedor => mostrar comprador
          // preferir buyerProfile o campos en raw; NO usar remitente dinámico
          let buyerNameFromRaw = (c && (c.buyerProfile && extractNameFrom(c.buyerProfile))) || (c && c.raw && (c.raw.buyerName || c.raw.buyer || (c.raw.buyerProfile && extractNameFrom(c.raw.buyerProfile)))) || null;
          // ignorar nombres que parezcan cadenas opacas/encriptadas
          try {
            if (buyerNameFromRaw && String(buyerNameFromRaw).length > 20 && /[+/=\\/]/.test(String(buyerNameFromRaw))) buyerNameFromRaw = null;
          } catch (e) { /* ignore */ }
          if (buyerNameFromRaw) {
            titulo = buyerNameFromRaw;
            // intentar extraer id del buyerProfile si existe
            otherParticipantProfile = c.buyerProfile || (c.raw && (c.raw.buyerProfile || c.raw.buyer)) || null;
            if (otherParticipantProfile) otherParticipantId = otherParticipantProfile.id || otherParticipantProfile.clienteId || otherParticipantProfile.cliente_id || null;
          } else if (buyerId) {
            ownerDetailId = buyerId; needOtherName = true; titulo = `Comprador ${buyerId}`;
            otherParticipantId = buyerId;
          } else {
            titulo = c.titulo || `Chat ${c.id}`;
          }
        } else {
          // soy comprador o no hay ownerId -> mostrar owner (vendedor)
          let ownerFromFields = ownerName || (c && c.raw && (c.raw.ownerName || c.raw.owner)) || null;
          try {
            if (ownerFromFields && String(ownerFromFields).length > 20 && /[+/=\\/]/.test(String(ownerFromFields))) ownerFromFields = null;
          } catch (e) { /* ignore */ }
          if (ownerFromFields && String(ownerFromFields).trim()) {
            titulo = ownerFromFields;
            // intentar extraer perfil/ID del owner si viene como objeto
            otherParticipantProfile = c.profile || (c.raw && (c.raw.ownerProfile || c.raw.owner || c.raw.publicacion && c.raw.publicacion.cliente)) || null;
            if (otherParticipantProfile) otherParticipantId = otherParticipantProfile.id || otherParticipantProfile.clienteId || otherParticipantProfile.cliente_id || null;
          } else if (ownerId) {
            ownerDetailId = ownerId; needOtherName = true; titulo = `Vendedor ${ownerId}`;
            otherParticipantId = ownerId;
          } else {
            // si el título viene como una cadena opaca (hash/encriptada), reemplazar por etiqueta amigable
            const rawTitle = String(c.titulo || '');
            const opaqueTitle = rawTitle.length > 20 && /[+/=\\/]/.test(rawTitle);
            if (opaqueTitle) {
              if (relatedMotoId) titulo = `Anuncio ${relatedMotoId}`;
              else titulo = `Chat ${c.id}`;
            } else {
              titulo = rawTitle || `Chat ${c.id}`;
            }
          }
        }

        // Preferir explícitamente el título que envía el servidor si es legible
        try {
          const serverTitle = (c && (c.titulo || c.title)) || (c && c.raw && (c.raw.titulo || c.raw.title)) || null;
          if (serverTitle) {
            const s = String(serverTitle || '').trim();
            const opaque = s.length > 20 && /[+/=\\/]/.test(s);
            if (!opaque && s) {
              titulo = s;
            }
          }
        } catch (e) { /* ignore */ }

        // Derivar subtítulo y mensaje usando helper centralizado
        const { subtitle: subtitleLabel, lastMessage: lastMsg } = deriveChatSubtitle(c, current);

        // avatar si viene en la respuesta (buyer/profile)
        const avatar = (c.buyerProfile && c.buyerProfile.avatar) || (c.profile && c.profile.avatar) || null;

        // normalizar contador de no leídos desde distintos shapes posibles que venga el backend
        const rawUnread = (c && (c.unreadCount || c.unread || c.unread_count)) || (c && c.raw && (c.raw.unreadCount || c.raw.unread || c.raw.unread_count)) || 0;
        const unreadNum = Number(rawUnread) || 0;

        return {
          id: c.id,
            title: titulo, // marcar si necesitamos enriquecer el título con el nombre del owner (cuando el último mensaje lo envió el propio usuario)
          subtitle: subtitleLabel,
          lastMessage: lastMsg,
          relatedId: relatedMotoId,
          relatedType: relatedType,
          unread: unreadNum,
          avatar,
          raw: c,
              needOwnerName: needOtherName || Boolean(lastFromCurrent && relatedMotoId && !ownerName), // marcar si necesitamos enriquecer el título con el nombre del otro participante o del owner relacionado
              ownerDetailId: ownerDetailId || null,
              otherParticipantId: otherParticipantId || null,
              otherParticipantProfile: otherParticipantProfile || null,
        };
      });
      // Intentar enriquecer contadores de no leídos con notificaciones del backend
      try {
        const { listarNotificaciones } = await import('../../services/notificaciones');
        const notifs = await listarNotificaciones({ clienteId, limit: 200 });
          if (Array.isArray(notifs) && notifs.length) {
          // Agrupar notificaciones por link relevante y capturar títulos legibles
          const notifCountMap = new Map();
          const notifTitleMap = new Map();
          notifs.forEach(n => {
            try {
              const link = n.link || n.to || (n._raw && (n._raw.link || n._raw.to)) || '';
              if (!link) return;
              const key = String(link).trim();
              notifCountMap.set(key, (notifCountMap.get(key) || 0) + 1);
              // si la notificación apunta a un chat (/chats/:id) extraer id y guardar título amable
              const m = key.match(/\/chats\/(\d+)/);
              if (m && m[1]) {
                const chatId = Number(m[1]);
                if (n.titulo && String(n.titulo).trim()) notifTitleMap.set(chatId, String(n.titulo).trim());
              }
            } catch (e) { /* ignore per item */ }
          });
          // Construir mapa de cuántas conversaciones están ligadas a la misma publicación
          const relatedCountMap = new Map();
          mapped.forEach(x => {
            if (x && x.relatedId) relatedCountMap.set(x.relatedId, (relatedCountMap.get(x.relatedId) || 0) + 1);
          });

          // Ajustar mapped: para cada conversación buscar coincidencias en map
          mapped.forEach((c) => {
            try {
              let best = 0;
              // 1) match /chats/:id
              const chatLink = `/chats/${c.id}`;
              if (notifCountMap.has(chatLink)) best = Math.max(best, notifCountMap.get(chatLink));
              // 2) match by related publication hash
              // Solo aplicar notificaciones apuntando a la publicación si NO hay
              // múltiples conversaciones que comparten la misma publicación, porque
              // el backend crea notificaciones con link a la publicación (no al chat)
              // y eso causaba que el mismo contador se aplicara a todos los chats.
              if (c.relatedId) {
                const relatedCount = relatedCountMap.get(c.relatedId) || 0;
                if (relatedCount === 1) {
                  if (c.relatedType === 'moto') {
                    const l = `/motos#moto-${c.relatedId}`;
                    if (notifCountMap.has(l)) best = Math.max(best, notifCountMap.get(l));
                  } else if (c.relatedType === 'repuesto') {
                    const l = `/repuestos#repuesto-${c.relatedId}`;
                    if (notifCountMap.has(l)) best = Math.max(best, notifCountMap.get(l));
                  }
                }
              }
              // 3) fallback: sometimes backend may store absolute URLs or other forms; try to find by includes
              if (best === 0) {
                for (const [k, v] of notifCountMap.entries()) {
                  if (!k) continue;
                  // match exact chat link
                  if (k.includes(`/chats/${c.id}`)) {
                    best = Math.max(best, v);
                    continue;
                  }
                  // only match by relatedId when the publication maps to a single conversation
                  if (c.relatedId && relatedCountMap.get(c.relatedId) === 1 && k.includes(String(c.relatedId))) {
                    best = Math.max(best, v);
                  }
                }
              }
              if (best > 0) {
                c.unread = Math.max(Number(c.unread) || 0, best);
              }
              // si hay un título amigable en las notificaciones para este chat, usarlo (reemplaza hashes)
              try {
                const nt = notifTitleMap.get(Number(c.id));
                if (nt && String(nt).trim()) {
                  c.title = nt;
                }
              } catch (e) { /* ignore title set */ }
            } catch (e) { /* ignore per conv */ }
          });
        }
      } catch (e) {
        console.debug('[chat] no se pudieron cargar notificaciones para enriquecer unread:', e && e.message ? e.message : e);
      }

      console.debug('[chat] mapped conversations:', mapped);
      setConversations(mapped);

      // Enriquecer títulos: para conversaciones donde el último mensaje fue enviado por el propio usuario
      // y no tenemos el nombre del owner en la respuesta, solicitamos detalle de la publicación
      (async () => {
        try {
          const toFetch = mapped.filter(x => x.needOwnerName && x.relatedId && x.relatedType);
          if (!toFetch || toFetch.length === 0) return;
          for (const conv of toFetch) {
            try {
              if (conv.relatedType === 'moto') {
                const pubResp = await (await import('../../services/motos')).detallePublicacion(conv.relatedId);
                const pub = pubResp && (pubResp.publicacion || pubResp) ? (pubResp.publicacion || pubResp) : null;
                if (pub) {
                  let clienteId = pub.clienteId || pub.cliente_id || (pub.cliente && (pub.cliente.id || pub.clienteId)) || pub.ownerId || pub.owner_id || null;
                  let resolvedName = null;
                  if (clienteId) {
                    try {
                      const { detalleCliente } = await import('../../services/clientes');
                      const cResp = await detalleCliente(clienteId);
                      resolvedName = (cResp && cResp.cliente && (cResp.cliente.nombre || cResp.cliente.fullname)) || (cResp && (cResp.nombre || cResp.fullname)) || null;
                    } catch (ee) { /* ignore client fetch */ }
                  }
                  if (!resolvedName) {
                    resolvedName = pub.clienteNombre || pub.cliente_nombre || pub.ownerName || pub.owner || (pub.cliente && (pub.cliente.nombre || pub.cliente.fullname || pub.cliente.usuario)) || null;
                  }
                  if (resolvedName) setConversations(prev => (Array.isArray(prev) ? prev.map(x => x.id === conv.id ? { ...x, title: resolvedName } : x) : prev));
                }
              } else if (conv.relatedType === 'repuesto') {
                const pubResp = await (await import('../../services/repuestos')).detalleRepuesto(conv.relatedId);
                const pub = pubResp && (pubResp.publicacion || pubResp) ? (pubResp.publicacion || pubResp) : null;
                if (pub) {
                  let clienteId = pub.clienteId || pub.cliente_id || (pub.cliente && (pub.cliente.id || pub.clienteId)) || pub.ownerId || pub.owner_id || null;
                  let resolvedName = null;
                  if (clienteId) {
                    try {
                      const { detalleCliente } = await import('../../services/clientes');
                      const cResp = await detalleCliente(clienteId);
                      resolvedName = (cResp && cResp.cliente && (cResp.cliente.nombre || cResp.cliente.fullname)) || (cResp && (cResp.nombre || cResp.fullname)) || null;
                    } catch (ee) { /* ignore client fetch */ }
                  }
                  if (!resolvedName) {
                    resolvedName = pub.clienteNombre || pub.cliente_nombre || pub.ownerName || pub.owner || (pub.cliente && (pub.cliente.nombre || pub.cliente.fullname || pub.cliente.usuario)) || null;
                  }
                  if (resolvedName) setConversations(prev => (Array.isArray(prev) ? prev.map(x => x.id === conv.id ? { ...x, title: resolvedName } : x) : prev));
                }
              }
            } catch (e) {
              /* ignore per conversation */
            }
          }
        } catch (e) {
          console.debug('[chat] enrich owner names error', e && e.message ? e.message : e);
        }
      })();
      // Enriquecer nombres de participantes cuando tenemos un ownerDetailId (buyer u owner id)
      (async () => {
        try {
          const toFetchClients = mapped.filter(x => x.needOwnerName && x.ownerDetailId);
          if (!toFetchClients || toFetchClients.length === 0) return;
          const { detalleCliente } = await import('../../services/clientes');
          for (const conv of toFetchClients) {
            try {
              const cid = conv.ownerDetailId;
              if (!cid) continue;
              const resp = await detalleCliente(cid);
              const resolved = resp && (resp.cliente || resp) ? (resp.cliente || resp) : null;
              const name = resolved && (resolved.nombre || resolved.fullname || resolved.usuario) ? (resolved.nombre || resolved.fullname || resolved.usuario) : null;
              if (name) {
                setConversations(prev => (Array.isArray(prev) ? prev.map(x => x.id === conv.id ? { ...x, title: name } : x) : prev));
              }
            } catch (e) {
              /* ignore per conv */
            }
          }
        } catch (e) {
          console.debug('[chat] enrich participant names error', e && e.message ? e.message : e);
        }
      })();
      // Enriquecer nombres usando participantId provisto por backend (más fiable)
      (async () => {
        try {
          const toFetch = mapped.filter(x => x.participantId && (!x.title || String(x.title).match(/^Comprador |^Vendedor /)));
          if (!toFetch || toFetch.length === 0) return;
          for (const conv of toFetch) {
            try {
              const pid = conv.participantId;
              if (!pid) continue;
              if (conv.participantIsCliente) {
                const { detalleCliente } = await import('../../services/clientes');
                const resp = await detalleCliente(pid);
                const resolved = resp && (resp.cliente || resp) ? (resp.cliente || resp) : null;
                const name = resolved && (resolved.nombre || resolved.fullname || resolved.usuario) ? (resolved.nombre || resolved.fullname || resolved.usuario) : null;
                if (name) setConversations(prev => (Array.isArray(prev) ? prev.map(x => x.id === conv.id ? { ...x, title: name } : x) : prev));
              } else {
                try {
                  const api = (await import('../../api/axios')).default;
                  const r = await api.get(`/usuarios/detalle/${encodeURIComponent(pid)}`);
                  const u = r && r.data ? r.data : null;
                  const name = u && (u.nombre || u.fullname || u.name) ? (u.nombre || u.fullname || u.name) : null;
                  if (name) setConversations(prev => (Array.isArray(prev) ? prev.map(x => x.id === conv.id ? { ...x, title: name } : x) : prev));
                } catch (e) { /* ignore usuario fetch */ }
              }
            } catch (e) { /* ignore per conv */ }
          }
        } catch (e) { console.debug('[chat] enrich by participantId error', e && e.message ? e.message : e); }
      })();
    } catch (err) {
      console.error('No se pudo cargar chats', err);
    }
  };

  // Formatea una fecha ISO/SQL a un formato legible en español
  const formatDateTime = (raw) => {
    if (!raw) return '';
    try {
      // Normalizar '2025-11-20 17:06:36' -> '2025-11-20T17:06:36'
      let s = String(raw).trim();
      if (s.indexOf('T') === -1 && s.indexOf(' ') !== -1) s = s.replace(' ', 'T');
      const d = new Date(s);
      if (isNaN(d)) return String(raw).replace('T', ' ');
      // Formato: DD/MM/YYYY HH:MM
      return d.toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return String(raw).replace('T', ' ');
    }
  };

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    loadChats();
    const onUpdated = () => { loadChats(); };
    const onStorage = (e) => {
      try {
        if (!e || !e.key) return;
        if (e.key === 'chats:updated') {
            console.debug('[chat] storage event received:', e.newValue);
            // Ignorar eventos originados por esta misma pestaña (source === instanceId)
            try {
              const parsedCheck = typeof e.newValue === 'string' ? JSON.parse(e.newValue) : (e.newValue || {});
              if (parsedCheck && parsedCheck.source && parsedCheck.source === instanceIdRef.current) {
                console.debug('[chat] ignoring storage event from self (source match)', parsedCheck);
                return;
              }
            } catch (ee) {
              // si no podemos parsear, continuamos con el flujo normal
            }
            // intentar actualizar localmente el contador de la conversación afectada
            try {
              const parsed = typeof e.newValue === 'string' ? JSON.parse(e.newValue) : (e.newValue || {});
              const incomingChatId = parsed && parsed.chatId ? Number(parsed.chatId) : null;
              if (incomingChatId) {
                setConversations(prev => {
                  if (!prev || !Array.isArray(prev)) return prev;
                  return prev.map(c => {
                    if (Number(c.id) !== Number(incomingChatId)) return c;
                    // si la conversación está abierta, no incrementar (ya se verá en hilo)
                    if (activeIdRef.current && Number(activeIdRef.current) === Number(incomingChatId)) return c;
                    const currentUnread = Number(c.unread) || 0;
                    return { ...c, unread: currentUnread + 1 };
                  });
                });
              }
            } catch (err) { console.warn('[chat] parse storage value error', err); }
            // otra pestaña indicó que hay cambios; dar un pequeño retraso para que el backend procese (fallback)
            // Guardamos el id del timeout para poder limpiarlo si el componente se desmonta
            const to = setTimeout(() => {
              loadChats();
            }, 250);
            storageTimeoutRef.current = to;
        }
      } catch (err) { console.warn('[chat] storage handler error', err); }
    };
    window.addEventListener('chats:updated', onUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('chats:updated', onUpdated);
      window.removeEventListener('storage', onStorage);
      // limpiar timeout pendiente si existe
      try { if (storageTimeoutRef.current) { clearTimeout(storageTimeoutRef.current); storageTimeoutRef.current = null; } } catch (e) {}
    };
  }, []);

  // Si fuimos navegados hacia /chat con state.openChatId, abrir esa conversación
  useEffect(() => {
    try {
      if (!location || !location.state || !location.state.openChatId) return;
      const cid = location.state.openChatId;
      if (!cid) return;
      // si ya tenemos la conversación cargada, abrirla; si aún no, esperar a que conversations cambie
      if (Array.isArray(conversations) && conversations.find(c => Number(c.id) === Number(cid))) {
        openConversation(Number(cid));
        try { navigate(location.pathname, { replace: true, state: {} }); } catch (e) {}
      }
    } catch (e) { /* ignore */ }
  }, [conversations, location]);

  const openConversation = async (id) => {
    // obtener usuario actual antes de actualizar el estado local para poder reflejarlo en `raw`
    const current = getCurrentUser();
    setConversations((prev) => (Array.isArray(prev) ? prev.map(c => {
      if (c.id !== id) return c;
      const raw = c && c.raw ? c.raw : {};
      const ultima = raw && raw.ultima ? raw.ultima : {};
      const curId = current && current.id ? String(current.id) : null;
      // construir nuevo campo leido_por asegurando que no duplicamos el id
      let newLeido = ultima && ultima.leido_por ? String(ultima.leido_por) : '';
      try {
        const parts = String(newLeido || '').split(',').map(s => s.trim()).filter(Boolean);
        if (curId && parts.indexOf(String(curId)) === -1) parts.push(String(curId));
        newLeido = parts.join(',');
      } catch (e) { /* ignore formatting errors */ }
      return { ...c, unread: 0, raw: { ...raw, unreadCount: 0, ultima: { ...ultima, leido_por: newLeido } } };
    }) : prev));
    setActiveId(id);
    try {
      // Persistir en sessionStorage para mantener la conversación abierta tras recargar
      sessionStorage.setItem('chat_open_id', String(id));
    } catch (e) {}
    setActiveRelated(null);
    try {
      // Intentar marcar como leídos en el backend para que el conteo persista
      try {
        if (current && current.id) {
          const markResp = await chatService.marcarLeidos(id, { clienteId: current.id });
          console.debug('[chat] marcarLeidos response:', markResp);
          // Retrasar ligeramente el re-fetch para reducir condiciones de carrera / 304
          try {
            setTimeout(() => {
              try { loadChats(); } catch (evErr) { try { window.dispatchEvent(new Event('chats:updated')); } catch (e2) {} }
            }, 300);
          } catch (evErr) {
            try { window.dispatchEvent(new Event('chats:updated')); } catch (e2) { /* ignore */ }
          }
        }
      } catch (e) { console.warn('[chat] marcarLeidos error', e); }

      // Al abrir la conversación, eliminar notificaciones relacionadas para este usuario
      try {
        if (current && current.id) {
          const { listarNotificaciones, marcarEliminada } = await import('../../services/notificaciones');
          const nots = await listarNotificaciones({ clienteId: current.id, limit: 200 });
          if (Array.isArray(nots) && nots.length) {
            for (const n of nots) {
              try {
                const link = n.link || n.to || (n._raw && (n._raw.link || n._raw.to)) || '';
                if (!link) continue;
                const key = String(link || '');
                // si la notificación apunta al chat o a la publicación relacionada, eliminarla
                if (key.includes(`/chats/${id}`) || (key.includes(`#moto-`) && key.includes(String(id))) || (key.includes(`#repuesto-`) && key.includes(String(id)))) {
                  try { await marcarEliminada(n.id); } catch (er) { /* ignore per notif */ }
                }
              } catch (e) { /* ignore item */ }
            }
          }
        }
      } catch (e) { console.warn('[chat] limpiar notificaciones error', e); }

      const msgs = await chatService.listarMensajes(id);
      // intentar obtener id del otro participante para calcular si un mensaje enviado por "you" fue leído
      const convForMsgs = conversations.find(c => c.id === id) || {};
      const otherParticipantId = convForMsgs.otherParticipantId || convForMsgs.ownerDetailId || convForMsgs.otherParticipantId || null;
      const mapped = (Array.isArray(msgs) ? msgs : []).map(m => {
        const isYou = current && ((m.remitenteId && String(m.remitenteId) === String(current.id)) || (m.clienteId && String(m.clienteId) === String(current.id)));
        const rawTime = m.fecha_creacion || m.createdAt || m.created_at || '';
        const leidoRaw = m.leido_por || m.leidoPor || m.leido_por || '';
        let readByOther = false;
        try {
          if (leidoRaw && otherParticipantId) {
            const parts = String(leidoRaw).split(',').map(s => s.trim()).filter(Boolean);
            readByOther = parts.indexOf(String(otherParticipantId)) !== -1;
          }
        } catch (e) { /* ignore parse errors */ }
        // Detectar borrado lógico y normalizar texto como en la vista de mensajes
        const isDeletedMsg = (m.estado && String(m.estado).toLowerCase() === 'eliminado') || (m.cuerpo && String(m.cuerpo).includes('[Mensaje eliminado'));
        const textContent = isDeletedMsg ? '[Mensaje eliminado]' : (m.cuerpo || m.texto || m.body || '');
        return { id: m.id, sender: isYou ? 'you' : 'them', text: textContent, time: formatDateTime(rawTime), leido_por: leidoRaw, read: Boolean(isYou && readByOther), isDeleted: !!isDeletedMsg };
      });
      setMessages(mapped);
      // Si la conversación refiere a una publicación, solicitar su detalle (moto o repuesto) para mostrar la tarjeta relacionada
      const conv = conversations.find(c => c.id === id);
      if (conv && conv.relatedId && conv.relatedType) {
        try {
          if (conv.relatedType === 'moto') {
            const pub = await (await import('../../services/motos')).detallePublicacion(conv.relatedId);
            const publicacion = (pub && pub.publicacion) ? { ...pub.publicacion, detalle: pub.detalle || pub.publicacion.detalle, imagenes: pub.imagenes || pub.publicacion.imagenes || [] } : null;
            if (publicacion) {
              const detalle = publicacion.detalle || {};
              let imgCandidate = null;
              if (publicacion.imagenes && publicacion.imagenes.length > 0 && publicacion.imagenes[0].url) imgCandidate = publicacion.imagenes[0].url;
              else if (detalle.imagenes && detalle.imagenes[0]) imgCandidate = detalle.imagenes[0];
              else imgCandidate = 'https://loremflickr.com/640/420/motorcycle';
              let finalImg = imgCandidate;
              try { const s = String(imgCandidate || ''); if (s.startsWith('/uploads')) finalImg = `${(await import('../../api/axios')).default.defaults.baseURL}${s}`; } catch (e) {}
              setActiveRelated({ id: publicacion.id, title: publicacion.titulo || publicacion.title, img: finalImg, price: (publicacion.precio || publicacion.price) ? String(publicacion.precio || publicacion.price) : '', type: 'moto' });
            }
          } else if (conv.relatedType === 'repuesto') {
            const pub = await (await import('../../services/repuestos')).detalleRepuesto(conv.relatedId);
            const publicacion = (pub && pub.publicacion) ? { ...pub.publicacion, detalle: pub.detalle || pub.publicacion.detalle, imagenes: pub.imagenes || pub.publicacion.imagenes || [] } : null;
            if (publicacion) {
              const detalle = publicacion.detalle || {};
              let imgCandidate = null;
              if (publicacion.imagenes && publicacion.imagenes.length > 0 && publicacion.imagenes[0].url) imgCandidate = publicacion.imagenes[0].url;
              else if (detalle.imagenes && detalle.imagenes[0]) imgCandidate = detalle.imagenes[0];
              else imgCandidate = 'https://loremflickr.com/640/420/motorcycle';
              let finalImg = imgCandidate;
              try { const s = String(imgCandidate || ''); if (s.startsWith('/uploads')) finalImg = `${(await import('../../api/axios')).default.defaults.baseURL}${s}`; } catch (e) {}
              setActiveRelated({ id: publicacion.id, title: publicacion.titulo || publicacion.title, img: finalImg, price: (publicacion.precio || publicacion.price) ? String(publicacion.precio || publicacion.price) : '', type: 'repuesto' });
            }
          }
        } catch (e) {
          console.warn('No se pudo cargar detalle de publicación relacionada', e);
        }
      }
      setTimeout(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, 60);
    } catch (err) {
      console.error('Error cargando mensajes', err);
    }
  };

  const openMotoModal = async (id) => {
    if (!id) return;
    try {
      const pub = await (await import('../../services/motos')).detallePublicacion(id);
      const publicacion = (pub && pub.publicacion) ? { ...pub.publicacion, detalle: pub.detalle || pub.publicacion.detalle, imagenes: pub.imagenes || pub.publicacion.imagenes || [] } : null;
      if (!publicacion) return;
      const detalle = publicacion.detalle || {};
      const imgCandidate = (publicacion.imagenes && publicacion.imagenes.length > 0 && publicacion.imagenes[0].url) ? publicacion.imagenes[0].url : (detalle.imagenes && detalle.imagenes[0]) ? detalle.imagenes[0] : publicacion.img || '';
      let finalImg = imgCandidate;
      try { const s = String(imgCandidate || ''); if (s.startsWith('/uploads')) finalImg = `${(await import('../../api/axios')).default.defaults.baseURL}${s}`; } catch (e) {}
      const moto = {
        id: publicacion.id,
        title: publicacion.titulo || publicacion.title || '',
        img: finalImg,
        price: publicacion.precio || publicacion.price || '',
        location: publicacion.ubicacion || publicacion.location || '',
        stars: publicacion.stars || 0,
        contact: publicacion.contact || {},
        model: detalle.modelo || publicacion.modelo || '',
        revision: detalle.revision || publicacion.revision || '',
        condition: detalle.estado || publicacion.estado || '',
        year: publicacion.anio || publicacion.year || detalle.anio || '',
        kilometraje: publicacion.kilometraje || detalle.kilometraje || '',
        transmission: publicacion.transmision || detalle.transmision || '',
        description: detalle.descripcion || publicacion.descripcion || ''
      };
      setSelectedMoto(moto);
      setShowMotoModal(true);
    } catch (e) {
      console.warn('No se pudo cargar detalle de moto para modal', e);
    }
  };

  const openRepuestoModal = async (id) => {
    if (!id) return;
    try {
      const pub = await (await import('../../services/repuestos')).detalleRepuesto(id);
      const publicacion = (pub && pub.publicacion) ? { ...pub.publicacion, detalle: pub.detalle || pub.publicacion.detalle, imagenes: pub.imagenes || pub.publicacion.imagenes || [] } : null;
      if (!publicacion) return;
      const detalle = publicacion.detalle || {};
      const imgCandidate = (publicacion.imagenes && publicacion.imagenes.length > 0 && publicacion.imagenes[0].url) ? publicacion.imagenes[0].url : (detalle.imagenes && detalle.imagenes[0]) ? detalle.imagenes[0] : publicacion.img || '';
      let finalImg = imgCandidate;
      try { const s = String(imgCandidate || ''); if (s.startsWith('/uploads')) finalImg = `${(await import('../../api/axios')).default.defaults.baseURL}${s}`; } catch (e) {}
      const part = {
        id: publicacion.id,
        title: publicacion.titulo || publicacion.title || '',
        img: finalImg,
        price: publicacion.precio || publicacion.price || '',
        location: publicacion.ubicacion || publicacion.location || '',
        category: detalle.categoria_repuesto || detalle.categoria || publicacion.categoria || '',
        condition: detalle.condicion || detalle.estado || publicacion.condicion || publicacion.estado || '',
        stars: publicacion.stars || 0,
        contact: publicacion.contact || {},
        description: detalle.descripcion || publicacion.descripcion || ''
      };
      setSelectedPart(part);
      setShowRepuestoModal(true);
    } catch (e) {
      console.warn('No se pudo cargar detalle de repuesto para modal', e);
    }
  };

  // Helper: determinar si una conversación corresponde a una moto
  const isMotoConversation = (conv) => {
    if (!conv) return false;
    // Si el tipo está explícito, respetarlo
    if (conv.relatedType === 'moto') return true;
    if (conv.relatedType === 'repuesto') return false;
    // Si sólo hay relatedId pero no tipo, preferir NO asumir 'moto' automáticamente
    // (esto avoids false positives when the backend omitted the type)
    if (conv.relatedId && !conv.relatedType) return true; // conservative fallback: prefer moto
    // revisar raw.titulo por si backend viene con el string 'publicacion-<id>'
    try {
      const t = conv.raw && conv.raw.titulo ? String(conv.raw.titulo).trim() : '';
      // Primero detectar claramente repuestos y evitarlos
      if (/^publicacion-repuesto-(\d+)(?:-buyer-(\d+))?$/.test(t)) return false;
      // Luego aceptar pattern de moto
      if (/^publicacion-(\d+)(?:-buyer-(\d+))?$/.test(t)) return true;
    } catch (e) {}
    return false;
  };

  const openProfilePeek = (profile) => {
    // profile puede ser: objeto completo, objeto mínimo con id/clienteId, o un id numérico/string
    (async () => {
      try {
        console.debug('[profilePeek] requested profile param:', profile);
        if (!profile) return;
        // mostrar modal de carga
        setProfilePeek({ loading: true });
        // si nos pasaron un id directo
        let resolved = profile;
        const maybeId = (typeof profile === 'number' || (typeof profile === 'string' && /^\d+$/.test(profile))) ? profile : null;
        if (maybeId) {
          const { detalleCliente } = await import('../../services/clientes');
          const resp = await detalleCliente(maybeId);
          console.debug('[profilePeek] detalleCliente resp:', resp);
          resolved = resp && (resp.cliente || resp) ? (resp.cliente || resp) : resolved;
          console.debug('[profilePeek] resolved after detalleCliente:', resolved);
        } else {
          // si viene objeto con poco info y contiene id, intentar cargar
          const id = profile && (profile.id || profile.clienteId || (profile.cliente && profile.cliente.id)) ? (profile.id || profile.clienteId || profile.cliente.id) : null;
          const hasEnough = profile && (profile.email || profile.correo_electronico || profile.phone || profile.telefono || profile.fecha_nacimiento || profile.birthdate || profile.city || profile.ciudad);
          if (id && !hasEnough) {
            const { detalleCliente } = await import('../../services/clientes');
            const resp = await detalleCliente(id);
              console.debug('[profilePeek] detalleCliente resp (id fallback):', resp);
            resolved = resp && (resp.cliente || resp) ? (resp.cliente || resp) : resolved;
              console.debug('[profilePeek] resolved after detalleCliente (id fallback):', resolved);
          }
        }

            // Normalizar campos del perfil para el modal
            let full = {
              fullname: resolved.nombre || resolved.fullname || resolved.name || resolved.usuario || resolved.clientName || '',
              birthdate: resolved.fecha_nacimiento || resolved.birthdate || resolved.fecha || '',
              email: resolved.correo_electronico || resolved.email || resolved.correo || '',
              phone: resolved.telefono || resolved.celular || resolved.movil || resolved.mobile || resolved.phone || resolved.contacto || (resolved.contact && (resolved.contact.telefono || resolved.contact.phone)) || '',
              city: resolved.ciudad || resolved.city || resolved.ubicacion || resolved.location || ''
            };

            // Si no tenemos teléfono en la respuesta de clientes, intentar obtenerlo
            // desde el endpoint de usuarios si disponemos de un id.
            try {
              if ((!full.phone || String(full.phone).trim() === '') && (resolved && (resolved.id || resolved.clienteId || resolved.usuarioId || resolved.userId))) {
                const uid = resolved.id || resolved.clienteId || resolved.usuarioId || resolved.userId;
                try {
                  const api = (await import('../../api/axios')).default;
                  const r = await api.get(`/usuarios/detalle/${encodeURIComponent(uid)}`);
                  const u = r && r.data ? r.data : null;
                  if (u) {
                    const phoneFromUser = u.telefono || u.celular || u.movil || u.mobile || u.phone || u.contacto || (u.contact && (u.contact.telefono || u.contact.phone)) || '';
                    if (phoneFromUser) full = { ...full, phone: phoneFromUser };
                  }
                } catch (e) {
                  // ignore usuario fetch
                }
              }
            } catch (e) { /* ignore */ }

            console.debug('[profilePeek] final normalized full:', full);
            setProfilePeek(full);
      } catch (err) {
        console.warn('Error cargando perfil', err);
        setProfilePeek(null);
        try { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el perfil del usuario.' }); } catch (e) {}
      }
    })();
  };

  const closeProfilePeek = () => setProfilePeek(null);

  const goBack = () => { setActiveId(null); setMessages([]); try { sessionStorage.removeItem('chat_open_id'); } catch (e) {} };

  // Restaurar conversación abierta desde sessionStorage si había una al recargar.
  // Esperamos a que `conversations` esté cargado para poder abrirla.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('chat_open_id');
      if (!stored) return;
      const cid = Number(stored);
      if (!cid) return;
      if (!activeId) {
        if (Array.isArray(conversations) && conversations.find(c => Number(c.id) === cid)) {
          openConversation(cid);
        }
      }
    } catch (e) {}
  }, [conversations]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeId) return;
    
    const current = getCurrentUser();
    if (!current || !current.id) {
      Swal.fire({ icon: 'warning', title: 'Inicia sesión', text: 'Debes iniciar sesión para enviar mensajes.' });
      return;
    }
    const cuerpo = input.trim();
    try {
      const body = { remitente: current.nombre || current.name || current.email || `user-${current.id}`, cuerpo, clienteId: current.id };
      await chatService.enviarMensaje(activeId, body);
      // añadir al hilo localmente
      const now = new Date();
      const time = now.toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      const message = { id: `m${Date.now()}`, sender: 'you', text: cuerpo, time };
      setMessages(prev => [...prev, message]);
      setConversations(prev => prev.map(c => c.id === activeId ? { ...c, lastMessage: cuerpo, subtitle: 'Tu mensaje fue enviado.' } : c));
      setInput('');
      setTimeout(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, 40);
      // avisar a otras vistas que chats cambiaron
      try { window.dispatchEvent(new CustomEvent('chats:updated', { detail: { chatId: activeId } })); } catch (e) {}
      try {
        // también escribir a localStorage para notificar otras pestañas (evento 'storage')
        const payload = { chatId: activeId, t: Date.now(), source: instanceIdRef.current };
        localStorage.setItem('chats:updated', JSON.stringify(payload));
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('Error enviando mensaje', err);
      const msg = (err && err.response && err.response.data && (err.response.data.message || err.response.data.error)) || err.message || 'Error al enviar mensaje';
      try { Swal.fire({ icon: 'error', title: 'No enviado', text: msg }); } catch (e) { alert(msg); }
    }
  };

  const active = conversations.find(c => c.id === activeId);

  return (
    <div className="chat-page">
      <div className="sell-modal" role="main">
        {/* Header */}
          <div className="chat-header">
          {active ? (
            <button className="chat-back" onClick={goBack} aria-label="Volver"><FaArrowLeft /></button>
          ) : null}
          {active ? (
            (() => {
              const raw = active && active.title ? String(active.title) : '';
              const headerTitle = raw.replace(/^Nuevo mensaje(?:\s+de)?[:\-\s]*/i, '').trim() || raw;
              // Preparar argumento para abrir el modal de perfil.
              // Preferir el perfil del otro participante calculado en el mapeo;
              // si no está, usar su id si no coincide con el usuario actual.
              const current = getCurrentUser();
              const currentId = current && current.id ? String(current.id) : null;
              let profileArg = null;
              if (active && active.otherParticipantProfile) {
                profileArg = active.otherParticipantProfile;
              } else if (active && active.otherParticipantId && String(active.otherParticipantId) !== currentId) {
                profileArg = { id: active.otherParticipantId };
              } else if (active && active.ownerDetailId && String(active.ownerDetailId) !== currentId) {
                profileArg = { id: active.ownerDetailId };
              } else {
                // intentar usar el remitente del último mensaje si está disponible
                const ultima = active && active.raw && active.raw.ultima ? active.raw.ultima : null;
                const maybeOther = ultima && (ultima.clienteId || ultima.remitenteId || ultima.remitente) ? (ultima.clienteId || ultima.remitenteId || ultima.remitente) : null;
                if (maybeOther && String(maybeOther) !== currentId) profileArg = { id: maybeOther };
                else profileArg = { fullname: headerTitle, city: '—' };
              }

              return (
                <h3 className="chat-header-title">
                  <span className="chat-header-main">Conversación</span>
                  <span className="chat-header-sep" aria-hidden="true" />
                  <span
                      className="chat-header-name"
                      onClick={() => {
                        try {
                          const current = getCurrentUser();
                          const currentId = current && current.id ? String(current.id) : null;
                          // copia para depuración y posible ajuste
                          let toOpen = profileArg;
                          // si el id a abrir coincide con la sesión actual, intentar una alternativa
                          if (toOpen && toOpen.id && String(toOpen.id) === currentId) {
                            // intentar tomar el remitente del último mensaje
                            const ultima = active && active.raw && active.raw.ultima ? active.raw.ultima : null;
                            const maybeOther = ultima && (ultima.clienteId || ultima.remitenteId || ultima.remitente) ? (ultima.clienteId || ultima.remitenteId || ultima.remitente) : null;
                            if (maybeOther && String(maybeOther) !== currentId) {
                              toOpen = { id: maybeOther };
                            } else if (active && active.otherParticipantId && String(active.otherParticipantId) !== currentId) {
                              toOpen = { id: active.otherParticipantId };
                            }
                          }
                          console.debug('[chat] opening profile peek', { profileArg, resolved: toOpen, active, currentId });
                          openProfilePeek(toOpen);
                        } catch (e) {
                          console.warn('[chat] error preparing profile peek', e);
                          openProfilePeek(profileArg);
                        }
                      }}
                  >{headerTitle}</span>
                </h3>
              );
            })()
          ) : (
            <h3>Bandeja de entrada</h3>
          )}
        </div>

        <div className="chat-body">
          {!active && (
            <div className="chat-list">
              <p className="chat-list-note">Aquí verás tus conversaciones de compra y mensajes relacionados.</p>
              {conversations.map(conv => {
                // Presentation-only transformation:
                // Si el título o subtítulo tiene el patrón "Nuevo mensaje de <Nombre>",
                // mostramos <Nombre> como título y "Nuevo mensaje" como subtítulo.
                const rawTitle = conv && conv.title ? String(conv.title) : '';
                const rawSub = conv && conv.subtitle ? String(conv.subtitle) : '';
                const lastMsg = conv && conv.lastMessage ? String(conv.lastMessage) : '';
                let displayTitle = rawTitle;
                let displaySub = rawSub;
                try {
                  const nuevoRe = /^Nuevo mensaje de\s+(.+)$/i;
                  const mTitle = rawTitle.match(nuevoRe);
                  const mSub = (!mTitle) ? rawSub.match(nuevoRe) : null;
                  const m = mTitle || mSub;
                  if (m && m[1]) {
                    displayTitle = String(m[1]).trim();
                    displaySub = 'Nuevo mensaje';
                  }
                } catch (e) { /* ignore presentation parse errors */ }

                // Si no tenemos subtítulo predefinido, derivar una etiqueta simple
                // según quién envió el último mensaje: "Te respondió" (si lo envió
                // la otra persona) o "Enviaste un mensaje" (si lo enviaste tú).
                // Esto es solo presentación: no se modifica la lógica ni se hacen nuevas peticiones.
                try {
                  if ((!displaySub || !String(displaySub).trim()) && conv && conv.raw && conv.raw.ultima) {
                    const currentUser = getCurrentUser();
                    const currentId = currentUser && currentUser.id ? String(currentUser.id) : null;
                    const ultimaRaw = conv.raw.ultima || {};
                    const lastSender = ultimaRaw.clienteId || ultimaRaw.remitenteId || ultimaRaw.remitente || ultimaRaw.clientId || ultimaRaw.senderId || null;
                    if (lastSender && currentId) {
                      if (String(lastSender) !== String(currentId)) {
                        displaySub = 'Te respondió';
                      } else {
                        displaySub = 'Enviaste un mensaje';
                      }
                    }
                  }
                } catch (e) { /* ignore */ }

                return (
                  <button key={conv.id} className="chat-item" onClick={() => openConversation(conv.id)}>
                    <div className="chat-item-left">
                      <div className="chat-avatar">{conv.avatar ? <img src={conv.avatar} alt={displayTitle} /> : (displayTitle && displayTitle[0] ? displayTitle.split(' ')[0][0] : 'U')}</div>
                      {conv.unread ? (
                        <div className="chat-unread-badge" title={`${conv.unread} mensajes sin leer`}>
                          <FaEnvelope className="unread-icon" />
                          <span className="unread-count">{conv.unread}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="chat-item-body">
                      <div className="chat-item-title">{displayTitle}</div>
                      <div className="chat-item-sub">{displaySub}{lastMsg ? ' — ' : ''}<span className="muted">{lastMsg}</span></div>
                    </div>
                    {conv.relatedId ? (
                      <div className="chat-item-actions">
                        <button type="button" className="chat-link-ad" onClick={(e) => { e.stopPropagation(); if (isMotoConversation(conv) || conv.relatedType === 'moto') navigate(`/motos#moto-${conv.relatedId}`); else if (conv.relatedType === 'repuesto') navigate(`/repuestos#repuesto-${conv.relatedId}`); else goToAd(conv.relatedId, conv.relatedType); }} aria-label={`Ver anuncio ${conv.relatedId}`}>Ver anuncio</button>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {/* Perfil peek modal/slide-over */}
          {profilePeek && createPortal(
            <div
              className="chat-profile-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Perfil de ${profilePeek.fullname || ''}`}
              style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.45)',
                zIndex: 2147483647,
                padding: 28,
              }}
            >
              <div className="chat-profile-card" role="document" style={{ position: 'relative', zIndex: 2147483648, maxWidth: 920 }}>
                <button className="chat-profile-close" onClick={closeProfilePeek} aria-label="Cerrar perfil"><FaTimes /></button>
                {profilePeek.loading ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>Cargando perfil...</div>
                ) : (
                <div className="chat-profile-grid">
                  <div className="chat-profile-left">
                    <div className="chat-profile-avatar">{(profilePeek.fullname || 'U').split(' ')[0][0]}</div>
                  </div>
                  <div className="chat-profile-right">
                    <h4 className="chat-profile-name">{profilePeek.fullname}</h4>
                    {profilePeek.city && <div className="chat-profile-city muted">{profilePeek.city}</div>}

                    <div className="chat-profile-fields">
                      {profilePeek.birthdate && (
                        <div className="profile-field">
                          <div className="pf-icon"><FaRegCalendarAlt /></div>
                          <div className="pf-value">
                            <div className="pf-label">Fecha de nacimiento</div>
                            <div className="pf-text">{profilePeek.birthdate}</div>
                          </div>
                        </div>
                      )}

                      {profilePeek.email && (
                        <div className="profile-field">
                          <div className="pf-icon"><FaEnvelope /></div>
                          <div className="pf-value">
                            <div className="pf-label">Correo electrónico</div>
                            <div className="pf-text">{profilePeek.email}</div>
                          </div>
                        </div>
                      )}

                      {profilePeek.phone && (
                        <div className="profile-field">
                          <div className="pf-icon"><MdPhone /></div>
                          <div className="pf-value">
                            <div className="pf-label">Número de teléfono</div>
                            <div className="pf-text">{profilePeek.phone}</div>
                          </div>
                        </div>
                      )}

                      {profilePeek.city && (
                        <div className="profile-field">
                          <div className="pf-icon"><FaMapMarkerAlt /></div>
                          <div className="pf-value">
                            <div className="pf-label">Ciudad / Provincia</div>
                            <div className="pf-text">{profilePeek.city}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Solo usamos la X de cierre en la esquina superior; se eliminan los botones para mejor UX */}
                  </div>
                </div>
                )}
              </div>
            </div>,
            document.body
          )}

          {/* Motor modal: abrir ficha de la moto sin navegar */}
          {showMotoModal && selectedMoto && (
            <MotosModal
              selectedMoto={selectedMoto}
              onClose={() => { setShowMotoModal(false); setSelectedMoto(null); }}
              showContactForm={false}
              setShowContactForm={() => {}}
              contactForm={{ message: '' }}
              handleContactChange={() => {}}
              handleContactSubmit={() => {}}
              contactSent={false}
              hideHeaderContact={false}
              isOwner={false}
            />
          )}

          {showRepuestoModal && selectedPart && (
            <RepuestosModal
              selectedPart={selectedPart}
              onClose={() => { setShowRepuestoModal(false); setSelectedPart(null); }}
              showContactForm={false}
              setShowContactForm={() => {}}
              contactForm={{ message: '' }}
              handleContactChange={() => {}}
              handleContactSubmit={() => {}}
              contactSent={false}
              hideHeaderContact={false}
              isOwner={false}
            />
          )}

          

          {active && (
            <div className="chat-thread">
              {/* Si la conversación refiere a un anuncio, mostrar su tarjeta arriba del hilo */}
              {(activeRelated) ? (
                <div className="chat-related-card" onClick={() => goToAd(activeRelated.id, activeRelated.type)} role="button" tabIndex={0}>
                  <div className="related-image">
                    <img src={activeRelated.img} alt={activeRelated.title} />
                  </div>
                  <div className="related-meta">
                    <div className="related-title">{activeRelated.title}</div>
                    <div className="related-price">${activeRelated.price}</div>
                  </div>
                    <div className="related-actions">
                      <button type="button" className="chat-link-ad" onClick={(e) => { e.stopPropagation(); const conv = conversations.find(c => c.id === activeId); if (isMotoConversation(conv) || activeRelated.type === 'moto') navigate(`/motos#moto-${activeRelated.id}`); else if (activeRelated.type === 'repuesto') navigate(`/repuestos#repuesto-${activeRelated.id}`); else goToAd(activeRelated.id, activeRelated.type); }}>Ver anuncio</button>
                    </div>
                </div>
              ) : null}
              <div className="chat-messages" ref={listRef}>
                {messages.map(m => (
                  <div key={m.id} className={`chat-msg ${m.sender === 'you' ? 'me' : 'them'}`}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div className={`chat-msg-text conv-text ${m.isDeleted ? 'deleted' : ''}`}>{m.text}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="chat-msg-time muted">{m.time}</div>
                          {m.sender === 'you' && m.read ? (
                            <div className="chat-msg-status" style={{ fontSize: 12, color: '#5b6bff' }}>Leído</div>
                          ) : null}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {/* Mostrar opción de reportar (solo para mensajes de la otra persona) */}
                        {m.sender !== 'you' && !m.isDeleted ? (
                          <div style={{ position: 'relative' }} ref={openMenuId === m.id ? menuRef : null}>
                            <button type="button" className="chat-link-ad" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === m.id ? null : m.id); }} aria-label="Abrir opciones del mensaje">
                              <FaEllipsisH />
                            </button>
                            {openMenuId === m.id ? (
                              <div style={{ position: 'absolute', left: 'calc(100% + 8px)', top: 4, background: '#fff', borderRadius: 10, boxShadow: '0 12px 40px rgba(2,6,23,0.12)', padding: 8, minWidth: 170, zIndex: 1000, whiteSpace: 'nowrap' }}>
                                <button type="button" className="chat-link-ad" onClick={(e) => { e.stopPropagation(); setReportSelected({ id: m.id, text: m.text }); setReportReason(''); setReportModalOpen(true); setOpenMenuId(null); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: '#e04b4b', padding: '8px 10px', borderRadius: 8 }}>
                                  <FaFlag /> Reportar mensaje
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <button type="button" className="chat-link-ad" style={{ opacity: 0.0, pointerEvents: 'none' }} aria-hidden />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Report modal */}
              {reportModalOpen && reportSelected && createPortal(
                <div className="report-modal" role="dialog" aria-modal="true" aria-label="Reportar mensaje">
                  <div className="report-card" role="document">
                    <button className="chat-profile-close" onClick={() => setReportModalOpen(false)} aria-label="Cerrar reporte"><FaTimes /></button>
                    <div className="report-body">
                      <h3 className="report-title"><FaFlag className="report-flag" /> Reportar mensaje</h3>
                      <p className="report-desc">¿Por qué quieres reportar este mensaje? Tu reporte será revisado por nuestro equipo.</p>

                      <div className="report-quote">&quot;{reportSelected.text}&quot;</div>

                      <textarea className="report-textarea" value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Describe el motivo del reporte..." />

                      <div className="report-actions">
                        <button type="button" className="chat-link-ad" onClick={() => { setReportModalOpen(false); setReportSelected(null); setReportReason(''); }}>Cancelar</button>
                        <button type="button" className="btn btn-danger" disabled={!String(reportReason || '').trim() || reportSending} onClick={async () => {
                          try {
                            const reason = String(reportReason || '').trim();
                            if (!reason) { try { Swal.fire({ icon: 'warning', title: 'Escribe un motivo', text: 'Por favor describe por qué reportas este mensaje.' }); } catch (e) {} return; }
                            if (!activeId) { try { Swal.fire({ icon: 'warning', title: 'Chat no seleccionado', text: 'No se pudo determinar el chat asociado.' }); } catch (e) {} return; }
                            setReportSending(true);
                            try {
                                // Enviar motivo en español como 'motivo'
                                await reportsService.reportMessage(activeId, reportSelected.id, { motivo: reason });
                            } finally {
                              setReportSending(false);
                            }
                            try { Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Mensaje reportado', text: 'Tu reporte ha sido enviado. Revisaremos el mensaje pronto.', showConfirmButton: false, timer: 3000 }); } catch (e) { alert('Reporte enviado'); }
                            setReportModalOpen(false); setReportSelected(null); setReportReason('');
                          } catch (err) { console.error('report send error', err);
                            const msg = err && err.response && err.response.data && (err.response.data.message || err.response.data.error) ? (err.response.data.message || err.response.data.error) : 'No se pudo enviar el reporte';
                            try { Swal.fire({ icon: 'error', title: 'Error', text: msg }); } catch (e) { alert(msg); }
                          }
                        }}>{reportSending ? 'Enviando...' : 'Enviar reporte'}</button>
                      </div>
                    </div>
                  </div>
                </div>, document.body
              )}

              <form className="chat-send" onSubmit={handleSend}>
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe un mensaje..." />
                <button type="submit" className="btn btn-primary">Enviar</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
