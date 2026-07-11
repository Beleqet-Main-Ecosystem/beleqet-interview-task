import { useCallback } from 'react';
import { useTheme } from 'next-themes';
import type { ThemeContextValue } from '@/types/theme';
import { normalizeTheme } from '@/lib/theme/theme';

/**
 * Returns the active application theme state and helpers for switching themes.
 *
 * @returns Theme context values for the current application state.
 */
export function useAppTheme(): ThemeContextValue {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  return {
    theme: normalizeTheme(theme),
    resolvedTheme: normalizeTheme(resolvedTheme),
    setTheme: (nextTheme) => setTheme(nextTheme),
    toggleTheme,
  };
}
