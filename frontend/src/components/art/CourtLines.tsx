import '../../css/print-art.css'

export interface CourtLinesProps {
  className?: string
}

// NBA half court in feet: 50 wide, 47 deep, baseline at y = 0, half-court line at y = 47.
const W = 50
const D = 47
const CX = W / 2
const RIM_Y = 5.25 // rim centre from the baseline
const BOARD_Y = 4
const LANE_HALF = 8 // lane is 16 wide
const FT_Y = 19 // free-throw line
const THREE_R = 23.75
const CORNER_X = 22 // corner three distance from the basket's centre
// Where the straight corner lines meet the arc.
const THREE_BREAK_Y = RIM_Y + Math.sqrt(THREE_R ** 2 - CORNER_X ** 2)
const RA_R = 4 // restricted area

const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1,
  vectorEffect: 'non-scaling-stroke',
} as const

/** Faint half-court linework. Decorative; hidden from assistive tech. */
export function CourtLines({ className = 'CourtLines-backdrop' }: CourtLinesProps) {
  const l = CX - CORNER_X
  const r = CX + CORNER_X
  return (
    <svg
      className={`CourtLines ${className}`}
      viewBox={`0 0 ${W} ${D}`}
      aria-hidden="true"
      focusable="false"
    >
      {/* Sidelines, baseline, half-court line */}
      <rect x={0} y={0} width={W} height={D} {...line} />
      {/* Centre circle, our half */}
      <path d={`M ${CX - 6} ${D} A 6 6 0 0 1 ${CX + 6} ${D}`} {...line} />
      {/* Lane */}
      <rect x={CX - LANE_HALF} y={0} width={LANE_HALF * 2} height={FT_Y} {...line} />
      {/* Free-throw circle: solid outside the lane, dashed inside */}
      <path d={`M ${CX - 6} ${FT_Y} A 6 6 0 0 0 ${CX + 6} ${FT_Y}`} {...line} />
      <path
        d={`M ${CX - 6} ${FT_Y} A 6 6 0 0 1 ${CX + 6} ${FT_Y}`}
        {...line}
        strokeDasharray="5 5"
      />
      {/* Three-point line: straight corners into the arc */}
      <path
        d={`M ${l} 0 L ${l} ${THREE_BREAK_Y} A ${THREE_R} ${THREE_R} 0 0 0 ${r} ${THREE_BREAK_Y} L ${r} 0`}
        {...line}
      />
      {/* Restricted area */}
      <path
        d={`M ${CX - RA_R} ${BOARD_Y} L ${CX - RA_R} ${RIM_Y} A ${RA_R} ${RA_R} 0 0 0 ${CX + RA_R} ${RIM_Y} L ${CX + RA_R} ${BOARD_Y}`}
        {...line}
      />
      {/* Backboard, neck and rim */}
      <path d={`M ${CX - 3} ${BOARD_Y} L ${CX + 3} ${BOARD_Y}`} {...line} />
      <path d={`M ${CX} ${BOARD_Y} L ${CX} ${RIM_Y - 0.75}`} {...line} />
      <circle cx={CX} cy={RIM_Y} r={0.75} {...line} />
    </svg>
  )
}
