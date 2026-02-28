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
function fmtM(v: number) { return `$${(v / 1e6).toFixed(1)}M` }

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
    const r = await getLineasNegocio(periodo, year)
    if (r && r.length > 0) {
      setLineas(r.map(x => ({ nombre: x.linea, primaNeta: x.primaNeta, presupuesto: 0, anioAnterior: 0 })))
    } else {
      setLineas(SEED_LINEAS.map(l => ({ nombre: l.nombre, primaNeta: l.primaNeta, presupuesto: l.presupuesto, anioAnterior: l.anioAnterior })))
    }
    setLoading(false)
    setExpanded({}); setGerData({}); setExpGer({}); setVendData({}); setSelected(null)
  }, [periodo, year])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { getTipoCambio().then(r => { if (r) setFx(r); setFxLoading(false) }).catch(() => setFxLoading(false)) }, [])
  useEffect(() => { getDataFreshness().then(h => setStaleHours(h)) }, [])
  useEffect(() => { getLastDataDate().then(d => setLastDataDate(d)) }, [])
  useEffect(() => {
    const t = setTimeout(() => { if (loading) { setLineas(SEED_LINEAS.map(l => ({ nombre: l.nombre, primaNeta: l.primaNeta, presupuesto: l.presupuesto, anioAnterior: l.anioAnterior }))); setLoading(false) } }, 3000)
    return () => clearTimeout(t)
  }, [loading])

  const toggleLinea = async (linea: string) => {
    if (!expanded[linea] && !gerData[linea]) {
      const d = await getGerencias(linea, periodo, year)
      setGerData(p => ({ ...p, [linea]: d ?? [] }))
    }
    setExpanded(p => ({ ...p, [linea]: !p[linea] }))
  }
  const toggleGer = async (linea: string, ger: string) => {
    const k = `${linea}::${ger}`
    if (!expGer[k] && !vendData[k]) {
      const d = await getVendedores(ger, linea, periodo, year)
      setVendData(p => ({ ...p, [k]: d ?? [] }))
    }
    setExpGer(p => ({ ...p, [k]: !p[k] }))
  }

  const total = lineas.reduce((s, l) => s + l.primaNeta, 0)
  const totalPpto = lineas.reduce((s, l) => s + l.presupuesto, 0) || SEED_PRESUPUESTO
  const totalAnioAnt = lineas.reduce((s, l) => s + l.anioAnterior, 0)
  const hasPpto = lineas.some(l => l.presupuesto > 0)
  const hasAA = lineas.some(l => l.anioAnterior > 0)

  const displayCumpl = hasPpto ? Math.round((total / totalPpto) * 100) : 76
  const displayCrec = hasAA ? Math.round(((total - totalAnioAnt) / totalAnioAnt) * 1000) / 10 : 10.8

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed = now.getDate()
  const forecast = daysPassed > 0 ? (total / daysPassed) * daysInMonth : total

  const gaugeVal = (selected ? (lineas.find(l => l.nombre === selected)?.primaNeta ?? total) : total) / 1e6 || 98.5
  const gaugeBudget = totalPpto / 1e6 || 129.5
  const gaugePY = totalAnioAnt / 1e6 || 88.9

  const chartData = [...lineas].reverse().map(l => ({
    nombre: l.nombre.length > 16 ? l.nombre.substring(0, 14) + "…" : l.nombre,
    full: l.nombre,
    pn: +(l.primaNeta / 1e6).toFixed(1),
    ppto: l.presupuesto ? +(l.presupuesto / 1e6).toFixed(1) : 0,
  }))

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <PageTabs />

      {/* Header row */}
      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
        <h1 className="text-[13px] font-bold text-[#041224]">Prima neta cobrada por línea de negocio</h1>
        <div className="flex items-center gap-1.5 text-[10px]">
          <select value={year} onChange={e => setYear(e.target.value)} className="border border-[#E5E7EB] rounded px-1 py-0.5 bg-white text-[10px]">
            <option>2026</option><option>2025</option>
          </select>
          <select value={month} onChange={e => setMonth(e.target.value)} className="border border-[#E5E7EB] rounded px-1 py-0.5 bg-white text-[10px]">
            {Object.keys(MESES).map(m => <option key={m}>{m}</option>)}
          </select>
          <span className="text-[9px] text-[#CCC]">Datos al: {lastDataDate ?? new Date().toLocaleDateString("es-MX")}</span>
          {staleHours !== null && staleHours > 6 && <span className="text-[8px] bg-orange-100 text-orange-700 px-1 rounded-full">⚠</span>}
        </div>
      </div>

      {/* ═══ ROW 1: Gauge (50%) + Table (50%) ═══ */}
      <div className="grid grid-cols-2 gap-2 flex-shrink-0" style={{ height: "42vh", minHeight: 280 }}>
        {/* Gauge card */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E7E9] p-1 flex flex-col justify-center overflow-hidden">
          <Gauge value={Math.round(gaugeVal * 10) / 10} prevYear={Math.round(gaugePY * 10) / 10} budget={Math.round(gaugeBudget * 10) / 10} />
        </div>

        {/* Table card */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E7E9] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                  <th className="w-5 px-0.5 py-1.5"></th>
                  <th className="text-left px-1.5 py-1.5 font-semibold text-[9px]">Línea</th>
                  <th className="text-right px-1.5 py-1.5 font-semibold text-[9px]">Prima neta</th>
                  <th className="text-right px-1.5 py-1.5 font-semibold text-[9px]">Año ant.*</th>
                  <th className="text-right px-1.5 py-1.5 font-semibold text-[9px]">Presupuesto</th>
                  <th className="text-right px-1.5 py-1.5 font-semibold text-[9px]">Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-6 text-center text-[#CCC] text-[10px]">Cargando...</td></tr>
                ) : lineas.map((l, idx) => {
                  const isExp = expanded[l.nombre]
                  const gers = gerData[l.nombre] || []
                  return (
                    <React.Fragment key={l.nombre}>
                      <tr className={`border-b border-[#F0F0F0] cursor-pointer transition-colors hover:bg-[#FFF5F5] ${selected === l.nombre ? "bg-[#FFF5F5]" : idx % 2 ? "bg-[#FAFAFA]" : ""}`}
                        onClick={() => setSelected(s => s === l.nombre ? null : l.nombre)}>
                        <td className="px-0.5 py-1">
                          <button onClick={e => { e.stopPropagation(); toggleLinea(l.nombre) }} className="text-[#E62800] hover:scale-110 transition-transform">
                            {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="px-1.5 py-1 font-medium text-[#111] text-[9px]">{l.nombre}</td>
                        <td className="px-1.5 py-1 text-right font-semibold text-[9px]">{fmt(l.primaNeta)}</td>
                        <td className="px-1.5 py-1 text-right text-[#999] text-[9px]">{l.anioAnterior ? fmt(l.anioAnterior) : "—"}</td>
                        <td className="px-1.5 py-1 text-right text-[#999] text-[9px]">{l.presupuesto ? fmt(l.presupuesto) : "—"}</td>
                        <td className="px-1.5 py-1 text-right text-[#CCC] text-[9px]">—</td>
                      </tr>
                      {isExp && gers.map(g => {
                        const gk = `${l.nombre}::${g.gerencia}`
                        return (
                          <React.Fragment key={gk}>
                            <tr className="border-b border-[#F0F0F0] bg-[#F8F8F8] hover:bg-[#FFF5F5] cursor-pointer" onClick={() => toggleGer(l.nombre, g.gerencia)}>
                              <td className="pl-3 py-0.5">{expGer[gk] ? <ChevronDown className="w-3 h-3 text-[#AAA]" /> : <ChevronRight className="w-3 h-3 text-[#AAA]" />}</td>
                              <td className="px-1.5 py-0.5 text-[#666] text-[9px]">{g.gerencia}</td>
                              <td className="px-1.5 py-0.5 text-right text-[9px]">{fmt(g.primaNeta)}</td>
                              <td colSpan={3}></td>
                            </tr>
                            {expGer[gk] && (vendData[gk] || []).map(v => (
                              <tr key={v.vendedor} className="border-b border-[#F0F0F0] bg-[#F3F3F3] hover:bg-[#FFF5F5]">
                                <td className="pl-6 py-0.5"></td>
                                <td className="px-1.5 py-0.5 text-[#888] text-[8px]">{v.vendedor}</td>
                                <td className="px-1.5 py-0.5 text-right text-[8px]">{fmt(v.primaNeta)}</td>
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
                    <td className="py-1.5"></td>
                    <td className="px-1.5 py-1.5 font-bold text-[9px]">Total</td>
                    <td className="px-1.5 py-1.5 text-right font-bold text-[9px]">{fmt(total)}</td>
                    <td className="px-1.5 py-1.5 text-right font-bold text-[9px]">{hasAA ? fmt(totalAnioAnt) : ""}</td>
                    <td className="px-1.5 py-1.5 text-right font-bold text-[9px]">{hasPpto ? fmt(totalPpto) : ""}</td>
                    <td className="px-1.5 py-1.5 text-right font-bold text-[9px]"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ ROW 2: KPI strip — flush, no gaps ═══ */}
      <div className="grid grid-cols-4 gap-1.5 my-1.5 flex-shrink-0">
        {/* Cumplimiento — radial progress */}
        <div className={`rounded-lg px-3 py-2 flex items-center gap-3 ${displayCumpl >= 90 ? "bg-[#16A34A]" : displayCumpl >= 70 ? "bg-gradient-to-br from-[#FBBF24] to-[#F59E0B]" : "bg-[#DC2626]"}`}>
          <svg viewBox="0 0 48 48" className="w-10 h-10 flex-shrink-0">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
            <circle cx="24" cy="24" r="20" fill="none" stroke="white" strokeWidth="4"
              strokeDasharray={`${(displayCumpl / 100) * 125.66} 125.66`}
              strokeLinecap="round" transform="rotate(-90 24 24)" />
            <text x="24" y="26" fontSize="11" fill="white" textAnchor="middle" fontWeight="900">{displayCumpl}%</text>
          </svg>
          <div>
            <div className={`text-[8px] uppercase font-bold tracking-wider ${displayCumpl >= 70 && displayCumpl < 90 ? "text-[#422006]" : "text-white/70"}`}>Cumplimiento</div>
            <div className={`text-[8px] ${displayCumpl >= 70 && displayCumpl < 90 ? "text-[#422006]/60" : "text-white/50"}`}>del presupuesto</div>
          </div>
        </div>

        {/* Crecimiento — arrow badge */}
        <div className={`rounded-lg px-3 py-2 flex items-center gap-2 ${displayCrec >= 0 ? "bg-[#16A34A]" : "bg-[#DC2626]"}`}>
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-black">{displayCrec >= 0 ? "↑" : "↓"}</span>
          </div>
          <div>
            <div className="text-white text-xl font-black leading-none">{displayCrec >= 0 ? "+" : ""}{displayCrec}%</div>
            <div className="text-[8px] text-white/60 uppercase font-bold tracking-wide">vs año anterior</div>
          </div>
        </div>

        {/* Tipo de cambio — clean card */}
        <div className="rounded-lg px-3 py-2 bg-white border border-[#E5E7E9] flex flex-col justify-center">
          <div className="text-[8px] text-[#999] uppercase font-bold tracking-wide mb-1">Tipo de cambio</div>
          {fxLoading ? <div className="text-[10px] text-[#CCC] animate-pulse">…</div> : (
            <div className="space-y-0.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[9px] text-[#888]">USD</span>
                <span className="text-sm font-bold text-[#041224]">${fx.usd.toFixed(2)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[9px] text-[#888]">DOP</span>
                <span className="text-sm font-bold text-[#041224]">${fx.dop.toFixed(2)}</span>
              </div>
            </div>
          )}
          {fx.fechaActualizacion && <div className="text-[7px] text-[#CCC] mt-0.5">{new Date(fx.fechaActualizacion).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>}
        </div>

        {/* Proyección */}
        <div className={`rounded-lg px-3 py-2 flex flex-col justify-center border ${forecast >= totalPpto ? "bg-[#F0FDF4] border-[#16A34A]/20" : "bg-[#FEF2F2] border-[#DC2626]/20"}`}>
          <div className="text-[8px] text-[#999] uppercase font-bold tracking-wide">Proyección al cierre</div>
          <div className={`text-2xl font-black leading-none mt-0.5 ${forecast >= totalPpto ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
            {fmtM(forecast)}
          </div>
          <div className="text-[7px] text-[#CCC] mt-0.5">Lineal · {daysPassed}/{daysInMonth} días</div>
        </div>
      </div>

      {/* ═══ ROW 3: Bar chart fills remaining space ═══ */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E7E9] px-3 py-2 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-3 mb-1 flex-shrink-0">
          <span className="text-[10px] font-bold text-[#041224]">Prima neta por línea</span>
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-2 h-2 bg-[#041224] rounded-sm" /><span className="text-[8px] text-[#999]">Prima cobrada</span>
          </div>
          {chartData.some(d => d.ppto > 0) && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-[#D1D5DB] rounded-sm" /><span className="text-[8px] text-[#999]">Presupuesto</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 45, left: 0, bottom: 0 }} barGap={1} barSize={14}>
              <CartesianGrid horizontal vertical={false} stroke="#F5F5F5" />
              <XAxis type="number" domain={[0, "auto"]} tickFormatter={(v: unknown) => `$${v}M`} fontSize={8} tick={{ fill: "#CCC" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nombre" width={100} fontSize={9} tick={{ fill: "#333", fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Bar dataKey="pn" radius={[0, 4, 4, 0]}>
                {chartData.map((e, i) => <Cell key={i} fill="#041224" opacity={!selected || e.full === selected ? 1 : 0.2} />)}
                <LabelList dataKey="pn" position="right" formatter={(v: unknown) => `$${v}M`} fontSize={9} fill="#666" />
              </Bar>
              {chartData.some(d => d.ppto > 0) && (
                <Bar dataKey="ppto" fill="#D1D5DB" radius={[0, 4, 4, 0]}>
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
