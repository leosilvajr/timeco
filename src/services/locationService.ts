/**
 * Busca de localizações usando Nominatim (OpenStreetMap), API gratuita.
 * Sem key necessária, mas tem rate limit de 1 req/seg — ok pra autocomplete
 * com debounce.
 */

export interface LocationResult {
  /** Nome curto/local (place_name) */
  name: string;
  /** Endereço completo formatado */
  address: string;
  lat: number;
  lng: number;
  /** ID único do OSM (place_id), pra evitar duplicatas */
  osmId: string;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

/**
 * Busca lugares por texto. Limita resultados a Brasil pra reduzir ruído.
 * @param query Texto digitado pelo usuário
 * @param signal AbortSignal para cancelar quando usuário continua digitando
 */
export const searchLocations = async (
  query: string,
  signal?: AbortSignal,
): Promise<LocationResult[]> => {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = `${NOMINATIM}?format=json&addressdetails=1&limit=8&countrycodes=br&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    signal,
    headers: { 'Accept-Language': 'pt-BR' },
  });
  if (!res.ok) throw new Error(`Erro na busca de localização (${res.status})`);

  const data = (await res.json()) as Array<{
    place_id: number | string;
    display_name: string;
    name?: string;
    lat: string;
    lon: string;
    address?: Record<string, string>;
  }>;

  return data.map((item) => {
    const addr = item.address ?? {};
    const shortName =
      item.name ||
      addr.amenity ||
      addr.leisure ||
      addr.sport ||
      addr.shop ||
      addr.tourism ||
      addr.road ||
      item.display_name.split(',')[0] ||
      'Localização';
    return {
      name: shortName,
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      osmId: String(item.place_id),
    };
  });
};

/** Constrói URL do Google Maps pra abrir o local. */
export const googleMapsUrl = (loc: { lat: number; lng: number; name?: string }): string => {
  if (loc.name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name)}&query_place_id=${loc.lat},${loc.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
};
