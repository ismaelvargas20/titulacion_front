import api from '../api/axios';

export async function requestPasswordReset(email) {
  // Asegurar que tenemos un token CSRF antes de hacer la petición
  try {
    const tokenRes = await api.get('/csrf-token');
    if (tokenRes && tokenRes.data && tokenRes.data.csrfToken) {
      localStorage.setItem('csrfToken', tokenRes.data.csrfToken);
    } else {
      localStorage.removeItem('csrfToken');
    }
  } catch (e) {
    // ignore: si falla, el backend responderá con el error correspondiente
  }
  return api.post('/auth/password-reset/request', { email });
}

export async function verifyPasswordToken(token) {
  return api.post('/auth/password-reset/verify', { token });
}

export async function confirmPasswordReset(token, password) {
  // Asegurar que tenemos un token CSRF antes de hacer la petición
  try {
    const tokenRes = await api.get('/csrf-token');
    if (tokenRes && tokenRes.data && tokenRes.data.csrfToken) {
      localStorage.setItem('csrfToken', tokenRes.data.csrfToken);
    } else {
      localStorage.removeItem('csrfToken');
    }
  } catch (e) {
    // ignore: si falla, el backend responderá con el error correspondiente
  }
  return api.post('/auth/password-reset/confirm', { token, password });
}

export default {
  requestPasswordReset,
  verifyPasswordToken,
  confirmPasswordReset
};
