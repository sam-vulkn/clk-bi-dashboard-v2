"use client"

import { useEffect, useRef, useState } from "react"

interface GaugeProps {
  value: number
  min?: number
  max?: number
  budget?: number
}

export function Gauge({ value, min = 110, max = 140, budget = 129.5 }: GaugeProps) {
  const [animatedAngle, setAnimatedAngle] = useState(-90)
  const startTime = useRef(0)
  const rafRef = useRef(0)

  const cx = 220, cy = 230
  const rOuter = 200, rInner = 130
  const bezelR = rOuter + 10

  const valueToAngle = (v: number) => {
    const clamped = Math.max(min - 15, Math.min(max, v))
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
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimatedAngle(startAngle + (targetAngle - startAngle) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [targetAngle])

  const segmentColors = [
    "#2D7A2D", "#3D9E3D", "#52C052", "#7FD44C", "#C8D430",
    "#F5C518", "#F59518", "#F06820", "#D43B20", "#B01010",
  ]
  const totalAngle = 180
  const gapDeg = 2
  const segAngle = (totalAngle - gapDeg * (segmentColors.length - 1)) / segmentColors.length

  const arcPath = (startDeg: number, endDeg: number, rOut: number, rIn: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180
    const sRad = toRad(startDeg - 90)
    const eRad = toRad(endDeg - 90)
    const x1o = cx + rOut * Math.cos(sRad), y1o = cy + rOut * Math.sin(sRad)
    const x2o = cx + rOut * Math.cos(eRad), y2o = cy + rOut * Math.sin(eRad)
    const x1i = cx + rIn * Math.cos(eRad), y1i = cy + rIn * Math.sin(eRad)
    const x2i = cx + rIn * Math.cos(sRad), y2i = cy + rIn * Math.sin(sRad)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M${x1o},${y1o} A${rOut},${rOut} 0 ${large} 1 ${x2o},${y2o} L${x1i},${y1i} A${rIn},${rIn} 0 ${large} 0 ${x2i},${y2i} Z`
  }

  const needleLength = rOuter - 15
  const nRad = ((animatedAngle - 90) * Math.PI) / 180
  const tipX = cx + needleLength * Math.cos(nRad)
  const tipY = cy + needleLength * Math.sin(nRad)
  const perpRad = nRad + Math.PI / 2
  const bw = 6
  const b1x = cx + bw * Math.cos(perpRad), b1y = cy + bw * Math.sin(perpRad)
  const b2x = cx - bw * Math.cos(perpRad), b2y = cy - bw * Math.sin(perpRad)

  return (
    <div className="w-full flex flex-col items-center" style={{ minHeight: 300 }}>
      <svg viewBox="0 0 440 270" className="w-full" style={{ overflow: "visible" }}>
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
        <circle cx={cx} cy={cy} r={20} fill="url(#pivotGrad)" stroke="#999" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={7} fill="#888" />

        {/* Labels */}
        <text x={cx - rOuter + 15} y={cy + 35} fontSize="12" fontWeight="bold" fill="#041224" textAnchor="start">PRIMA NETA</text>
        <text x={cx + rOuter - 15} y={cy + 35} fontSize="12" fontWeight="bold" fill="#041224" textAnchor="end">PRESUPUESTO</text>
      </svg>

      <div className="text-center -mt-3">
        <div className="text-[36px] font-black text-[#E62800] leading-none">
          ${value < 1000 ? value.toFixed(1) : value.toFixed(1)}M
        </div>
        <div className="text-[13px] text-[#CCD1D3] mt-1">
          de ${budget}M presupuesto
        </div>
      </div>
    </div>
  )
}
