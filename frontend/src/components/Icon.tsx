type IconName =
  | "play"
  | "pause"
  | "stop"
  | "check"
  | "trash"
  | "edit"
  | "plus"
  | "download"
  | "clock"
  | "list"
  | "chart"
  | "flag"
  | "spark"
  | "tomato"
  | "keyboard"
  | "undo";

const PATHS: Record<IconName, JSX.Element> = {
  play: <path d="M7 5.5v13l11-6.5z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  trash: <path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l1 12.5h9l1-12.5M9.5 7V4.5h5V7" />,
  edit: <path d="M4.5 19.5h4l10-10-4-4-10 10zM13 7l4 4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  download: <path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  list: <path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01" />,
  chart: <path d="M5 19.5V11M10 19.5V5M15 19.5v-7M20 19.5V8" />,
  flag: <path d="M6 20.5V4.5M6 5h11l-2 4 2 4H6" />,
  spark: <path d="M12 3.5l1.8 6.7 6.7 1.8-6.7 1.8L12 20.5l-1.8-6.7L3.5 12l6.7-1.8z" />,
  tomato: (
    <>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 6.5V4M9 7l3-1 3 1" />
    </>
  ),
  keyboard: (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="2" />
      <path d="M7 10.5h.01M10.5 10.5h.01M14 10.5h.01M17 10.5h.01M8 14h8" />
    </>
  ),
  undo: <path d="M9 7.5L5 11.5l4 4M5.5 11.5H15a4 4 0 010 8h-2" />,
};

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

export type { IconName };
