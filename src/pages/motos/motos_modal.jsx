import React from 'react';
import { FaTag, FaMapMarkerAlt, FaStar, FaTimes, FaEnvelope } from 'react-icons/fa';
import '../../assets/scss/motos_modal.scss';

const MotosModal = ({ selectedMoto, onClose, showContactForm, setShowContactForm, contactForm, handleContactChange, handleContactSubmit, contactSent, hideHeaderContact = false, isOwner = false }) => {
  if (!selectedMoto) return null;

  return (
    <div className="moto-modal-overlay" onClick={(e) => { if (e.target.classList.contains('moto-modal-overlay')) onClose(); }}>
      <div className="moto-modal" role="dialog" aria-modal="true">
        <button className="modal-close" aria-label="Cerrar" onClick={onClose}><FaTimes /></button>
        <div className="modal-left">
          {(() => {
            const imgSrc = (selectedMoto.img && String(selectedMoto.img).startsWith('data:')) ? selectedMoto.img : `${selectedMoto.img}?${selectedMoto.id}`;
            return <img src={imgSrc} alt={selectedMoto.title} />;
          })()}
        </div>
        <div className="modal-right">
          <h2 className="modal-title">{selectedMoto.title}</h2>
          <div className="modal-meta">
            <span className="modal-price"><FaTag /> ${selectedMoto.price}</span>
            <span className="modal-location"><FaMapMarkerAlt /> {selectedMoto.location}</span>
            <span className="modal-stars">{selectedMoto.stars} <FaStar className="star-icon" /></span>
            {!hideHeaderContact && selectedMoto.contact && selectedMoto.contact.phone && (
              <span className="modal-contact-phone">☎ {selectedMoto.contact.phone}</span>
            )}
          </div>
          <div className="modal-desc">
            <p className="desc-lead">{`${selectedMoto.title} disponible en ${selectedMoto.location}. Precio: $${selectedMoto.price}. Valorada en ${selectedMoto.stars} estrellas por nuestro usuario.`}</p>

            <div className="modal-features">
              <span className="chip">Modelo: {selectedMoto.model || selectedMoto.title}</span>
              <span className="chip">Revisión: {selectedMoto.revision || '—'}</span>
              <span className="chip">Estado: {selectedMoto.condition || 'Desconocido'}</span>
              {/* Mostrar la chip de teléfono sólo si el encabezado NO la muestra (evita duplicado) */}
              {hideHeaderContact && (
                <span className="chip">Teléfono: {(selectedMoto.contact && selectedMoto.contact.phone) ? selectedMoto.contact.phone : 'consultar'}</span>
              )}
            </div>

            <ul className="modal-specs">
              <li><strong>Año:</strong> {selectedMoto.year || 'consultar'}</li>
              <li><strong>Kilometraje:</strong> {selectedMoto.kilometraje || 'consultar'}</li>
              <li><strong>Transmisión:</strong> {selectedMoto.transmission ? (selectedMoto.transmission === 'manual' ? 'Manual' : 'Automática') : 'consultar'}</li>
            </ul>

            <p className="desc-note">{selectedMoto.description || 'Excelente para trayectos urbanos y escapadas de fin de semana. Pregunta por mantenimiento y accesorios antes de comprar.'}</p>
          </div>

          {!showContactForm && (
            <div className="modal-actions">
              {!isOwner ? (
                <button className="btn btn-primary" onClick={() => { setShowContactForm(true); }}><FaEnvelope style={{ marginRight: 8 }} /> Contactar vendedor</button>
              ) : (
                <button className="btn btn-primary owner-note" disabled aria-disabled="true">No puedes escribir en tu publicación.</button>
              )}
            </div>
          )}

          {showContactForm && !isOwner && (
            <form className="modal-contact" onSubmit={handleContactSubmit}>
              <label>Mensaje<textarea name="message" value={contactForm.message} onChange={handleContactChange} rows={6} required /></label>
              <div className="modal-contact-actions">
                <button type="submit" className="btn btn-primary">Enviar mensaje</button>
                <button type="button" className="btn" onClick={() => setShowContactForm(false)}>Cancelar</button>
              </div>
              {contactSent && <div className="contact-sent">Mensaje enviado. El vendedor te responderá pronto.</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MotosModal;
