"use client"

import { useEffect, useRef, useState } from "react"

interface GaugeProps {
  value: number
  prevYear?: number
  budget?: number
}

export function Gauge({ value, prevYear = 88.9, budget = 129.5 }: GaugeProps) {
  const [anim, setAnim] = useState(0)
  const raf = useRef(0)

  // Smart range: adapt to actual values — never let needle be invisible
  const min = 0
  // Max = whichever is biggest × 1.15, rounded up
  const rawMax = Math.max(budget, prevYear, value) * 1.15
  const max = Math.ceil(rawMax / 10) * 10 // round to nearest 10

  const pct = Math.max(0.02, Math.min(0.98, (value - min) / (max - min))) // clamp 2-98%
  const pyPct = Math.max(0, Math.min(1, (prevYear - min) / (max - min)))
  const budPct = Math.max(0, Math.min(1, (budget - min) / (max - min)))

  useEffect(() => {
    const dur = 1400, t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      setAnim(pct * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [pct])

  const cx = 200, cy = 175
  const ro = 145, ri = 105
  const startA = 150, sweepA = 240 // 240° arc

  const toXY = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const descArc = (s: number, e: number, rOut: number, rIn: number) => {
    const p1 = toXY(s, rOut), p2 = toXY(e, rOut), p3 = toXY(e, rIn), p4 = toXY(s, rIn)
    const lg = (e - s) > 180 ? 1 : 0
    return `M${p1.x},${p1.y} A${rOut},${rOut} 0 ${lg} 1 ${p2.x},${p2.y} L${p3.x},${p3.y} A${rIn},${rIn} 0 ${lg} 0 ${p4.x},${p4.y} Z`
  }

  const p2a = (p: number) => startA + p * sweepA

  // Zone angles
  const z1e = p2a(pyPct), z2e = p2a(budPct)

  // Needle
  const na = p2a(anim)
  const nRad = (na * Math.PI) / 180
  const nLen = ro + 6
  const tip = { x: cx + nLen * Math.cos(nRad), y: cy + nLen * Math.sin(nRad) }
  const pRad = nRad + Math.PI / 2
  const bw = 3.5
  const b1 = { x: cx + bw * Math.cos(pRad), y: cy + bw * Math.sin(pRad) }
  const b2 = { x: cx - bw * Math.cos(pRad), y: cy - bw * Math.sin(pRad) }
  const tail = { x: cx - 15 * Math.cos(nRad), y: cy - 15 * Math.sin(nRad) }

  // Tick marks with values
  const renderTick = (pctVal: number, label: string, color: string, showLine: boolean) => {
    const angle = p2a(pctVal)
    const outer = toXY(angle, ro + 2)
    const inner = toXY(angle, ri - 2)
    const lblPos = toXY(angle, ro + 16)
    return (
      <g key={label}>
        {showLine && <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="white" strokeWidth="2.5" />}
        <text x={lblPos.x} y={lblPos.y} fontSize="9" fill={color} textAnchor="middle" dominantBaseline="middle" fontWeight="800" fontFamily="Lato">
          {label}
        </text>
      </g>
    )
  }

  // Scale ticks — every 25% of range
  const scaleTicks = [0, 0.25, 0.5, 0.75, 1].map(p => {
    const val = min + p * (max - min)
    const angle = p2a(p)
    const pos = toXY(angle, ro + 10)
    return (
      <text key={`sc-${p}`} x={pos.x} y={pos.y} fontSize="7" fill="#BBB" textAnchor="middle" dominantBaseline="middle">
        ${Math.round(val)}M
      </text>
    )
  })

  // Small tick lines
  const smallTicks = Array.from({ length: 21 }, (_, i) => i / 20).map(p => {
    const angle = p2a(p)
    const isMajor = p % 0.25 === 0
    const outerR = ro + (isMajor ? 3 : 1)
    const innerR = ro - (isMajor ? 5 : 2)
    const o = toXY(angle, outerR), i2 = toXY(angle, innerR)
    return <line key={`t-${p}`} x1={o.x} y1={o.y} x2={i2.x} y2={i2.y} stroke={isMajor ? "#999" : "#CCC"} strokeWidth={isMajor ? 1.5 : 0.7} />
  })

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox="25 10 350 220" className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="arcShadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.1" /></filter>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#B91C1C" /></linearGradient>
          <linearGradient id="yg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FCD34D" /><stop offset="100%" stopColor="#D97706" /></linearGradient>
          <linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#34D399" /><stop offset="100%" stopColor="#059669" /></linearGradient>
          <filter id="nSh"><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.25" /></filter>
          <radialGradient id="pvt" cx="35%" cy="35%"><stop offset="0%" stopColor="#EEE" /><stop offset="60%" stopColor="#999" /><stop offset="100%" stopColor="#555" /></radialGradient>
        </defs>

        {/* Track background */}
        <path d={descArc(startA, startA + sweepA, ro + 2, ri - 2)} fill="#E5E5E5" filter="url(#arcShadow)" />

        {/* 3 zones */}
        <path d={descArc(startA, z1e, ro, ri)} fill="url(#rg)" />
        <path d={descArc(z1e, z2e, ro, ri)} fill="url(#yg)" />
        <path d={descArc(z2e, startA + sweepA, ro, ri)} fill="url(#gg)" />

        {/* Highlight strip */}
        <path d={descArc(startA, startA + sweepA, ro, ro - 4)} fill="rgba(255,255,255,0.2)" />

        {/* Small tick marks */}
        {smallTicks}

        {/* Scale numbers */}
        {scaleTicks}

        {/* Zone boundary markers with $ values */}
        {renderTick(pyPct, `$${prevYear}M`, "#B91C1C", true)}
        {renderTick(budPct, `$${budget}M`, "#059669", true)}

        {/* Needle */}
        <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" filter="url(#nSh)" />
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#111" />

        {/* Pivot */}
        <circle cx={cx} cy={cy} r={10} fill="url(#pvt)" stroke="#888" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={3} fill="#666" />

        {/* Center value */}
        <text x={cx} y={cy - 25} fontSize="34" fill="#041224" textAnchor="middle" fontWeight="900" fontFamily="Lato">
          ${value < 1000 ? value.toFixed(1) : Math.round(value)}M
        </text>
        <text x={cx} y={cy - 8} fontSize="10" fill="#999" textAnchor="middle" fontFamily="Lato">
          de ${budget}M presupuesto
        </text>
      </svg>
    </div>
  )
}
