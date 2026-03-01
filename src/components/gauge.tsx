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

  // Scale like Power BI - adjusted to data range
  const min = Math.floor(Math.min(value, prevYear) * 0.7 / 10) * 10 // Start lower
  const max = Math.ceil(Math.max(budget, value) * 1.1 / 10) * 10 // End higher
  
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

  const cx = 180, cy = 165
  const ro = 140, ri = 90
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

  // Generate scale marks every $5M like Power BI
  const scaleMarks: number[] = []
  for (let v = min; v <= max; v += 5) {
    scaleMarks.push(v)
  }

  const GaugeContent = (
    <div className={`w-full h-full flex flex-col items-center justify-center ${clickable ? 'cursor-pointer hover:scale-[1.01] transition-transform' : ''}`}>
      <svg viewBox="0 0 360 260" className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="redZone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C53030" />
            <stop offset="100%" stopColor="#FC8181" />
          </linearGradient>
          <linearGradient id="yellowZone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D69E2E" />
            <stop offset="100%" stopColor="#F6E05E" />
          </linearGradient>
          <linearGradient id="greenZone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#276749" />
            <stop offset="100%" stopColor="#68D391" />
          </linearGradient>
          <filter id="arcShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
          </filter>
          <filter id="needleShadow">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Background track */}
        <path d={descArc(startA, startA + sweepA, ro + 2, ri - 2)} fill="#E2E8F0" filter="url(#arcShadow)" />

        {/* Colored zones - THICK */}
        <path d={descArc(startA, z1e, ro, ri)} fill="url(#redZone)" />
        <path d={descArc(z1e, z2e, ro, ri)} fill="url(#yellowZone)" />
        <path d={descArc(z2e, startA + sweepA, ro, ri)} fill="url(#greenZone)" />

        {/* SCALE LABELS around arc - Like Power BI every $5M */}
        {scaleMarks.map((val, i) => {
          const pctVal = (val - min) / (max - min)
          const angle = p2a(pctVal)
          const pos = toXY(angle, ro + 18)
          const isKey = val === Math.round(prevYear) || val === Math.round(budget)
          const isBudget = Math.abs(val - budget) < 3
          const isPrevYear = Math.abs(val - prevYear) < 3
          
          return (
            <g key={i}>
              {/* Tick mark */}
              <line 
                x1={toXY(angle, ro).x} y1={toXY(angle, ro).y}
                x2={toXY(angle, ri).x} y2={toXY(angle, ri).y}
                stroke={isKey ? "white" : "#CBD5E0"} 
                strokeWidth={isKey ? 2 : 1} 
              />
              {/* Label */}
              <text 
                x={pos.x} y={pos.y} 
                fontSize={isBudget || isPrevYear ? "10" : "9"} 
                fill={isPrevYear ? "#C53030" : isBudget ? "#276749" : "#718096"}
                textAnchor="middle" 
                fontWeight={isBudget || isPrevYear ? "700" : "500"}
              >
                ${val}.0M
              </text>
            </g>
          )
        })}

        {/* Needle */}
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#2D3748" filter="url(#needleShadow)" />
        <circle cx={cx} cy={cy} r={10} fill="#4A5568" />
        <circle cx={cx} cy={cy} r={5} fill="#718096" />

        {/* CENTER VALUE - Large like Power BI */}
        <text x={cx} y={cy + 45} fontSize="42" fill="#1A202C" textAnchor="middle" fontWeight="900" fontFamily="system-ui">
          ${value.toFixed(1)}M
        </text>
      </svg>
      
      {clickable && (
        <div className="text-[10px] text-gray-400 text-center -mt-2">
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
