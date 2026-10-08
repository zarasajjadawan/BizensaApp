import '@/global.css';
import { useEffect, useSyncExternalStore } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const brand = {
  primary: '#8b2cf5',
  primarySoft: '#b57bff',
  primaryDark: '#2a0f4d',
  surface: '#14141c', // cards, tab bar
  border: '#23232f',
  success: '#22c55e',
  danger: '#ef4444',
} as const;

export const Colors = {
  light: {
    text: '#14141C',
    background: '#F4F4F8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E3E3EC',
    textSecondary: '#6B7280',
    ...brand,
  },
  dark: {
    text: '#ffffff',
    selectedTab: '#8b2cf5',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    ...brand,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/* =====================================================================
   APP THEME (light / dark / use phone setting)

   - `C`            live colors: always the colors of the CURRENT theme.
   - `themedStyles` like StyleSheet.create, but re-built for the current theme.
   - `useAppTheme`  hook: current mode, isDark, and setThemeMode().

   The root layout remounts the whole app when the theme changes, so every
   screen shows the new colors right away.
   ===================================================================== */

export interface Palette {
  bg: string; // screen background
  card: string; // cards, tab bar, inputs
  border: string;
  text: string;
  muted: string;
  purple: string;
  purpleSoft: string;
  purpleDark: string; // balance card background
  green: string;
  red: string;
  onPurple: string; // text on the purple balance card
  onPurpleMuted: string;
  chipBg: string; // small purple icon boxes
  chipBorder: string;
  successBg: string;
  successBorder: string;
  successFg: string;
  dangerBg: string;
  dangerBorder: string;
  dangerFg: string;
  overlay: string; // modal backdrop
}

export type SchemeName = 'dark' | 'light';

export const palettes: Record<SchemeName, Palette> = {
  dark: {
    bg: '#000000',
    card: '#14141c',
    border: '#23232f',
    text: '#ffffff',
    muted: '#B0B4BA',
    purple: '#8b2cf5',
    purpleSoft: '#b57bff',
    purpleDark: '#2a0f4d',
    green: '#22c55e',
    red: '#ef4444',
    onPurple: '#ffffff',
    onPurpleMuted: '#D9B8FF',
    chipBg: '#1c1030',
    chipBorder: '#4a2390',
    successBg: '#12261a',
    successBorder: '#1f4d31',
    successFg: '#4ade80',
    dangerBg: '#2a1214',
    dangerBorder: '#5c1f24',
    dangerFg: '#f87171',
    overlay: 'rgba(0,0,0,0.6)',
  },
  light: {
    bg: '#F4F4F8',
    card: '#FFFFFF',
    border: '#E3E3EC',
    text: '#14141C',
    muted: '#6B7280',
    purple: '#8b2cf5',
    purpleSoft: '#7C3AED',
    purpleDark: '#6d28d9',
    green: '#16a34a',
    red: '#dc2626',
    onPurple: '#ffffff',
    onPurpleMuted: '#E9D5FF',
    chipBg: '#F1E7FF',
    chipBorder: '#D9C2FA',
    successBg: '#DCFCE7',
    successBorder: '#BBF7D0',
    successFg: '#16A34A',
    dangerBg: '#FEE2E2',
    dangerBorder: '#FECACA',
    dangerFg: '#DC2626',
    overlay: 'rgba(0,0,0,0.4)',
  },
};

export type ThemeMode = 'dark' | 'light' | 'system';

const THEME_KEY = 'theme';

let mode: ThemeMode = 'dark';
let ready = false;
let loadStarted = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const isMode = (v: unknown): v is ThemeMode =>
    v === 'dark' || v === 'light' || v === 'system';

/** Makes alerts, date pickers, keyboard... follow the chosen theme too */
const applyNative = (m: ThemeMode) => {
  try {
    Appearance.setColorScheme(m === 'system' ? 'unspecified' : m);
  } catch (err) {
    console.log('Set color scheme error:', err);
  }
};

/** "dark" or "light" right now (usable outside components) */
export const getScheme = (): SchemeName => {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
  }
  return mode;
};

/** Live colors of the current theme. Read them while rendering. */
export const C: Palette = new Proxy({} as Palette, {
  get: (_target, key) => palettes[getScheme()][key as keyof Palette],
});

/** Same as StyleSheet.create, but styles are rebuilt for light / dark. */
export function themedStyles<T extends object>(factory: (c: Palette) => T): T {
  const cache: Partial<Record<SchemeName, T>> = {};

  return new Proxy({} as T, {
    get: (_target, prop) => {
      const name = getScheme();
      const sheet = (cache[name] ??= factory(palettes[name]));
      return (sheet as any)[prop];
    },
  });
}

/** Loads the saved choice once per app start. */
export const loadTheme = async () => {
  if (loadStarted) return;
  loadStarted = true;

  try {
    const saved = await SecureStore.getItemAsync(THEME_KEY);
    if (isMode(saved)) {
      mode = saved;
      applyNative(mode);
    }
  } catch (err) {
    console.log('Load theme error:', err);
  } finally {
    ready = true;
    emit();
  }
};

/** Changes the theme everywhere, then saves it. */
export const setThemeMode = async (next: ThemeMode) => {
  if (next === mode) return;

  mode = next;
  applyNative(next);
  emit();

  try {
    await SecureStore.setItemAsync(THEME_KEY, next);
  } catch (err) {
    console.log('Save theme error:', err);
  }
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export function useAppTheme() {
  const currentMode = useSyncExternalStore(subscribe, () => mode);
  const isReady = useSyncExternalStore(subscribe, () => ready);
  const system = useColorScheme();

  useEffect(() => {
    loadTheme();
  }, []);

  const scheme: SchemeName =
      currentMode === 'system' ? (system === 'light' ? 'light' : 'dark') : currentMode;

  return {
    mode: currentMode,
    scheme,
    isDark: scheme === 'dark',
    ready: isReady,
    setThemeMode,
  };
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  18: 72,
  20: 80,
  24: 96,
  30: 120,
} as const;

export const components = {
  tabBar: {
    height: spacing[18],
    horizontalInset: spacing[5],
    radius: spacing[8],
    iconFrame: spacing[12],
    itemPaddingVertical: spacing[2],
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;