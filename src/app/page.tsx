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
import { RefreshCw } from "lucide-react"

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
    <div className="flex items-center">
      {TABS.map((tab, i) => {
        const active = pathname === tab.href
        return (
          <React.Fragment key={tab.href}>
            {i > 0 && <span className="text-gray-300 px-1">|</span>}
            <Link
              href={tab.href}
              className={`px-2 py-1 text-[13px] ${active ? "text-gray-900 font-bold" : "text-gray-500 hover:text-gray-700"}`}
            >
              {tab.label}
            </Link>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// POWER BI GAUGE - Large with scale labels around arc
function PowerBIGauge({ value, prevYear, budget }: { value: number; prevYear: number; budget: number }) {
  const [anim, setAnim] = useState(0)
  const raf = useRef(0)

  const min = 70, max = 140
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

  const cx = 180, cy = 160
  const ro = 120, ri = 75
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

  // Scale labels like Power BI
  const scaleValues = [
    { val: 70, show: false },
    { val: 80, show: false },
    { val: 90, show: true, label: "$90.0M" },
    { val: 100, show: true, label: "$100.0M" },
    { val: 105, show: true, label: "$105.0M" },
    { val: 110, show: true, label: "$110.0M" },
    { val: 115, show: true, label: "$115.0M" },
    { val: 120, show: true, label: "$120.0M" },
    { val: 125, show: true, label: "$125.0M" },
    { val: 129.5, show: true, label: "$129.5M", isBudget: true },
    { val: 130, show: true, label: "$130.0M" },
    { val: 135, show: true, label: "$135.0M" },
    { val: 140, show: true, label: "$140.0M" },
  ]

  return (
    <Link href="/tabla-detalle" className="block cursor-pointer">
      <svg viewBox="0 0 360 220" className="w-full h-full">
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

        {/* Colored zones */}
        <path d={descArc(startA, z1e, ro, ri)} fill="url(#redZone)" />
        <path d={descArc(z1e, z2e, ro, ri)} fill="url(#yellowZone)" />
        <path d={descArc(z2e, startA + sweepA, ro, ri)} fill="url(#greenZone)" />

        {/* Scale labels around arc */}
        {scaleValues.filter(s => s.show).map((s) => {
          const pctVal = (s.val - min) / (max - min)
          const angle = p2a(pctVal)
          const labelR = ro + 25
          const pos = toXY(angle, labelR)
          return (
            <text 
              key={s.val}
              x={pos.x} y={pos.y} 
              fontSize={s.isBudget ? "11" : "10"} 
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
        <circle cx={cx} cy={cy} r={14} fill="#4A5568" />
        <circle cx={cx} cy={cy} r={7} fill="#718096" />

        {/* Value below gauge - BIG */}
        <text x={cx} y={cy + 55} fontSize="32" fontWeight="900" fill="#1A202C" textAnchor="middle">
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
    <div className="min-h-screen bg-[#FAFAFA] p-4">
      
      {/* HEADER - exactly like Power BI */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
        <PowerBITabs />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Año</span>
            <select id="year-select" name="year" value={year} onChange={e => setYear(e.target.value)} 
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white min-w-[70px]">
              <option>2025</option><option>2026</option><option>2024</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Mes</span>
            <select id="month-select" name="month" value={month} onChange={e => setMonth(e.target.value)} 
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white min-w-[90px]">
              <option>Febrero</option><option>Enero</option><option>Marzo</option>
            </select>
          </div>
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* TITLE */}
      <h1 className="text-xl font-bold text-gray-800 mb-4">Prima neta cobrada por línea de negocio</h1>

      {/* MAIN LAYOUT - like Power BI */}
      <div className="flex gap-4">
        
        {/* LEFT SIDE - Filter buttons */}
        <div className="w-[90px] flex-shrink-0 space-y-2">
          {["Gobierno", "Grupo Click", "RD"].map(f => (
            <button 
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`w-full text-left px-3 py-2 text-xs rounded border transition-colors ${
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
        <div className="w-[340px] flex-shrink-0">
          {/* GAUGE */}
          <div style={{ height: 230 }}>
            <PowerBIGauge 
              value={Math.round(gV * 10) / 10} 
              prevYear={Math.round(gP * 10) / 10} 
              budget={Math.round(gB * 10) / 10} 
            />
          </div>

          {/* CUMPLIMIENTO - coral/salmon like Power BI */}
          <div className="bg-[#E8927C] rounded-lg p-4 mt-3">
            <div className="text-[#5D2A1A] text-sm font-medium mb-1">Cumplimiento del presupuesto</div>
            <div className="text-[#3D1A10] text-5xl font-black">{cumpl} %</div>
          </div>

          {/* CRECIMIENTO - green like Power BI */}
          <div className="bg-[#68D391] rounded-lg p-4 mt-3">
            <div className="text-[#1C4532] text-sm font-medium mb-1">
              Crecimiento de la prima neta actual<br/>frente al año anterior *
            </div>
            <div className="text-[#1C4532] text-4xl font-black">⇧ {crec}%</div>
          </div>

          {/* TIPO DE CAMBIO - small box */}
          <div className="bg-white border border-gray-200 rounded-lg mt-3 text-sm overflow-hidden">
            <div className="bg-[#2D3748] text-white font-bold px-3 py-1.5 text-xs">Tipo de cambio</div>
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-blue-600">Dólar</span>
                <span className="font-bold text-lg">${fx.usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                <span className="text-gray-600">Peso<br/>Dominicano</span>
                <span className="font-bold text-lg">${fx.dop.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Table + Chart */}
        <div className="flex-1 space-y-3">
          {/* TABLE */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#3D4A5C] text-white">
                  <th className="text-left px-3 py-2 font-semibold">Línea</th>
                  <th className="text-right px-3 py-2 font-semibold">Prima Neta</th>
                  <th className="text-right px-3 py-2 font-semibold">Año Anterior *</th>
                  <th className="text-right px-3 py-2 font-semibold">Presupuesto</th>
                  <th className="text-right px-3 py-2 font-semibold">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l, i) => {
                  const diff = l.primaNeta - l.presupuesto
                  return (
                    <tr key={l.nombre} className={`border-b border-gray-100 ${i % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                      <td className="px-3 py-2 text-gray-800">{l.nombre}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmt(l.primaNeta)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{fmt(l.anioAnterior)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{fmt(l.presupuesto)}</td>
                      <td className="px-3 py-2 text-right text-red-600 font-medium">({fmt(Math.abs(diff))})</td>
                    </tr>
                  )
                })}
                <tr className="bg-[#3D4A5C] text-white font-bold">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right">{fmt(total)}</td>
                  <td className="px-3 py-2 text-right">{fmt(totalAA)}</td>
                  <td className="px-3 py-2 text-right">{fmt(totalPpto)}</td>
                  <td className="px-3 py-2 text-right text-red-300">({fmt(Math.abs(total - totalPpto))})</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CHART - PN Efectuada vs Presupuesto */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-4 text-xs mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#2D3748] rounded-sm"></span>
                <span className="text-gray-600">PN Efectuada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#A0AEC0] rounded-sm"></span>
                <span className="text-gray-600">Presupuesto</span>
              </div>
            </div>
            <div style={{ height: 180 }}>
              {chartReady && chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 50, left: 10, bottom: 20 }} barGap={2}>
                    <XAxis 
                      type="number" 
                      domain={[0, 80]} 
                      ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80]}
                      tickFormatter={(v) => `$${v}M`}
                      tick={{ fontSize: 10, fill: '#666' }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis type="category" dataKey="nombre" width={85} tick={{ fontSize: 11, fill: '#4A5568' }} axisLine={false} tickLine={false} />
                    <Bar dataKey="pn" fill="#2D3748" radius={[0, 3, 3, 0]} barSize={14}>
                      <LabelList dataKey="pn" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 10, fill: '#2D3748', fontWeight: 500 }} />
                    </Bar>
                    <Bar dataKey="ppto" fill="#A0AEC0" radius={[0, 3, 3, 0]} barSize={14}>
                      <LabelList dataKey="ppto" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 10, fill: '#718096' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Question mark - like Power BI */}
          <div className="flex justify-end">
            <button className="w-5 h-5 rounded-full border border-gray-300 text-gray-400 text-xs flex items-center justify-center hover:bg-gray-100">?</button>
          </div>
        </div>
      </div>

      {/* FOOTER - like Power BI */}
      <div className="flex items-center justify-between mt-6 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded leading-tight">
            INTRA<br/>CLICK
          </div>
          <span className="text-xs text-gray-500">
            * El total de la prima neta del año anterior está al corte del día: 23/febrero/2025
          </span>
        </div>
        <div className="text-right text-xs text-gray-600">
          <div className="font-semibold">Fecha de actualización.</div>
          <div>23/02/2026 08:10:20 a.m.</div>
        </div>
      </div>
    </div>
  )
}
