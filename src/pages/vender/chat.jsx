import React, { useState, useRef } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
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

  const openConversation = (id) => {
    setConversations((prev) => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
    setActiveId(id);
    setTimeout(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, 50);
  };

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
          <h3>{active ? `Conversación — ${active.title}` : 'Bandeja de entrada'}</h3>
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
