"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SEED_LINEAS, SEED_PRESUPUESTO, SEED_FX,
  getTipoCambio, getLastDataDate,
} from "@/lib/queries"
import type { FxRates } from "@/lib/queries"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from "recharts"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

// TABS - exactly like Power BI
const TABS = [
  { href: "/", label: "Tacómetro" },
  { href: "/tabla-detalle", label: "Tabla detalle" },
  { href: "/compromisos", label: "Compromisos 2024" },
  { href: "/internacional", label: "Internacional" },
  { href: "/corporate", label: "Corporate." },
  { href: "/cobranza", label: "Convenios." },
]

function PowerBITabs() {
  const pathname = usePathname()
  return (
    <div className="flex items-center flex-wrap">
      {TABS.map((tab, i) => {
        const active = pathname === tab.href
        return (
          <React.Fragment key={tab.href}>
            {i > 0 && <span className="text-gray-300 px-1 text-sm">|</span>}
            <Link
              href={tab.href}
              className={`px-2 py-1 text-sm whitespace-nowrap ${active ? "text-gray-900 font-bold" : "text-gray-500 hover:text-gray-700"}`}
            >
              {tab.label}
            </Link>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// POWER BI GAUGE - Scale from 100M to 140M like Power BI
function PowerBIGauge({ value, prevYear, budget }: { value: number; prevYear: number; budget: number }) {
  const [anim, setAnim] = useState(0)
  const raf = useRef(0)

  // Scale EXACTLY like Power BI: 100M to 140M
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

  const cx = 180, cy = 155
  const ro = 115, ri = 70
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
  const nLen = ro + 8
  const tip = { x: cx + nLen * Math.cos(nRad), y: cy + nLen * Math.sin(nRad) }
  const bw = 6
  const b1 = { x: cx + bw * Math.cos(nRad + Math.PI / 2), y: cy + bw * Math.sin(nRad + Math.PI / 2) }
  const b2 = { x: cx - bw * Math.cos(nRad + Math.PI / 2), y: cy - bw * Math.sin(nRad + Math.PI / 2) }

  // Scale labels EXACTLY like Power BI - only show 100M to 140M
  const scaleValues = [
    { val: 100, label: "$100.0M" },
    { val: 105, label: "$105.0M" },
    { val: 110, label: "$110.0M" },
    { val: 115, label: "$115.0M" },
    { val: 120, label: "$120.0M" },
    { val: 125, label: "$125.0M" },
    { val: 129.5, label: "$129.5M", isBudget: true },
    { val: 130, label: "$130.0M" },
    { val: 135, label: "$135.0M" },
    { val: 140, label: "$140.0M" },
  ]

  return (
    <Link href="/tabla-detalle" className="block cursor-pointer">
      <svg viewBox="0 0 360 210" className="w-full h-full">
        <defs>
          <linearGradient id="redZone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C53030" />
            <stop offset="100%" stopColor="#E53E3E" />
          </linearGradient>
          <linearGradient id="yellowZone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D69E2E" />
            <stop offset="100%" stopColor="#ECC94B" />
          </linearGradient>
          <linearGradient id="greenZone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38A169" />
            <stop offset="100%" stopColor="#48BB78" />
          </linearGradient>
        </defs>

        {/* Background */}
        <path d={descArc(startA, startA + sweepA, ro + 2, ri - 2)} fill="#E2E8F0" />

        {/* Colored zones - RED (below prev year), YELLOW (prev year to budget), GREEN (above budget) */}
        <path d={descArc(startA, z1e, ro, ri)} fill="url(#redZone)" />
        <path d={descArc(z1e, z2e, ro, ri)} fill="url(#yellowZone)" />
        <path d={descArc(z2e, startA + sweepA, ro, ri)} fill="url(#greenZone)" />

        {/* Scale labels around arc */}
        {scaleValues.map((s) => {
          const pctVal = (s.val - min) / (max - min)
          const angle = p2a(pctVal)
          const labelR = ro + 22
          const pos = toXY(angle, labelR)
          return (
            <text 
              key={s.val}
              x={pos.x} y={pos.y} 
              fontSize={s.isBudget ? "10" : "9"} 
              fill={s.isBudget ? "#276749" : "#4A5568"}
              textAnchor="middle" 
              dominantBaseline="middle"
              fontWeight={s.isBudget ? "700" : "500"}
            >
              {s.label}
            </text>
          )
        })}

        {/* Needle */}
        <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill="#2D3748" />
        <circle cx={cx} cy={cy} r={12} fill="#4A5568" />
        <circle cx={cx} cy={cy} r={6} fill="#718096" />

        {/* Value below gauge - BIG */}
        <text x={cx} y={cy + 50} fontSize="28" fontWeight="900" fill="#1A202C" textAnchor="middle">
          ${value.toFixed(1)}M
        </text>
      </svg>
    </Link>
  )
}

export default function HomePage() {
  const [year, setYear] = useState("2025")
  const [month, setMonth] = useState("Febrero")
  const lineas = SEED_LINEAS.map(l => ({ ...l }))
  const [fx, setFx] = useState<FxRates & { fechaActualizacion?: string }>(SEED_FX)
  const [lastDataDate, setLastDataDate] = useState<string | null>(null)
  const [chartReady, setChartReady] = useState(false)
  const [activeFilter, setActiveFilter] = useState("Grupo Click")

  useEffect(() => { 
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

  // Chart data
  const chartData = [...lineas].sort((a, b) => a.primaNeta - b.primaNeta).map(l => ({
    nombre: l.nombre.replace('Click ', '').replace('Cartera ', ''),
    pn: +(l.primaNeta / 1e6).toFixed(1),
    ppto: +(l.presupuesto / 1e6).toFixed(1),
  }))

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-3">
      
      {/* HEADER - exactly like Power BI */}
      <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
        <PowerBITabs />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Año</span>
          <select id="year-select" name="year" value={year} onChange={e => setYear(e.target.value)} 
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white">
            <option>2025</option><option>2026</option><option>2024</option>
          </select>
          <span className="text-xs text-gray-500">Mes</span>
          <select id="month-select" name="month" value={month} onChange={e => setMonth(e.target.value)} 
            className="border border-gray-300 rounded px-2 py-1 text-xs bg-white">
            <option>Febrero</option><option>Enero</option><option>Marzo</option>
          </select>
          <button className="p-1 hover:bg-gray-100 rounded ml-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* TITLE */}
      <h1 className="text-lg font-bold text-gray-800 mb-3">Prima neta cobrada por línea de negocio</h1>

      {/* MAIN LAYOUT - exactly like Power BI */}
      <div className="flex gap-3">
        
        {/* LEFT SIDE - Filter buttons (small like Power BI) */}
        <div className="w-[80px] flex-shrink-0 space-y-1.5">
          {["Gobierno", "Grupo Click", "RD"].map(f => (
            <button 
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`w-full text-left px-2 py-1.5 text-[11px] rounded border transition-colors ${
                activeFilter === f 
                  ? "bg-white border-gray-400 font-semibold shadow-sm" 
                  : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* CENTER - Gauge + KPIs */}
        <div className="w-[300px] flex-shrink-0">
          {/* GAUGE */}
          <div style={{ height: 200 }}>
            <PowerBIGauge 
              value={Math.round(gV * 10) / 10} 
              prevYear={Math.round(gP * 10) / 10} 
              budget={Math.round(gB * 10) / 10} 
            />
          </div>

          {/* CUMPLIMIENTO - coral/salmon like Power BI */}
          <div className="bg-[#E8927C] rounded p-3">
            <div className="text-[#5D2A1A] text-xs font-medium mb-1">Cumplimiento del presupuesto</div>
            <div className="text-[#3D1A10] text-4xl font-black">{cumpl} %</div>
          </div>

          {/* CRECIMIENTO - green like Power BI */}
          <div className="bg-[#68D391] rounded p-3 mt-2">
            <div className="text-[#1C4532] text-xs font-medium mb-1">
              Crecimiento de la prima neta actual<br/>frente al año anterior *
            </div>
            <div className="text-[#1C4532] text-3xl font-black">⇧ {crec}%</div>
          </div>

          {/* TIPO DE CAMBIO - small box */}
          <div className="bg-white border border-gray-200 rounded mt-2 text-xs overflow-hidden">
            <div className="bg-[#2D3748] text-white font-bold px-2 py-1 text-[10px]">Tipo de cambio</div>
            <div className="p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-blue-600 text-[11px]">Dólar</span>
                <span className="font-bold">${fx.usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-1">
                <span className="text-gray-600 text-[11px]">Peso Dominicano</span>
                <span className="font-bold">${fx.dop.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Table + Chart */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* TABLE - with horizontal scroll for small screens */}
          <div className="bg-white border border-gray-200 rounded overflow-x-auto shadow-sm">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="bg-[#3D4A5C] text-white">
                  <th className="text-left px-2 py-1.5 font-semibold whitespace-nowrap">Línea</th>
                  <th className="text-right px-2 py-1.5 font-semibold whitespace-nowrap">Prima Neta</th>
                  <th className="text-right px-2 py-1.5 font-semibold whitespace-nowrap">Año Anterior *</th>
                  <th className="text-right px-2 py-1.5 font-semibold whitespace-nowrap">Presupuesto</th>
                  <th className="text-right px-2 py-1.5 font-semibold whitespace-nowrap">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l, i) => {
                  const diff = l.primaNeta - l.presupuesto
                  return (
                    <tr key={l.nombre} className={`border-b border-gray-100 ${i % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                      <td className="px-2 py-1.5 text-gray-800 whitespace-nowrap">{l.nombre}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-gray-900 whitespace-nowrap">{fmt(l.primaNeta)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-600 whitespace-nowrap">{fmt(l.anioAnterior)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-600 whitespace-nowrap">{fmt(l.presupuesto)}</td>
                      <td className="px-2 py-1.5 text-right text-red-600 font-medium whitespace-nowrap">({fmt(Math.abs(diff))})</td>
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

          {/* CHART - PN Efectuada vs Presupuesto */}
          <div className="bg-white border border-gray-200 rounded p-2 shadow-sm">
            <div className="flex items-center gap-3 text-[10px] mb-1">
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
                  <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 45, left: 5, bottom: 15 }} barGap={2}>
                    <XAxis 
                      type="number" 
                      domain={[0, 80]} 
                      ticks={[0, 20, 40, 60, 80]}
                      tickFormatter={(v) => `$${v}M`}
                      tick={{ fontSize: 9, fill: '#666' }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis type="category" dataKey="nombre" width={75} tick={{ fontSize: 9, fill: '#4A5568' }} axisLine={false} tickLine={false} />
                    <Bar dataKey="pn" fill="#2D3748" radius={[0, 2, 2, 0]} barSize={12}>
                      <LabelList dataKey="pn" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 8, fill: '#2D3748', fontWeight: 500 }} />
                    </Bar>
                    <Bar dataKey="ppto" fill="#A0AEC0" radius={[0, 2, 2, 0]} barSize={12}>
                      <LabelList dataKey="ppto" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 8, fill: '#718096' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Question mark - like Power BI */}
          <div className="flex justify-end">
            <button className="w-4 h-4 rounded-full border border-gray-300 text-gray-400 text-[10px] flex items-center justify-center hover:bg-gray-100">?</button>
          </div>
        </div>
      </div>

      {/* FOOTER - like Power BI */}
      <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="bg-orange-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded leading-tight">
            INTRA<br/>CLICK
          </div>
          <span className="text-[10px] text-gray-500">
            * El total de la prima neta del año anterior está al corte del día: 23/febrero/2025
          </span>
        </div>
        <div className="text-right text-[10px] text-gray-600">
          <div className="font-semibold">Fecha de actualización.</div>
          <div>23/02/2026 08:10:20 a.m.</div>
        </div>
      </div>
    </div>
  )
}
