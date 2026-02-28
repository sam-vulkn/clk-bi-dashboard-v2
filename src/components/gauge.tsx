"use client"

import { useEffect, useRef, useState } from "react"

interface GaugeProps {
  value: number
  prevYear?: number
  budget?: number
}

export function Gauge({ value, prevYear = 88.9, budget = 129.5 }: GaugeProps) {
  const [animatedAngle, setAnimatedAngle] = useState(-90)
  const rafRef = useRef(0)

  const min = 0
  const maxVal = Math.max(budget * 1.08, value * 1.15, prevYear * 1.2)
  const max = Math.ceil(maxVal / 5) * 5

  // Full-width SVG centered
  const cx = 250, cy = 210
  const rOuter = 185, rInner = 130

  const valueToAngle = (v: number) => {
    const clamped = Math.max(min, Math.min(max, v))
    return -90 + ((clamped - min) / (max - min)) * 180
  }

  const targetAngle = valueToAngle(value)

  useEffect(() => {
    const duration = 1200
    const start = performance.now()
    const startAngle = -90
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimatedAngle(startAngle + (targetAngle - startAngle) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [targetAngle])

  const pyAngle = ((prevYear - min) / (max - min)) * 180
  const budAngle = ((budget - min) / (max - min)) * 180

  const zones = [
    { start: 0, end: pyAngle, color: "#DC2626" },
    { start: pyAngle, end: budAngle, color: "#EAB308" },
    { start: budAngle, end: 180, color: "#16A34A" },
  ]

  const arc = (s: number, e: number, ro: number, ri: number) => {
    const r = (d: number) => ((d - 90) * Math.PI) / 180
    const sr = r(s), er = r(e)
    const x1 = cx + ro * Math.cos(sr), y1 = cy + ro * Math.sin(sr)
    const x2 = cx + ro * Math.cos(er), y2 = cy + ro * Math.sin(er)
    const x3 = cx + ri * Math.cos(er), y3 = cy + ri * Math.sin(er)
    const x4 = cx + ri * Math.cos(sr), y4 = cy + ri * Math.sin(sr)
    const lg = e - s > 180 ? 1 : 0
    return `M${x1},${y1} A${ro},${ro} 0 ${lg} 1 ${x2},${y2} L${x3},${y3} A${ri},${ri} 0 ${lg} 0 ${x4},${y4} Z`
  }

  // Needle
  const nLen = rOuter - 5
  const nRad = ((animatedAngle - 90) * Math.PI) / 180
  const tipX = cx + nLen * Math.cos(nRad), tipY = cy + nLen * Math.sin(nRad)
  const pRad = nRad + Math.PI / 2, bw = 3.5
  const b1x = cx + bw * Math.cos(pRad), b1y = cy + bw * Math.sin(pRad)
  const b2x = cx - bw * Math.cos(pRad), b2y = cy - bw * Math.sin(pRad)

  // Zone boundary tick marks
  const tick = (val: number, label: string, sublabel: string, col: string) => {
    const pct = (val - min) / (max - min)
    const deg = pct * 180
    const rad = ((deg - 90) * Math.PI) / 180
    const x1 = cx + (rOuter + 1) * Math.cos(rad), y1 = cy + (rOuter + 1) * Math.sin(rad)
    const x2 = cx + (rInner - 1) * Math.cos(rad), y2 = cy + (rInner - 1) * Math.sin(rad)
    // Label outside
    const lr = rOuter + 22
    const lx = cx + lr * Math.cos(rad), ly = cy + lr * Math.sin(rad)
    return (
      <g key={label}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2.5" />
        <text x={lx} y={ly - 4} fontSize="10" fill={col} textAnchor="middle" fontWeight="800" fontFamily="Lato">{label}</text>
        <text x={lx} y={ly + 7} fontSize="7" fill="#AAA" textAnchor="middle">{sublabel}</text>
      </g>
    )
  }

  return (
    <svg viewBox="0 0 500 265" className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="ns"><feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.2" /></filter>
        <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* Background */}
      <path d={arc(0, 180, rOuter + 3, rInner - 3)} fill="#EAEAEA" />

      {/* Zone arcs */}
      {zones.map((z, i) => <path key={i} d={arc(z.start, z.end, rOuter, rInner)} fill={z.color} />)}

      {/* Zone labels inside arc */}
      {(() => {
        const midRed = (0 + pyAngle) / 2
        const midYel = (pyAngle + budAngle) / 2
        const midGrn = (budAngle + 180) / 2
        const midR = (rOuter + rInner) / 2
        const pos = (deg: number) => {
          const rad = ((deg - 90) * Math.PI) / 180
          return { x: cx + midR * Math.cos(rad), y: cy + midR * Math.sin(rad) }
        }
        return (
          <>
            {pyAngle > 25 && <text {...pos(midRed)} fontSize="8" fill="white" textAnchor="middle" dominantBaseline="middle" fontWeight="700" opacity="0.8">BAJO</text>}
            {(budAngle - pyAngle) > 20 && <text {...pos(midYel)} fontSize="8" fill="#333" textAnchor="middle" dominantBaseline="middle" fontWeight="700" opacity="0.7">META</text>}
            {(180 - budAngle) > 15 && <text {...pos(midGrn)} fontSize="8" fill="white" textAnchor="middle" dominantBaseline="middle" fontWeight="700" opacity="0.8">SUPER</text>}
          </>
        )
      })()}

      {/* Boundary ticks */}
      {tick(prevYear, `$${prevYear}M`, "Año ant.", "#DC2626")}
      {tick(budget, `$${budget}M`, "Meta", "#16A34A")}

      {/* Min / Max */}
      <text x={cx - rOuter - 8} y={cy + 14} fontSize="8" fill="#CCC" textAnchor="end">$0</text>
      <text x={cx + rOuter + 8} y={cy + 14} fontSize="8" fill="#CCC" textAnchor="start">${max}M</text>

      {/* Needle */}
      <polygon points={`${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`} fill="#1A1A1A" filter="url(#ns)" />
      <circle cx={cx} cy={cy} r={9} fill="#444" />
      <circle cx={cx} cy={cy} r={3.5} fill="#888" />

      {/* Center value */}
      <text x={cx} y={cy - 30} fontSize="42" fill="#041224" textAnchor="middle" fontWeight="900" fontFamily="Lato, sans-serif">
        ${value < 1000 ? value.toFixed(1) : Math.round(value)}M
      </text>
      <text x={cx} y={cy - 10} fontSize="11" fill="#999" textAnchor="middle" fontFamily="Lato">
        de ${budget}M presupuesto
      </text>
    </svg>
  )
}
