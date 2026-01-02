import api from '../api/axios';

// Obtener token CSRF y guardarlo en localStorage (si el backend lo expone)
export async function fetchCsrfToken() {
  try {
    const res = await api.get('/csrf-token');
    if (res && res.data && res.data.csrfToken) {
      localStorage.setItem('csrfToken', res.data.csrfToken);
      return res.data.csrfToken;
    }
  } catch (err) {
    console.warn('No se pudo obtener CSRF token', err.message || err);
  }
  return null;
}

// Registrar nuevo cliente
export async function registerClient(payload) {
  try {
    // Obtener siempre un token CSRF fresco antes de pedir POST
    await fetchCsrfToken();
    try {
      const res = await api.post('/clientes/registro', payload);
      return res.data;
    } catch (err) {
      // Si falló por CSRF, intentar obtener token de nuevo y reintentar una vez
      const status = err && err.response && err.response.status;
      const msg = err && err.response && err.response.data && err.response.data.message;
      if (status === 403 && msg && msg.toLowerCase().includes('csrf')) {
        await fetchCsrfToken();
        const retryRes = await api.post('/clientes/registro', payload);
        return retryRes.data;
      }
      throw err;
    }
  } catch (err) {
    // Lanzar para que el componente maneje el error
    throw err;
  }
}

export default {
  fetchCsrfToken,
  registerClient,
};

export async function detalleCliente(id) {
  try {
    if (!id) throw new Error('id requerido');
    const res = await api.get(`/clientes/detalle/${encodeURIComponent(id)}`);
    return res.data;
  } catch (err) {
    throw err;
  }
}
