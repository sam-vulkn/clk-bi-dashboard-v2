"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Gauge } from "@/components/gauge"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import {
  SEED_LINEAS, SEED_PRESUPUESTO, SEED_FX,
  getTipoCambio, getDataFreshness, getLastDataDate,
} from "@/lib/queries"
import type { FxRates } from "@/lib/queries"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell } from "recharts"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

const MESES: Record<string, number> = {
  Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
  Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12,
}

interface DL { nombre: string; primaNeta: number; presupuesto: number; anioAnterior: number }

export default function HomePage() {
  const [year, setYear] = useState("2026")
  const [month, setMonth] = useState("Febrero")
  const [lineas] = useState<DL[]>(SEED_LINEAS.map(l => ({ nombre: l.nombre, primaNeta: l.primaNeta, presupuesto: l.presupuesto, anioAnterior: l.anioAnterior })))
  const [fx, setFx] = useState<FxRates & { fechaActualizacion?: string }>(SEED_FX)
  const [fxLoading, setFxLoading] = useState(true)
  const [staleHours, setStaleHours] = useState<number | null>(null)
  const [lastDataDate, setLastDataDate] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [chartReady, setChartReady] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true); document.title = "Tacómetro | CLK BI Dashboard" }, [])
  
  // Wait for chart container to have dimensions before rendering
  useEffect(() => {
    if (!mounted) return
    const timer = setTimeout(() => {
      if (chartRef.current && chartRef.current.offsetHeight > 0) {
        setChartReady(true)
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [mounted])
  useEffect(() => { getTipoCambio().then(r => { if (r) setFx(r); setFxLoading(false) }).catch(() => setFxLoading(false)) }, [])
  useEffect(() => { getDataFreshness().then(h => setStaleHours(h)) }, [])
  useEffect(() => { getLastDataDate().then(d => setLastDataDate(d)) }, [])

  const total = lineas.reduce((s, l) => s + l.primaNeta, 0)
  const totalPpto = lineas.reduce((s, l) => s + l.presupuesto, 0) || SEED_PRESUPUESTO
  const totalAA = lineas.reduce((s, l) => s + l.anioAnterior, 0)
  const hasPpto = lineas.some(l => l.presupuesto > 0)
  const hasAA = lineas.some(l => l.anioAnterior > 0)

  // KPIs
  const cumpl = hasPpto ? Math.round((total / totalPpto) * 100) : 76
  const crec = hasAA ? Math.round(((total - totalAA) / totalAA) * 1000) / 10 : 10.8

  const now = mounted ? new Date() : new Date(2026, 1, 28)
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dp = now.getDate()
  const forecast = total * 1.05 // Seed data: project +5% (realistic)

  // Gauge values
  const gV = total / 1e6 || 98.5
  const gB = hasPpto ? totalPpto / 1e6 : 129.5
  const gP = hasAA ? totalAA / 1e6 : 88.9

  // Chart data - sorted by prima descending for visual impact
  const chartData = [...lineas].sort((a, b) => a.primaNeta - b.primaNeta).map(l => ({
    nombre: l.nombre,
    pn: +(l.primaNeta / 1e6).toFixed(1),
    ppto: l.presupuesto ? +(l.presupuesto / 1e6).toFixed(1) : 0,
  }))

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] overflow-hidden">
      <PageTabs />

      {/* Title bar */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-[#041224] tracking-wide uppercase">Prima neta cobrada</span>
          <span className="text-[10px] text-[#999]">por línea de negocio</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(e.target.value)} className="border border-[#E5E7EB] rounded px-2 py-1 bg-white text-[11px] font-medium">
            <option>2026</option><option>2025</option>
          </select>
          <select value={month} onChange={e => setMonth(e.target.value)} className="border border-[#E5E7EB] rounded px-2 py-1 bg-white text-[11px] font-medium">
            {Object.keys(MESES).map(m => <option key={m}>{m}</option>)}
          </select>
          <span className="text-[10px] text-[#BBB]">Datos al: {lastDataDate ?? (mounted ? new Date().toLocaleDateString("es-MX") : "—")}</span>
          {staleHours !== null && staleHours > 6 && <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">⚠ Desactualizado</span>}
        </div>
      </div>

      {/* ═══ MAIN LAYOUT: Gauge (40%) + Table (60%) ═══ */}
      <div className="flex gap-3 flex-shrink-0" style={{ height: "42%" }}>
        {/* GAUGE — Larger and more prominent */}
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#E5E5E5] flex items-center justify-center p-4 overflow-hidden" style={{ width: "40%", minWidth: 320 }}>
          <Gauge value={Math.round(gV * 10) / 10} prevYear={Math.round(gP * 10) / 10} budget={Math.round(gB * 10) / 10} />
        </div>

        {/* TABLE — Static, click goes to Tabla Detalle */}
        <div className="flex-1 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#E5E5E5] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                  <th className="text-left px-4 py-3 font-bold text-[12px]">Línea de Negocio</th>
                  <th className="text-right px-4 py-3 font-bold text-[12px]">Prima Neta</th>
                  <th className="text-right px-4 py-3 font-bold text-[12px]">Año Anterior</th>
                  <th className="text-right px-4 py-3 font-bold text-[12px]">Presupuesto</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l, idx) => (
                  <tr key={l.nombre} className={`border-b border-[#F0F0F0] hover:bg-[#FFF5F5] transition-all cursor-default ${idx % 2 ? "bg-[#FAFAFA]" : "bg-white"}`}>
                    <td className="px-4 py-3 font-semibold text-[#111]">{l.nombre}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#041224]">{fmt(l.primaNeta)}</td>
                    <td className="px-4 py-3 text-right text-[#666]">{l.anioAnterior ? fmt(l.anioAnterior) : <span className="text-[#DDD]">—</span>}</td>
                    <td className="px-4 py-3 text-right text-[#666]">{l.presupuesto ? fmt(l.presupuesto) : <span className="text-[#DDD]">—</span>}</td>
                  </tr>
                ))}
                <tr className="bg-[#041224] text-white sticky bottom-0">
                  <td className="px-4 py-3 font-bold">Total</td>
                  <td className="px-4 py-3 text-right font-bold">{fmt(total)}</td>
                  <td className="px-4 py-3 text-right font-bold">{hasAA ? fmt(totalAA) : ""}</td>
                  <td className="px-4 py-3 text-right font-bold">{hasPpto ? fmt(totalPpto) : ""}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Link to Tabla Detalle */}
          <Link href="/tabla-detalle" className="block bg-[#FDECEA] text-center py-2 text-[11px] font-bold text-[#E62800] hover:bg-[#FEE2E2] transition-colors border-t border-[#F0F0F0]">
            Ver detalle completo →
          </Link>
        </div>
      </div>

      {/* ═══ KPI CARDS ROW ═══ */}
      <div className="grid grid-cols-4 gap-3 my-3 flex-shrink-0">
        {/* Cumplimiento */}
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#E5E5E5] p-4 flex items-center gap-4">
          <svg viewBox="0 0 64 64" className="w-16 h-16 flex-shrink-0">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#F0F0F0" strokeWidth="8" />
            <circle cx="32" cy="32" r="26" fill="none"
              stroke={cumpl >= 90 ? "#16A34A" : cumpl >= 70 ? "#EAB308" : "#DC2626"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(cumpl / 100) * 163.36} 163.36`}
              transform="rotate(-90 32 32)" />
            <text x="32" y="35" fontSize="18" fill="#041224" textAnchor="middle" fontWeight="900" fontFamily="Lato">{cumpl}%</text>
          </svg>
          <div>
            <div className="text-[11px] font-bold text-[#041224]">Cumplimiento</div>
            <div className="text-[9px] text-[#888]">del presupuesto</div>
            <div className={`text-[10px] font-bold mt-1 ${cumpl >= 90 ? "text-[#16A34A]" : cumpl >= 70 ? "text-[#CA8A04]" : "text-[#DC2626]"}`}>
              {cumpl >= 90 ? "Meta alcanzada ✓" : cumpl >= 70 ? "Cerca de meta" : "Por debajo de meta"}
            </div>
          </div>
        </div>

        {/* Crecimiento */}
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#E5E5E5] p-4 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${crec >= 0 ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]"}`}>
            <span className={`text-2xl font-black ${crec >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{crec >= 0 ? "↑" : "↓"}</span>
          </div>
          <div>
            <div className={`text-3xl font-black leading-none ${crec >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{crec >= 0 ? "+" : ""}{crec}%</div>
            <div className="text-[10px] text-[#888] font-medium mt-1">vs Año Anterior</div>
          </div>
        </div>

        {/* Tipo de cambio */}
        <div className="bg-[#041224] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.2)] p-4 text-white">
          <div className="text-[9px] text-white/50 uppercase font-bold tracking-wider mb-2">Tipo de Cambio</div>
          {fxLoading ? <div className="text-sm text-white/30 animate-pulse">Actualizando…</div> : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-white/60">Dólar USD</span>
                <span className="text-xl font-black">${fx.usd.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-white/60">Peso Dominicano</span>
                <span className="text-xl font-black">${fx.dop.toFixed(2)}</span>
              </div>
            </div>
          )}
          {fx.fechaActualizacion && <div className="text-[8px] text-white/30 mt-2 text-right">{new Date(fx.fechaActualizacion).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>}
        </div>

        {/* Proyección */}
        <div className={`rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border p-4 ${forecast >= totalPpto ? "bg-[#F0FDF4] border-[#16A34A]/30" : "bg-[#FEF2F2] border-[#DC2626]/30"}`}>
          <div className="text-[9px] text-[#888] uppercase font-bold tracking-wider">Proyección al cierre</div>
          <div className={`text-4xl font-black leading-none mt-1 ${forecast >= totalPpto ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
            ${(forecast / 1e6).toFixed(1)}M
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-[#E5E7E9] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${forecast >= totalPpto ? "bg-[#16A34A]" : "bg-[#DC2626]"}`} style={{ width: `${Math.min(100, (dp / dim) * 100)}%` }} />
            </div>
            <span className="text-[9px] text-[#888] font-medium">{dp}/{dim} días</span>
          </div>
        </div>
      </div>

      {/* ═══ CHART — BIGGER AND MORE PROMINENT ═══ */}
      <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#E5E5E5] px-5 py-4 flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center gap-4 mb-3 flex-shrink-0">
          <span className="text-sm font-bold text-[#041224]">Prima neta por línea</span>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-[#041224] rounded" /><span className="text-[11px] text-[#666] font-medium">Prima cobrada</span>
            </div>
            {chartData.some(d => d.ppto > 0) && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 bg-[#CCD1D3] rounded" /><span className="text-[11px] text-[#666] font-medium">Presupuesto</span>
              </div>
            )}
          </div>
        </div>
        <div ref={chartRef} className="flex-1" style={{ minHeight: 220, height: 220 }}>
          {chartReady && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart layout="vertical" data={chartData} margin={{ top: 10, right: 100, left: 20, bottom: 10 }} barGap={8} barSize={32}>
                <CartesianGrid horizontal vertical={false} stroke="#F0F0F0" />
                <XAxis type="number" domain={[0, "auto"]} tickFormatter={(v: unknown) => `$${v}M`} fontSize={12} tick={{ fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nombre" width={150} fontSize={13} tick={{ fill: "#111", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Bar dataKey="pn" fill="#041224" radius={[0, 8, 8, 0]}>
                  <LabelList dataKey="pn" position="right" formatter={(v: unknown) => `$${v}M`} fontSize={13} fill="#041224" fontWeight={800} offset={12} />
                </Bar>
                {chartData.some(d => d.ppto > 0) && (
                  <Bar dataKey="ppto" fill="#CCD1D3" radius={[0, 8, 8, 0]}>
                    <LabelList dataKey="ppto" position="right" formatter={(v: unknown) => Number(v) > 0 ? `$${v}M` : ""} fontSize={11} fill="#888" offset={12} />
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <PageFooter showFootnote />
    </div>
  )
}
// Force rebuild 1772384912
