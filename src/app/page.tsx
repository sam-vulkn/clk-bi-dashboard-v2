"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { PageTabs } from "@/components/page-tabs"
import {
  SEED_LINEAS, SEED_PRESUPUESTO, SEED_FX,
  getTipoCambio, getLastDataDate,
} from "@/lib/queries"
import type { FxRates } from "@/lib/queries"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from "recharts"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

// POWER BI GAUGE - Large, prominent, with scale labels around arc
function PowerBIGauge({ value, prevYear, budget }: { value: number; prevYear: number; budget: number }) {
  const [anim, setAnim] = useState(0)
  const raf = useRef(0)

  const min = 100, max = 140
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

  const na = p2a(anim)
  const nRad = (na * Math.PI) / 180
  const nLen = ro + 5
  const tip = { x: cx + nLen * Math.cos(nRad), y: cy + nLen * Math.sin(nRad) }
  const bw = 5
  const b1 = { x: cx + bw * Math.cos(nRad + Math.PI / 2), y: cy + bw * Math.sin(nRad + Math.PI / 2) }
  const b2 = { x: cx - bw * Math.cos(nRad + Math.PI / 2), y: cy - bw * Math.sin(nRad + Math.PI / 2) }

  // Scale labels - exactly like Power BI
  const scaleValues = [100, 105, 110, 115, 120, 125, 129.5, 130, 135, 140]

  return (
    <Link href="/tabla-detalle" className="block cursor-pointer">
      <svg viewBox="0 0 400 220" className="w-full h-full">
        <defs>
          <linearGradient id="redZone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C53030" />
            <stop offset="100%" stopColor="#E53E3E" />
          </linearGradient>
          <linearGradient id="yellowZone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4A02C" />
            <stop offset="100%" stopColor="#EAC94B" />
          </linearGradient>
          <linearGradient id="greenZone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38A169" />
            <stop offset="100%" stopColor="#48BB78" />
          </linearGradient>
        </defs>

        {/* Background */}
        <path d={descArc(startA, startA + sweepA, ro + 2, ri - 2)} fill="#E8E8E8" />

        {/* Colored zones */}
        <path d={descArc(startA, z1e, ro, ri)} fill="url(#redZone)" />
        <path d={descArc(z1e, z2e, ro, ri)} fill="url(#yellowZone)" />
        <path d={descArc(z2e, startA + sweepA, ro, ri)} fill="url(#greenZone)" />

        {/* Scale labels around arc */}
        {scaleValues.map((val) => {
          const pctVal = (val - min) / (max - min)
          const angle = p2a(pctVal)
          const labelR = ro + 22
          const pos = toXY(angle, labelR)
          const isBudget = val === 129.5
          
          return (
            <text 
              key={val}
              x={pos.x} y={pos.y} 
              fontSize={isBudget ? "11" : "10"} 
              fill={isBudget ? "#276749" : "#555"}
              textAnchor="middle" 
              dominantBaseline="middle"
              fontWeight={isBudget ? "700" : "500"}
            >
              ${val.toFixed(1)}M
            </text>
          )
        })}

        {/* Needle */}
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#333" />
        <circle cx={cx} cy={cy} r={12} fill="#555" />
        <circle cx={cx} cy={cy} r={6} fill="#888" />

        {/* Value below gauge - BIG like Power BI */}
        <text x={cx} y={cy + 55} fontSize="36" fontWeight="900" fill="#1A202C" textAnchor="middle">
          ${value.toFixed(1)}M
        </text>
      </svg>
    </Link>
  )
}

export default function HomePage() {
  const [year, setYear] = useState("2026")
  const [month, setMonth] = useState("Febrero")
  const lineas = SEED_LINEAS.map(l => ({ ...l }))
  const [fx, setFx] = useState<FxRates & { fechaActualizacion?: string }>(SEED_FX)
  const [lastDataDate, setLastDataDate] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [chartReady, setChartReady] = useState(false)

  useEffect(() => { 
    setMounted(true)
    document.title = "Tacómetro | CLK BI Dashboard"
    const timer = setTimeout(() => setChartReady(true), 300)
    return () => clearTimeout(timer)
  }, [])
  
  useEffect(() => { getTipoCambio().then(r => { if (r) setFx(r) }) }, [])
  useEffect(() => { getLastDataDate().then(d => setLastDataDate(d)) }, [])

  const total = lineas.reduce((s, l) => s + l.primaNeta, 0)
  const totalPpto = lineas.reduce((s, l) => s + l.presupuesto, 0) || SEED_PRESUPUESTO
  const totalAA = lineas.reduce((s, l) => s + l.anioAnterior, 0)

  const cumpl = Math.round((total / totalPpto) * 100)
  const crec = Math.round(((total - totalAA) / totalAA) * 1000) / 10

  const gV = total / 1e6
  const gB = totalPpto / 1e6
  const gP = totalAA / 1e6

  // Chart data - order like Power BI (smallest to largest)
  const chartData = [...lineas].sort((a, b) => a.primaNeta - b.primaNeta).map(l => ({
    nombre: l.nombre.replace('Click ', '').replace('Cartera ', ''),
    pn: +(l.primaNeta / 1e6).toFixed(1),
    ppto: +(l.presupuesto / 1e6).toFixed(1),
  }))

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <PageTabs />

      {/* MAIN LAYOUT - EXACTLY LIKE POWER BI */}
      <div className="flex gap-1 px-1">
        
        {/* LEFT COLUMN - SMALL FILTERS + TIPO CAMBIO (like Power BI) */}
        <div className="w-[90px] flex-shrink-0 flex flex-col gap-2">
          {/* Filter buttons - small like Power BI */}
          <div className="space-y-1">
            <button className="w-full bg-gray-200 hover:bg-gray-300 text-[10px] text-gray-700 py-1.5 px-2 rounded text-left">
              Gobierno
            </button>
            <button className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-[10px] text-gray-900 py-1.5 px-2 rounded text-left font-medium">
              Grupo Click
            </button>
            <button className="w-full bg-gray-200 hover:bg-gray-300 text-[10px] text-gray-700 py-1.5 px-2 rounded text-left">
              RD
            </button>
          </div>

          {/* Spacer to push tipo cambio to bottom */}
          <div className="flex-1" />

          {/* TIPO DE CAMBIO - EXACTLY like Power BI (bottom left) */}
          <div className="bg-white border border-gray-200 rounded text-[10px]">
            <div className="bg-[#2D3748] text-white font-bold px-2 py-1">Tipo de cambio</div>
            <div className="p-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-blue-600">Dólar</span>
                <span className="font-bold">${fx.usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-1">
                <span className="text-gray-600">Peso<br/>Dominicano</span>
                <span className="font-bold">${fx.dop.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER - GAUGE + KPIs */}
        <div className="w-[320px] flex-shrink-0 flex flex-col">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-sm font-bold text-[#333]">Prima neta cobrada por línea de negocio</h1>
          </div>

          {/* BIG GAUGE */}
          <div className="bg-white rounded border border-gray-200" style={{ height: 240 }}>
            <PowerBIGauge value={Math.round(gV * 10) / 10} prevYear={Math.round(gP * 10) / 10} budget={Math.round(gB * 10) / 10} />
          </div>

          {/* CUMPLIMIENTO - coral/salmon like Power BI */}
          <div className="bg-[#E8927C] rounded p-3 mt-2">
            <div className="text-[#4A2020] text-[11px] font-medium">Cumplimiento del presupuesto</div>
            <div className="text-[#4A2020] text-4xl font-black">{cumpl} %</div>
          </div>

          {/* CRECIMIENTO - green like Power BI */}
          <div className="bg-[#68D391] rounded p-3 mt-2">
            <div className="text-[#1C4532] text-[11px] font-medium">Crecimiento de la prima neta actual<br/>frente al año anterior *</div>
            <div className="text-[#1C4532] text-3xl font-black">⇧ {crec}%</div>
          </div>
        </div>

        {/* RIGHT COLUMN - TABLE + CHART */}
        <div className="flex-1 flex flex-col">
          {/* Filters row */}
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="text-[10px] text-gray-500">Año</span>
            <select id="year-select" name="year" value={year} onChange={e => setYear(e.target.value)} 
              className="border border-gray-300 rounded px-1.5 py-0.5 text-[10px] bg-white">
              <option>2026</option><option>2025</option>
            </select>
            <span className="text-[10px] text-gray-500">Mes</span>
            <select id="month-select" name="month" value={month} onChange={e => setMonth(e.target.value)} 
              className="border border-gray-300 rounded px-1.5 py-0.5 text-[10px] bg-white">
              <option>Febrero</option><option>Enero</option><option>Marzo</option>
            </select>
            <span className="text-[9px] text-gray-400">Datos al: {lastDataDate ?? "09/09/2025"}</span>
          </div>

          {/* TABLE - compact with Power BI styling */}
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[#3D4A5C] text-white">
                  <th className="text-left px-2 py-1.5 font-semibold">Línea</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Prima Neta</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Año Anterior *</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Presupuesto</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l, i) => {
                  const diff = l.primaNeta - l.presupuesto
                  return (
                    <tr key={l.nombre} className={`border-b border-gray-100 ${i % 2 ? 'bg-[#F7F7F7]' : 'bg-white'}`}>
                      <td className="px-2 py-1 text-gray-800">{l.nombre}</td>
                      <td className="px-2 py-1 text-right font-semibold text-gray-900">{fmt(l.primaNeta)}</td>
                      <td className="px-2 py-1 text-right text-gray-600">{fmt(l.anioAnterior)}</td>
                      <td className="px-2 py-1 text-right text-gray-600">{fmt(l.presupuesto)}</td>
                      <td className="px-2 py-1 text-right text-red-600 font-medium">
                        ({fmt(Math.abs(diff))})
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-[#3D4A5C] text-white font-bold">
                  <td className="px-2 py-1.5">Total</td>
                  <td className="px-2 py-1.5 text-right">{fmt(total)}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(totalAA)}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(totalPpto)}</td>
                  <td className="px-2 py-1.5 text-right text-red-300">({fmt(Math.abs(total - totalPpto))})</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CHART - horizontal bar like Power BI */}
          <div className="bg-white rounded border border-gray-200 p-2 mt-2 flex-1">
            <div className="flex items-center gap-3 text-[9px] mb-1">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#2D3748] rounded-sm"></span>
                <span className="text-gray-600">PN Efectuada</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#A0AEC0] rounded-sm"></span>
                <span className="text-gray-600">Presupuesto</span>
              </div>
            </div>
            <div style={{ height: 150 }}>
              {chartReady && chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 40, left: 5, bottom: 5 }} barGap={1}>
                    <XAxis 
                      type="number" 
                      domain={[0, 80]} 
                      tickFormatter={(v) => `$${v}M`}
                      tick={{ fontSize: 8, fill: '#666' }}
                      axisLine={{ stroke: '#ddd' }}
                      tickLine={{ stroke: '#ddd' }}
                    />
                    <YAxis type="category" dataKey="nombre" width={70} tick={{ fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} />
                    <Bar dataKey="pn" fill="#2D3748" radius={[0, 2, 2, 0]} barSize={10}>
                      <LabelList dataKey="pn" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 7, fill: '#444' }} />
                    </Bar>
                    <Bar dataKey="ppto" fill="#A0AEC0" radius={[0, 2, 2, 0]} barSize={10}>
                      <LabelList dataKey="ppto" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 7, fill: '#999' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER - like Power BI */}
      <div className="flex items-center justify-between px-2 py-1 mt-2 text-[9px] text-gray-500 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className="font-bold text-orange-600">INTRA<br/>CLICK</span>
          <span>* El total de la prima neta del año anterior está al corte del día: 23/febrero/2025</span>
        </div>
        <div className="text-right">
          <div className="font-medium">Fecha de actualización.</div>
          <div>23/02/2026 08:10:20 a.m.</div>
        </div>
      </div>
    </div>
  )
}
