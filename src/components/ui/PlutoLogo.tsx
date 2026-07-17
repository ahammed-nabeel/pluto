/**
 * PlutoLogo — shared brand mark for pluto.
 *
 * The SVG icon can be swapped out by replacing the contents of the
 * <PlutoIcon> component below (or dropping a new file in its place).
 *
 * The logotype ("pluto.") uses the "Abel" Google Font loaded globally
 * via the root layout. Apply className `font-abel` to use it.
 */

interface PlutoLogoProps {
  /** Size variant for the icon badge */
  size?: "sm" | "md" | "lg";
  /** Whether to show the text logotype beside the icon */
  showText?: boolean;
  /** Override text colour (defaults to white for dark bg, slate-900 for light) */
  textClassName?: string;
  /** Extra classes on the wrapper */
  className?: string;
}

/** Swappable icon mark — replace the SVG inside here to update the logo */
export function PlutoIcon({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-8",   /* matches text-3xl (30px) */
    md: "h-9",   /* matches text-4xl (36px) */
    lg: "h-12",  /* matches text-5xl (48px) */
  };

  return (
    <svg
      version="1.2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="260 115 275 370"
      className={`${sizes[size]} w-auto flex-shrink-0 self-center block`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        fill="#1447e6"
        d="m282.64 422.17l78.54 45.02v-241.12l77.54-45.52v90.05l-75.77 43.63 75.73 45.05 78.53-46.13v-88.82l-156.41-90.75-78.52 44.19z"
      />
    </svg>
  );
}

/** Full lockup: icon + "pluto." wordmark */
export default function PlutoLogo({
  size = "md",
  showText = true,
  textClassName = "text-slate-900",
  className = "",
}: PlutoLogoProps) {
  const textSizes = {
    sm: "text-3xl",
    md: "text-4xl",
    lg: "text-5xl",
  };

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <PlutoIcon size={size} />
      {showText && (
        <span
          className={`font-abel ${textSizes[size]} tracking-wide leading-none ${textClassName}`}
        >
          Pluto.
        </span>
      )}
    </span>
  );
}
