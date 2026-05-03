/**
 * Helper puro pra construir URL do Google Maps. Mantido em arquivo
 * separado de locationService.ts pra que possa ser testado sem
 * carregar dependências do React Native (ex.: Platform).
 */

/** Constrói URL do Google Maps pra abrir o local. */
export const googleMapsUrl = (loc: { lat: number; lng: number; name?: string }): string => {
  if (loc.name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name)}&query_place_id=${loc.lat},${loc.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
};
