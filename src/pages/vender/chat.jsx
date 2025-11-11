import React, { useState, useRef } from 'react';
import { FaArrowLeft, FaEnvelope, FaTimes, FaRegCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { MdPhone } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import '../../assets/scss/chat.scss';

export default function Chat() {
  const [conversations, setConversations] = useState(() => ([
    {
      id: 'c1',
      title: 'Juan Pérez',
      subtitle: 'Le interesó tu anuncio',
      lastMessage: '¿Sigue disponible?',
      relatedMotoId: 1,
      interested: true,
      relatedMoto: { id: 1, title: 'Yamaha MT-09 2022', price: '9,500', img: 'https://loremflickr.com/280/180/motorcycle,yamaha' },
      unread: 1,
      messages: [
        { id: 'm1', sender: 'buyer', text: 'Hola, ¿sigue disponible?', time: '09:12' },
        { id: 'm2', sender: 'you', text: 'Sí, sigue disponible.', time: '09:14' }
      ]
      ,
      // Datos de perfil de ejemplo (demo). En producción estos vendrían del backend.
      buyerProfile: {
        fullname: 'Juan Pérez',
        birthdate: '1990-05-15',
        email: 'juan.perez@email.com',
        phone: '0987654321',
        city: 'Quito'
      }
    },
    {
      id: 'c2',
      title: 'María López',
      subtitle: 'Consulta por disponibilidad',
      lastMessage: '¿Aceptas cambio?',
      relatedMotoId: 2,
      interested: false,
      relatedMoto: { id: 2, title: 'Honda CBR600RR', price: '8,200', img: 'https://loremflickr.com/280/180/motorcycle,honda' },
      unread: 0,
      messages: [
        { id: 'm1', sender: 'buyer', text: '¿Aceptas cambio por otro modelo?', time: '08:20' }
      ]
      ,
      buyerProfile: {
        fullname: 'María López',
        birthdate: '1992-11-02',
        email: 'maria.lopez@example.com',
        phone: '0991234567',
        city: 'Guayaquil'
      }
    }
  ]));

  const navigate = useNavigate();

  const goToAd = (motoId) => {
    if (!motoId) return;
    // navegar a la página de motos con hash para localizar la tarjeta
    navigate(`/motos#moto-${motoId}`);
  };

  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');
  const listRef = useRef(null);
  // Estado para vista previa de perfil (peek)
  const [profilePeek, setProfilePeek] = useState(null);

  const openConversation = (id) => {
    setConversations((prev) => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
    setActiveId(id);
    setTimeout(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, 50);
  };

  const openProfilePeek = (profile) => {
    if (!profile) return;
    setProfilePeek(profile);
  };

  const closeProfilePeek = () => setProfilePeek(null);

  const goBack = () => setActiveId(null);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeId) return;
    const text = input.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setConversations(prev => prev.map(c => {
      if (c.id !== activeId) return c;
      const msg = { id: `m${Date.now()}`, sender: 'you', text, time };
      return { ...c, lastMessage: text, messages: [...c.messages, msg] };
    }));
    setInput('');
    setTimeout(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, 40);
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
            <h3 className="chat-header-title">
              <span className="chat-header-main">Conversación</span>
              <span className="chat-header-sep" aria-hidden="true" />
              <span className="chat-header-name" onClick={() => openProfilePeek(active.buyerProfile || active.profile || { fullname: active.title, city: '—' })}>{active.title}</span>
            </h3>
          ) : (
            <h3>Bandeja de entrada</h3>
          )}
        </div>

        <div className="chat-body">
          {!active && (
            <div className="chat-list">
              <p className="chat-list-note">Aquí verás tus conversaciones de compra y mensajes relacionados.</p>
              {conversations.map(conv => (
                <button key={conv.id} className="chat-item" onClick={() => openConversation(conv.id)}>
                  <div className="chat-item-left">
                    <div className="chat-avatar">{conv.title.split(' ')[0][0]}</div>
                  </div>
                  <div className="chat-item-body">
                    <div className="chat-item-title">{conv.title} {conv.unread ? <span className="chat-unread">{conv.unread}</span> : null}</div>
                    <div className="chat-item-sub">{conv.subtitle} — <span className="muted">{conv.lastMessage}</span></div>
                  </div>
                  {conv.relatedMotoId ? (
                    <div className="chat-item-actions">
                      <button type="button" className="chat-link-ad" onClick={(e) => { e.stopPropagation(); goToAd(conv.relatedMotoId); }} aria-label={`Ver anuncio ${conv.relatedMotoId}`}>Ver anuncio</button>
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {/* Perfil peek modal/slide-over */}
          {profilePeek && (
            <div className="chat-profile-modal" role="dialog" aria-modal="true" aria-label={`Perfil de ${profilePeek.fullname}`}>
              <div className="chat-profile-card" role="document">
                <button className="chat-profile-close" onClick={closeProfilePeek} aria-label="Cerrar perfil"><FaTimes /></button>
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
              </div>
            </div>
          )}

          {active && (
            <div className="chat-thread">
              {/* Si la conversación refiere a un anuncio, mostrar su tarjeta arriba del hilo */}
              {active.relatedMoto ? (
                <div className="chat-related-card" onClick={() => goToAd(active.relatedMoto.id)} role="button" tabIndex={0}>
                  <div className="related-image">
                    <img src={active.relatedMoto.img} alt={active.relatedMoto.title} />
                  </div>
                  <div className="related-meta">
                    <div className="related-title">{active.relatedMoto.title}</div>
                    <div className="related-price">${active.relatedMoto.price}</div>
                  </div>
                  <div className="related-actions">
                    <button type="button" className="chat-link-ad" onClick={(e) => { e.stopPropagation(); goToAd(active.relatedMoto.id); }}>Ver anuncio</button>
                  </div>
                </div>
              ) : null}
              <div className="chat-messages" ref={listRef}>
                {active.messages.map(m => (
                  <div key={m.id} className={`chat-msg ${m.sender === 'you' ? 'me' : 'them'}`}>
                    <div className="chat-msg-text">{m.text}</div>
                    <div className="chat-msg-time muted">{m.time}</div>
                  </div>
                ))}
              </div>

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
