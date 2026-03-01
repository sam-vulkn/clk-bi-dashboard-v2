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

  // LARGER gauge dimensions
  const cx = 200, cy = 180
  const ro = 160, ri = 110 // Bigger arc (was 140/95)
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
  const nLen = ro + 12
  const tip = { x: cx + nLen * Math.cos(nRad), y: cy + nLen * Math.sin(nRad) }
  const bw = 6
  const b1 = { x: cx + bw * Math.cos(nRad + Math.PI / 2), y: cy + bw * Math.sin(nRad + Math.PI / 2) }
  const b2 = { x: cx - bw * Math.cos(nRad + Math.PI / 2), y: cy - bw * Math.sin(nRad + Math.PI / 2) }

  const GaugeContent = (
    <div className={`w-full h-full flex flex-col items-center justify-center ${clickable ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}>
      <svg viewBox="0 0 400 280" className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Gradients with better textures */}
          <linearGradient id="redZone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="50%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
          <linearGradient id="yellowZone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
          <linearGradient id="greenZone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <filter id="arcShadow">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.2" />
          </filter>
          <filter id="needleShadow">
            <feDropShadow dx="1" dy="3" stdDeviation="3" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Background track with shadow */}
        <path d={descArc(startA, startA + sweepA, ro + 4, ri - 4)} fill="#E0E0E0" filter="url(#arcShadow)" />

        {/* Colored zones - PROMINENT */}
        <path d={descArc(startA, z1e, ro, ri)} fill="url(#redZone)" />
        <path d={descArc(z1e, z2e, ro, ri)} fill="url(#yellowZone)" />
        <path d={descArc(z2e, startA + sweepA, ro, ri)} fill="url(#greenZone)" />

        {/* Inner highlight for depth */}
        <path d={descArc(startA, startA + sweepA, ri + 8, ri)} fill="rgba(255,255,255,0.15)" />

        {/* Zone markers with labels */}
        {(() => {
          const angle = p2a(pyPct)
          const o = toXY(angle, ro + 5), inner = toXY(angle, ri - 5)
          const labelPos = toXY(angle, ro + 25)
          return (
            <g>
              <line x1={o.x} y1={o.y} x2={inner.x} y2={inner.y} stroke="white" strokeWidth="4" />
              <text x={labelPos.x} y={labelPos.y} fontSize="12" fill="#B91C1C" textAnchor="middle" fontWeight="800">
                ${prevYear}M
              </text>
            </g>
          )
        })()}
        
        {(() => {
          const angle = p2a(budPct)
          const o = toXY(angle, ro + 5), inner = toXY(angle, ri - 5)
          const labelPos = toXY(angle, ro + 25)
          return (
            <g>
              <line x1={o.x} y1={o.y} x2={inner.x} y2={inner.y} stroke="white" strokeWidth="4" />
              <text x={labelPos.x} y={labelPos.y} fontSize="12" fill="#166534" textAnchor="middle" fontWeight="800">
                ${budget}M
              </text>
            </g>
          )
        })()}

        {/* Scale markers */}
        <text x={toXY(startA, ro + 20).x} y={toXY(startA, ro + 20).y} fontSize="11" fill="#9CA3AF" textAnchor="middle" fontWeight="600">$0M</text>
        <text x={toXY(startA + sweepA, ro + 20).x} y={toXY(startA + sweepA, ro + 20).y} fontSize="11" fill="#9CA3AF" textAnchor="middle" fontWeight="600">${max}M</text>

        {/* Needle - prominent */}
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#1F2937" filter="url(#needleShadow)" />
        <circle cx={cx} cy={cy} r={14} fill="#374151" />
        <circle cx={cx} cy={cy} r={7} fill="#6B7280" />
        <circle cx={cx} cy={cy} r={3} fill="#9CA3AF" />

        {/* ═══ CENTER VALUE - LARGE, BOLD, WELL SPACED ═══ */}
        <text x={cx} y={cy - 35} fontSize="64" fill="#111827" textAnchor="middle" fontWeight="900" fontFamily="system-ui">
          ${value.toFixed(1)}M
        </text>

        {/* Budget text - SEPARATE LINE, NOT OVERLAPPING */}
        <text x={cx} y={cy + 5} fontSize="16" fill="#6B7280" textAnchor="middle" fontFamily="system-ui">
          de <tspan fill="#111827" fontWeight="800" fontSize="18">${budget}M</tspan> presupuesto
        </text>
      </svg>
      
      {clickable && (
        <div className="text-xs text-gray-500 mt-0 text-center font-medium">
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
