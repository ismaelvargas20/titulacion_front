import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTag, FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaStar } from 'react-icons/fa';
import '../../assets/scss/motos.scss';
import RepuestosModal from './repuestos_modal';

const Repuestos = () => {
  const initialParts = [
    { id: 1, title: 'Casco Integral K3', price: '250', location: 'Quito', category: 'Cascos', img: 'https://loremflickr.com/640/420/motorcycle,helmet', stars: 5 },
    { id: 2, title: 'Llantas Michelin Road 5', price: '180', location: 'Guayaquil', category: 'Llantas', img: 'https://loremflickr.com/640/420/motorcycle,tire', stars: 4 },
    { id: 3, title: 'Kit de Arrastre DID', price: '120', location: 'Cuenca', category: 'Transmisión', img: 'https://loremflickr.com/640/420/motorcycle,chain', stars: 5 },
    { id: 4, title: 'Chaqueta Alpinestars', price: '300', location: 'Quito', category: 'Ropa', img: 'https://loremflickr.com/640/420/motorcycle,jacket', stars: 4 },
    { id: 5, title: 'Escape Akrapovič', price: '750', location: 'Manta', category: 'Escape', img: 'https://loremflickr.com/640/420/motorcycle,exhaust', stars: 5 },
    { id: 6, title: 'Guantes de Cuero', price: '80', location: 'Guayaquil', category: 'Accesorios', img: 'https://loremflickr.com/640/420/motorcycle,gloves', stars: 4 },
  ];

  const [recentParts, setRecentParts] = useState(initialParts);
  const listRef = useRef(null);
  const [showSellForm, setShowSellForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', condition: 'Nuevo', price: '', location: '', img: '', description: '', contactPhone: '', stars: 5 });
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return setForm((s) => ({ ...s, img: '' }));
    const reader = new FileReader();
    reader.onload = (ev) => setForm((s) => ({ ...s, img: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleAddPart = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price.trim() || !form.contactPhone.trim()) {
      alert('Por favor completa título, precio y teléfono de contacto.');
      return;
    }

    const newPart = {
      id: Date.now(),
      title: form.title,
      category: form.category || 'Hermoso',
      condition: form.condition,
      price: form.price,
      stars: form.stars || 5,
      location: form.location || 'Sin especificar',
      img: form.img || 'https://loremflickr.com/640/420/motorcycle',
      description: form.description || '',
      contact: { phone: form.contactPhone },
    };

    setPublishLoading(true);
    setTimeout(() => {
      setRecentParts((prev) => [newPart, ...prev]);
      setPublishLoading(false);
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 2200);
      setForm({ title: '', category: '', condition: 'Nuevo', price: '', location: '', img: '', description: '', contactPhone: '', stars: 5 });
      setShowSellForm(false);
    }, 900);
  };

  useEffect(() => {
    if (!showSellForm) return;
    const first = document.querySelector('.sell-form input[name="title"]');
    if (first) setTimeout(() => first.focus(), 40);
    const onKey = (e) => { if (e.key === 'Escape') setShowSellForm(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [showSellForm]);

  // Si navegamos desde otra página con location.state.editPart, abrir el formulario
  // de publicación y precargar los datos para editar ese repuesto.
  const location = useLocation();
  useEffect(() => {
    try {
      if (location && location.state && location.state.editPart) {
        const part = location.state.editPart;
        setForm((s) => ({
          ...s,
          title: part.title || '',
          category: part.category || '',
          condition: part.condition || 'Nuevo',
          stars: part.stars || 5,
          price: part.price ? String(part.price) : '',
          location: part.location || '',
          img: part.img || '',
          description: part.description || '',
          contactPhone: (part.contact && part.contact.phone) || ''
        }));
        setShowSellForm(true);
      }
    } catch (e) {
      console.warn('no se pudo inicializar edición de repuesto desde location.state', e);
    }
  }, [location]);

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((s) => ({ ...s, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.message) return;
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setShowContactForm(false);
      setContactForm({ name: '', email: '', message: '' });
    }, 1600);
  };

  const scrollCarousel = (ref, dir = 1) => {
    if (!ref || !ref.current) return;
    const container = ref.current;
    const card = container.querySelector('.item-card');
    const style = window.getComputedStyle(container);
    const gap = parseInt(style.gap) || 24;
    const cardWidth = card ? card.clientWidth : 300;
    const scrollAmount = Math.round((cardWidth + gap) * 2);
    container.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="repuestos-page">
      <main className="motos-main">
        <section className="sell-hero" role="region" aria-label="Vender repuesto">
          <div className="sell-hero-inner">
            <div className="sell-hero-text">
              <h1>¿Tienes repuestos o accesorios?</h1>
              <p>Publica cascos, llantas, escapes y más. Rápido y seguro.</p>
            </div>
            <div className="sell-hero-cta">
              <button type="button" className="btn btn-primary" onClick={() => setShowSellForm(true)}>Vender ahora</button>
            </div>
          </div>
        </section>

        {showSellForm && (
          <div className="sell-modal-overlay" onClick={(e) => { if (e.target.classList && e.target.classList.contains('sell-modal-overlay')) setShowSellForm(false); }}>
            <div className="sell-modal" role="dialog" aria-modal="true">
              <button className="modal-close" aria-label="Cerrar" onClick={() => setShowSellForm(false)}>×</button>
              <form className={`sell-form`} onSubmit={handleAddPart}>
                <div className="sell-form-grid">
                  <div className="sell-form-main">
                    <label>
                      Título
                      <input name="title" value={form.title} onChange={handleFormChange} placeholder="Ej: Casco Integral AGV K3" required />
                    </label>

                    <label>
                      Categoría
                      <select name="category" value={form.category} onChange={handleFormChange}>
                        <option value="">Seleccionar</option>
                        <option value="Cascos">Cascos</option>
                        <option value="Llantas">Llantas</option>
                        <option value="Transmisión">Transmisión</option>
                        <option value="Ropa">Ropa</option>
                        <option value="Escape">Escape</option>
                        <option value="Accesorios">Accesorios</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </label>

                    <label>
                      Condición
                      <select name="condition" value={form.condition} onChange={handleFormChange}>
                        <option>Nuevo</option>
                        <option>Usado - Bueno</option>
                        <option>Usado - Regular</option>
                      </select>
                    </label>

                    <label>
                      Valora este repuesto
                      <select name="stars" value={form.stars} onChange={handleFormChange}>
                        <option value={5}>5 - Excelente</option>
                        <option value={4}>4 - Muy bueno</option>
                        <option value={3}>3 - Bueno</option>
                        <option value={2}>2 - Regular</option>
                        <option value={1}>1 - Malo</option>
                      </select>
                    </label>

                    <label>
                      Precio
                      <input name="price" value={form.price} onChange={handleFormChange} placeholder="Ej: 120" required />
                    </label>

                    <label>
                      Ubicación
                      <input name="location" value={form.location} onChange={handleFormChange} placeholder="Ciudad" />
                    </label>

                    <label className="full">
                      Descripción
                      <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Detalles del estado o compatibilidades" rows={4} />
                    </label>

                    <label>
                      Imagen
                      <input type="file" accept="image/*" name="image" onChange={handleImageChange} />
                    </label>

                    <label>
                      Teléfono de contacto
                      <input name="contactPhone" type="tel" value={form.contactPhone} onChange={handleFormChange} placeholder="0987654321" required />
                    </label>

                    <div className="sell-form-actions">
                      <button type="submit" className={`btn btn-primary ${publishLoading ? 'loading' : ''}`} disabled={publishLoading}>{publishLoading ? 'Publicando...' : 'Publicar repuesto'}</button>
                      <button type="button" className="btn" onClick={() => setShowSellForm(false)} disabled={publishLoading}>Cancelar</button>
                    </div>
                    {publishSuccess && <div className="sell-form-success">Repuesto publicado correctamente.</div>}
                  </div>

                  <aside className="sell-form-preview">
                    <div className="preview-card">
                      <div className="preview-image">
                        <img src={form.img || 'https://loremflickr.com/640/420/motorcycle'} alt={form.title || 'Vista previa'} />
                        <div className="preview-price">${form.price || '0'}</div>
                      </div>
                      <div className="preview-body">
                        <h4>{form.title || 'Título del repuesto'}</h4>
                        <div className="preview-meta">{form.category ? <span className="chip">{form.category}</span> : <span className="chip">Hermoso</span>} <span className="muted">{form.location}</span> <span className="stars">{form.stars} <FaStar className="star-icon" /></span></div>
                        <p className="preview-desc">{form.description ? form.description.slice(0, 140) + (form.description.length > 140 ? '…' : '') : 'Aquí verás una vista previa antes de publicar.'}</p>
                        <div className="preview-contact">Teléfono: {form.contactPhone || '—'}</div>
                      </div>
                    </div>
                  </aside>

                </div>
              </form>
            </div>
          </div>
        )}

        <section className="featured-items">
          <div className="section-header">
            <h2><FaMapMarkerAlt className="section-icon" />Repuestos Recientes</h2>
          </div>

          <div className="carousel-wrapper">
            <button className="carousel-button left" aria-label="Anterior" onClick={() => scrollCarousel(listRef, -1)}>
              <FaChevronLeft />
            </button>

            <div className="item-cards-carousel" ref={listRef}>
              {recentParts.map((part) => (
                <article key={part.id} className="item-card" tabIndex={0} onClick={() => setSelectedPart(part)} onKeyDown={(e) => { if (e.key === 'Enter') setSelectedPart(part); }}>
                  <div className="card-image">
                    <img src={`${part.img}?${part.id}`} alt={part.title} />
                    <span className="card-price"><FaTag /> ${part.price}</span>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{part.title}</h3>
                    <div className="card-meta">
                      <span><FaMapMarkerAlt /> {part.location}</span>
                      <span className="muted">{part.category}</span>
                      <span className="stars">{part.stars || 0} <FaStar className="star-icon" /></span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Modal detalle del repuesto */}
            <RepuestosModal
              selectedPart={selectedPart}
              onClose={() => setSelectedPart(null)}
              showContactForm={showContactForm}
              setShowContactForm={setShowContactForm}
              contactForm={contactForm}
              handleContactChange={handleContactChange}
              handleContactSubmit={handleContactSubmit}
              contactSent={contactSent}
            />

            <button className="carousel-button right" aria-label="Siguiente" onClick={() => scrollCarousel(listRef, 1)}>
              <FaChevronRight />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Repuestos;
