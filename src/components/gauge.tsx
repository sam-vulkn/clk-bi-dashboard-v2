"use client"

import { useEffect, useRef, useState } from "react"

interface GaugeProps {
  value: number       // e.g. 98.5 (millions)
  min?: number        // default 110
  max?: number        // default 140
  budget?: number     // default 129.5
}

export function Gauge({ value, min = 110, max = 140, budget = 129.5 }: GaugeProps) {
  const [animatedAngle, setAnimatedAngle] = useState(-90) // start at LOW
  const startTime = useRef(0)
  const rafRef = useRef(0)

  // Center and radii
  const cx = 200, cy = 210
  const rOuter = 175, rInner = 110
  const bezelR = rOuter + 8

  // Angles: -90 (left/LOW) to 90 (right/CRITICAL) mapped to 180° arc
  const valueToAngle = (v: number) => {
    const clamped = Math.max(min - 15, Math.min(max, v)) // allow below scale
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
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimatedAngle(startAngle + (targetAngle - startAngle) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [targetAngle])

  // 10 segments
  const segmentColors = [
    "#2D7A2D", "#3D9E3D", "#52C052", "#7FD44C", "#C8D430",
    "#F5C518", "#F59518", "#F06820", "#D43B20", "#B01010",
  ]
  const totalAngle = 180
  const gapDeg = 2
  const segAngle = (totalAngle - gapDeg * (segmentColors.length - 1)) / segmentColors.length

  // Helper: arc path for a donut segment
  const arcPath = (startDeg: number, endDeg: number, rOut: number, rIn: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180
    const startRad = toRad(startDeg - 90) // rotate so -90 = left
    const endRad = toRad(endDeg - 90)
    const x1o = cx + rOut * Math.cos(startRad), y1o = cy + rOut * Math.sin(startRad)
    const x2o = cx + rOut * Math.cos(endRad), y2o = cy + rOut * Math.sin(endRad)
    const x1i = cx + rIn * Math.cos(endRad), y1i = cy + rIn * Math.sin(endRad)
    const x2i = cx + rIn * Math.cos(startRad), y2i = cy + rIn * Math.sin(startRad)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M${x1o},${y1o} A${rOut},${rOut} 0 ${large} 1 ${x2o},${y2o} L${x1i},${y1i} A${rIn},${rIn} 0 ${large} 0 ${x2i},${y2i} Z`
  }

  // Bezel arc (outer border)
  const bezelPath = arcPath(0, 180, bezelR, bezelR - 4)

  // Needle
  const needleRad = ((animatedAngle - 90) * Math.PI) / 180 // adjusted
  const needleAngleRad = ((animatedAngle) * Math.PI) / 180 + Math.PI / 2 * 0 // let me recalculate
  // animatedAngle: -90 = left (pointing left), 0 = up, 90 = right
  // Convert to standard: -90 maps to π (left), 0 maps to π/2*3 (up)... 
  // Actually for SVG: angle 0 = right, 90 = down
  // We want: -90 → pointing left, 0 → pointing up, 90 → pointing right
  // In SVG rotation: -90 → rotate(-90) from up = left ✓
  const needleLength = rOuter - 15

  // Needle tip coordinates
  const nRad = ((animatedAngle - 90) * Math.PI) / 180
  const tipX = cx + needleLength * Math.cos(nRad)
  const tipY = cy + needleLength * Math.sin(nRad)

  // Needle base perpendicular (width = 8px)
  const perpRad = nRad + Math.PI / 2
  const bw = 5
  const b1x = cx + bw * Math.cos(perpRad), b1y = cy + bw * Math.sin(perpRad)
  const b2x = cx - bw * Math.cos(perpRad), b2y = cy - bw * Math.sin(perpRad)

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox="0 0 400 250" className="w-full max-w-[320px]">
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

        {/* Segments */}
        {segmentColors.map((color, i) => {
          const start = i * (segAngle + gapDeg)
          const end = start + segAngle
          return <path key={i} d={arcPath(start, end, rOuter, rInner)} fill={color} />
        })}

        {/* Needle */}
        <polygon
          points={`${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`}
          fill="#3D3D3D"
          filter="url(#needleShadow)"
        />

        {/* Pivot circle (metallic) */}
        <circle cx={cx} cy={cy} r={18} fill="url(#pivotGrad)" stroke="#999" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={6} fill="#888" />

        {/* Labels */}
        <text x={cx - rOuter + 10} y={cy + 30} fontSize="11" fontWeight="bold" fill="#111" textAnchor="start">PRIMA NETA</text>
        <text x={cx + rOuter - 10} y={cy + 30} fontSize="11" fontWeight="bold" fill="#111" textAnchor="end">PRESUPUESTO</text>
      </svg>

      {/* Value below */}
      <div className="text-center -mt-2">
        <div className="text-[32px] font-bold text-[#C00000] font-lato leading-none">
          ${value < 1000 ? value.toFixed(1) : (value).toFixed(1)}M
        </div>
        <div className="text-[12px] text-gray-500 mt-0.5">
          de ${budget}M presupuesto
        </div>
      </div>
    </div>
  )
}
