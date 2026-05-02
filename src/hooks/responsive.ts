export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export const maxContentWidth = 1200;

export type DeviceLayout = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveSnapshot {
  width: number;
  height: number;
  layout: DeviceLayout;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const layoutFor = (width: number): DeviceLayout => {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
};

export const buildSnapshot = (size: { width: number; height: number }): ResponsiveSnapshot => {
  const layout = layoutFor(size.width);
  return {
    width: size.width,
    height: size.height,
    layout,
    isMobile: layout === 'mobile',
    isTablet: layout === 'tablet',
    isDesktop: layout === 'desktop',
  };
};
