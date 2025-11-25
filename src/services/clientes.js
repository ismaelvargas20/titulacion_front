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
    // Asegurarse de tener token CSRF si el backend lo requiere
    if (!localStorage.getItem('csrfToken')) {
      await fetchCsrfToken();
    }
    const res = await api.post('/clientes/registro', payload);
    return res.data;
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
