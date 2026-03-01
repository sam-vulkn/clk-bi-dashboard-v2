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
    const dur = 1200, t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1)
      setAnim(pct * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [pct])

  const cx = 200, cy = 170
  const ro = 140, ri = 95
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

  const GaugeContent = (
    <div className={`w-full h-full flex flex-col items-center justify-center ${clickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}>
      <svg viewBox="0 0 400 260" className="w-full max-w-[400px]" preserveAspectRatio="xMidYMid meet">
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
          <filter id="needleShadow"><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" /></filter>
          <filter id="textGlow"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.1" /></filter>
        </defs>

        {/* Background track */}
        <path d={descArc(startA, startA + sweepA, ro + 3, ri - 3)} fill="#E5E7EB" />

        {/* Colored zones */}
        <path d={descArc(startA, z1e, ro, ri)} fill="url(#redZone)" />
        <path d={descArc(z1e, z2e, ro, ri)} fill="url(#yellowZone)" />
        <path d={descArc(z2e, startA + sweepA, ro, ri)} fill="url(#greenZone)" />

        {/* Zone labels with values */}
        {/* Año Anterior marker */}
        {(() => {
          const angle = p2a(pyPct)
          const o = toXY(angle, ro + 4), inner = toXY(angle, ri - 4)
          const labelPos = toXY(angle, ro + 22)
          return (
            <g>
              <line x1={o.x} y1={o.y} x2={inner.x} y2={inner.y} stroke="white" strokeWidth="3" />
              <text x={labelPos.x} y={labelPos.y} fontSize="11" fill="#991B1B" textAnchor="middle" fontWeight="700">
                ${prevYear}M
              </text>
            </g>
          )
        })()}
        
        {/* Presupuesto marker */}
        {(() => {
          const angle = p2a(budPct)
          const o = toXY(angle, ro + 4), inner = toXY(angle, ri - 4)
          const labelPos = toXY(angle, ro + 22)
          return (
            <g>
              <line x1={o.x} y1={o.y} x2={inner.x} y2={inner.y} stroke="white" strokeWidth="3" />
              <text x={labelPos.x} y={labelPos.y} fontSize="11" fill="#166534" textAnchor="middle" fontWeight="700">
                ${budget}M
              </text>
            </g>
          )
        })()}

        {/* Scale markers */}
        <text x={toXY(startA, ro + 18).x} y={toXY(startA, ro + 18).y} fontSize="10" fill="#9CA3AF" textAnchor="middle">$0M</text>
        <text x={toXY(startA + sweepA, ro + 18).x} y={toXY(startA + sweepA, ro + 18).y} fontSize="10" fill="#9CA3AF" textAnchor="middle">${max}M</text>

        {/* Needle */}
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#1F2937" filter="url(#needleShadow)" />
        <circle cx={cx} cy={cy} r={12} fill="#374151" />
        <circle cx={cx} cy={cy} r={6} fill="#6B7280" />

        {/* ═══ CENTER VALUE - LARGE & PROMINENT ═══ */}
        <text x={cx} y={cy - 25} fontSize="56" fill="#111827" textAnchor="middle" fontWeight="900" fontFamily="system-ui" filter="url(#textGlow)">
          ${value.toFixed(1)}M
        </text>

        {/* Budget info - elegant layout */}
        <text x={cx} y={cy + 12} fontSize="15" fill="#6B7280" textAnchor="middle" fontFamily="system-ui">
          de <tspan fill="#111827" fontWeight="800" fontSize="17">${budget}M</tspan> presupuesto
        </text>
        
        {/* Zone legend at bottom */}
        <g transform="translate(200, 245)">
          <rect x="-120" y="-8" width="16" height="10" rx="2" fill="#EF4444" />
          <text x="-100" y="0" fontSize="9" fill="#666" dominantBaseline="middle">Año Ant.</text>
          <rect x="-40" y="-8" width="16" height="10" rx="2" fill="#FBBF24" />
          <text x="-20" y="0" fontSize="9" fill="#666" dominantBaseline="middle">En Meta</text>
          <rect x="40" y="-8" width="16" height="10" rx="2" fill="#34D399" />
          <text x="60" y="0" fontSize="9" fill="#666" dominantBaseline="middle">Arriba</text>
        </g>
      </svg>
      
      {clickable && (
        <div className="text-[10px] text-gray-400 mt-1 text-center">
          Click para ver detalle →
        </div>
      )}
    </div>
  )

  if (clickable) {
    return <Link href="/tabla-detalle" className="block w-full h-full">{GaugeContent}</Link>
  }
  
  return GaugeContent
}
