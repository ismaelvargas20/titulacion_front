import api from '../api/axios';

// Llamada unificada al nuevo endpoint /auth/login
// Normaliza la respuesta a { data: { user: { id, nombre, email, rol } } }
export async function login(payload) {
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
