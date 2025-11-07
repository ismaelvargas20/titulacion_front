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

const Inicio = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

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
    { id: 1, title: 'Casco Integral AGV K3', price: '250', category: 'Cascos', img: 'https://loremflickr.com/320/240/motorcycle,helmet' },
    { id: 2, title: 'Llantas Michelin Road 5', price: '180', category: 'Llantas', img: 'https://loremflickr.com/320/240/motorcycle,tire' },
    { id: 3, title: 'Kit de Arrastre DID', price: '120', category: 'Transmisión', img: 'https://loremflickr.com/320/240/motorcycle,chain' },
    { id: 4, title: 'Chaqueta Alpinestars', price: '300', category: 'Protección', img: 'https://loremflickr.com/320/240/motorcycle,jacket' },
    { id: 5, title: 'Escape Akrapovič', price: '750', category: 'Escapes', img: 'https://loremflickr.com/320/240/motorcycle,exhaust' },
    { id: 6, title: 'Guantes de Cuero', price: '80', category: 'Protección', img: 'https://loremflickr.com/320/240/motorcycle,gloves' },
  ];

  const forumActivity = [
    { id: 1, topic: '¿Vale la pena la nueva Himalayan 450?', lastReplyBy: 'Carlos', time: 'hace 5m' },
    { id: 2, topic: 'Mejor aceite para una moto 2T', lastReplyBy: 'Ana', time: 'hace 22m' },
    { id: 3, topic: 'Consejos para primer viaje largo', lastReplyBy: 'David', time: 'hace 1h' },
  ];

  const trending = [
    '¿Cuáles son las mejores rutas de fin de semana?',
    'Mantenimiento preventivo: consejos rápidos',
    'Mejores ofertas en neumáticos este mes'
  ];

  // Refs para controlar el scroll de los carruseles
  const motosRef = React.useRef(null);
  const partsRef = React.useRef(null);

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
              <article key={moto.id} className="item-card">
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
              <article key={part.id} className="item-card">
                <div className="card-image">
                  <img src={`${part.img}?${part.id}`} alt={part.title} />
                  <span className="card-price"><FaTag /> ${part.price}</span>
                </div>
                <div className="card-content">
                  <span className="card-category">{part.category}</span>
                  <h3 className="card-title">{part.title}</h3>
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
              {forumActivity.map((post) => (
                <div key={post.id} className="post-item">
                  <FaUserCircle className="post-avatar" />
                  <div className="post-content">
                    <NavLink to={`/foro/tema/${post.id}`} className="post-topic">{post.topic}</NavLink>
                    <span className="post-meta">Último comentario por <strong>{post.lastReplyBy}</strong></span>
                    {/* --- NUEVO: Botón de Responder --- */}
                    <NavLink to={`/foro/tema/${post.id}#responder`} className="post-reply-link">
                      <FaReply /> Responder
                    </NavLink>
                  </div>
                  <span className="post-time">{post.time}</span>
                </div>
              ))}
            </div>
          </section>

          {/* --- 4. Temas Trending --- */}
      <section className="trending-topics">
        <h2><FaFire className="section-icon icon-fire" /> Temas Trending</h2>
            <ul className="topic-list">
              {trending.map((t, i) => (
                <li key={i}>
                  <NavLink to="/foro/trending">
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

      </main>
    </div>
  );
};

export default Inicio;