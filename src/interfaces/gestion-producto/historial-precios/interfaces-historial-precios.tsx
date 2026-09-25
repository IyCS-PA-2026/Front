// CR-007: un cambio de precio de un producto (GET /producto/:id/historial-precios).
// Reemplaza las interfaces del sistema anterior (precio cliente/mayorista/oferta),
// que no tenían respaldo en el backend ni en el dominio.
export interface HistorialPrecio {
  id: number;
  productoId: number;
  // null en el registro del alta del producto
  precioAnterior: number | null;
  precioNuevo: number;
  fecha: string;
  motivo: string;
}
