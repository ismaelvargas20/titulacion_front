import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaStar, 
  FaMapMarkerAlt, 
  FaTag, 
  FaUserCircle, 
  FaRegCommentAlt,
  FaArrowRight, // Icono para "Ver todas"
  FaReply,     // Icono para "Responder"
  FaMotorcycle,
  FaTools,
  FaFire
} from 'react-icons/fa';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';
import '../../assets/scss/inicio.scss';
import Registro from '../registro.jsx/registro.jsx';
import MotosModal from '../motos/motos_modal.jsx';
import RepuestosModal from '../repuestos/repuestos_modal.jsx';

const Inicio = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedMoto, setSelectedMoto] = useState(null);
  const [showMotoModal, setShowMotoModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [showPartModal, setShowPartModal] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ message: '' });
  const [contactSent, setContactSent] = useState(false);

  // estado local del formulario del modal
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // --- Datos de Ejemplo (Ampliados para el carrusel) ---

  const recentMotos = [
    { id: 1, title: 'Yamaha MT-09 2022', price: '9,500', location: 'Quito', stars: 5, img: 'https://loremflickr.com/320/240/motorcycle,yamaha' },
    { id: 2, title: 'Honda CBR600RR', price: '8,200', location: 'Guayaquil', stars: 4, img: 'https://loremflickr.com/320/240/motorcycle,honda' },
    { id: 3, title: 'Suzuki V-Strom 650', price: '7,800', location: 'Cuenca', stars: 5, img: 'https://loremflickr.com/320/240/motorcycle,suzuki' },
    { id: 4, title: 'Royal Enfield Classic 350', price: '4,500', location: 'Quito', stars: 4, img: 'https://loremflickr.com/320/240/motorcycle,classic' },
    { id: 5, title: 'Kawasaki Z900', price: '10,100', location: 'Manta', stars: 5, img: 'https://loremflickr.com/320/240/motorcycle,kawasaki' },
    { id: 6, title: 'Ducati Scrambler', price: '11,000', location: 'Guayaquil', stars: 5, img: 'https://loremflickr.com/320/240/motorcycle,ducati' },
  ];

  const featuredParts = [
    { id: 1, title: 'Casco Integral AGV K3', price: '250', category: 'Cascos', img: 'https://loremflickr.com/320/240/motorcycle,helmet', stars: 5 },
    { id: 2, title: 'Llantas Michelin Road 5', price: '180', category: 'Llantas', img: 'https://loremflickr.com/320/240/motorcycle,tire', stars: 4 },
    { id: 3, title: 'Kit de Arrastre DID', price: '120', category: 'Transmisión', img: 'https://loremflickr.com/320/240/motorcycle,chain', stars: 5 },
    { id: 4, title: 'Chaqueta Alpinestars', price: '300', category: 'Protección', img: 'https://loremflickr.com/320/240/motorcycle,jacket', stars: 4 },
    { id: 5, title: 'Escape Akrapovič', price: '750', category: 'Escapes', img: 'https://loremflickr.com/320/240/motorcycle,exhaust', stars: 5 },
    { id: 6, title: 'Guantes de Cuero', price: '80', category: 'Protección', img: 'https://loremflickr.com/320/240/motorcycle,gloves', stars: 4 },
  ];

  const initialForum = [
    { id: 1, topic: '¿Vale la pena la nueva Himalayan 450?', lastReplyBy: 'Carlos', time: 'hace 5m', responses: [
      { id: 101, user: 'EnduroPro', text: '¡Excelente recomendación! Añadiría la Honda CRF250F también, es muy dócil para aprender.' }
    ] },
    { id: 2, topic: 'Mejor aceite para una moto 2T', lastReplyBy: 'Ana', time: 'hace 22m', responses: [
      { id: 201, user: 'AventureroMX', text: '¡No olvides revisar los rodamientos de rueda y dirección! Un fallo ahí te puede arruinar el viaje.' }
    ] },
    { id: 3, topic: 'Consejos para primer viaje largo', lastReplyBy: 'David', time: 'hace 1h', responses: [] },
  ];

  const [forumPosts, setForumPosts] = useState(initialForum);
  const [openReplyFor, setOpenReplyFor] = useState(null); // id of post with reply form open

  const trending = [
    '¿Cuáles son las mejores rutas de fin de semana?',
    'Mantenimiento preventivo: consejos rápidos',
    'Mejores ofertas en neumáticos este mes'
  ];

  // Refs para controlar el scroll de los carruseles
  const motosRef = React.useRef(null);
  const partsRef = React.useRef(null);

  // --- Componentes locales para Respuestas (adaptado de comunidad.jsx) ---
  function Response({ response }) {
    return (
      <div className="response-item">
        <FaUserCircle className="icon" />
        <div>
          <span className="response-user">@{response.user}</span>
          <p className="response-text">{response.text}</p>
        </div>
      </div>
    );
  }

  function AddResponseForm({ postId, onAddResponse, onClose }) {
    const [responseText, setResponseText] = useState('');
    const handleSubmit = (e) => {
      e.preventDefault();
      if (responseText.trim() === '') return;
      onAddResponse(postId, { id: Date.now(), user: 'Usuario', text: responseText });
      setResponseText('');
      if (onClose) onClose();
    };
    return (
      <form onSubmit={handleSubmit} className="add-response-form">
        <input
          type="text"
          className="input-response"
          placeholder="Tu respuesta..."
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
        />
        <button type="submit" className="btn small-send" title="Enviar respuesta" aria-label="Enviar respuesta">
          {/* reuse small paper plane icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-send" width="16" height="16"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </form>
    );
  }

  const scrollCarousel = (ref, dir = 1) => {
    if (!ref || !ref.current) return;
    const container = ref.current;
    const card = container.querySelector('.item-card');
    const style = window.getComputedStyle(container);
    const gap = parseInt(style.gap) || 24;
    const cardWidth = card ? card.clientWidth : 300;
    const scrollAmount = Math.round((cardWidth + gap) * 1.5);
    container.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
  };

  const openPartModal = (part) => {
    // reuse same contact form state/handlers
    setSelectedPart(part);
    setShowPartModal(true);
    setShowContactForm(false);
    setContactForm({ message: '' });
    setContactSent(false);
  };

  const closePartModal = () => {
    setShowPartModal(false);
    setSelectedPart(null);
    setShowContactForm(false);
    setContactForm({ message: '' });
    setContactSent(false);
  };

  const openMotoModal = (moto) => {
    setSelectedMoto(moto);
    setShowMotoModal(true);
    setShowContactForm(false);
    setContactForm({ message: '' });
    setContactSent(false);
  };

  const closeMotoModal = () => {
    setShowMotoModal(false);
    setSelectedMoto(null);
    setShowContactForm(false);
    setContactForm({ message: '' });
    setContactSent(false);
  };

  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Aquí podrías integrar envío real. Por ahora simulamos envío.
    setContactSent(true);
    // opcional: cerrar formulario después de un tiempo
    setTimeout(() => {
      setShowContactForm(false);
    }, 1400);
  };

  // Añadir respuesta a un post del bloque 'Actividad Reciente' en Inicio
  const addResponse = (postId, newResponse) => {
    setForumPosts(prev => prev.map(p => p.id === postId ? { ...p, responses: [...(p.responses || []), newResponse] } : p));
  };

  return (
    <div className="inicio-page">
      <main className="inicio-main">
        {/* --- Sección Hero --- */}
        <section className="hero">
          <div className="hero-content">
            <h1>¡Bienvenido a la comunidad!</h1>
            <p className="hero-sub">Donde la aventura comienza — Conecta, Compra y Rodamos Juntos</p>
            <button className="cta-join" onClick={() => setShowLoginModal(true)}>¡Únete a la tribu!</button>
          </div>
          <div className="hero-visual"><FaFire className="hero-fire" /></div>
        </section>

        {/* --- 1. Motos Recién Publicadas (Carrusel) --- */}
        <section className="featured-items">
          <div className="section-header">
            <h2><FaMotorcycle className="section-icon icon-moto" />Motos Recién Publicadas</h2>
            <NavLink to="/motos" className="view-all-link">
              Ver todas <FaArrowRight />
            </NavLink>
          </div>
          <div className="carousel-wrapper">
            <button
              className="carousel-button left"
              aria-label="Anterior"
              onClick={() => scrollCarousel(motosRef, -1)}
              title="Anterior"
            >
              <FaChevronLeft />
            </button>
            <div className="item-cards-carousel" ref={motosRef}> {/* CAMBIO: Ahora es carrusel */}
              {recentMotos.map((moto) => (
              <article key={moto.id} className="item-card" onClick={() => openMotoModal(moto)} style={{ cursor: 'pointer' }}>
                <div className="card-image">
                  <img src={`${moto.img}?${moto.id}`} alt={moto.title} />
                  <span className="card-price"><FaTag /> ${moto.price}</span>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{moto.title}</h3>
                  <div className="card-meta">
                    <span><FaMapMarkerAlt /> {moto.location}</span>
                    <span>{moto.stars} <FaStar className="star-icon" /></span>
                  </div>
                </div>
              </article>
            ))}
            </div>
            <button
              className="carousel-button right"
              aria-label="Siguiente"
              onClick={() => scrollCarousel(motosRef, 1)}
              title="Siguiente"
            >
              <FaChevronRight />
            </button>
          </div>
        </section>
        
        {/* --- 2. Repuestos Destacados (Carrusel) --- */}
        <section className="featured-items">
          <div className="section-header">
            <h2><FaTools className="section-icon icon-tools" />Repuestos Destacados</h2>
            <NavLink to="/repuestos" className="view-all-link">
              Ver todos <FaArrowRight />
            </NavLink>
          </div>
          <div className="carousel-wrapper">
            <button
              className="carousel-button left"
              aria-label="Anterior"
              onClick={() => scrollCarousel(partsRef, -1)}
              title="Anterior"
            >
              <FaChevronLeft />
            </button>
            <div className="item-cards-carousel" ref={partsRef}> {/* CAMBIO: Ahora es carrusel */}
              {featuredParts.map((part) => (
              <article key={part.id} className="item-card" onClick={() => openPartModal(part)} style={{ cursor: 'pointer' }}>
                <div className="card-image">
                  <img src={`${part.img}?${part.id}`} alt={part.title} />
                  <span className="card-price"><FaTag /> ${part.price}</span>
                </div>
                <div className="card-content">
                  <span className="card-category">{part.category}</span>
                  <h3 className="card-title">{part.title}</h3>
                  <div className="card-meta">
                    <span className="muted">{part.category}</span>
                    <span className="stars">{part.stars || 0} <FaStar className="star-icon" /></span>
                  </div>
                </div>
              </article>
            ))}
            </div>
            <button
              className="carousel-button right"
              aria-label="Siguiente"
              onClick={() => scrollCarousel(partsRef, 1)}
              title="Siguiente"
            >
              <FaChevronRight />
            </button>
          </div>
        </section>

        {/* --- Grid de Comunidad (Foros y Temas) --- */}
        <div className="community-grid">
          {/* --- 3. Actividad Reciente (con botón Responder) --- */}
          <section className="recent-posts">
            <div className="section-header">
              <h2><FaRegCommentAlt className="section-icon icon-forum" />Actividad Reciente</h2>
              <NavLink to="/comunidad" className="view-all-link">
                Ver foros <FaArrowRight />
              </NavLink>
            </div>
            <div className="post-list">
              {forumPosts.map((post) => (
                <React.Fragment key={post.id}>
                <div className="post-item">
                  <FaUserCircle className="post-avatar" />
                  <div className="post-content">
                    {/* Navegar a la página Comunidad y pasar el id del post en state para que Comunidad pueda hacer scroll al post */}
                    <NavLink to="/comunidad" state={{ postId: post.id }} className="post-topic">{post.topic}</NavLink>
                    <span className="post-meta">Último comentario por <strong>{post.lastReplyBy}</strong></span>
                    {/* Botón de Responder: abre formulario inline igual que en Comunidad */}
                    <button type="button" className="post-reply-link" onClick={() => setOpenReplyFor(openReplyFor === post.id ? null : post.id)}>
                      <FaReply /> Responder
                    </button>
                  </div>
                  <span className="post-time">{post.time}</span>
                </div>

                {/* Reply row: mostramos el input DEBAJO de la publicación cuando se pulsa Responder */}
                {openReplyFor === post.id && (
                  <div className="post-reply-row">
                    <AddResponseForm postId={post.id} onAddResponse={addResponse} onClose={() => setOpenReplyFor(null)} />
                  </div>
                )}

                </React.Fragment>
              ))}
            </div>
          </section>

          {/* --- 4. Temas Trending --- */}
      <section className="trending-topics">
        <h2><FaFire className="section-icon icon-fire" /> Tendencias</h2>
            <ul className="topic-list">
              {trending.map((t, i) => (
                <li key={i}>
                  <NavLink to="/comunidad" state={{ fromTrending: true, index: i }}>
                    <FaRegCommentAlt className="topic-icon" /> {t}
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Mapa eliminado según indicación del cliente */}

        {/* --- Login Modal (se abre al pulsar "¡Únete a la tribu!") --- */}
        {showLoginModal && (
          <div className="reg-modal-overlay" role="dialog" aria-modal="true">
            <div className="reg-modal-card">
              <button className="reg-close" onClick={() => setShowLoginModal(false)} aria-label="Cerrar">✕</button>
              <h2 className="reg-title">Iniciar sesión</h2>
              <p className="reg-sub">Accede para publicar, comentar y participar en la comunidad</p>

              <form className="reg-form" onSubmit={(e) => { e.preventDefault(); if (loginEmail.trim() && loginPassword.trim()) { setShowLoginModal(false); navigate('/'); } else { alert('Ingresa email y contraseña'); } }}>
                <label>
                  <span>Email</span>
                  <div className="reg-input">
                    <MdEmail className="reg-icon" />
                    <input name="email" type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                </label>

                <label>
                  <span>Contraseña</span>
                  <div className="reg-input">
                    <RiLockPasswordFill className="reg-icon" />
                    <input name="password" type="password" placeholder="Contraseña" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                </label>

                <div className="reg-actions">
                  <button type="button" className="reg-btn secondary" onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}>Crear cuenta</button>
                  <button type="submit" className="reg-btn primary">Iniciar sesión</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Registro modal reutilizando componente existente */}
        <Registro isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} />

        {/* Modal de detalle de moto: se muestra al hacer click en una tarjeta */}
        {showMotoModal && (
          <MotosModal
            selectedMoto={selectedMoto}
            onClose={closeMotoModal}
            showContactForm={showContactForm}
            setShowContactForm={setShowContactForm}
            contactForm={contactForm}
            handleContactChange={handleContactChange}
            handleContactSubmit={handleContactSubmit}
            contactSent={contactSent}
          />
        )}

        {/* Modal de detalle de repuesto: se muestra al hacer click en una tarjeta de repuestos */}
        {showPartModal && (
          <RepuestosModal
            selectedPart={selectedPart}
            onClose={closePartModal}
            showContactForm={showContactForm}
            setShowContactForm={setShowContactForm}
            contactForm={contactForm}
            handleContactChange={handleContactChange}
            handleContactSubmit={handleContactSubmit}
            contactSent={contactSent}
          />
        )}

      </main>
    </div>
  );
};

export default Inicio;