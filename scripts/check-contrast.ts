import { lightColors, darkColors, ColorPalette } from '../src/constants/theme';
import { contrastRatio } from '../src/constants/contrast';

const pairs: { label: string; a: keyof ColorPalette; b: keyof ColorPalette }[] = [
  { label: 'text vs background', a: 'text', b: 'background' },
  { label: 'text vs surface', a: 'text', b: 'surface' },
  { label: 'text vs surfaceVariant', a: 'text', b: 'surfaceVariant' },
  { label: 'textSecondary vs background', a: 'textSecondary', b: 'background' },
  { label: 'textSecondary vs surface', a: 'textSecondary', b: 'surface' },
  { label: 'textMuted vs background', a: 'textMuted', b: 'background' },
  { label: 'textMuted vs surface', a: 'textMuted', b: 'surface' },
  { label: 'primary vs background', a: 'primary', b: 'background' },
  { label: 'primary vs surface', a: 'primary', b: 'surface' },
  { label: 'primaryDark vs background', a: 'primaryDark', b: 'background' },
  { label: 'primaryDark vs surface', a: 'primaryDark', b: 'surface' },
  { label: 'white vs primary', a: 'white', b: 'primary' },
  { label: 'danger vs background', a: 'danger', b: 'background' },
  { label: 'success vs background', a: 'success', b: 'background' },
  { label: 'warning vs background', a: 'warning', b: 'background' },
  { label: 'info vs background', a: 'info', b: 'background' },
];

const print = (mode: string, p: ColorPalette) => {
  console.log('\n' + mode + ':');
  pairs.forEach(({ label, a, b }) => {
    const r = contrastRatio(p[a] as string, p[b] as string);
    const aa = r >= 4.5 ? 'AA  ' : r >= 3 ? 'AA-L' : 'FAIL';
    console.log(`  ${aa}  ${r.toFixed(2).padStart(5)}  ${label}`);
  });
};

print('LIGHT', lightColors);
print('DARK', darkColors);
