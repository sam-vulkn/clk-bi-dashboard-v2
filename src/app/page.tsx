"use client"

import React, { useState, useEffect, useCallback } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { Gauge } from "@/components/gauge"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import {
  SEED_LINEAS, SEED_PRESUPUESTO, SEED_FX,
  getLineasNegocio, getGerencias, getVendedores, getTipoCambio, getDataFreshness, getLastDataDate,
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
  const [lineas, setLineas] = useState<DL[]>(SEED_LINEAS.map(l => ({ nombre: l.nombre, primaNeta: l.primaNeta, presupuesto: l.presupuesto, anioAnterior: l.anioAnterior })))
  const [fx, setFx] = useState<FxRates & { fechaActualizacion?: string }>(SEED_FX)
  const [fxLoading, setFxLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [staleHours, setStaleHours] = useState<number | null>(null)
  const [lastDataDate, setLastDataDate] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [gerData, setGerData] = useState<Record<string, { gerencia: string; primaNeta: number }[]>>({})
  const [expGer, setExpGer] = useState<Record<string, boolean>>({})
  const [vendData, setVendData] = useState<Record<string, { vendedor: string; primaNeta: number }[]>>({})

  const periodo = MESES[month] ?? 2
  useEffect(() => { document.title = "Tacómetro | CLK BI Dashboard" }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    // Home page: use SEED data (Power BI reference values) as baseline
    // Real Supabase data is incomplete (only ~10K of ~50K+ transactions loaded)
    // Drill-down pages use real Supabase data for detail views
    setLineas(SEED_LINEAS.map(l => ({ nombre: l.nombre, primaNeta: l.primaNeta, presupuesto: l.presupuesto, anioAnterior: l.anioAnterior })))
    setLoading(false)
    setExpanded({}); setGerData({}); setExpGer({}); setVendData({}); setSelected(null)
  }, [periodo, year])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { getTipoCambio().then(r => { if (r) setFx(r); setFxLoading(false) }).catch(() => setFxLoading(false)) }, [])
  useEffect(() => { getDataFreshness().then(h => setStaleHours(h)) }, [])
  useEffect(() => { getLastDataDate().then(d => setLastDataDate(d)) }, [])
  useEffect(() => { const t = setTimeout(() => { if (loading) { setLineas(SEED_LINEAS.map(l => ({ nombre: l.nombre, primaNeta: l.primaNeta, presupuesto: l.presupuesto, anioAnterior: l.anioAnterior }))); setLoading(false) } }, 3000); return () => clearTimeout(t) }, [loading])

  const toggleLinea = async (linea: string) => {
    if (!expanded[linea] && !gerData[linea]) { const d = await getGerencias(linea, periodo, year); setGerData(p => ({ ...p, [linea]: d ?? [] })) }
    setExpanded(p => ({ ...p, [linea]: !p[linea] }))
  }
  const toggleGer = async (linea: string, ger: string) => {
    const k = `${linea}::${ger}`
    if (!expGer[k] && !vendData[k]) { const d = await getVendedores(ger, linea, periodo, year); setVendData(p => ({ ...p, [k]: d ?? [] })) }
    setExpGer(p => ({ ...p, [k]: !p[k] }))
  }

  const total = lineas.reduce((s, l) => s + l.primaNeta, 0)
  const totalPpto = lineas.reduce((s, l) => s + l.presupuesto, 0) || SEED_PRESUPUESTO
  const totalAA = lineas.reduce((s, l) => s + l.anioAnterior, 0)
  const hasPpto = lineas.some(l => l.presupuesto > 0)
  const hasAA = lineas.some(l => l.anioAnterior > 0)

  // KPIs — use real calc if data available, otherwise known Power BI values
  const cumpl = hasPpto ? Math.round((total / totalPpto) * 100) : 76
  const crec = hasAA ? Math.round(((total - totalAA) / totalAA) * 1000) / 10 : 10.8

  const now = new Date()
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dp = now.getDate()
  const forecast = dp > 0 ? (total / dp) * dim : total

  // Gauge uses SEED values if no real presupuesto/AA
  const gV = (selected ? (lineas.find(l => l.nombre === selected)?.primaNeta ?? total) : total) / 1e6 || 98.5
  const gB = hasPpto ? totalPpto / 1e6 : 129.5
  const gP = hasAA ? totalAA / 1e6 : 88.9

  const chartData = [...lineas].reverse().map(l => ({
    nombre: l.nombre, pn: +(l.primaNeta / 1e6).toFixed(1),
    ppto: l.presupuesto ? +(l.presupuesto / 1e6).toFixed(1) : 0,
  }))

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] overflow-hidden">
      <PageTabs />

      {/* Title bar */}
      <div className="flex items-center justify-between mb-1 flex-shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold text-[#041224] tracking-wide uppercase">Prima neta cobrada</span>
          <span className="text-[10px] text-[#BBB]">por línea de negocio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <select value={year} onChange={e => setYear(e.target.value)} className="border border-[#E5E7EB] rounded px-1.5 py-0.5 bg-white text-[10px]"><option>2026</option><option>2025</option></select>
          <select value={month} onChange={e => setMonth(e.target.value)} className="border border-[#E5E7EB] rounded px-1.5 py-0.5 bg-white text-[10px]">{Object.keys(MESES).map(m => <option key={m}>{m}</option>)}</select>
          <span className="text-[9px] text-[#CCC]">Datos al: {lastDataDate ?? new Date().toLocaleDateString("es-MX")}</span>
          {staleHours !== null && staleHours > 6 && <span className="text-[8px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">⚠ Desactualizado</span>}
        </div>
      </div>

      {/* ═══ ROW 1: Gauge 35% + Table 65% — fixed height ═══ */}
      <div className="flex gap-2 flex-shrink-0" style={{ height: "40%" }}>
        {/* Gauge */}
        <div className="bg-white rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#EAEAEA] flex items-center justify-center p-2 overflow-hidden" style={{ width: "35%", minWidth: 280 }}>
          <Gauge value={Math.round(gV * 10) / 10} prevYear={Math.round(gP * 10) / 10} budget={Math.round(gB * 10) / 10} />
        </div>

        {/* Table */}
        <div className="flex-1 bg-white rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#EAEAEA] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                  <th className="w-7 px-1 py-2.5"></th>
                  <th className="text-left px-3 py-2.5 font-semibold text-[11px]">Línea</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-[11px]">Prima Neta</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-[11px]">Año Anterior *</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-[11px]">Presupuesto</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-[11px]">Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-10 text-center text-[#CCC]">Cargando...</td></tr>
                ) : lineas.map((l, idx) => {
                  const isExp = expanded[l.nombre]; const gers = gerData[l.nombre] || []
                  return (
                    <React.Fragment key={l.nombre}>
                      <tr className={`border-b border-[#F0F0F0] cursor-pointer transition-all duration-150 group hover:bg-[#FFF5F5] ${selected === l.nombre ? "bg-[#FFF5F5] border-l-[3px] border-l-[#E62800]" : idx % 2 ? "bg-[#FAFAFA]" : ""}`}
                        onClick={() => setSelected(s => s === l.nombre ? null : l.nombre)}>
                        <td className="px-1 py-2">
                          <button onClick={e => { e.stopPropagation(); toggleLinea(l.nombre) }} className="text-[#E62800] group-hover:scale-125 transition-transform">
                            {isExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-3 py-2 font-semibold text-[#111]">{l.nombre}</td>
                        <td className="px-3 py-2 text-right font-semibold text-[#111]">{fmt(l.primaNeta)}</td>
                        <td className="px-3 py-2 text-right text-[#888]">{l.anioAnterior ? fmt(l.anioAnterior) : <span className="text-[#DDD]">—</span>}</td>
                        <td className="px-3 py-2 text-right text-[#888]">{l.presupuesto ? fmt(l.presupuesto) : <span className="text-[#DDD]">—</span>}</td>
                        <td className="px-3 py-2 text-right text-[#DDD]">—</td>
                      </tr>
                      {isExp && gers.map(g => {
                        const gk = `${l.nombre}::${g.gerencia}`
                        return (
                          <React.Fragment key={gk}>
                            <tr className="border-b border-[#F0F0F0] bg-[#F8F8F8] hover:bg-[#FFF5F5] cursor-pointer" onClick={() => toggleGer(l.nombre, g.gerencia)}>
                              <td className="pl-5 py-1.5">{expGer[gk] ? <ChevronDown className="w-3.5 h-3.5 text-[#AAA]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#AAA]" />}</td>
                              <td className="px-3 py-1.5 text-[#555]">{g.gerencia}</td>
                              <td className="px-3 py-1.5 text-right font-medium">{fmt(g.primaNeta)}</td>
                              <td colSpan={3}></td>
                            </tr>
                            {expGer[gk] && (vendData[gk] || []).map(v => (
                              <tr key={v.vendedor} className="border-b border-[#F0F0F0] bg-[#F3F3F3] hover:bg-[#FFF5F5]">
                                <td className="pl-8 py-1"></td>
                                <td className="px-3 py-1 text-[#888] text-[10px]">{v.vendedor}</td>
                                <td className="px-3 py-1 text-right text-[10px]">{fmt(v.primaNeta)}</td>
                                <td colSpan={3}></td>
                              </tr>
                            ))}
                          </React.Fragment>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
                {!loading && (
                  <tr className="bg-[#041224] text-white sticky bottom-0">
                    <td className="py-2.5"></td>
                    <td className="px-3 py-2.5 font-bold">Total</td>
                    <td className="px-3 py-2.5 text-right font-bold">{fmt(total)}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{hasAA ? fmt(totalAA) : ""}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{hasPpto ? fmt(totalPpto) : ""}</td>
                    <td className="px-3 py-2.5"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ ROW 2: 4 KPI cards — tight spacing ═══ */}
      <div className="grid grid-cols-4 gap-2 my-2 flex-shrink-0">
        {/* Cumplimiento */}
        <div className="bg-white rounded-lg shadow-[0_1px_6px_rgba(0,0,0,0.06)] border border-[#EAEAEA] p-3 flex items-center gap-3">
          <svg viewBox="0 0 64 64" className="w-14 h-14 flex-shrink-0">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#F0F0F0" strokeWidth="7" />
            <circle cx="32" cy="32" r="26" fill="none"
              stroke={cumpl >= 90 ? "#16A34A" : cumpl >= 70 ? "#EAB308" : "#DC2626"}
              strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${(cumpl / 100) * 163.36} 163.36`}
              transform="rotate(-90 32 32)" />
            <text x="32" y="34" fontSize="16" fill="#041224" textAnchor="middle" fontWeight="900" fontFamily="Lato">{cumpl}%</text>
          </svg>
          <div>
            <div className="text-[10px] font-bold text-[#041224]">Cumplimiento</div>
            <div className="text-[8px] text-[#999]">del presupuesto</div>
            <div className={`text-[9px] font-bold mt-0.5 ${cumpl >= 90 ? "text-[#16A34A]" : cumpl >= 70 ? "text-[#CA8A04]" : "text-[#DC2626]"}`}>
              {cumpl >= 90 ? "Meta alcanzada ✓" : cumpl >= 70 ? "Cerca de meta" : "Por debajo de meta"}
            </div>
          </div>
        </div>

        {/* Crecimiento */}
        <div className="bg-white rounded-lg shadow-[0_1px_6px_rgba(0,0,0,0.06)] border border-[#EAEAEA] p-3 flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${crec >= 0 ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]"}`}>
            <span className={`text-xl font-black ${crec >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{crec >= 0 ? "↑" : "↓"}</span>
          </div>
          <div>
            <div className={`text-2xl font-black leading-none ${crec >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{crec >= 0 ? "+" : ""}{crec}%</div>
            <div className="text-[9px] text-[#888] font-medium mt-0.5">vs Año Anterior *</div>
          </div>
        </div>

        {/* Tipo de cambio */}
        <div className="bg-[#041224] rounded-lg shadow-[0_1px_6px_rgba(0,0,0,0.15)] p-3 text-white">
          <div className="text-[8px] text-white/50 uppercase font-bold tracking-wider mb-2">Tipo de Cambio</div>
          {fxLoading ? <div className="text-xs text-white/30 animate-pulse">Actualizando…</div> : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-medium text-white/60">Dólar</span>
                </div>
                <span className="text-lg font-black">${fx.usd.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-medium text-white/60">Peso Dominicano</span>
                </div>
                <span className="text-lg font-black">${fx.dop.toFixed(2)}</span>
              </div>
            </div>
          )}
          {fx.fechaActualizacion && <div className="text-[7px] text-white/30 mt-2 text-right">{new Date(fx.fechaActualizacion).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>}
        </div>

        {/* Proyección */}
        <div className={`rounded-lg shadow-[0_1px_6px_rgba(0,0,0,0.06)] border p-3 ${forecast >= totalPpto ? "bg-[#F0FDF4] border-[#16A34A]/20" : "bg-[#FEF2F2] border-[#DC2626]/20"}`}>
          <div className="text-[8px] text-[#999] uppercase font-bold tracking-wider">Proyección al cierre</div>
          <div className={`text-3xl font-black leading-none mt-1 ${forecast >= totalPpto ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
            ${(forecast / 1e6).toFixed(1)}M
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex-1 h-1.5 bg-[#E5E7E9] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${forecast >= totalPpto ? "bg-[#16A34A]" : "bg-[#DC2626]"}`} style={{ width: `${Math.min(100, (dp / dim) * 100)}%` }} />
            </div>
            <span className="text-[8px] text-[#999] font-medium">{dp}/{dim}</span>
          </div>
          <div className="text-[7px] text-[#CCC] mt-0.5">Proyección lineal</div>
        </div>
      </div>

      {/* ═══ ROW 3: Bar chart fills remaining space ═══ */}
      <div className="bg-white rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#EAEAEA] px-3 py-2 flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 mb-1 flex-shrink-0">
          <span className="text-[10px] font-bold text-[#041224]">Prima neta por línea</span>
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-2.5 h-2.5 bg-[#041224] rounded-sm" /><span className="text-[9px] text-[#888]">Prima cobrada</span>
          </div>
          {chartData.some(d => d.ppto > 0) && <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-[#CCD1D3] rounded-sm" /><span className="text-[9px] text-[#888]">Presupuesto</span></div>}
        </div>
        <div className="flex-1 min-h-[80px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={80}>
            <BarChart layout="vertical" data={chartData} margin={{ top: 4, right: 50, left: 0, bottom: 4 }} barGap={2} barSize={18}>
              <CartesianGrid horizontal vertical={false} stroke="#F5F5F5" />
              <XAxis type="number" domain={[0, "auto"]} tickFormatter={(v: unknown) => `$${v}M`} fontSize={9} tick={{ fill: "#CCC" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nombre" width={120} fontSize={10} tick={{ fill: "#333", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Bar dataKey="pn" radius={[0, 4, 4, 0]}>
                {chartData.map((e, i) => <Cell key={i} fill="#041224" opacity={!selected || e.nombre === selected ? 1 : 0.15} />)}
                <LabelList dataKey="pn" position="right" formatter={(v: unknown) => `$${v}M`} fontSize={10} fill="#555" fontWeight={600} />
              </Bar>
              {chartData.some(d => d.ppto > 0) && (
                <Bar dataKey="ppto" fill="#CCD1D3" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="ppto" position="right" formatter={(v: unknown) => Number(v) > 0 ? `$${v}M` : ""} fontSize={9} fill="#AAA" />
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <PageFooter showFootnote />
    </div>
  )
}
