"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Gauge } from "@/components/gauge"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import {
  SEED_LINEAS, SEED_PRESUPUESTO, SEED_FX,
  getTipoCambio, getLastDataDate,
} from "@/lib/queries"
import type { FxRates } from "@/lib/queries"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Legend } from "recharts"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

export default function HomePage() {
  const [year, setYear] = useState("2026")
  const [month, setMonth] = useState("Febrero")
  const lineas = SEED_LINEAS.map(l => ({ ...l }))
  const [fx, setFx] = useState<FxRates & { fechaActualizacion?: string }>(SEED_FX)
  const [lastDataDate, setLastDataDate] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [chartReady, setChartReady] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

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
    nombre: l.nombre,
    pn: +(l.primaNeta / 1e6).toFixed(1),
    ppto: +(l.presupuesto / 1e6).toFixed(1),
  }))

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <PageTabs />

      {/* Title Row - EXACTLY like Power BI */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h1 className="text-xl font-bold text-[#333] tracking-tight">
          Prima neta cobrada por línea de negocio
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Año</span>
            <select id="year-select" name="year" value={year} onChange={e => setYear(e.target.value)} 
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white min-w-[80px]">
              <option>2026</option><option>2025</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Mes</span>
            <select id="month-select" name="month" value={month} onChange={e => setMonth(e.target.value)} 
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white min-w-[100px]">
              <option>Febrero</option><option>Enero</option><option>Marzo</option>
            </select>
          </div>
          <span className="text-xs text-gray-400">Datos al: {lastDataDate ?? "09/09/2025"}</span>
        </div>
      </div>

      {/* MAIN LAYOUT - Exactly like Power BI */}
      <div className="grid grid-cols-12 gap-3">
        
        {/* LEFT COLUMN: Gauge + KPIs + Tipo Cambio */}
        <div className="col-span-5 space-y-3">
          {/* GAUGE */}
          <div className="bg-white rounded shadow-sm border border-gray-200 p-2" style={{ height: 320 }}>
            <Gauge 
              value={Math.round(gV * 10) / 10} 
              prevYear={Math.round(gP * 10) / 10} 
              budget={Math.round(gB * 10) / 10} 
              clickable={true} 
            />
          </div>

          {/* CUMPLIMIENTO - RED BOX like Power BI */}
          <div className="bg-[#C53030] rounded shadow-sm p-4 text-white">
            <div className="text-sm font-medium opacity-90 mb-1">Cumplimiento del presupuesto</div>
            <div className="text-5xl font-black">{cumpl} %</div>
          </div>

          {/* CRECIMIENTO - GREEN BOX like Power BI */}
          <div className="bg-[#38A169] rounded shadow-sm p-4 text-white">
            <div className="text-sm font-medium opacity-90 mb-1">Crecimiento de la prima neta actual frente al año anterior *</div>
            <div className="text-4xl font-black">{crec >= 0 ? '↑' : '↓'} {Math.abs(crec)}%</div>
          </div>

          {/* TIPO DE CAMBIO - Separate box like Power BI */}
          <div className="bg-white rounded shadow-sm border border-gray-200 p-3">
            <div className="text-xs font-bold text-gray-700 mb-2 uppercase">Tipo de cambio</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-[#2B6CB0] font-medium">Dólar</span>
                <span className="text-lg font-bold text-gray-900">${fx.usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Peso Dominicano</span>
                <span className="text-lg font-bold text-gray-900">${fx.dop.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Table + Chart */}
        <div className="col-span-7 space-y-3">
          {/* TABLE - Like Power BI */}
          <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2D3748] text-white">
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
                      <td className="px-3 py-1.5 font-medium text-gray-900">{l.nombre}</td>
                      <td className="px-3 py-1.5 text-right text-gray-900">{fmt(l.primaNeta)}</td>
                      <td className="px-3 py-1.5 text-right text-gray-600">{fmt(l.anioAnterior)}</td>
                      <td className="px-3 py-1.5 text-right text-gray-600">{fmt(l.presupuesto)}</td>
                      <td className={`px-3 py-1.5 text-right font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ({fmt(Math.abs(diff))})
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-[#2D3748] text-white font-bold">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right">{fmt(total)}</td>
                  <td className="px-3 py-2 text-right">{fmt(totalAA)}</td>
                  <td className="px-3 py-2 text-right">{fmt(totalPpto)}</td>
                  <td className="px-3 py-2 text-right text-red-300">({fmt(Math.abs(total - totalPpto))})</td>
                </tr>
              </tbody>
            </table>
            <Link href="/tabla-detalle" 
              className="block bg-orange-50 text-center py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors border-t border-gray-200">
              Ver detalle con drill-down →
            </Link>
          </div>

          {/* CHART - Like Power BI horizontal bars */}
          <div className="bg-white rounded shadow-sm border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#2D3748] rounded-sm"></span>
                  <span className="text-gray-600">PN Efectuada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#A0AEC0] rounded-sm"></span>
                  <span className="text-gray-600">Presupuesto</span>
                </div>
              </div>
            </div>
            <div ref={chartRef} style={{ height: 200 }}>
              {chartReady && chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 60, left: 5, bottom: 5 }} barGap={2}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="nombre" width={110} tick={{ fontSize: 10, fill: '#4A5568' }} axisLine={false} tickLine={false} />
                    <Bar dataKey="pn" fill="#2D3748" radius={[0, 3, 3, 0]} barSize={14}>
                      <LabelList dataKey="pn" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 9, fill: '#4A5568' }} />
                    </Bar>
                    <Bar dataKey="ppto" fill="#A0AEC0" radius={[0, 3, 3, 0]} barSize={14}>
                      <LabelList dataKey="ppto" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 9, fill: '#A0AEC0' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      <PageFooter showFootnote />
    </div>
  )
}
