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
  const forecast = total * 1.05

  const gV = total / 1e6
  const gB = totalPpto / 1e6
  const gP = totalAA / 1e6

  const now = mounted ? new Date() : new Date(2026, 1, 28)
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dp = now.getDate()

  const chartData = [...lineas].sort((a, b) => a.primaNeta - b.primaNeta).map(l => ({
    nombre: l.nombre,
    value: +(l.primaNeta / 1e6).toFixed(1),
    ppto: +(l.presupuesto / 1e6).toFixed(1),
  }))

  return (
    <div className="min-h-screen bg-gray-100">
      <PageTabs />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Prima Neta Cobrada</h1>
          <p className="text-sm text-gray-500">por línea de negocio</p>
        </div>
        <div className="flex items-center gap-3">
          <select id="year-select" name="year" value={year} onChange={e => setYear(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm">
            <option>2026</option><option>2025</option>
          </select>
          <select id="month-select" name="month" value={month} onChange={e => setMonth(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm">
            {MESES.map(m => <option key={m}>{m}</option>)}
          </select>
          {lastDataDate && <span className="text-xs text-gray-400 ml-2">Datos al: {lastDataDate}</span>}
        </div>
      </div>

      {/* Main Row: Gauge (larger) + Table */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Gauge - CLICKABLE to Tabla Detalle */}
        <div className="col-span-5 bg-white rounded-xl shadow-md border border-gray-200 p-4" style={{ minHeight: 340 }}>
          <Gauge value={Math.round(gV * 10) / 10} prevYear={Math.round(gP * 10) / 10} budget={Math.round(gB * 10) / 10} clickable={true} />
        </div>

        {/* Table - Static, links to Tabla Detalle */}
        <div className="col-span-7 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
          <table className="w-full text-sm flex-1">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="text-left px-4 py-3 font-semibold">Línea de Negocio</th>
                <th className="text-right px-4 py-3 font-semibold">Prima Neta</th>
                <th className="text-right px-4 py-3 font-semibold">Año Anterior</th>
                <th className="text-right px-4 py-3 font-semibold">Presupuesto</th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l, i) => (
                <tr key={l.nombre} className={`border-b border-gray-100 ${i % 2 ? 'bg-gray-50' : 'bg-white'} hover:bg-orange-50 transition-colors`}>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{l.nombre}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{fmt(l.primaNeta)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{fmt(l.anioAnterior)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{fmt(l.presupuesto)}</td>
                </tr>
              ))}
              <tr className="bg-gray-900 text-white">
                <td className="px-4 py-3 font-bold">Total</td>
                <td className="px-4 py-3 text-right font-bold">{fmt(total)}</td>
                <td className="px-4 py-3 text-right font-bold">{fmt(totalAA)}</td>
                <td className="px-4 py-3 text-right font-bold">{fmt(totalPpto)}</td>
              </tr>
            </tbody>
          </table>
          <Link href="/tabla-detalle" className="block bg-gradient-to-r from-orange-50 to-orange-100 text-center py-2.5 text-sm font-semibold text-orange-700 hover:from-orange-100 hover:to-orange-200 transition-all border-t border-gray-200">
            Ver detalle completo con drill-down →
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {/* Cumplimiento */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 44 44" className="w-16 h-16 flex-shrink-0">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#E5E7EB" strokeWidth="5" />
              <circle cx="22" cy="22" r="18" fill="none"
                stroke={cumpl >= 90 ? "#10B981" : cumpl >= 70 ? "#F59E0B" : "#EF4444"}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${(cumpl / 100) * 113} 113`}
                transform="rotate(-90 22 22)" />
              <text x="22" y="24" fontSize="13" fill="#111" textAnchor="middle" fontWeight="800">{cumpl}%</text>
            </svg>
            <div>
              <div className="text-sm font-bold text-gray-900">Cumplimiento</div>
              <div className="text-xs text-gray-500">del presupuesto</div>
              <div className={`text-xs font-bold mt-1 ${cumpl >= 90 ? "text-emerald-600" : cumpl >= 70 ? "text-amber-600" : "text-red-600"}`}>
                {cumpl >= 90 ? "✓ Meta alcanzada" : cumpl >= 70 ? "Cerca de meta" : "Por debajo"}
              </div>
            </div>
          </div>
        </div>

        {/* Crecimiento */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${crec >= 0 ? "bg-emerald-100" : "bg-red-100"}`}>
              <span className={`text-2xl font-black ${crec >= 0 ? "text-emerald-600" : "text-red-600"}`}>{crec >= 0 ? "↑" : "↓"}</span>
            </div>
            <div>
              <div className={`text-3xl font-black ${crec >= 0 ? "text-emerald-600" : "text-red-600"}`}>{crec >= 0 ? "+" : ""}{crec}%</div>
              <div className="text-xs text-gray-500">vs Año Anterior</div>
            </div>
          </div>
        </div>

        {/* Tipo de Cambio */}
        <div className="bg-gray-900 rounded-xl shadow-md p-5 text-white">
          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-3">Tipo de Cambio</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Dólar USD</span>
              <span className="text-xl font-black">${fx.usd.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-700"></div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Peso Dominicano</span>
              <span className="text-xl font-black">${fx.dop.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Proyección */}
        <div className={`rounded-xl shadow-md border p-5 ${forecast >= totalPpto ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wide">Proyección al Cierre</div>
          <div className={`text-3xl font-black mt-1 ${forecast >= totalPpto ? "text-emerald-600" : "text-red-600"}`}>
            ${(forecast / 1e6).toFixed(1)}M
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${forecast >= totalPpto ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${Math.min(100, (dp / dim) * 100)}%` }} />
            </div>
            <span className="text-xs text-gray-500 font-medium">{dp}/{dim}</span>
          </div>
        </div>
      </div>

      {/* Chart - BIGGER and more readable */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Prima Neta por Línea</h3>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-gray-900 rounded"></span>
              <span className="text-xs text-gray-600 font-medium">Prima cobrada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-gray-300 rounded"></span>
              <span className="text-xs text-gray-600 font-medium">Presupuesto</span>
            </div>
          </div>
        </div>
        <div ref={chartRef} className="w-full" style={{ height: 280 }}>
          {chartReady && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 100, left: 20, bottom: 5 }} barGap={6}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nombre" width={140} tick={{ fontSize: 13, fill: '#374151', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => `$${v}M`} />
                <Bar dataKey="value" fill="#1F2937" radius={[0, 6, 6, 0]} barSize={28}>
                  <LabelList dataKey="value" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 13, fontWeight: 700, fill: '#374151' }} />
                </Bar>
                <Bar dataKey="ppto" fill="#D1D5DB" radius={[0, 6, 6, 0]} barSize={28}>
                  <LabelList dataKey="ppto" position="right" formatter={(v: unknown) => `$${v}M`} style={{ fontSize: 11, fill: '#9CA3AF' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <PageFooter showFootnote />
    </div>
  )
}
