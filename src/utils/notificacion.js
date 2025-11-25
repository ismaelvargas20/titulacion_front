// Helper mínimo para notificaciones locales (fallback)
// Exporta: pushLocalNotification(item), loadLocalNotifications(limit), clearLocalNotifications()
// Mantengo los nombres de las funciones en inglés para que coincidan con las importaciones existentes.
export function pushLocalNotification(item) {
	try {
		const key = 'localInbox';
		const raw = localStorage.getItem(key);
		const arr = raw ? JSON.parse(raw) : [];
		const id = item.id || `local-${Date.now()}`;
		const time = item.time || 'Hace un momento';
		const next = { ...item, id, time, _local: true };
		// evitar duplicados por id
		const exists = arr.find((i) => String(i.id) === String(id));
		if (!exists) arr.unshift(next);
		// limitar tamaño
		localStorage.setItem(key, JSON.stringify(arr.slice(0, 200)));
		return true;
	} catch (e) {
		console.warn('pushLocalNotification error', e);
		return false;
	}
}

export function loadLocalNotifications(/* limit = 200 */) {
	// For UX purposes we don't auto-seed example notifications anymore.
	// Always return an empty array so the UI shows the "no notifications" state
	// unless the backend explicitly provides items or `pushLocalNotification` was
	// used during this session.
	return [];
}

export function clearLocalNotifications() {
	try {
		localStorage.removeItem('localInbox');
		return true;
	} catch (e) {
		console.warn('clearLocalNotifications error', e);
		return false;
	}
}

