"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

interface GaugeProps {
  value: number
  prevYear?: number
  budget?: number
  clickable?: boolean
}

export function Gauge({ value, prevYear = 88.9, budget = 129.5, clickable = true }: GaugeProps) {
  const [anim, setAnim] = useState(0)
  const raf = useRef(0)

  const min = 0
  const rawMax = Math.max(budget, prevYear, value) * 1.15
  const max = Math.ceil(rawMax / 10) * 10

  const pct = Math.max(0.02, Math.min(0.98, (value - min) / (max - min)))
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
  const ro = 150, ri = 100
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
  const nLen = ro + 10
  const tip = { x: cx + nLen * Math.cos(nRad), y: cy + nLen * Math.sin(nRad) }
  const bw = 5
  const b1 = { x: cx + bw * Math.cos(nRad + Math.PI / 2), y: cy + bw * Math.sin(nRad + Math.PI / 2) }
  const b2 = { x: cx - bw * Math.cos(nRad + Math.PI / 2), y: cy - bw * Math.sin(nRad + Math.PI / 2) }

  // SCALE MARKERS - Like Power BI with multiple values around arc
  const scaleValues = [0, 38, 75, Math.round(prevYear), 113, Math.round(budget), max]
  const uniqueScales = Array.from(new Set(scaleValues)).sort((a, b) => a - b)

  const GaugeContent = (
    <div className={`w-full h-full flex flex-col items-center justify-center ${clickable ? 'cursor-pointer hover:scale-[1.01] transition-transform' : ''}`}>
      <svg viewBox="0 0 400 270" className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="redZone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C53030" />
            <stop offset="100%" stopColor="#F56565" />
          </linearGradient>
          <linearGradient id="yellowZone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C05621" />
            <stop offset="100%" stopColor="#ECC94B" />
          </linearGradient>
          <linearGradient id="greenZone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#276749" />
            <stop offset="100%" stopColor="#48BB78" />
          </linearGradient>
          <filter id="arcShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
          <filter id="needleShadow">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Background track */}
        <path d={descArc(startA, startA + sweepA, ro + 3, ri - 3)} fill="#E2E8F0" filter="url(#arcShadow)" />

        {/* Colored zones - THICK and PROMINENT */}
        <path d={descArc(startA, z1e, ro, ri)} fill="url(#redZone)" />
        <path d={descArc(z1e, z2e, ro, ri)} fill="url(#yellowZone)" />
        <path d={descArc(z2e, startA + sweepA, ro, ri)} fill="url(#greenZone)" />

        {/* Inner highlight */}
        <path d={descArc(startA, startA + sweepA, ri + 6, ri)} fill="rgba(255,255,255,0.2)" />

        {/* SCALE LABELS around arc - Like Power BI */}
        {uniqueScales.map((val, i) => {
          const pctVal = (val - min) / (max - min)
          const angle = p2a(pctVal)
          const pos = toXY(angle, ro + 22)
          const isKey = val === Math.round(prevYear) || val === Math.round(budget)
          return (
            <g key={i}>
              {/* Tick mark */}
              <line 
                x1={toXY(angle, ro + 2).x} y1={toXY(angle, ro + 2).y}
                x2={toXY(angle, ri - 2).x} y2={toXY(angle, ri - 2).y}
                stroke={isKey ? "white" : "#CBD5E0"} 
                strokeWidth={isKey ? 3 : 1} 
              />
              {/* Label */}
              <text 
                x={pos.x} y={pos.y} 
                fontSize={isKey ? "11" : "9"} 
                fill={val === Math.round(prevYear) ? "#C53030" : val === Math.round(budget) ? "#276749" : "#718096"}
                textAnchor="middle" 
                fontWeight={isKey ? "800" : "600"}
              >
                ${val}M
              </text>
            </g>
          )
        })}

        {/* Needle */}
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#2D3748" filter="url(#needleShadow)" />
        <circle cx={cx} cy={cy} r={12} fill="#4A5568" />
        <circle cx={cx} cy={cy} r={6} fill="#718096" />

        {/* CENTER VALUE - LARGE */}
        <text x={cx} y={cy - 30} fontSize="58" fill="#1A202C" textAnchor="middle" fontWeight="900" fontFamily="system-ui">
          ${value.toFixed(1)}M
        </text>

        {/* Budget text - CLEAN */}
        <text x={cx} y={cy + 8} fontSize="14" fill="#718096" textAnchor="middle" fontFamily="system-ui">
          de <tspan fill="#1A202C" fontWeight="800" fontSize="16">${budget}M</tspan> presupuesto
        </text>
      </svg>
      
      {clickable && (
        <div className="text-[10px] text-gray-500 text-center">
          Click para detalle →
        </div>
      )}
    </div>
  )

  if (clickable) {
    return <Link href="/tabla-detalle" className="block w-full h-full">{GaugeContent}</Link>
  }
  
  return GaugeContent
}
