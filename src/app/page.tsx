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
    nombre: l.nombre.replace('Click ', '').replace('Cartera ', ''),
    pn: +(l.primaNeta / 1e6).toFixed(1),
    ppto: +(l.presupuesto / 1e6).toFixed(1),
  }))

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <PageTabs />

      {/* Title Row - EXACTLY like Power BI */}
      <div className="flex items-center justify-between mb-2 px-1">
        <h1 className="text-lg font-bold text-[#333]">
          Prima neta cobrada por línea de negocio
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Año</span>
          <select id="year-select" name="year" value={year} onChange={e => setYear(e.target.value)} 
            className="border border-gray-300 rounded px-2 py-0.5 text-xs bg-white">
            <option>2026</option><option>2025</option>
          </select>
          <span className="text-xs text-gray-500">Mes</span>
          <select id="month-select" name="month" value={month} onChange={e => setMonth(e.target.value)} 
            className="border border-gray-300 rounded px-2 py-0.5 text-xs bg-white">
            <option>Febrero</option><option>Enero</option><option>Marzo</option>
          </select>
          <span className="text-[10px] text-gray-400">Datos al: {lastDataDate ?? "09/09/2025"}</span>
        </div>
      </div>

      {/* MAIN LAYOUT - 2 columns like Power BI */}
      <div className="flex gap-3">
        
        {/* LEFT COLUMN: Gauge + Cumplimiento + Crecimiento + Tipo Cambio */}
        <div className="w-[340px] flex-shrink-0 space-y-2">
          {/* GAUGE - Clean, no background card */}
          <div className="bg-white rounded border border-gray-200 p-2" style={{ height: 280 }}>
            <Gauge 
              value={Math.round(gV * 10) / 10} 
              prevYear={Math.round(gP * 10) / 10} 
              budget={Math.round(gB * 10) / 10} 
              clickable={true} 
            />
          </div>

          {/* CUMPLIMIENTO - EXACTLY like Power BI: Red box, white text */}
          <div className="bg-[#C53030] rounded p-4">
            <div className="text-white text-sm mb-1">Cumplimiento del presupuesto</div>
            <div className="text-white text-6xl font-black">{cumpl} %</div>
          </div>

          {/* CRECIMIENTO - EXACTLY like Power BI: Green box, white text */}
          <div className="bg-[#38A169] rounded p-4">
            <div className="text-white text-sm mb-1">Crecimiento de la prima neta actual<br/>frente al año anterior *</div>
            <div className="text-white text-5xl font-black">↑ {crec}%</div>
          </div>

          {/* TIPO DE CAMBIO - EXACTLY like Power BI */}
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div className="bg-[#333] text-white text-xs font-bold px-3 py-1.5 uppercase">Tipo de cambio</div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600 font-medium">Dólar</span>
                <span className="text-xl font-bold text-gray-900">${fx.usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                <span className="text-sm text-gray-600">Peso Dominicano</span>
                <span className="text-xl font-bold text-gray-900">${fx.dop.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Table + Chart */}
        <div className="flex-1 space-y-2">
          {/* TABLE - EXACTLY like Power BI */}
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#444] text-white">
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
                      <td className="px-3 py-1.5 font-medium text-gray-800">{l.nombre}</td>
                      <td className="px-3 py-1.5 text-right text-gray-800">{fmt(l.primaNeta)}</td>
                      <td className="px-3 py-1.5 text-right text-gray-600">{fmt(l.anioAnterior)}</td>
                      <td className="px-3 py-1.5 text-right text-gray-600">{fmt(l.presupuesto)}</td>
                      <td className="px-3 py-1.5 text-right text-red-600 font-medium">
                        ({fmt(Math.abs(diff))})
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-[#444] text-white font-bold">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right">{fmt(total)}</td>
                  <td className="px-3 py-2 text-right">{fmt(totalAA)}</td>
                  <td className="px-3 py-2 text-right">{fmt(totalPpto)}</td>
                  <td className="px-3 py-2 text-right text-red-300">({fmt(Math.abs(total - totalPpto))})</td>
                </tr>
              </tbody>
            </table>
            <Link href="/tabla-detalle" 
              className="block text-center py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 transition-colors border-t border-gray-100">
              Ver detalle con drill-down →
            </Link>
          </div>

          {/* CHART - EXACTLY like Power BI with X axis scale */}
          <div className="bg-white rounded border border-gray-200 p-3">
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
            <div ref={chartRef} style={{ height: 180 }}>
              {chartReady && chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 50, left: 5, bottom: 20 }} barGap={2}>
                    <XAxis 
                      type="number" 
                      domain={[0, 80]} 
                      tickFormatter={(v) => `$${v}M`}
                      tick={{ fontSize: 9, fill: '#666' }}
                      axisLine={{ stroke: '#ddd' }}
                      tickLine={{ stroke: '#ddd' }}
                    />
                    <YAxis type="category" dataKey="nombre" width={90} tick={{ fontSize: 9, fill: '#444' }} axisLine={false} tickLine={false} />
                    <Bar dataKey="pn" fill="#2D3748" radius={[0, 2, 2, 0]} barSize={12}>
                      <LabelList dataKey="pn" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 8, fill: '#444' }} />
                    </Bar>
                    <Bar dataKey="ppto" fill="#A0AEC0" radius={[0, 2, 2, 0]} barSize={12}>
                      <LabelList dataKey="ppto" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 8, fill: '#999' }} />
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
