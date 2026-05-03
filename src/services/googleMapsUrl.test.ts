import { googleMapsUrl } from './googleMapsUrl';

describe('googleMapsUrl', () => {
  it('gera URL apenas com lat/lng quando não tem nome', () => {
    const url = googleMapsUrl({ lat: -23.55, lng: -46.63 });
    expect(url).toContain('https://www.google.com/maps/search/');
    expect(url).toContain('query=-23.55,-46.63');
  });

  it('inclui o nome do local quando informado', () => {
    const url = googleMapsUrl({ lat: -23.55, lng: -46.63, name: 'Arena XPTO' });
    expect(url).toContain('query=Arena%20XPTO');
    expect(url).toContain('query_place_id=-23.55,-46.63');
  });

  it('escapa caracteres especiais no nome', () => {
    const url = googleMapsUrl({ lat: 0, lng: 0, name: 'Quadra do João & Maria' });
    expect(url).toContain('query=Quadra%20do%20Jo%C3%A3o%20%26%20Maria');
  });
});
