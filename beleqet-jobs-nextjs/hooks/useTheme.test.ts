import { jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from 'next-themes';
import { useAppTheme } from './useTheme';

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

const mockedUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('useAppTheme', () => {
  it('returns the current theme and a toggle helper', () => {
    const setTheme = jest.fn();
    mockedUseTheme.mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme,
      systemTheme: 'light',
      themes: ['light', 'dark', 'system'],
      forcedTheme: undefined,
    } as never);

    const { result } = renderHook(() => useAppTheme());

    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(setTheme).toHaveBeenCalledWith('dark');
  });
});
