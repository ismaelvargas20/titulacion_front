import api from '../api/axios';

// Llamada unificada al nuevo endpoint /auth/login
// Normaliza la respuesta a { data: { user: { id, nombre, email, rol } } }
export async function login(payload) {
  // Asegurarnos de obtener un token CSRF si el servidor lo requiere.
  try {
    const tokenRes = await api.get('/csrf-token');
    if (tokenRes && tokenRes.data && tokenRes.data.csrfToken) {
      localStorage.setItem('csrfToken', tokenRes.data.csrfToken);
    } else {
      // Si el servidor devuelve null, eliminar token local por seguridad
      localStorage.removeItem('csrfToken');
    }
  } catch (err) {
    // Si falla la obtención del token, continuar y dejar que el servidor responda con el error.
    console.warn('No se pudo obtener CSRF token previo al login:', err && err.message);
  }

  const res = await api.post('/auth/login', payload);
  const data = res && res.data ? res.data : {};

  // Si el backend devuelve { success: true, user: {...}, rol }
  if (data.user) {
    const rol = data.rol || data.user.rol || 'usuario';
    const user = data.user;
    return { data: { user: { id: user.id, nombre: user.nombre || user.fullname || user.name, email: user.email || user.correo_electronico, rol } } };
  }

  // Fallback: mantener compatibilidad mínima con estructuras antiguas
  if (data.clienteId || data.userId) {
    const id = data.clienteId || data.userId;
    const nombre = data.nombre || data.fullname;
    const email = data.email || data.correo_electronico;
    const rol = data.success === true && data.user ? (data.user.rol || 'cliente') : 'usuario';
    return { data: { user: { id, nombre, email, rol } } };
  }

  // Si no se obtuvo user, lanzar para que el llamador maneje el error
  throw new Error('Login: respuesta inesperada del servidor');
}

export default {
  login,
};
