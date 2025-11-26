import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/header/header';
import Footer from './components/footer/footer';
import Login from './pages/login/login';
import Registro from './pages/registro.jsx/registro';
import Inicio from './pages/inicio/inicio';
import Perfil from './pages/perfil/perfil';
import Publicaciones from './pages/publicaciones/publicaciones';
import Comunidad from './pages/comunidad/comunidad';
import Motos from './pages/motos/motos';
import Repuestos from './pages/repuestos/repuestos';
import Usuarios from './pages/usuarios/usuarios';
import Posteadas from './pages/posteadas/posteadas';
import Vender from './pages/vender/vender';
import Chat from './pages/vender/chat';
import Dashboard from './pages/dashboard/dashboard';
import Comentarios from './pages/comentarios/comentarios';

const AppContent = () => {
  const location = useLocation();
  const hideHeaderPaths = ['/login', '/registro'];
  const adminHeaderPaths = ['/dashboard', '/usuarios', '/posteadas', '/comentarios'];

  // Detectar si el usuario actualmente logueado actúa como administrador.
  // En esta app 'usuario' representa cuentas administrativas y 'cliente' los clientes.
  let cur = null;
  let isAdminUser = false;
  try {
    cur = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    if (cur) {
      const rolRaw = (cur.rol || cur.role || '').toString().toLowerCase();
      isAdminUser = !!(
        cur.isAdmin || cur.is_admin ||
        rolRaw.includes('admin') || rolRaw.includes('usuario') || rolRaw.includes('usuarios')
      );
    }
  } catch (e) { /* ignorar errores de parseo */ }

  const shouldShowHeader = !hideHeaderPaths.includes(location.pathname);
  // Mostrar header admin cuando la ruta es de admin o cuando el usuario autenticado
  // es admin y está visualizando su perfil (/perfil).
  const isAdminHeader = adminHeaderPaths.includes(location.pathname) || (isAdminUser && location.pathname === '/perfil');

  return (
    <>
      {shouldShowHeader && <Header adminMode={isAdminHeader} />}
      <main className="app-main">
        <Routes>
          {/* Ruta explícita para /inicio */}
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/" element={
            // si hay usuario en sessionStorage redirigimos a /inicio; si no, redirigimos a /login
            (function(){
              try {
                const cur = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
                if (cur && (cur.id || cur.email)) return <Navigate to="/inicio" replace />;
              } catch (e) { /* ignore parse error */ }
              return <Navigate to="/login" replace />;
            })()
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/motos" element={<Motos />} />
          <Route path="/repuestos" element={<Repuestos />} />
          <Route path="/posteadas" element={<Posteadas />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/comunidad" element={<Comunidad />} />
          <Route path="/vender" element={<Vender />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/comentarios" element={<Comentarios />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/publicaciones" element={<Publicaciones />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      {/* Mostrar footer en páginas públicas/cliente: no mostrar en login/registro ni en rutas admin */}
      {shouldShowHeader && !isAdminHeader && <Footer />}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
