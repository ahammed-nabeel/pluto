// Design tokens matching the Pluto web app
export const colors = {
  // Primary blue (matches web app CTA buttons)
  primary: "#2563EB",
  primaryLight: "#EFF6FF",
  primaryDark: "#1D4ED8",

  // Dark navy sidebar/header (matches web left panel)
  navy: "#0F172A",
  navyMid: "#1E293B",
  navyLight: "#334155",

  // Backgrounds
  bgPage: "#F1F5F9",   // light slate - matches web bg
  bgCard: "#FFFFFF",
  bgMuted: "#F8FAFC",

  // Text
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  textOnDark: "#FFFFFF",
  textOnDarkMuted: "#94A3B8",

  // Borders
  border: "#E2E8F0",
  borderDark: "#334155",

  // Status colors
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  // Nav active indicator
  navActive: "#2563EB",
  navInactive: "#64748B",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: "700" as const, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: "600" as const, color: colors.textPrimary },
  h4: { fontSize: 15, fontWeight: "600" as const, color: colors.textPrimary },
  body: { fontSize: 14, fontWeight: "400" as const, color: colors.textPrimary },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, color: colors.textSecondary },
  caption: { fontSize: 11, fontWeight: "500" as const, color: colors.textMuted },
  label: { fontSize: 12, fontWeight: "600" as const, color: colors.textSecondary },
};
