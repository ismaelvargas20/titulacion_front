import api from '../api/axios';

export async function listInvites() {
  const res = await api.get('/admin/invite/list');
  return res && res.data ? res.data : [];
}

export async function createInvite(payload) {
  const res = await api.post('/admin/invite/create', payload);
  return res && res.data ? res.data : null;
}

export async function deleteInvite(id) {
  const res = await api.delete(`/admin/invite/${id}`);
  return res && res.data ? res.data : null;
}

export default {
  listInvites,
  createInvite,
  deleteInvite
};