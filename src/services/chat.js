import api from '../api/axios';

export async function crearChat(payload) {
  try {
    const res = await api.post('/chats/crear', payload);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function listarChats(params = {}) {
  try {
    const res = await api.get('/chats', { params });
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function listarMensajes(chatId, params = {}) {
  try {
    const res = await api.get(`/chats/${chatId}/mensajes`, { params });
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function enviarMensaje(chatId, body) {
  try {
    const res = await api.post(`/chats/${chatId}/mensajes`, body);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function marcarLeidos(chatId, body = {}) {
  try {
    const res = await api.put(`/chats/${chatId}/marcar-leidos`, body);
    return res.data;
  } catch (err) {
    throw err;
  }
}

export default {
  crearChat,
  listarChats,
  listarMensajes,
  enviarMensaje,
  marcarLeidos,
};
