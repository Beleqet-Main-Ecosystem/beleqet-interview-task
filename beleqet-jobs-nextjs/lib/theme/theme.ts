import type { Theme } from '@/types/theme';

const THEME_STORAGE_KEY = 'beleqet-theme';

/**
 * Returns the storage key used for persisting the user's theme preference.
 *
 * @returns The localStorage key for the theme setting.
 */
export function getThemeStorageKey(): string {
  return THEME_STORAGE_KEY;
}

/**
 * Normalizes a theme value to a supported theme option.
 *
 * @param value - The incoming theme value.
 * @returns A supported theme value.
 */
export function normalizeTheme(value: string | null | undefined): Theme {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }

  return 'system';
}
