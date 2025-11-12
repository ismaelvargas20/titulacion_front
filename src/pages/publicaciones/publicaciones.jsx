import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/scss/publicaciones.scss';
import { FaEdit, FaTimes } from 'react-icons/fa';

export default function Publicaciones() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([
    { id: 1, type: 'moto', title: 'Yamaha MT-09 2020', price: 9500, stars: 5, status: 'Activa', img: 'https://loremflickr.com/320/200/motorcycle' },
    { id: 2, type: 'repuesto', title: 'Casco Integral AGV', price: 120, stars: 4, status: 'Activa', img: 'https://loremflickr.com/320/200/helmet' }
  ]);

  const removePost = (id) => {
    if (window.confirm('Eliminar esta publicación?')) setPosts((p) => p.filter(x => x.id !== id));
  };

  return (
    <div className="publicaciones-page">
      <main className="publicaciones-main">
        <section className="publicaciones-hero" aria-label="Tus publicaciones">
          <div className="publicaciones-hero-inner">
            <div className="publicaciones-hero-text">
              <h1>Mis publicaciones</h1>
              <p>Aquí puedes ver las publicaciones que hayas subido: motocicletas o repuestos. Desde esta sección puedes editar o eliminar tus anuncios.</p>
            </div>
            <div className="publicaciones-hero-cta">
              <button type="button" className="hero-sell-btn" onClick={() => navigate('/')}>Ir a inicio</button>
            </div>
          </div>
        </section>

        <div className="section-header">
          <h2>Mis publicaciones</h2>
        </div>

        <div className="posts-grid">
          {posts.length === 0 && <p className="muted">No tienes publicaciones todavía.</p>}
          {posts.map((p) => (
            <div key={p.id} className="post-card">
              <img src={p.img} alt={p.title} className="post-image" />
              <div className="post-body">
                <strong className="post-title">{p.title}</strong>
                <div className="post-meta muted">{p.type === 'moto' ? 'Moto' : 'Repuesto'} • ${p.price} • {p.stars} ⭐</div>
              </div>
              <div className="post-actions">
                <button className="btn" onClick={() => {
                    if (p.type === 'moto') {
                      // Navegar a la página de Motos y solicitar que abra el formulario de edición
                      navigate('/motos', { state: { editMoto: p } });
                    } else {
                      // Navegar a la página de Repuestos y solicitar que abra el formulario de edición
                      navigate('/repuestos', { state: { editPart: p } });
                    }
                  }}>
                  <FaEdit /> Editar
                </button>
                <button className="btn btn-danger" onClick={() => removePost(p.id)}><FaTimes /> Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
