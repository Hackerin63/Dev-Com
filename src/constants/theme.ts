import type { TextStyle } from 'react-native';

export const palette = {
  light: {
    background: '#F5F6FA',
    surface: '#FFFFFF',
    surfaceAlt: '#ECEEF5',
    text: '#11131C',
    textMuted: '#5E6477',
    border: '#DFE2EC',
    primary: '#3547F5',
    primaryText: '#FFFFFF',
    primarySoft: '#E5E8FF',
    danger: '#D6364B',
    dangerSoft: '#FCE8EB',
    success: '#14996B',
    successSoft: '#DDF4EA',
    warning: '#B97A00',
    warningSoft: '#FFF0CF',
    overlay: 'rgba(17,19,28,0.5)',
  },
  dark: {
    background: '#0D0F17',
    surface: '#161926',
    surfaceAlt: '#1F2333',
    text: '#EDEFF7',
    textMuted: '#9AA1B8',
    border: '#2A2F44',
    primary: '#7B88FF',
    primaryText: '#0D0F17',
    primarySoft: '#242A5C',
    danger: '#FF6B7F',
    dangerSoft: '#3A1D24',
    success: '#3DD6A0',
    successSoft: '#12332A',
    warning: '#F2B84B',
    warningSoft: '#3A2E10',
    overlay: 'rgba(0,0,0,0.65)',
  },
};

export type ThemeColors = typeof palette.light;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const typography: Record<'h1' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'caption', TextStyle> = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.4 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.2 },
  h3: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
};
