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

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

interface NominatimReverseResponse {
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  place_id: number | string;
  address?: Record<string, string>;
}

/**
 * Reverse geocoding: dadas coordenadas, descobre o estabelecimento /
 * endereço mais provável. Usa Nominatim com zoom alto pra capturar POIs.
 */
export const reverseGeocode = async (
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<LocationResult> => {
  const url = `${NOMINATIM_REVERSE}?format=json&addressdetails=1&namedetails=1&zoom=18&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    signal,
    headers: { 'Accept-Language': 'pt-BR' },
  });
  if (!res.ok) throw new Error(`Erro no reverse geocode (${res.status})`);
  const data = (await res.json()) as NominatimReverseResponse;
  const addr = data.address ?? {};
  const shortName =
    data.name ||
    addr.amenity ||
    addr.leisure ||
    addr.sport ||
    addr.shop ||
    addr.tourism ||
    addr.building ||
    addr.road ||
    data.display_name.split(',')[0] ||
    'Local atual';
  return {
    name: shortName,
    address: data.display_name,
    lat: parseFloat(data.lat),
    lng: parseFloat(data.lon),
    osmId: String(data.place_id),
  };
};

export interface CurrentPosition {
  lat: number;
  lng: number;
  /** Precisão em metros (quanto menor, mais preciso) */
  accuracy: number;
}

/**
 * Obtém a localização atual do dispositivo via Geolocation API (web).
 * Pede permissão se ainda não foi concedida.
 */
export const getCurrentPosition = (timeoutMs = 15000): Promise<CurrentPosition> => {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocalização não disponível neste dispositivo'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Permissão de localização negada'));
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject(new Error('Localização indisponível agora'));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error('Tempo esgotado tentando obter sua localização'));
        } else {
          reject(new Error(err.message || 'Erro ao obter localização'));
        }
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    );
  });
};
