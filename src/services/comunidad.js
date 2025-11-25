import api from '../api/axios';
import { fetchCsrfToken } from './clientes';

// Servicios para interactuar con el backend de hilos (/hilos)
export async function listarHilos(params = {}) {
  try {
    const res = await api.get('/hilos/listar', { params });
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function crearHilo(payload) {
  try {
    if (!localStorage.getItem('csrfToken')) await fetchCsrfToken();
    // payload puede ser objeto simple o contener image como dataURL
    const res = await api.post('/hilos/crear', payload);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function detalleHilo(id) {
  try {
    const res = await api.get(`/hilos/detalle/${encodeURIComponent(id)}`);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function crearRespuesta(hiloId, payload) {
  try {
    if (!localStorage.getItem('csrfToken')) await fetchCsrfToken();
    const res = await api.post(`/hilos/detalle/${encodeURIComponent(hiloId)}/responder`, payload);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function actualizarRespuesta(respuestaId, payload) {
  try {
    if (!localStorage.getItem('csrfToken')) await fetchCsrfToken();
    const res = await api.put(`/hilos/respuesta/${encodeURIComponent(respuestaId)}`, payload);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function eliminarRespuesta(respuestaId) {
  try {
    if (!localStorage.getItem('csrfToken')) await fetchCsrfToken();
    const res = await api.delete(`/hilos/respuesta/${encodeURIComponent(respuestaId)}`);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function actualizarHilo(hiloId, payload) {
  try {
    if (!localStorage.getItem('csrfToken')) await fetchCsrfToken();
    const res = await api.put(`/hilos/${encodeURIComponent(hiloId)}`, payload);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function eliminarHilo(hiloId) {
  try {
    if (!localStorage.getItem('csrfToken')) await fetchCsrfToken();
    const res = await api.delete(`/hilos/${encodeURIComponent(hiloId)}`);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export default {
  listarHilos,
  crearHilo,
  detalleHilo,
  crearRespuesta
  , actualizarRespuesta,
  eliminarRespuesta
  , actualizarHilo
  , eliminarHilo
};
