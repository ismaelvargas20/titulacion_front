import React, { useRef, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaTag, FaMapMarkerAlt, FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../assets/scss/motos.scss';
import MotosModal from './motos_modal';

const Motos = () => {
  const initialMotos = [
    { id: 1, title: 'Yamaha MT-09 2022', price: '9,500', location: 'Quito', stars: 5, img: 'https://loremflickr.com/640/420/motorcycle,yamaha' },
    { id: 2, title: 'Honda CBR600RR', price: '8,200', location: 'Guayaquil', stars: 4, img: 'https://loremflickr.com/640/420/motorcycle,honda' },
    { id: 3, title: 'Suzuki V-Strom 650', price: '7,800', location: 'Cuenca', stars: 5, img: 'https://loremflickr.com/640/420/motorcycle,suzuki' },
    { id: 4, title: 'Royal Enfield Classic 350', price: '4,500', location: 'Quito', stars: 4, img: 'https://loremflickr.com/640/420/motorcycle,classic' },
    { id: 5, title: 'Kawasaki Z900', price: '10,100', location: 'Manta', stars: 5, img: 'https://loremflickr.com/640/420/motorcycle,kawasaki' },
    { id: 6, title: 'Ducati Scrambler', price: '11,000', location: 'Guayaquil', stars: 5, img: 'https://loremflickr.com/640/420/motorcycle,ducati' },
  ];
  const [recentMotos, setRecentMotos] = useState(initialMotos);

  const listRef = useRef(null);
  const [showSellForm, setShowSellForm] = useState(false);
  const [form, setForm] = useState({ title: '', model: '', revision: 'Al día', condition: 'Excelente', price: '', location: '', stars: 5, img: '', description: '', contactPhone: '', kilometraje: '', year: '', transmission: 'manual' });
  const formRef = useRef(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [selectedMoto, setSelectedMoto] = useState(null);
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
    reader.onload = (ev) => {
      setForm((s) => ({ ...s, img: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddMoto = (e) => {
    e.preventDefault();
    // validation: required fields
    if (!form.title.trim() || !form.price.trim() || !form.contactPhone.trim()) {
      alert('Por favor completa título, precio y teléfono de contacto.');
      return;
    }

    const newMoto = {
      id: Date.now(),
      title: form.title,
      model: form.model,
      revision: form.revision,
      condition: form.condition,
      price: form.price,
      location: form.location || 'Sin especificar',
      stars: Number(form.stars) || 0,
      img: form.img || 'https://loremflickr.com/640/420/motorcycle',
      description: form.description || '',
      contact: { phone: form.contactPhone },
      kilometraje: form.kilometraje || '',
      year: form.year || '',
      transmission: form.transmission || 'manual',
    };

    setPublishLoading(true);
    // simulate server request
    setTimeout(() => {
      setRecentMotos((prev) => [newMoto, ...prev]);
      setPublishLoading(false);
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 2200);
  setForm({ title: '', model: '', revision: 'Al día', condition: 'Excelente', price: '', location: '', stars: 5, img: '', description: '', contactPhone: '', kilometraje: '', year: '', transmission: 'manual' });
      setShowSellForm(false);
    }, 1100);
  };

  useEffect(() => {
    if (showSellForm && formRef.current) {
      setTimeout(() => formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }, [showSellForm]);

  // cerrar modal con Escape y bloquear scroll cuando esté abierto
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedMoto(null);
    };
    if (selectedMoto) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [selectedMoto]);

  const scrollCarousel = (ref, dir = 1) => {
    if (!ref || !ref.current) return;
    const container = ref.current;
    const card = container.querySelector('.item-card');
    const style = window.getComputedStyle(container);
    const gap = parseInt(style.gap) || 24;
    const cardWidth = card ? card.clientWidth : 300;
    const scrollAmount = Math.round((cardWidth + gap) * 2); // desplazar 2 tarjetas
    container.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((s) => ({ ...s, [name]: value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // validación mínima: solo mensaje requerido ahora
    if (!contactForm.message) return;
    // simular envío
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setShowContactForm(false);
      setContactForm({ name: '', email: '', message: '' });
      // podríamos cerrar el modal o dejarlo abierto
    }, 1600);
  };

  return (
    <div className="motos-page">
      <main className="motos-main">
        <section className="sell-hero" role="region" aria-label="Vender motocicleta">
          <div className="sell-hero-inner">
            <div className="sell-hero-text">
              <h1>¿Quieres vender tu motocicleta?</h1>
              <p>Publica tu anuncio en segundos y llega a miles de compradores. Fácil, rápido y seguro.</p>
            </div>
            <div className="sell-hero-cta">
              {/* mantenemos la misma apariencia; convertimos a botón para abrir el formulario */}
              <button type="button" className="btn btn-primary" onClick={() => setShowSellForm((s) => !s)}>
                {showSellForm ? 'Cerrar' : 'Vender ahora'}
              </button>
            </div>
          </div>
        </section>
        {/* Modal de detalle de moto (componente separado) */}
        <MotosModal
          selectedMoto={selectedMoto}
          onClose={() => setSelectedMoto(null)}
          showContactForm={showContactForm}
          setShowContactForm={setShowContactForm}
          contactForm={contactForm}
          handleContactChange={handleContactChange}
          handleContactSubmit={handleContactSubmit}
          contactSent={contactSent}
        />
        {/* Formulario embebido: aparece al hacer click en el botón de arriba */}
        <div ref={formRef} className={`sell-form-panel ${showSellForm ? 'open' : ''}`} aria-hidden={!showSellForm}>
          <form className={`sell-form ${showSellForm ? 'fade-slide' : ''}`} onSubmit={handleAddMoto}>
            <div className="sell-form-grid">
              <div className="sell-form-main">
                <label>
                  Título
                  <input name="title" value={form.title} onChange={handleFormChange} placeholder="Ej: Yamaha MT-09 2022" required />
                </label>

                <label>
                  Modelo
                  <input name="model" value={form.model} onChange={handleFormChange} placeholder="Ej: MT-09" />
                </label>

                <label>
                  Revisión vehicular
                  <select name="revision" value={form.revision} onChange={handleFormChange}>
                    <option>Al día</option>
                    <option>Atrasado</option>
                  </select>
                </label>

                <label>
                  Estado
                  <select name="condition" value={form.condition} onChange={handleFormChange}>
                    <option>Excelente</option>
                    <option>Muy bueno</option>
                    <option>Bueno</option>
                    <option>Regular</option>
                  </select>
                </label>

                <label>
                  Precio
                  <input name="price" value={form.price} onChange={handleFormChange} placeholder="Ej: 9500" required />
                </label>

                <label>
                  Ubicación
                  <input name="location" value={form.location} onChange={handleFormChange} placeholder="Ciudad" />
                </label>

                <label>
                  Valora tu motocicleta
                  <select name="stars" value={form.stars} onChange={handleFormChange}>
                    <option value={5}>5 - Excelente</option>
                    <option value={4}>4 - Muy bueno</option>
                    <option value={3}>3 - Bueno</option>
                    <option value={2}>2 - Regular</option>
                    <option value={1}>1 - Malo</option>
                  </select>
                </label>

                <label className="full">
                  Descripción
                  <textarea name="description" value={form.description} onChange={handleFormChange} placeholder="Describe el estado, accesorios, y cualquier detalle relevante" rows={4} />
                </label>

                <label>
                  Imagen
                  <input type="file" accept="image/*" name="image" onChange={handleImageChange} />
                </label>

                <label>
                  Kilometraje
                  <input name="kilometraje" value={form.kilometraje} onChange={handleFormChange} placeholder="Ej: 12000 km" />
                </label>

                <label>
                  Año
                  <input name="year" value={form.year} onChange={handleFormChange} placeholder="Ej: 2019" />
                </label>

                <label>
                  Transmisión
                  <select name="transmission" value={form.transmission} onChange={handleFormChange}>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automática</option>
                  </select>
                </label>

                <label>
                  Teléfono de contacto
                  <input name="contactPhone" type="tel" value={form.contactPhone} onChange={handleFormChange} placeholder="0987654321" required />
                </label>

                <div className="sell-form-actions">
                  <button type="submit" className={`btn btn-primary ${publishLoading ? 'loading' : ''}`} disabled={publishLoading}>
                    {publishLoading ? 'Publicando...' : 'Publicar moto'}
                  </button>
                  <button type="button" className="btn" onClick={() => setShowSellForm(false)} disabled={publishLoading}>Cancelar</button>
                </div>
                {publishSuccess && <div className="sell-form-success">Anuncio publicado correctamente.</div>}
              </div>

              <aside className="sell-form-preview">
                <div className="preview-card">
                  <div className="preview-image">
                    <img src={form.img || 'https://loremflickr.com/640/420/motorcycle'} alt={form.title || 'Vista previa'} />
                    <div className="preview-price">${form.price || '0'}</div>
                  </div>
                  <div className="preview-body">
                    <h4>{form.title || 'Título de la moto'}</h4>
                    <div className="preview-meta">{form.model ? <span className="chip">{form.model}</span> : null} <span className="muted">{form.location}</span></div>
                    <p className="preview-desc">{form.description ? form.description.slice(0, 140) + (form.description.length > 140 ? '…' : '') : 'Aquí verás una vista previa de tu anuncio antes de publicar.'}</p>
                    <div className="preview-meta small">{form.year ? <span>{form.year}</span> : null} {form.kilometraje ? <span>• {form.kilometraje}</span> : null} {form.transmission ? <span>• {form.transmission === 'manual' ? 'Manual' : 'Automática'}</span> : null}</div>
                    <div className="preview-contact">Teléfono: {form.contactPhone || '—'}</div>
                  </div>
                </div>
              </aside>

            </div>
          </form>
        </div>
        <section className="featured-items">
          <div className="section-header">
            <h2><FaMapMarkerAlt className="section-icon" />Motos Recién Publicadas</h2>
          </div>

          <div className="carousel-wrapper">
            <button className="carousel-button left" aria-label="Anterior" onClick={() => scrollCarousel(listRef, -1)}>
              <FaChevronLeft />
            </button>

            <div className="item-cards-carousel" ref={listRef}>
              {recentMotos.map((moto) => (
                <article key={moto.id} className="item-card" tabIndex={0} onClick={() => setSelectedMoto(moto)} onKeyDown={(e) => { if (e.key === 'Enter') setSelectedMoto(moto); }}>
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

            <button className="carousel-button right" aria-label="Siguiente" onClick={() => scrollCarousel(listRef, 1)}>
              <FaChevronRight />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Motos;
