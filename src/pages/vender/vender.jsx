import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTag, FaMotorcycle, FaTools, FaEnvelope, FaTimes } from 'react-icons/fa';
import '../../assets/scss/vender.scss';

export default function Vender() {
  const navigate = useNavigate();

  // Modal states
  const [showMotoForm, setShowMotoForm] = useState(false);
  const [showPartForm, setShowPartForm] = useState(false);
  // messages are now a dedicated page (/chat)
  // Form states (complete version mirroring Motos/Repuestos)
  const [motoForm, setMotoForm] = useState({ title: '', model: '', revision: 'Al día', condition: 'Excelente', price: '', location: '', stars: 5, img: '', description: '', contactPhone: '', kilometraje: '', year: '', transmission: 'manual' });
  const [partForm, setPartForm] = useState({ title: '', category: '', condition: 'Nuevo', price: '', location: '', img: '', description: '', contactPhone: '' });
  const [motoPreview, setMotoPreview] = useState(null);
  const [partPreview, setPartPreview] = useState(null);
  const [publishLoadingMoto, setPublishLoadingMoto] = useState(false);
  const [publishSuccessMoto, setPublishSuccessMoto] = useState(false);
  const [publishLoadingPart, setPublishLoadingPart] = useState(false);
  const [publishSuccessPart, setPublishSuccessPart] = useState(false);

  useEffect(() => {
    return () => {
      if (motoPreview) URL.revokeObjectURL(motoPreview);
      if (partPreview) URL.revokeObjectURL(partPreview);
    };
  }, [motoPreview, partPreview]);

  const handleMotoChange = (e) => {
    const { name, value } = e.target;
    setMotoForm((s) => ({ ...s, [name]: value }));
  };

  const handlePartChange = (e) => {
    const { name, value } = e.target;
    setPartForm((s) => ({ ...s, [name]: value }));
  };

  // Use FileReader like other pages so we store data-URLs (consistent preview & serialization)
  const handleMotoImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return setMotoPreview(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      setMotoPreview(data);
      setMotoForm((s) => ({ ...s, img: data }));
    };
    reader.readAsDataURL(file);
  };

  const handlePartImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return setPartPreview(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      setPartPreview(data);
      setPartForm((s) => ({ ...s, img: data }));
    };
    reader.readAsDataURL(file);
  };

  const submitMoto = (e) => {
    e.preventDefault();
    setPublishLoadingMoto(true);
    setTimeout(() => {
      setPublishLoadingMoto(false);
      setPublishSuccessMoto(true);
      setTimeout(() => setPublishSuccessMoto(false), 1800);
      setShowMotoForm(false);
      setMotoForm({ title: '', model: '', revision: 'Al día', condition: 'Excelente', price: '', location: '', stars: 5, img: '', description: '', contactPhone: '', kilometraje: '', year: '', transmission: 'manual' });
      setMotoPreview(null);
    }, 1000);
  };

  const submitPart = (e) => {
    e.preventDefault();
    setPublishLoadingPart(true);
    setTimeout(() => {
      setPublishLoadingPart(false);
      setPublishSuccessPart(true);
      setTimeout(() => setPublishSuccessPart(false), 1800);
      setShowPartForm(false);
      setPartForm({ title: '', category: '', condition: 'Nuevo', price: '', location: '', img: '', description: '', contactPhone: '' });
      setPartPreview(null);
    }, 900);
  };

  return (
    <div className="vender-page">
      <main className="vender-main">
        {/* Mover el hero dentro del contenedor principal para que su ancho coincida con motos */}
        <section className="sell-hero" role="region" aria-label="Actividades de compra">
          <div className="sell-hero-inner">
            <div className="sell-hero-text">
              <h1>Actividades de compra</h1>
              <p>Aquí puedes consultar tus mensajes de compra, ver la actividad relacionada y publicar tus ventas cuando quieras.</p>
            </div>

            <div className="sell-hero-cta">
              <button type="button" className="hero-sell-btn" onClick={() => navigate('/')}>Ir a inicio</button>
            </div>
          </div>
        </section>
        <div className="section-header">
          <h2><FaTag className="section-icon" /> Tus actividades</h2>
        </div>

        <div className="cards-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div className="activity-card" role="button" onClick={() => setShowMotoForm(true)} style={{ padding: 18, borderRadius: 12, background: 'var(--card-bg, #fff)', boxShadow: '0 8px 26px rgba(2,6,23,0.06)', cursor: 'pointer' }}>
            <h3><FaMotorcycle /> Vender Motos</h3>
            <p>Publica tu motocicleta con fotos, precio y descripción. Haz click para abrir el formulario.</p>
          </div>

          <div className="activity-card" role="button" onClick={() => setShowPartForm(true)} style={{ padding: 18, borderRadius: 12, background: 'var(--card-bg, #fff)', boxShadow: '0 8px 26px rgba(2,6,23,0.06)', cursor: 'pointer' }}>
            <h3><FaTools /> Vender Repuestos</h3>
            <p>Publica repuestos y accesorios: cascos, llantas, escape, etc. Haz click para abrir el formulario.</p>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div className="activity-card large" role="button" onClick={() => navigate('/chat')} style={{ padding: 22, borderRadius: 12, background: 'var(--card-bg, #fff)', boxShadow: '0 10px 30px rgba(2,6,23,0.06)', cursor: 'pointer' }}>
            <div className="inbox-dot" aria-hidden="true" />
            <h3><FaEnvelope /> Mis bandejas de entrada</h3>
            <p>Accede a tus mensajes de compra y notificaciones. Haz click para abrir la bandeja.</p>
          </div>
        </div>
      </main>

      {/* Moto publish modal (full form like in Motos) */}
      {showMotoForm && (
        <div className="sell-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowMotoForm(false)}>
          <div className="sell-modal" role="document" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Cerrar" onClick={() => setShowMotoForm(false)}>×</button>
            <form className={`sell-form`} onSubmit={submitMoto}>
              <div className="sell-form-grid">
                <div className="sell-form-main">
                  <label>
                    Título
                    <input name="title" value={motoForm.title} onChange={handleMotoChange} placeholder="Ej: Yamaha MT-09 2022" required />
                  </label>

                  <label>
                    Modelo
                    <input name="model" value={motoForm.model} onChange={handleMotoChange} placeholder="Ej: MT-09" />
                  </label>

                  <label>
                    Revisión vehicular
                    <select name="revision" value={motoForm.revision} onChange={handleMotoChange}>
                      <option>Al día</option>
                      <option>Atrasado</option>
                    </select>
                  </label>

                  <label>
                    Estado
                    <select name="condition" value={motoForm.condition} onChange={handleMotoChange}>
                      <option>Excelente</option>
                      <option>Muy bueno</option>
                      <option>Bueno</option>
                      <option>Regular</option>
                    </select>
                  </label>

                  <label>
                    Precio
                    <input name="price" value={motoForm.price} onChange={handleMotoChange} placeholder="Ej: 9500" required />
                  </label>

                  <label>
                    Ubicación
                    <input name="location" value={motoForm.location} onChange={handleMotoChange} placeholder="Ciudad" />
                  </label>

                  <label>
                    Valora tu motocicleta
                    <select name="stars" value={motoForm.stars} onChange={handleMotoChange}>
                      <option value={5}>5 - Excelente</option>
                      <option value={4}>4 - Muy bueno</option>
                      <option value={3}>3 - Bueno</option>
                      <option value={2}>2 - Regular</option>
                      <option value={1}>1 - Malo</option>
                    </select>
                  </label>

                  <label className="full">
                    Descripción
                    <textarea name="description" value={motoForm.description} onChange={handleMotoChange} placeholder="Describe el estado, accesorios, y cualquier detalle relevante" rows={4} />
                  </label>

                  <label>
                    Imagen
                    <input type="file" accept="image/*" onChange={handleMotoImage} />
                  </label>

                  <label>
                    Kilometraje
                    <input name="kilometraje" value={motoForm.kilometraje} onChange={handleMotoChange} placeholder="Ej: 12000 km" />
                  </label>

                  <label>
                    Año
                    <input name="year" value={motoForm.year} onChange={handleMotoChange} placeholder="Ej: 2019" />
                  </label>

                  <label>
                    Transmisión
                    <select name="transmission" value={motoForm.transmission} onChange={handleMotoChange}>
                      <option value="manual">Manual</option>
                      <option value="automatic">Automática</option>
                    </select>
                  </label>

                  <label>
                    Teléfono de contacto
                    <input name="contactPhone" type="tel" value={motoForm.contactPhone} onChange={handleMotoChange} placeholder="0987654321" required />
                  </label>

                  <div className="sell-form-actions">
                    <button type="submit" className={`btn btn-primary ${publishLoadingMoto ? 'loading' : ''}`} disabled={publishLoadingMoto}>
                      {publishLoadingMoto ? 'Publicando...' : 'Publicar moto'}
                    </button>
                    <button type="button" className="btn" onClick={() => setShowMotoForm(false)} disabled={publishLoadingMoto}>Cancelar</button>
                  </div>
                  {publishSuccessMoto && <div className="sell-form-success">Anuncio publicado correctamente.</div>}
                </div>

                <aside className="sell-form-preview">
                  <div className="preview-card">
                    <div className="preview-image">
                      <img src={motoForm.img || 'https://loremflickr.com/640/420/motorcycle'} alt={motoForm.title || 'Vista previa'} />
                      <div className="preview-price">${motoForm.price || '0'}</div>
                    </div>
                    <div className="preview-body">
                      <h4>{motoForm.title || 'Título de la moto'}</h4>
                      <div className="preview-meta">{motoForm.model ? <span className="chip">{motoForm.model}</span> : null} <span className="muted">{motoForm.location}</span></div>
                      <p className="preview-desc">{motoForm.description ? motoForm.description.slice(0, 140) + (motoForm.description.length > 140 ? '…' : '') : 'Aquí verás una vista previa de tu anuncio antes de publicar.'}</p>
                      <div className="preview-meta small">{motoForm.year ? <span>{motoForm.year}</span> : null} {motoForm.kilometraje ? <span>• {motoForm.kilometraje}</span> : null} {motoForm.transmission ? <span>• {motoForm.transmission === 'manual' ? 'Manual' : 'Automática'}</span> : null}</div>
                      <div className="preview-contact">Teléfono: {motoForm.contactPhone || '—'}</div>
                    </div>
                  </div>
                </aside>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Part publish modal */}
      {showPartForm && (
        <div className="sell-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowPartForm(false)}>
          <div className="sell-modal" role="document" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Cerrar" onClick={() => setShowPartForm(false)}><FaTimes /></button>
            <form className="sell-form" onSubmit={submitPart}>
              <div className="sell-form-grid">
                <div className="sell-form-main">
                  <label>
                    Título
                    <input name="title" value={partForm.title} onChange={handlePartChange} placeholder="Ej: Casco Integral AGV" required />
                  </label>

                  <label>
                    Categoría
                    <select name="category" value={partForm.category} onChange={handlePartChange}>
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
                    <select name="condition" value={partForm.condition} onChange={handlePartChange}>
                      <option>Nuevo</option>
                      <option>Usado - Bueno</option>
                      <option>Usado - Regular</option>
                    </select>
                  </label>

                  <label>
                    Precio
                    <input name="price" value={partForm.price} onChange={handlePartChange} placeholder="Ej: 120" required />
                  </label>

                  <label>
                    Ubicación
                    <input name="location" value={partForm.location} onChange={handlePartChange} placeholder="Ciudad" />
                  </label>

                  <label className="full">
                    Descripción
                    <textarea name="description" value={partForm.description} onChange={handlePartChange} rows={4} placeholder="Detalles del repuesto" />
                  </label>

                  <label>
                    Imagen
                    <input type="file" accept="image/*" name="image" onChange={handlePartImage} />
                  </label>

                  <label>
                    Teléfono de contacto
                    <input name="contactPhone" value={partForm.contactPhone} onChange={handlePartChange} placeholder="0987654321" required />
                  </label>

                  <div className="sell-form-actions">
                    <button type="submit" className={`btn btn-primary ${publishLoadingPart ? 'loading' : ''}`} disabled={publishLoadingPart}>{publishLoadingPart ? 'Publicando...' : 'Publicar repuesto'}</button>
                    <button type="button" className="btn" onClick={() => setShowPartForm(false)} disabled={publishLoadingPart}>Cancelar</button>
                  </div>
                  {publishSuccessPart && <div className="sell-form-success">Repuesto publicado correctamente.</div>}
                </div>
                <aside className="sell-form-preview">
                  <div className="preview-card">
                    <div className="preview-image">
                      <img src={partForm.img || 'https://loremflickr.com/640/420/motorcycle'} alt={partForm.title || 'Vista previa'} />
                      <div className="preview-price">${partForm.price || '0'}</div>
                    </div>
                    <div className="preview-body">
                      <h4>{partForm.title || 'Título del repuesto'}</h4>
                      <p className="preview-desc">{partForm.description ? partForm.description.slice(0, 140) : 'Aquí verás una vista previa antes de publicar.'}</p>
                      <div className="preview-contact">Teléfono: {partForm.contactPhone || '—'}</div>
                    </div>
                  </div>
                </aside>
              </div>
            </form>
          </div>
        </div>
      )}

  {/* Messages are now handled via the /chat page */}

    </div>
  );
}
