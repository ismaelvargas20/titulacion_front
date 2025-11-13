import React, { useEffect } from 'react';
import '../../assets/scss/dashboard.scss';

const Dashboard = () => {
  useEffect(() => {
    // Forzar estilo inline en botones .btn-view para que conserven el gradiente claro
    const apply = () => {
      document.querySelectorAll('.btn-view').forEach(el => {
        // Aplicar con prioridad important para sobreescribir reglas con !important en CSS
        el.style.setProperty('background', 'linear-gradient(90deg,#0b73ff,#4fb8ff)', 'important');
        el.style.setProperty('background-image', 'linear-gradient(90deg,#0b73ff,#4fb8ff)', 'important');
        el.style.setProperty('color', '#ffffff', 'important');
        el.style.setProperty('border', 'none', 'important');
        el.style.setProperty('box-shadow', '0 12px 30px rgba(11,115,255,0.16)', 'important');
        el.style.setProperty('padding', '6px 12px', 'important');
        el.style.setProperty('border-radius', '8px', 'important');
      });
    };

    // Apply immediately and also after a short delay (in case of late renders)
    apply();
    const t = setTimeout(apply, 120);
    return () => clearTimeout(t);
  }, []);
  
  return (
    <div className="dashboard">
      <main className="dashboard-main">
        <h1 className="dashboard-title">Panel de Administración</h1>
        <p className="dashboard-subtitle">Gestiona usuarios, anuncios y la comunidad de la plataforma</p>

        <section className="dashboard-summary">
          <div className="summary-card">
            <h2>Total Usuarios</h2>
            <span className="summary-icon"><i className="fas fa-users" aria-hidden="true"></i></span>
            <p>1,234</p>
          </div>
          <div className="summary-card">
            <h2>Motos Publicadas</h2>
            <span className="summary-icon"><i className="fas fa-motorcycle" aria-hidden="true"></i></span>
            <p>456</p>
          </div>
          <div className="summary-card">
            <h2>Repuestos Publicados</h2>
            <span className="summary-icon"><i className="fas fa-wrench" aria-hidden="true"></i></span>
            <p>789</p>
          </div>
          <div className="summary-card">
            <h2>Preguntas en el Foro</h2>
            <span className="summary-icon"><i className="fas fa-comments" aria-hidden="true"></i></span>
            <p>234</p>
          </div>
        </section>

        <section className="dashboard-actions">
          <button className="btn-manage">Gestionar Usuarios</button>
          <button className="btn-manage">Gestionar Motos</button>
          <button className="btn-manage">Gestionar Repuestos</button>
          <button className="btn-manage">Gestionar Foro</button>
        </section>

        <section className="dashboard-recent">
          <h2>Últimos Anuncios Publicados</h2>
          <table className="recent-table">
            <tbody>
              <tr>
                <td>
                  <div className="cell-content">
                    <div className="cell-icon"><i className="fas fa-bicycle" aria-hidden="true"></i></div>
                    <div className="cell-title">
                      <div className="title-text">Yamaha MT-09 2022</div>
                      <div className="meta"><span className="badge">Moto</span><span>Por Juan Pérez</span></div>
                    </div>
                  </div>
                </td>
                <td className="status-active"><div className="cell-content">Activo</div></td>
                <td>
                  <div className="cell-actions">
                    <button className="btn-view">Ver</button>
                    <button className="btn-reject">Eliminar</button>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <div className="cell-content">
                    <div className="cell-icon"><i className="fas fa-wrench" aria-hidden="true"></i></div>
                    <div className="cell-title">
                      <div className="title-text">Casco Integral AGV K3</div>
                      <div className="meta"><span className="badge">Repuesto</span><span>Por María García</span></div>
                    </div>
                  </div>
                </td>
                <td className="status-active"><div className="cell-content">Activo</div></td>
                <td>
                  <div className="cell-actions">
                    <button className="btn-view">Ver</button>
                    <button className="btn-reject">Eliminar</button>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <div className="cell-content">
                    <div className="cell-icon"><i className="fas fa-bicycle" aria-hidden="true"></i></div>
                    <div className="cell-title">
                      <div className="title-text">Honda CBR600RR</div>
                      <div className="meta"><span className="badge">Moto</span><span>Por Carlos López</span></div>
                    </div>
                  </div>
                </td>
                <td className="status-active"><div className="cell-content">Activo</div></td>
                <td>
                  <div className="cell-actions">
                    <button className="btn-view">Ver</button>
                    <button className="btn-reject">Eliminar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;