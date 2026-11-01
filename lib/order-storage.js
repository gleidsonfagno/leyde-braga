export const ORDER_RETENTION_DAYS = 30;
export function lerPedidoLocal(storage, now = Date.now()) {
  try {
    const raw = storage.getItem('leyde_pedido');
    if (!raw) return null;
    const pedido = JSON.parse(raw);
    const data = Date.parse(pedido?.data);
    if (!Number.isFinite(data) || data > now || now - data >= ORDER_RETENTION_DAYS * 86400000) {
      storage.removeItem('leyde_pedido');
      return null;
    }
    return pedido;
  } catch {
    try { storage.removeItem('leyde_pedido'); } catch { /* Armazenamento indisponível. */ }
    return null;
  }
}
