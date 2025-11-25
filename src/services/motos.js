import api from '../api/axios';
import { fetchCsrfToken } from './clientes';

// Servicios para interactuar con el endpoint /publicaciones
// Funciones: crearPublicacion, listarPublicaciones, detallePublicacion, actualizarPublicacion, eliminarPublicacion

export async function crearPublicacion(payload) {
  try {
    // Asegurar token CSRF si el backend lo requiere
    if (!localStorage.getItem('csrfToken')) {
      await fetchCsrfToken();
    }
    // Si el payload es FormData, dejar que axios gestione el Content-Type (multipart/form-data)
    let res;
    if (payload instanceof FormData) {
      res = await api.post('/publicaciones/crear', payload);
    } else {
      res = await api.post('/publicaciones/crear', payload);
    }
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function listarPublicaciones(params = {}) {
  try {
    // params puede incluir: tipo, limit, offset, includeDetails
    const res = await api.get('/publicaciones/listar', { params });
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function detallePublicacion(id) {
  try {
    const res = await api.get(`/publicaciones/detalle/${encodeURIComponent(id)}`);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function actualizarPublicacion(id, payload) {
  try {
    if (!localStorage.getItem('csrfToken')) {
      await fetchCsrfToken();
    }
    const res = await api.put(`/publicaciones/actualizar/${encodeURIComponent(id)}`, payload);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function eliminarPublicacion(id) {
  try {
    if (!localStorage.getItem('csrfToken')) {
      await fetchCsrfToken();
    }
    const res = await api.delete(`/publicaciones/eliminar/${encodeURIComponent(id)}`);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export default {
  crearPublicacion,
  listarPublicaciones,
  detallePublicacion,
  actualizarPublicacion,
  eliminarPublicacion
};
