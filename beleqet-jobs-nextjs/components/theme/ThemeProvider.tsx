"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { getThemeStorageKey } from "@/lib/theme/theme";

/**
 * Wraps the app with the theme provider used for light, dark, and system themes.
 *
 * @param children - The app content that should receive the theme context.
 * @returns The themed application shell.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={getThemeStorageKey()}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
