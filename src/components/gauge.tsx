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

  const cx = 200, cy = 180
  const ro = 155, ri = 115
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
  const nLen = ro + 8
  const tip = { x: cx + nLen * Math.cos(nRad), y: cy + nLen * Math.sin(nRad) }
  const pRad = nRad + Math.PI / 2
  const bw = 4
  const b1 = { x: cx + bw * Math.cos(pRad), y: cy + bw * Math.sin(pRad) }
  const b2 = { x: cx - bw * Math.cos(pRad), y: cy - bw * Math.sin(pRad) }
  const tail = { x: cx - 18 * Math.cos(nRad), y: cy - 18 * Math.sin(nRad) }

  // Tick marks with values
  const renderTick = (pctVal: number, label: string, color: string, showLine: boolean) => {
    const angle = p2a(pctVal)
    const outer = toXY(angle, ro + 3)
    const inner = toXY(angle, ri - 3)
    const lblPos = toXY(angle, ro + 20)
    return (
      <g key={label}>
        {showLine && <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="white" strokeWidth="3" />}
        <text x={lblPos.x} y={lblPos.y} fontSize="10" fill={color} textAnchor="middle" dominantBaseline="middle" fontWeight="800" fontFamily="Lato">
          {label}
        </text>
      </g>
    )
  }

  // Scale ticks — every 25% of range
  const scaleTicks = [0, 0.25, 0.5, 0.75, 1].map(p => {
    const val = min + p * (max - min)
    const angle = p2a(p)
    const pos = toXY(angle, ro + 14)
    return (
      <text key={`sc-${p}`} x={pos.x} y={pos.y} fontSize="9" fill="#AAA" textAnchor="middle" dominantBaseline="middle" fontWeight="600">
        ${Math.round(val)}M
      </text>
    )
  })

  // Small tick lines
  const smallTicks = Array.from({ length: 21 }, (_, i) => i / 20).map(p => {
    const angle = p2a(p)
    const isMajor = p % 0.25 === 0
    const outerR = ro + (isMajor ? 4 : 2)
    const innerR = ro - (isMajor ? 6 : 3)
    const o = toXY(angle, outerR), i2 = toXY(angle, innerR)
    return <line key={`t-${p}`} x1={o.x} y1={o.y} x2={i2.x} y2={i2.y} stroke={isMajor ? "#888" : "#CCC"} strokeWidth={isMajor ? 2 : 1} />
  })

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox="0 0 400 260" className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="arcShadow"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.12" /></filter>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#B91C1C" /></linearGradient>
          <linearGradient id="yg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FCD34D" /><stop offset="100%" stopColor="#D97706" /></linearGradient>
          <linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#34D399" /><stop offset="100%" stopColor="#059669" /></linearGradient>
          <filter id="nSh"><feDropShadow dx="1" dy="3" stdDeviation="3" floodOpacity="0.3" /></filter>
          <radialGradient id="pvt" cx="35%" cy="35%"><stop offset="0%" stopColor="#F5F5F5" /><stop offset="60%" stopColor="#AAA" /><stop offset="100%" stopColor="#666" /></radialGradient>
          <filter id="textShadow"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15" /></filter>
        </defs>

        {/* Track background */}
        <path d={descArc(startA, startA + sweepA, ro + 3, ri - 3)} fill="#E8E8E8" filter="url(#arcShadow)" />

        {/* 3 zones */}
        <path d={descArc(startA, z1e, ro, ri)} fill="url(#rg)" />
        <path d={descArc(z1e, z2e, ro, ri)} fill="url(#yg)" />
        <path d={descArc(z2e, startA + sweepA, ro, ri)} fill="url(#gg)" />

        {/* Highlight strip */}
        <path d={descArc(startA, startA + sweepA, ro, ro - 5)} fill="rgba(255,255,255,0.25)" />

        {/* Small tick marks */}
        {smallTicks}

        {/* Scale numbers */}
        {scaleTicks}

        {/* Zone boundary markers with $ values */}
        {renderTick(pyPct, `$${prevYear}M`, "#B91C1C", true)}
        {renderTick(budPct, `$${budget}M`, "#059669", true)}

        {/* Needle */}
        <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" filter="url(#nSh)" />
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#111" />

        {/* Pivot */}
        <circle cx={cx} cy={cy} r={12} fill="url(#pvt)" stroke="#777" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={4} fill="#555" />

        {/* ═══ CENTER VALUE — BOLD & ELEGANT ═══ */}
        <text x={cx} y={cy - 35} fontSize="60" fill="#041224" textAnchor="middle" fontWeight="900" fontFamily="Lato" letterSpacing="-3" filter="url(#textShadow)">
          ${value < 1000 ? value.toFixed(1) : Math.round(value)}M
        </text>
        
        {/* Elegant budget text with styling */}
        <text x={cx} y={cy + 5} textAnchor="middle" fontFamily="Lato">
          <tspan fontSize="13" fill="#888" fontWeight="400">de </tspan>
          <tspan fontSize="18" fill="#041224" fontWeight="800">${budget}M</tspan>
          <tspan fontSize="13" fill="#888" fontWeight="400"> presupuesto</tspan>
        </text>
      </svg>
    </div>
  )
}
