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

  const min = 0
  const max = Math.round(budget * 1.15)

  const cx = 220, cy = 220
  const rOuter = 190, rInner = 140
  const bezelR = rOuter + 6

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

  const needleLength = rOuter - 10
  const nRad = ((animatedAngle - 90) * Math.PI) / 180
  const tipX = cx + needleLength * Math.cos(nRad)
  const tipY = cy + needleLength * Math.sin(nRad)
  const perpRad = nRad + Math.PI / 2
  const bw = 3.5
  const b1x = cx + bw * Math.cos(perpRad), b1y = cy + bw * Math.sin(perpRad)
  const b2x = cx - bw * Math.cos(perpRad), b2y = cy - bw * Math.sin(perpRad)

  // Boundary markers
  const markers = [
    { val: prevYear, label: `$${prevYear}M`, color: "#E62800" },
    { val: budget, label: `$${budget}M`, color: "#2E7D32" },
  ]

  return (
    <div className="w-full flex flex-col items-center" style={{ minHeight: 280 }}>
      <svg viewBox="0 0 440 260" className="w-full" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="pivotGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E0E0E0" />
            <stop offset="100%" stopColor="#B0B0B0" />
          </radialGradient>
          <filter id="needleShadow">
            <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Thin bezel */}
        <path d={arcPath(0, 180, bezelR, rOuter + 1)} fill="#5A5A5A" />

        {/* 3 Zone arcs */}
        {zones.map((z, i) => (
          <path key={i} d={arcPath(z.start, z.end, rOuter, rInner)} fill={z.color} opacity={0.85} />
        ))}

        {/* Boundary markers — thin lines with labels OUTSIDE */}
        {markers.map((m, i) => {
          const pct = (m.val - min) / (max - min)
          const deg = pct * 180
          const rad = ((deg - 90) * Math.PI) / 180
          const x1 = cx + rOuter * Math.cos(rad), y1 = cy + rOuter * Math.sin(rad)
          const x2 = cx + rInner * Math.cos(rad), y2 = cy + rInner * Math.sin(rad)
          const labelR = rOuter + 20
          const lx = cx + labelR * Math.cos(rad), ly = cy + labelR * Math.sin(rad)
          return (
            <g key={`marker-${i}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth="1.5" />
              <text x={lx} y={ly} fontSize="9" fill={m.color} textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
                {m.label}
              </text>
            </g>
          )
        })}

        {/* Needle — thinner, refined */}
        <polygon
          points={`${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`}
          fill="#3D3D3D"
          filter="url(#needleShadow)"
        />

        {/* Pivot */}
        <circle cx={cx} cy={cy} r={14} fill="url(#pivotGrad)" stroke="#999" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={5} fill="#888" />
      </svg>

      <div className="text-center -mt-6">
        <div className="text-[48px] font-black text-[#041224] leading-none">
          ${value.toFixed(1)}M
        </div>
        <div className="text-[13px] text-gray-400 mt-1">
          de ${budget}M presupuesto
        </div>
      </div>
    </div>
  )
}
