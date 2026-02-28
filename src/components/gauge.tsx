"use client"

import { useEffect, useState } from "react"

interface GaugeProps {
  value: number       // e.g. 98.5 (millions) — can be BELOW min
  min?: number        // default 110
  max?: number        // default 140
  budget?: number     // e.g. 129.5
}

export function Gauge({ value, min = 110, max = 140, budget = 129.5 }: GaugeProps) {
  const [animProgress, setAnimProgress] = useState(0)

  const cx = 170
  const cy = 185
  const outerR = 155
  const innerR = 100
  const midR = (outerR + innerR) / 2
  const thickness = outerR - innerR

  // 180° = left, 0° = right. Values below min clamp to left edge.
  const valToAngle = (v: number) => {
    const clamped = Math.max(min, Math.min(max, v))
    return 180 - ((clamped - min) / (max - min)) * 180
  }

  const angleToXY = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
  }

  const describeArc = (startVal: number, endVal: number) => {
    const a1 = valToAngle(startVal)
    const a2 = valToAngle(endVal)
    const s = angleToXY(a1, midR)
    const e = angleToXY(a2, midR)
    const large = Math.abs(a1 - a2) > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${midR} ${midR} 0 ${large} 1 ${e.x} ${e.y}`
  }

  useEffect(() => {
    const start = performance.now()
    const dur = 1200
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimProgress(eased)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])

  // Needle: if value < min, needle points past the left edge of the arc
  // This creates the dramatic "below scale" effect
  const needleTargetAngle = value < min
    ? 180 + ((min - value) / (max - min)) * 30  // extend past 180° proportionally
    : valToAngle(value)
  const needleAngle = 180 + (needleTargetAngle - 180) * animProgress
  const needleTip = angleToXY(needleAngle, outerR - 5)

  // 4 zones: red · orange · yellow · green
  const zones = [
    { from: 110, to: 117.5, color: "#C00000" },
    { from: 117.5, to: 125, color: "#E8735A" },
    { from: 125, to: 132.5, color: "#FFD700" },
    { from: 132.5, to: 140, color: "#375623" },
  ]

  // Ticks
  const ticks = [110, 115, 120, 125, 130, 135, 140]

  const fmtV = (v: number) => `$${v}M`

  return (
    <div className="relative flex flex-col items-center" style={{ paddingBottom: 20 }}>
      <svg viewBox="0 0 340 220" className="w-full" style={{ overflow: "visible" }}>
        {/* Zone arcs */}
        {zones.map((z, i) => (
          <path
            key={i}
            d={describeArc(z.from, z.to)}
            fill="none"
            stroke={z.color}
            strokeWidth={thickness}
            strokeLinecap="butt"
          />
        ))}

        {/* Tick marks + labels */}
        {ticks.map((t) => {
          const angle = valToAngle(t)
          const outer = angleToXY(angle, outerR + 3)
          const inner = angleToXY(angle, outerR + 10)
          const label = angleToXY(angle, outerR + 24)
          return (
            <g key={t}>
              <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="#666" strokeWidth={1.5} />
              <text
                x={label.x} y={label.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight="600" fill="#555" fontFamily="system-ui"
              >
                {fmtV(t)}
              </text>
            </g>
          )
        })}

        {/* Budget marker line on arc */}
        {(() => {
          const bAngle = valToAngle(budget)
          const bOuter = angleToXY(bAngle, outerR + 2)
          const bInner = angleToXY(bAngle, innerR - 2)
          return <line x1={bOuter.x} y1={bOuter.y} x2={bInner.x} y2={bInner.y} stroke="#333" strokeWidth={2.5} />
        })()}

        {/* Needle — line from center to tip */}
        <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="#111" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={10} fill="#111" />
        <circle cx={cx} cy={cy} r={4} fill="#fff" />

        {/* Value below gauge */}
        <text x={cx} y={cy + 30} textAnchor="middle" fontSize="26" fontWeight="bold" fill="#C00000" fontFamily="Lato, system-ui">
          {fmtV(value)}
        </text>
      </svg>

      {/* Budget badge — top right, legible */}
      <div className="absolute top-1 right-1 bg-[#375623] text-white px-3 py-1.5 rounded text-[12px] font-bold shadow">
        Presupuesto: {fmtV(budget)}
      </div>
    </div>
  )
}
