"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useAppTheme } from "@/hooks/useTheme";
import type { Theme } from "@/types/theme";

const themeOptions: Array<{ value: Theme; label: string; icon: JSX.Element }> = [
  { value: "light", label: "Light", icon: <Sun size={16} /> },
  { value: "dark", label: "Dark", icon: <Moon size={16} /> },
  { value: "system", label: "System", icon: <Monitor size={16} /> },
];

/**
 * Renders a theme switcher that lets users choose light, dark, or system mode.
 *
 * @returns The theme toggle control.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useAppTheme();

  const handleChange = (nextTheme: Theme) => {
    setTheme(nextTheme);
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-white/80 p-1 shadow-sm dark:bg-slate-900/80" role="group" aria-label="Theme options">
      {themeOptions.map((option) => {
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-label={`Toggle theme to ${option.label}`}
            onClick={() => handleChange(option.value)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-brandGreen text-white"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
