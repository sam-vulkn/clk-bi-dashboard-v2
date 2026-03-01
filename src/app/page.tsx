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
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Tooltip } from "recharts"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

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

  const chartData = [...lineas].sort((a, b) => a.primaNeta - b.primaNeta).map(l => ({
    nombre: l.nombre,
    value: +(l.primaNeta / 1e6).toFixed(1),
    ppto: +(l.presupuesto / 1e6).toFixed(1),
  }))

  return (
    <div className="min-h-screen">
      {/* Compact header with tabs - NO WHITE BAR */}
      <PageTabs />

      {/* Title Row - Elegant like Power BI */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-black text-[#041224] tracking-tight">
          Prima neta cobrada <span className="font-normal text-gray-500 text-sm ml-2">por línea de negocio</span>
        </h1>
        <div className="flex items-center gap-2">
          <select id="year-select" name="year" value={year} onChange={e => setYear(e.target.value)} 
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
            <option>2026</option><option>2025</option>
          </select>
          <select id="month-select" name="month" value={month} onChange={e => setMonth(e.target.value)} 
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
            {MESES.map(m => <option key={m}>{m}</option>)}
          </select>
          <span className="text-xs text-gray-400">Datos al: {lastDataDate ?? "09/09/2025"}</span>
        </div>
      </div>

      {/* Main Grid - Power BI Layout */}
      <div className="grid grid-cols-12 gap-3">
        
        {/* LEFT COLUMN: Gauge + KPIs */}
        <div className="col-span-5 space-y-3">
          {/* TACÓMETRO - Larger and prominent */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3" style={{ height: 340 }}>
            <Gauge 
              value={Math.round(gV * 10) / 10} 
              prevYear={Math.round(gP * 10) / 10} 
              budget={Math.round(gB * 10) / 10} 
              clickable={true} 
            />
          </div>

          {/* KPI Row - Like Power BI with colored boxes */}
          <div className="grid grid-cols-3 gap-2">
            {/* Cumplimiento - RED/GREEN based on value */}
            <div className={`rounded-lg p-3 ${cumpl >= 100 ? 'bg-emerald-600' : 'bg-red-600'} text-white shadow-sm`}>
              <div className="text-[10px] uppercase tracking-wide opacity-80 mb-1">Cumplimiento</div>
              <div className="text-2xl font-black">{cumpl}%</div>
              <div className="text-[10px] opacity-70">del presupuesto</div>
            </div>

            {/* Crecimiento - GREEN/RED based on value */}
            <div className={`rounded-lg p-3 ${crec >= 0 ? 'bg-emerald-600' : 'bg-red-600'} text-white shadow-sm`}>
              <div className="text-[10px] uppercase tracking-wide opacity-80 mb-1">Crecimiento</div>
              <div className="text-2xl font-black">{crec >= 0 ? '+' : ''}{crec}%</div>
              <div className="text-[10px] opacity-70">vs año anterior</div>
            </div>

            {/* Tipo de Cambio - Dark with green accents */}
            <div className="bg-[#041224] rounded-lg p-3 text-white shadow-sm relative overflow-hidden">
              {/* Green accent lines */}
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="absolute bottom-0 right-0 w-8 h-1 bg-emerald-500 opacity-50"></div>
              
              <div className="text-[9px] uppercase tracking-wide text-emerald-400 mb-1">Tipo de Cambio</div>
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] text-gray-400">USD</span>
                <span className="text-lg font-black">${fx.usd.toFixed(2)}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] text-gray-400">DOP</span>
                <span className="text-lg font-black">${fx.dop.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Table */}
        <div className="col-span-7">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#041224] text-white">
                  <th className="text-left px-3 py-2.5 font-semibold text-xs">Línea de Negocio</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-xs">Prima Neta</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-xs">Año Anterior</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-xs">Presupuesto</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l, i) => (
                  <tr key={l.nombre} className={`border-b border-gray-100 ${i % 2 ? 'bg-gray-50' : 'bg-white'} hover:bg-orange-50 transition-colors`}>
                    <td className="px-3 py-2 font-medium text-gray-900 text-xs">{l.nombre}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900 text-xs">{fmt(l.primaNeta)}</td>
                    <td className="px-3 py-2 text-right text-gray-600 text-xs">{fmt(l.anioAnterior)}</td>
                    <td className="px-3 py-2 text-right text-gray-600 text-xs">{fmt(l.presupuesto)}</td>
                  </tr>
                ))}
                <tr className="bg-[#041224] text-white">
                  <td className="px-3 py-2.5 font-bold text-xs">Total</td>
                  <td className="px-3 py-2.5 text-right font-bold text-xs">{fmt(total)}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-xs">{fmt(totalAA)}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-xs">{fmt(totalPpto)}</td>
                </tr>
              </tbody>
            </table>
            <Link href="/tabla-detalle" 
              className="block bg-gradient-to-r from-orange-50 to-orange-100 text-center py-2 text-xs font-semibold text-orange-700 hover:from-orange-100 hover:to-orange-200 transition-all mt-auto">
              Ver detalle con drill-down →
            </Link>
          </div>
        </div>

        {/* CHART - Full width below */}
        <div className="col-span-12 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Prima Neta por Línea</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#041224] rounded-sm"></span>
                <span className="text-xs text-gray-600">Prima cobrada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-gray-300 rounded-sm"></span>
                <span className="text-xs text-gray-600">Presupuesto</span>
              </div>
            </div>
          </div>
          <div ref={chartRef} className="w-full" style={{ height: 240 }}>
            {chartReady && chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 100, left: 20, bottom: 5 }} barGap={6}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="nombre" width={130} tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => `$${v}M`} />
                  <Bar dataKey="value" fill="#041224" radius={[0, 6, 6, 0]} barSize={24}>
                    <LabelList dataKey="value" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 12, fontWeight: 700, fill: '#374151' }} />
                  </Bar>
                  <Bar dataKey="ppto" fill="#D1D5DB" radius={[0, 6, 6, 0]} barSize={24}>
                    <LabelList dataKey="ppto" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 10, fill: '#9CA3AF' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <PageFooter showFootnote />
    </div>
  )
}
