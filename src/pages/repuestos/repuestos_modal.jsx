import React from 'react';
import { FaTag, FaMapMarkerAlt, FaTimes, FaEnvelope, FaStar } from 'react-icons/fa';
import '../../assets/scss/motos_modal.scss';

const RepuestosModal = ({ selectedPart, onClose, showContactForm, setShowContactForm, contactForm, handleContactChange, handleContactSubmit, contactSent, hideHeaderContact = false }) => {
  if (!selectedPart) return null;

  return (
    // usar las mismas clases que el modal de motos para heredar estilos y centrado
    <div className="moto-modal-overlay" onClick={(e) => { if (e.target.classList && e.target.classList.contains('moto-modal-overlay')) onClose(); }}>
      <div className="moto-modal" role="dialog" aria-modal="true">
        <button className="modal-close" aria-label="Cerrar" onClick={onClose}><FaTimes /></button>
        <div className="modal-left">
          <img src={`${selectedPart.img}?${selectedPart.id}`} alt={selectedPart.title} />
        </div>
        <div className="modal-right">
          <h2 className="modal-title">{selectedPart.title}</h2>
          <div className="modal-meta">
            <span className="modal-price"><FaTag /> ${selectedPart.price}</span>
            <span className="modal-location"><FaMapMarkerAlt /> {selectedPart.location}</span>
            <span className="modal-category">{selectedPart.category || '—'}</span>
            <span className="modal-stars">{(selectedPart.stars || 0)} <FaStar className="star-icon" /></span>
            {/* mostrar teléfono en el header solo si no se pide ocultarlo (Dashboard) */}
            {!hideHeaderContact && selectedPart.contact && selectedPart.contact.phone && (
              <span className="modal-contact-phone">☎ {selectedPart.contact.phone}</span>
            )}
          </div>

          <div className="modal-desc">
            <p className="desc-lead">{`${selectedPart.title} disponible en ${selectedPart.location}. Precio: $${selectedPart.price}.`}</p>

            <div className="modal-features">
              <span className="chip">Categoría: {selectedPart.category || '—'}</span>
              <span className="chip">Condición: {selectedPart.condition || 'Consultar'}</span>
              <span className="chip">Teléfono: {(selectedPart.contact && selectedPart.contact.phone) ? selectedPart.contact.phone : 'consultar'}</span>
            </div>

            <p className="preview-desc" style={{ marginTop: 8 }}>{selectedPart.description || 'No hay descripción. Puedes preguntar al vendedor.'}</p>
          </div>

          {!showContactForm && (
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowContactForm(true)}><FaEnvelope style={{ marginRight: 8 }} /> Contactar vendedor</button>
            </div>
          )}

          {showContactForm && (
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

export default RepuestosModal;
