import { normalizeTheme, getThemeStorageKey } from './theme';

describe('theme helpers', () => {
  it('normalizes supported theme values', () => {
    expect(normalizeTheme('dark')).toBe('dark');
    expect(normalizeTheme('system')).toBe('system');
    expect(normalizeTheme('unknown')).toBe('system');
  });

  it('returns the expected storage key', () => {
    expect(getThemeStorageKey()).toBe('beleqet-theme');
  });
});
