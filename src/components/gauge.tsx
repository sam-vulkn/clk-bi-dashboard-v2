"use client"

import { useEffect, useRef, useState } from "react"

interface GaugeProps {
  value: number        // Current value in $M
  prevYear?: number    // PN Año Anterior in $M
  budget?: number      // Presupuesto in $M
}

export function Gauge({ value, prevYear = 88.9, budget = 129.5 }: GaugeProps) {
  const [animatedAngle, setAnimatedAngle] = useState(-90)
  const startTime = useRef(0)
  const rafRef = useRef(0)

  // Range: from 0 to budget * 1.15 (some headroom above budget)
  const min = 0
  const max = Math.round(budget * 1.15)

  const cx = 220, cy = 230
  const rOuter = 200, rInner = 130
  const bezelR = rOuter + 10

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

  // 3 zones: RED (0 → prevYear), YELLOW (prevYear → budget), GREEN (budget → max)
  const prevYearAngle = ((prevYear - min) / (max - min)) * 180
  const budgetAngle = ((budget - min) / (max - min)) * 180
  const maxAngle = 180

  const zones = [
    { start: 0, end: prevYearAngle, color: "#E62800" },           // RED
    { start: prevYearAngle, end: budgetAngle, color: "#F5C518" },  // YELLOW
    { start: budgetAngle, end: maxAngle, color: "#2D7A2D" },       // GREEN
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

  // Tick marks with money labels
  const tickCount = 6
  const tickValues: number[] = []
  for (let i = 0; i <= tickCount; i++) {
    tickValues.push(Math.round(min + (max - min) * (i / tickCount)))
  }

  const needleLength = rOuter - 15
  const nRad = ((animatedAngle - 90) * Math.PI) / 180
  const tipX = cx + needleLength * Math.cos(nRad)
  const tipY = cy + needleLength * Math.sin(nRad)
  const perpRad = nRad + Math.PI / 2
  const bw = 6
  const b1x = cx + bw * Math.cos(perpRad), b1y = cy + bw * Math.sin(perpRad)
  const b2x = cx - bw * Math.cos(perpRad), b2y = cy - bw * Math.sin(perpRad)

  return (
    <div className="w-full flex flex-col items-center" style={{ minHeight: 300 }}>
      <svg viewBox="0 0 440 280" className="w-full" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="pivotGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E0E0E0" />
            <stop offset="100%" stopColor="#B0B0B0" />
          </radialGradient>
          <filter id="needleShadow">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Bezel */}
        <path d={arcPath(0, 180, bezelR, rOuter + 1)} fill="#4A4A4A" />

        {/* 3 Zone arcs */}
        {zones.map((z, i) => (
          <path key={i} d={arcPath(z.start, z.end, rOuter, rInner)} fill={z.color} />
        ))}

        {/* Tick marks + money labels */}
        {tickValues.map((tv, i) => {
          const pct = (tv - min) / (max - min)
          const deg = pct * 180
          const rad = ((deg - 90) * Math.PI) / 180
          const tickOuter = rOuter + 2
          const tickInner = rOuter - 8
          const x1 = cx + tickOuter * Math.cos(rad), y1 = cy + tickOuter * Math.sin(rad)
          const x2 = cx + tickInner * Math.cos(rad), y2 = cy + tickInner * Math.sin(rad)
          const labelR = rOuter + 22
          const lx = cx + labelR * Math.cos(rad), ly = cy + labelR * Math.sin(rad)
          const label = tv >= 1000 ? `$${(tv / 1000).toFixed(0)}B` : `$${tv}M`
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#666" strokeWidth="1.5" />
              <text x={lx} y={ly} fontSize="9" fill="#666" textAnchor="middle" dominantBaseline="middle">{label}</text>
            </g>
          )
        })}

        {/* Zone boundary labels */}
        {[
          { val: prevYear, label: "PN Año Ant", color: "#E62800" },
          { val: budget, label: "Presupuesto", color: "#2D7A2D" },
        ].map((marker, i) => {
          const pct = (marker.val - min) / (max - min)
          const deg = pct * 180
          const rad = ((deg - 90) * Math.PI) / 180
          const lr = rInner - 18
          const lx = cx + lr * Math.cos(rad), ly = cy + lr * Math.sin(rad)
          return (
            <g key={`marker-${i}`}>
              <line
                x1={cx + rOuter * Math.cos(rad)} y1={cy + rOuter * Math.sin(rad)}
                x2={cx + rInner * Math.cos(rad)} y2={cy + rInner * Math.sin(rad)}
                stroke="#333" strokeWidth="2"
              />
              <text x={lx} y={ly} fontSize="8" fill={marker.color} textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
                ${marker.val}M
              </text>
            </g>
          )
        })}

        {/* Needle */}
        <polygon
          points={`${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`}
          fill="#3D3D3D"
          filter="url(#needleShadow)"
        />

        {/* Pivot circle (metallic) */}
        <circle cx={cx} cy={cy} r={20} fill="url(#pivotGrad)" stroke="#999" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={7} fill="#888" />
      </svg>

      <div className="text-center -mt-3">
        <div className="text-[36px] font-black text-[#E62800] leading-none">
          ${value.toFixed(1)}M
        </div>
        <div className="text-[13px] text-[#CCD1D3] mt-1">
          de ${budget}M presupuesto
        </div>
      </div>
    </div>
  )
}
