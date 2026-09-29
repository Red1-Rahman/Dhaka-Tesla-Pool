export function RickshawIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9Q3 3 8 3H11Q13 3 13 6" />
      <path d="M3 9V14M13 6V14" />
      <path d="M3 14H16L18 12" />
      <path d="M20 18L17.5 9M16 9H19" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="20" cy="18" r="2" />
    </svg>
  )
}
