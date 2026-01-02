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

// Interceptor de respuestas: si recibimos 403 por CSRF, obtenemos un token nuevo y reintentamos una vez
instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error && error.config;
    const status = error && error.response && error.response.status;
    const msg = error && error.response && error.response.data && (error.response.data.message || '').toString().toLowerCase();

    if (originalRequest && status === 403 && msg.includes('csrf')) {
      // Evitar bucles infinitos
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const tokenRes = await instance.get('/csrf-token');
          if (tokenRes && tokenRes.data && tokenRes.data.csrfToken) {
            localStorage.setItem('csrfToken', tokenRes.data.csrfToken);
          } else {
            localStorage.removeItem('csrfToken');
          }
          return instance(originalRequest);
        } catch (e) {
          return Promise.reject(error);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
