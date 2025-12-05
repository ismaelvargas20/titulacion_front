import api from '../api/axios';

export async function reportMessage(chatId, mensajeId, body) {
  try {
    // Asegurar que el body use la clave 'motivo' en lugar de 'reason'
    const payload = { chatId, mensajeId, ...body };
    const res = await api.post('/reports', payload);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function listReports(params = {}) {
  try {
    const res = await api.get('/reports/listar', { params });
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function getReport(id) {
  try {
    const res = await api.get(`/reports/detalle/${id}`);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function updateReport(id, body) {
  try {
    const res = await api.put(`/reports/actualizar/${id}`, body);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export default {
  reportMessage,
  listReports,
  getReport,
  updateReport,
};
