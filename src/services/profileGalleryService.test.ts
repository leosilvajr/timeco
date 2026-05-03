import { PROFILE_PHOTOS_LIMIT } from './profileGalleryService';

describe('PROFILE_PHOTOS_LIMIT', () => {
  it('mantém valor estável (mudança implica em revisar storage rules)', () => {
    expect(PROFILE_PHOTOS_LIMIT).toBe(10);
  });

  it('é um inteiro positivo', () => {
    expect(Number.isInteger(PROFILE_PHOTOS_LIMIT)).toBe(true);
    expect(PROFILE_PHOTOS_LIMIT).toBeGreaterThan(0);
  });
});
