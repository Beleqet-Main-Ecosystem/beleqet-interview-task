import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';
import { useAppTheme } from '@/hooks/useTheme';

jest.mock('@/hooks/useTheme', () => ({
  useAppTheme: jest.fn(),
}));

const mockedUseAppTheme = useAppTheme as jest.MockedFunction<typeof useAppTheme>;

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockedUseAppTheme.mockReset();
  });

  it('requests a dark theme when the current theme is light', async () => {
    const setTheme = jest.fn();
    mockedUseAppTheme.mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme,
      toggleTheme: jest.fn(),
    });

    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole('button', { name: /toggle theme to dark/i }));

    expect(setTheme).toHaveBeenCalledWith('dark');
  });
});
