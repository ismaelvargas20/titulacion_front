import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

export default function Chat({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="sell-modal-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target.classList && e.target.classList.contains('sell-modal-overlay')) onClose(); }}>
      <div className="sell-modal" role="document" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Cerrar" onClick={onClose}><FaTimes /></button>
        <div style={{ padding: 12 }}>
          <h3>Mis bandejas</h3>
          <p style={{ marginTop: 6 }}>Aquí verás tus conversaciones de compra y mensajes relacionados. (Mock de ejemplo)</p>
          <div style={{ marginTop: 12 }}>
            <div style={{ padding: 12, borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', marginBottom: 8 }}>Chat con Comprador #1 — <strong>Interesado en tu anuncio</strong></div>
            <div style={{ padding: 12, borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', marginBottom: 8 }}>Chat con Comprador #2 — <strong>Consulta por disponibilidad</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
