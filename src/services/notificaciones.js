import api from '../api/axios';

export async function listarNotificaciones(params = {}) {
  try {
    const res = await api.get('/notificaciones/listar', { params });
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function crearNotificacion(payload) {
  try {
    const res = await api.post('/notificaciones/crear', payload);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function marcarLeida(id) {
  try {
    const res = await api.put(`/notificaciones/${encodeURIComponent(id)}/leer`);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function marcarEliminada(id) {
  try {
    const res = await api.put(`/notificaciones/${encodeURIComponent(id)}/eliminar`);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export default { listarNotificaciones, crearNotificacion, marcarLeida, marcarEliminada };
