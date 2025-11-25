import * as motos from './motos';

// Wrapper para adaptar llamadas específicas de repuestos usando el mismo
// backend de publicaciones. Añadimos el parámetro `tipo: 'repuesto'` donde
// corresponde para que el backend filtre/gestione correctamente.

export async function crearRepuesto(payload) {
  const body = typeof payload === 'object' && !(payload instanceof FormData)
    ? { ...payload, tipo: 'repuesto' }
    : payload; // si es FormData, se asume que ya contiene el campo tipo si es necesario

  // delegar en crearPublicacion (mismos endpoints)
  return motos.crearPublicacion(body instanceof FormData ? body : body);
}

export async function listarRepuestos(params = {}) {
  // forzar tipo 'repuesto' a menos que se especifique otro
  const p = { tipo: 'repuesto', ...params };
  return motos.listarPublicaciones(p);
}

export async function detalleRepuesto(id) {
  return motos.detallePublicacion(id);
}

export async function actualizarRepuesto(id, payload) {
  return motos.actualizarPublicacion(id, payload);
}

export async function eliminarRepuesto(id) {
  return motos.eliminarPublicacion(id);
}

export default {
  crearRepuesto,
  listarRepuestos,
  detalleRepuesto,
  actualizarRepuesto,
  eliminarRepuesto
};
