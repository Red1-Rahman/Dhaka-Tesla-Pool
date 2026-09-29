// Side-view electric rickshaw. Seat slots: 2 on the rear bench, 1 on the front bench.
const SEAT_X = [66, 106, 176] as const
const SEAT_Y = 44

interface RickshawSilhouetteProps {
  /** Initials per occupied seat, in seating order. */
  occupants: string[]
  capacity: number
  label?: string
}

export function RickshawSilhouette({
  occupants,
  capacity,
  label = "Electric rickshaw",
}: RickshawSilhouetteProps) {
  const seats = SEAT_X.slice(0, capacity)

  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[10px] bg-[var(--surface-2)] p-4">
      <svg
        viewBox="0 0 340 120"
        className="w-full"
        role="img"
        aria-label={`${label}: ${occupants.length} of ${capacity} seats taken`}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* canopy + poles */}
        <path d="M34 36C34 14 60 10 90 10H130C142 10 148 16 148 28V36" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M34 36V58M148 28V58" stroke="var(--muted)" strokeWidth="1.2" />

        {/* rear bench: backrest, cushion, body */}
        <path d="M40 58V34" stroke="var(--ink)" strokeWidth="1.5" />
        <rect x="40" y="58" width="90" height="10" rx="3" stroke="var(--ink)" strokeWidth="1.5" />
        <rect x="40" y="68" width="90" height="12" stroke="var(--ink)" strokeWidth="1.5" />

        {/* front bench */}
        <path d="M152 58V36" stroke="var(--ink)" strokeWidth="1.5" />
        <rect x="152" y="58" width="52" height="10" rx="3" stroke="var(--ink)" strokeWidth="1.5" />
        <rect x="152" y="68" width="52" height="12" stroke="var(--ink)" strokeWidth="1.5" />

        {/* floor + dash panel */}
        <path d="M34 80H232L246 68" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M232 80V56Q232 52 238 52H250" stroke="var(--muted)" strokeWidth="1.2" />

        {/* fork, handlebar, mirror, headlight, fender */}
        <path d="M274 90L256 46" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M248 42H262M250 42L254 30" stroke="var(--ink)" strokeWidth="1.5" />
        <circle cx="262" cy="58" r="4" stroke="var(--muted)" strokeWidth="1.2" />
        <path d="M262 82Q276 70 292 82" stroke="var(--muted)" strokeWidth="1.2" />

        {/* wheels */}
        <circle cx="70" cy="90" r="14" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <circle cx="70" cy="90" r="5" stroke="var(--muted)" strokeWidth="1" />
        <circle cx="274" cy="90" r="13" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        <circle cx="274" cy="90" r="5" stroke="var(--muted)" strokeWidth="1" />

        {/* seat markers */}
        {seats.map((x, i) => {
          const initials = occupants[i]
          return initials ? (
            <g key={x}>
              <circle cx={x} cy={SEAT_Y} r="13" fill="var(--primary)" />
              <text
                x={x}
                y={SEAT_Y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontWeight="600"
                fill="var(--primary-ink)"
              >
                {initials}
              </text>
            </g>
          ) : (
            <circle
              key={x}
              cx={x}
              cy={SEAT_Y}
              r="13"
              stroke="var(--faint)"
              strokeDasharray="3 3"
            />
          )
        })}
      </svg>
    </div>
  )
}
