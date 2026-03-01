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

  const min = 0
  const rawMax = Math.max(budget, prevYear, value) * 1.15
  const max = Math.ceil(rawMax / 10) * 10

  const pct = Math.max(0.02, Math.min(0.98, (value - min) / (max - min)))
  const pyPct = Math.max(0, Math.min(1, (prevYear - min) / (max - min)))
  const budPct = Math.max(0, Math.min(1, (budget - min) / (max - min)))

  useEffect(() => {
    const dur = 1200, t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      setAnim(pct * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [pct])

  const cx = 180, cy = 160
  const ro = 130, ri = 90
  const startA = 150, sweepA = 240

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
  const z1e = p2a(pyPct), z2e = p2a(budPct)

  // Needle
  const na = p2a(anim)
  const nRad = (na * Math.PI) / 180
  const nLen = ro + 8
  const tip = { x: cx + nLen * Math.cos(nRad), y: cy + nLen * Math.sin(nRad) }
  const bw = 4
  const b1 = { x: cx + bw * Math.cos(nRad + Math.PI / 2), y: cy + bw * Math.sin(nRad + Math.PI / 2) }
  const b2 = { x: cx - bw * Math.cos(nRad + Math.PI / 2), y: cy - bw * Math.sin(nRad + Math.PI / 2) }

  // Scale labels at key points
  const scaleLabels = [
    { pct: 0, label: "$0M" },
    { pct: pyPct, label: `$${prevYear}M`, color: "#991B1B" },
    { pct: budPct, label: `$${budget}M`, color: "#166534" },
    { pct: 1, label: `$${max}M` },
  ]

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2">
      <svg viewBox="0 0 360 220" className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="redZone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          <linearGradient id="yellowZone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
          <linearGradient id="greenZone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" /></filter>
        </defs>

        {/* Background track */}
        <path d={descArc(startA, startA + sweepA, ro + 2, ri - 2)} fill="#E5E7EB" />

        {/* Colored zones - VIBRANT */}
        <path d={descArc(startA, z1e, ro, ri)} fill="url(#redZone)" />
        <path d={descArc(z1e, z2e, ro, ri)} fill="url(#yellowZone)" />
        <path d={descArc(z2e, startA + sweepA, ro, ri)} fill="url(#greenZone)" />

        {/* Zone markers - white lines */}
        {[pyPct, budPct].map((pctVal, i) => {
          const angle = p2a(pctVal)
          const o = toXY(angle, ro + 3), inner = toXY(angle, ri - 3)
          return <line key={i} x1={o.x} y1={o.y} x2={inner.x} y2={inner.y} stroke="white" strokeWidth="3" />
        })}

        {/* Scale labels outside the arc */}
        {scaleLabels.map((s, i) => {
          const angle = p2a(s.pct)
          const pos = toXY(angle, ro + 18)
          return (
            <text key={i} x={pos.x} y={pos.y} fontSize="11" fill={s.color || "#6B7280"} 
              textAnchor="middle" dominantBaseline="middle" fontWeight="700">
              {s.label}
            </text>
          )
        })}

        {/* Needle */}
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#1F2937" filter="url(#shadow)" />
        <circle cx={cx} cy={cy} r={10} fill="#374151" />
        <circle cx={cx} cy={cy} r={5} fill="#6B7280" />

        {/* Center value - BIG and BOLD */}
        <text x={cx} y={cy - 20} fontSize="48" fill="#111827" textAnchor="middle" fontWeight="900" fontFamily="system-ui">
          ${value.toFixed(1)}M
        </text>

        {/* Budget text - PROPERLY SPACED */}
        <text x={cx} y={cy + 15} fontSize="14" fill="#6B7280" textAnchor="middle" fontFamily="system-ui">
          de <tspan fill="#111827" fontWeight="700">${budget}M</tspan> presupuesto
        </text>
      </svg>
    </div>
  )
}
