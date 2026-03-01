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
  const max = Math.ceil(Math.max(budget * 1.08, value * 1.15) / 5) * 5
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const pyPct = (prevYear - min) / (max - min)
  const budPct = (budget - min) / (max - min)

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

  // Arc geometry — 240° sweep (from 150° to 390°)
  const cx = 200, cy = 185, r = 150, sw = 28
  const startAngle = 150, endAngle = 390, sweep = 240

  const toXY = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  const describeArc = (start: number, end: number, ro: number, ri: number) => {
    const s1 = toXY(start, ro), e1 = toXY(end, ro)
    const s2 = toXY(end, ri), e2 = toXY(start, ri)
    const large = (end - start) > 180 ? 1 : 0
    return `M${s1.x},${s1.y} A${ro},${ro} 0 ${large} 1 ${e1.x},${e1.y} L${s2.x},${s2.y} A${ri},${ri} 0 ${large} 0 ${e2.x},${e2.y} Z`
  }

  const pctToAngle = (p: number) => startAngle + p * sweep
  const ro = r, ri = r - sw

  // Zone arcs
  const z1End = pctToAngle(pyPct)
  const z2End = pctToAngle(budPct)

  // Needle
  const needleAngle = pctToAngle(anim)
  const nRad = (needleAngle * Math.PI) / 180
  const nLen = r + 8
  const tipX = cx + nLen * Math.cos(nRad), tipY = cy + nLen * Math.sin(nRad)
  const bw = 4
  const pRad = nRad + Math.PI / 2
  const b1 = { x: cx + bw * Math.cos(pRad), y: cy + bw * Math.sin(pRad) }
  const b2 = { x: cx - bw * Math.cos(pRad), y: cy - bw * Math.sin(pRad) }
  // Tail
  const tailLen = 20
  const tx = cx - tailLen * Math.cos(nRad), ty = cy - tailLen * Math.sin(nRad)

  // Zone boundary markers
  const marker = (p: number, label: string, color: string) => {
    const angle = pctToAngle(p)
    const outer = toXY(angle, ro + 2), inner = toXY(angle, ri - 2)
    const lbl = toXY(angle, ro + 18)
    return (
      <g key={label}>
        <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="white" strokeWidth="3" />
        <text x={lbl.x} y={lbl.y} fontSize="9" fill={color} textAnchor="middle" dominantBaseline="middle" fontWeight="800" fontFamily="Lato">{label}</text>
      </g>
    )
  }

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox="30 20 340 220" className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* 3D depth shadow under the arc */}
          <filter id="arcDepth">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.12" />
          </filter>
          {/* Inner shadow for 3D feel */}
          <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
          <linearGradient id="yelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id="grnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <filter id="needleShadow">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
          <radialGradient id="pivotMetal" cx="35%" cy="35%">
            <stop offset="0%" stopColor="#F0F0F0" />
            <stop offset="50%" stopColor="#999" />
            <stop offset="100%" stopColor="#555" />
          </radialGradient>
        </defs>

        {/* Background track */}
        <path d={describeArc(startAngle, endAngle, ro + 3, ri - 3)} fill="#E8E8E8" filter="url(#arcDepth)" />

        {/* 3 Zone arcs with gradients */}
        <path d={describeArc(startAngle, z1End, ro, ri)} fill="url(#redGrad)" />
        <path d={describeArc(z1End, z2End, ro, ri)} fill="url(#yelGrad)" />
        <path d={describeArc(z2End, endAngle, ro, ri)} fill="url(#grnGrad)" />

        {/* Thin highlight on outer edge for 3D */}
        <path d={describeArc(startAngle, endAngle, ro, ro - 3)} fill="rgba(255,255,255,0.25)" />

        {/* Zone boundaries */}
        {marker(pyPct, `$${prevYear}M`, "#DC2626")}
        {marker(budPct, `$${budget}M`, "#16A34A")}

        {/* Scale labels at start/end */}
        {(() => {
          const s = toXY(startAngle, ro + 16)
          const e = toXY(endAngle, ro + 16)
          return (
            <>
              <text x={s.x} y={s.y} fontSize="8" fill="#BBB" textAnchor="middle">$0</text>
              <text x={e.x} y={e.y} fontSize="8" fill="#BBB" textAnchor="middle">${max}M</text>
            </>
          )
        })()}

        {/* Needle with tail — metallic feel */}
        <line x1={tx} y1={ty} x2={tipX} y2={tipY} stroke="#222" strokeWidth="3" strokeLinecap="round" filter="url(#needleShadow)" />
        <polygon points={`${tipX},${tipY} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#1A1A1A" filter="url(#needleShadow)" />

        {/* Metallic pivot */}
        <circle cx={cx} cy={cy} r={12} fill="url(#pivotMetal)" stroke="#777" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={4} fill="#555" />

        {/* Value in center */}
        <text x={cx} y={cy - 32} fontSize="38" fill="#041224" textAnchor="middle" fontWeight="900" fontFamily="Lato, sans-serif">
          ${value < 1000 ? value.toFixed(1) : Math.round(value)}M
        </text>
        <text x={cx} y={cy - 14} fontSize="10" fill="#AAA" textAnchor="middle" fontFamily="Lato">
          de ${budget}M presupuesto
        </text>
      </svg>
    </div>
  )
}
