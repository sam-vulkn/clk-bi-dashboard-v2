"use client"

import { useEffect, useRef, useState } from "react"

interface GaugeProps {
  value: number
  prevYear?: number
  budget?: number
}

export function Gauge({ value, prevYear = 88.9, budget = 129.5 }: GaugeProps) {
  const [animatedAngle, setAnimatedAngle] = useState(-90)
  const startTime = useRef(0)
  const rafRef = useRef(0)

  // Dynamic range: always show value within arc
  const min = 0
  const maxVal = Math.max(budget * 1.1, value * 1.2, prevYear * 1.3)
  const max = Math.ceil(maxVal / 5) * 5 // Round up to nearest 5

  const cx = 200, cy = 180
  const rOuter = 160, rInner = 115

  const valueToAngle = (v: number) => {
    const clamped = Math.max(min, Math.min(max, v))
    const pct = (clamped - min) / (max - min)
    return -90 + pct * 180
  }

  const targetAngle = valueToAngle(value)

  useEffect(() => {
    const duration = 1400
    const startAngle = -90
    startTime.current = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime.current
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimatedAngle(startAngle + (targetAngle - startAngle) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [targetAngle])

  const prevYearAngle = ((prevYear - min) / (max - min)) * 180
  const budgetAngle = ((budget - min) / (max - min)) * 180

  const zones = [
    { start: 0, end: prevYearAngle, color: "#E62800" },
    { start: prevYearAngle, end: budgetAngle, color: "#F5C518" },
    { start: budgetAngle, end: 180, color: "#2E7D32" },
  ]

  const arcPath = (startDeg: number, endDeg: number, rOut: number, rIn: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180
    const sRad = toRad(startDeg - 90)
    const eRad = toRad(endDeg - 90)
    const x1o = cx + rOut * Math.cos(sRad), y1o = cy + rOut * Math.sin(sRad)
    const x2o = cx + rOut * Math.cos(eRad), y2o = cy + rOut * Math.sin(eRad)
    const x1i = cx + rIn * Math.cos(eRad), y1i = cy + rIn * Math.sin(eRad)
    const x2i = cx + rIn * Math.cos(sRad), y2i = cy + rIn * Math.sin(sRad)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M${x1o},${y1o} A${rOut},${rOut} 0 ${large} 1 ${x2o},${y2o} L${x1i},${y1i} A${rIn},${rIn} 0 ${large} 0 ${x2i},${y2i} Z`
  }

  const needleLength = rOuter - 8
  const nRad = ((animatedAngle - 90) * Math.PI) / 180
  const tipX = cx + needleLength * Math.cos(nRad)
  const tipY = cy + needleLength * Math.sin(nRad)
  const perpRad = nRad + Math.PI / 2
  const bw = 3
  const b1x = cx + bw * Math.cos(perpRad), b1y = cy + bw * Math.sin(perpRad)
  const b2x = cx - bw * Math.cos(perpRad), b2y = cy - bw * Math.sin(perpRad)

  // Zone boundary markers
  const markers = [
    { val: prevYear, label: `$${prevYear}M`, sublabel: "Año ant.", color: "#E62800" },
    { val: budget, label: `$${budget}M`, sublabel: "Meta", color: "#2E7D32" },
  ]

  // Min/Max labels
  const minLabel = `$${min}M`
  const maxLabel = `$${max}M`

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox="0 0 400 220" className="w-full max-w-[320px]" style={{ overflow: "visible" }}>
        <defs>
          <filter id="needleShadow">
            <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodOpacity="0.25" />
          </filter>
          <filter id="arcShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Background arc shadow */}
        <path d={arcPath(0, 180, rOuter + 2, rInner - 2)} fill="#E5E7E9" filter="url(#arcShadow)" />

        {/* 3 Zone arcs */}
        {zones.map((z, i) => (
          <path key={i} d={arcPath(z.start, z.end, rOuter, rInner)} fill={z.color} opacity={0.9} />
        ))}

        {/* Zone boundary markers */}
        {markers.map((m, i) => {
          const pct = (m.val - min) / (max - min)
          const deg = pct * 180
          const rad = ((deg - 90) * Math.PI) / 180
          const x1 = cx + (rOuter + 2) * Math.cos(rad), y1 = cy + (rOuter + 2) * Math.sin(rad)
          const x2 = cx + (rInner - 2) * Math.cos(rad), y2 = cy + (rInner - 2) * Math.sin(rad)
          const labelR = rOuter + 18
          const lx = cx + labelR * Math.cos(rad), ly = cy + labelR * Math.sin(rad)
          return (
            <g key={`marker-${i}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2.5" />
              <text x={lx} y={ly - 5} fontSize="8" fill={m.color} textAnchor="middle" dominantBaseline="middle" fontWeight="700">
                {m.label}
              </text>
              <text x={lx} y={ly + 5} fontSize="6" fill="#999" textAnchor="middle" dominantBaseline="middle">
                {m.sublabel}
              </text>
            </g>
          )
        })}

        {/* Min/Max labels */}
        <text x={cx - rOuter - 5} y={cy + 12} fontSize="8" fill="#CCC" textAnchor="end">{minLabel}</text>
        <text x={cx + rOuter + 5} y={cy + 12} fontSize="8" fill="#CCC" textAnchor="start">{maxLabel}</text>

        {/* Needle */}
        <polygon
          points={`${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`}
          fill="#1A1A1A"
          filter="url(#needleShadow)"
        />

        {/* Pivot */}
        <circle cx={cx} cy={cy} r={10} fill="#333" />
        <circle cx={cx} cy={cy} r={4} fill="#666" />

        {/* Center value — big and bold INSIDE the arc */}
        <text x={cx} y={cy - 20} fontSize="36" fill="#041224" textAnchor="middle" fontWeight="900" fontFamily="Lato, sans-serif">
          ${value < 1000 ? value.toFixed(1) : Math.round(value)}M
        </text>
        <text x={cx} y={cy - 2} fontSize="10" fill="#999" textAnchor="middle">
          de ${budget}M presupuesto
        </text>
      </svg>
    </div>
  )
}
