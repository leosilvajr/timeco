import { breakpoints, buildSnapshot, layoutFor } from './responsive';

describe('layoutFor', () => {
  it('classifica como mobile abaixo de 768px', () => {
    expect(layoutFor(0)).toBe('mobile');
    expect(layoutFor(320)).toBe('mobile');
    expect(layoutFor(414)).toBe('mobile');
    expect(layoutFor(breakpoints.tablet - 1)).toBe('mobile');
  });

  it('classifica como tablet entre 768 e 1023px', () => {
    expect(layoutFor(breakpoints.tablet)).toBe('tablet');
    expect(layoutFor(900)).toBe('tablet');
    expect(layoutFor(breakpoints.desktop - 1)).toBe('tablet');
  });

  it('classifica como desktop a partir de 1024px', () => {
    expect(layoutFor(breakpoints.desktop)).toBe('desktop');
    expect(layoutFor(1280)).toBe('desktop');
    expect(layoutFor(1920)).toBe('desktop');
    expect(layoutFor(3840)).toBe('desktop');
  });
});

describe('buildSnapshot', () => {
  it('mobile: width=375 retorna flags coerentes', () => {
    const r = buildSnapshot({ width: 375, height: 667 });
    expect(r.layout).toBe('mobile');
    expect(r.isMobile).toBe(true);
    expect(r.isTablet).toBe(false);
    expect(r.isDesktop).toBe(false);
    expect(r.width).toBe(375);
    expect(r.height).toBe(667);
  });

  it('tablet: width=900', () => {
    const r = buildSnapshot({ width: 900, height: 1200 });
    expect(r.layout).toBe('tablet');
    expect(r.isTablet).toBe(true);
    expect(r.isMobile).toBe(false);
    expect(r.isDesktop).toBe(false);
  });

  it('desktop: width=1440', () => {
    const r = buildSnapshot({ width: 1440, height: 900 });
    expect(r.layout).toBe('desktop');
    expect(r.isDesktop).toBe(true);
    expect(r.isMobile).toBe(false);
    expect(r.isTablet).toBe(false);
  });

  it('exatamente uma flag is* é true para qualquer largura', () => {
    [200, 768, 1024, 1500].forEach((w) => {
      const r = buildSnapshot({ width: w, height: 800 });
      const trueCount = [r.isMobile, r.isTablet, r.isDesktop].filter(Boolean).length;
      expect(trueCount).toBe(1);
    });
  });
});
