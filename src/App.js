import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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

const AppContent = () => {
  const location = useLocation();
  const hideHeaderPaths = ['/login', '/registro'];
  const adminHeaderPaths = ['/dashboard', '/usuarios', '/publicaciones', '/posteadas', '/comunidad'];

  const shouldShowHeader = !hideHeaderPaths.includes(location.pathname);
  const isAdminHeader = adminHeaderPaths.includes(location.pathname);

  return (
    <>
      {shouldShowHeader && <Header adminMode={isAdminHeader} />}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/motos" element={<Motos />} />
          <Route path="/repuestos" element={<Repuestos />} />
          <Route path="/posteadas" element={<Posteadas />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/comunidad" element={<Comunidad />} />
          <Route path="/vender" element={<Vender />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/publicaciones" element={<Publicaciones />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
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
