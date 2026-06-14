import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 */
export function useColors() {
  return {
    ...colors,
    foreground: colors.text,
    mutedForeground: colors.textMuted,
    primaryForeground: colors.white,
  };
}

