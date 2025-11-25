// src/api/axios.js
import axios from 'axios';

const instance = axios.create({
  // ¡IMPORTANTE! Cambia esta URL a la de tu backend en Railway
  baseURL: 'http://localhost:9000', 
  withCredentials: true, // MUY IMPORTANTE: Para que las cookies (incluyendo CSRF) se envíen
  // No fijar `Content-Type` por defecto: dejar que el navegador/axios lo determine.
  // Si se fija aquí a 'application/json' rompe el envío de FormData (boundary missing).
  headers: {}
});

// Interceptor de solicitudes para añadir el CSRF token a los encabezados
instance.interceptors.request.use(config => {
  // Solo añade el token si el método no es GET, HEAD u OPTIONS (métodos que no requieren CSRF)
  // y si hay un token CSRF disponible en localStorage
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method.toUpperCase())) {
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken; // Añade el token al encabezado
    }
    // Si el payload es FormData, no forzar Content-Type (dejar que el navegador ponga el boundary)
    if (config.data instanceof FormData) {
      // eliminar cualquier Content-Type existente para que el browser lo establezca
      if (config.headers && config.headers['Content-Type']) delete config.headers['Content-Type'];
    } else {
      // garantizar application/json para payloads normales
      if (!config.headers['Content-Type']) config.headers['Content-Type'] = 'application/json';
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default instance;
