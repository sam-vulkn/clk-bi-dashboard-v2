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
    const r = await getLineasNegocio(periodo, year)
    if (r && r.length > 0) setLineas(r.map(x => ({ nombre: x.linea, primaNeta: x.primaNeta, presupuesto: 0, anioAnterior: 0 })))
    else setLineas(SEED_LINEAS.map(l => ({ nombre: l.nombre, primaNeta: l.primaNeta, presupuesto: l.presupuesto, anioAnterior: l.anioAnterior })))
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
  const cumpl = hasPpto ? Math.round((total / totalPpto) * 100) : 76
  const crec = hasAA ? Math.round(((total - totalAA) / totalAA) * 1000) / 10 : 10.8
  const now = new Date()
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dp = now.getDate()
  const forecast = dp > 0 ? (total / dp) * dim : total
  const gV = (selected ? (lineas.find(l => l.nombre === selected)?.primaNeta ?? total) : total) / 1e6 || 98.5
  const gB = totalPpto / 1e6 || 129.5
  const gP = totalAA / 1e6 || 88.9

  const chartData = [...lineas].reverse().map(l => ({
    nombre: l.nombre.length > 16 ? l.nombre.substring(0, 14) + "…" : l.nombre,
    full: l.nombre, pn: +(l.primaNeta / 1e6).toFixed(1), ppto: l.presupuesto ? +(l.presupuesto / 1e6).toFixed(1) : 0,
  }))

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] overflow-hidden">
      <PageTabs />

      {/* Header */}
      <div className="flex items-center justify-between mb-1 flex-shrink-0">
        <h1 className="text-[13px] font-bold text-[#041224]">Prima neta cobrada por línea de negocio</h1>
        <div className="flex items-center gap-1.5 text-[10px]">
          <select value={year} onChange={e => setYear(e.target.value)} className="border border-[#E5E7EB] rounded px-1 py-0.5 bg-white text-[10px]"><option>2026</option><option>2025</option></select>
          <select value={month} onChange={e => setMonth(e.target.value)} className="border border-[#E5E7EB] rounded px-1 py-0.5 bg-white text-[10px]">{Object.keys(MESES).map(m => <option key={m}>{m}</option>)}</select>
          <span className="text-[9px] text-[#CCC]">Datos al: {lastDataDate ?? new Date().toLocaleDateString("es-MX")}</span>
          {staleHours !== null && staleHours > 6 && <span className="text-[8px] bg-orange-100 text-orange-700 px-1 rounded-full">⚠</span>}
        </div>
      </div>

      {/* ═══ ROW 1: Gauge 38% + Table 62% ═══ */}
      <div className="flex gap-2 flex-shrink-0" style={{ height: "38%" }}>
        {/* Gauge */}
        <div className="bg-white rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E8E8E8] flex items-center justify-center overflow-hidden" style={{ width: "38%" }}>
          <Gauge value={Math.round(gV * 10) / 10} prevYear={Math.round(gP * 10) / 10} budget={Math.round(gB * 10) / 10} />
        </div>

        {/* Table — BIGGER */}
        <div className="flex-1 bg-white rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E8E8E8] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                  <th className="w-6 px-1 py-2"></th>
                  <th className="text-left px-2 py-2 font-semibold">Línea</th>
                  <th className="text-right px-2 py-2 font-semibold">Prima neta</th>
                  <th className="text-right px-2 py-2 font-semibold">Año anterior *</th>
                  <th className="text-right px-2 py-2 font-semibold">Presupuesto</th>
                  <th className="text-right px-2 py-2 font-semibold">Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-[#CCC]">Cargando...</td></tr>
                ) : lineas.map((l, idx) => {
                  const isExp = expanded[l.nombre]; const gers = gerData[l.nombre] || []
                  return (
                    <React.Fragment key={l.nombre}>
                      <tr className={`border-b border-[#F0F0F0] cursor-pointer transition-colors hover:bg-[#FFF5F5] ${selected === l.nombre ? "bg-[#FFF5F5]" : idx % 2 ? "bg-[#FAFAFA]" : ""}`}
                        onClick={() => setSelected(s => s === l.nombre ? null : l.nombre)}>
                        <td className="px-1 py-1.5">
                          <button onClick={e => { e.stopPropagation(); toggleLinea(l.nombre) }} className="text-[#E62800] hover:scale-125 transition-transform">
                            {isExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-2 py-1.5 font-semibold text-[#111]">{l.nombre}</td>
                        <td className="px-2 py-1.5 text-right font-semibold">{fmt(l.primaNeta)}</td>
                        <td className="px-2 py-1.5 text-right text-[#888]">{l.anioAnterior ? fmt(l.anioAnterior) : "—"}</td>
                        <td className="px-2 py-1.5 text-right text-[#888]">{l.presupuesto ? fmt(l.presupuesto) : "—"}</td>
                        <td className="px-2 py-1.5 text-right text-[#CCC]">—</td>
                      </tr>
                      {isExp && gers.map(g => {
                        const gk = `${l.nombre}::${g.gerencia}`
                        return (
                          <React.Fragment key={gk}>
                            <tr className="border-b border-[#F0F0F0] bg-[#F8F8F8] hover:bg-[#FFF5F5] cursor-pointer" onClick={() => toggleGer(l.nombre, g.gerencia)}>
                              <td className="pl-4 py-1">{expGer[gk] ? <ChevronDown className="w-3 h-3 text-[#AAA]" /> : <ChevronRight className="w-3 h-3 text-[#AAA]" />}</td>
                              <td className="px-2 py-1 text-[#555]">{g.gerencia}</td>
                              <td className="px-2 py-1 text-right">{fmt(g.primaNeta)}</td>
                              <td colSpan={3}></td>
                            </tr>
                            {expGer[gk] && (vendData[gk] || []).map(v => (
                              <tr key={v.vendedor} className="border-b border-[#F0F0F0] bg-[#F3F3F3] hover:bg-[#FFF5F5]">
                                <td className="pl-7 py-0.5"></td>
                                <td className="px-2 py-0.5 text-[#888] text-[10px]">{v.vendedor}</td>
                                <td className="px-2 py-0.5 text-right text-[10px]">{fmt(v.primaNeta)}</td>
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
                    <td className="py-2"></td>
                    <td className="px-2 py-2 font-bold">Total</td>
                    <td className="px-2 py-2 text-right font-bold">{fmt(total)}</td>
                    <td className="px-2 py-2 text-right font-bold">{hasAA ? fmt(totalAA) : ""}</td>
                    <td className="px-2 py-2 text-right font-bold">{hasPpto ? fmt(totalPpto) : ""}</td>
                    <td className="px-2 py-2"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ ROW 2: KPI cards ═══ */}
      <div className="grid grid-cols-4 gap-1.5 my-1.5 flex-shrink-0">
        {/* Cumplimiento — donut ring inspired by Power BI */}
        <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#E8E8E8] p-2.5 flex items-center gap-3">
          <svg viewBox="0 0 60 60" className="w-14 h-14 flex-shrink-0">
            <circle cx="30" cy="30" r="24" fill="none" stroke="#F0F0F0" strokeWidth="6" />
            <circle cx="30" cy="30" r="24" fill="none"
              stroke={cumpl >= 90 ? "#16A34A" : cumpl >= 70 ? "#EAB308" : "#DC2626"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${(cumpl / 100) * 150.8} 150.8`}
              transform="rotate(-90 30 30)" />
            <text x="30" y="32" fontSize="14" fill="#041224" textAnchor="middle" fontWeight="900" fontFamily="Lato">{cumpl}%</text>
          </svg>
          <div>
            <div className="text-[10px] font-bold text-[#041224] leading-tight">Cumplimiento</div>
            <div className="text-[8px] text-[#999]">del presupuesto</div>
            <div className={`text-[9px] font-bold mt-0.5 ${cumpl >= 90 ? "text-[#16A34A]" : cumpl >= 70 ? "text-[#CA8A04]" : "text-[#DC2626]"}`}>
              {cumpl >= 90 ? "En meta ✓" : cumpl >= 70 ? "Cerca de meta" : "Por debajo"}
            </div>
          </div>
        </div>

        {/* Crecimiento */}
        <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#E8E8E8] p-2.5 flex items-center gap-3">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${crec >= 0 ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]"}`}>
            <span className={`text-2xl font-black ${crec >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{crec >= 0 ? "↑" : "↓"}</span>
          </div>
          <div>
            <div className={`text-xl font-black leading-none ${crec >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{crec >= 0 ? "+" : ""}{crec}%</div>
            <div className="text-[9px] text-[#888] font-medium">vs Año Anterior</div>
          </div>
        </div>

        {/* Tipo de cambio — elegant */}
        <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#E8E8E8] p-2.5">
          <div className="text-[8px] text-[#BBB] uppercase font-bold tracking-wider mb-1.5">Tipo de Cambio</div>
          {fxLoading ? <div className="text-[10px] text-[#CCC] animate-pulse">Actualizando…</div> : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-[#041224] text-white text-[7px] font-bold flex items-center justify-center">US</span>
                  <span className="text-[10px] text-[#666]">Dólar</span>
                </div>
                <span className="text-base font-black text-[#041224]">${fx.usd.toFixed(2)}</span>
              </div>
              <div className="h-px bg-[#F0F0F0]" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-[#E62800] text-white text-[7px] font-bold flex items-center justify-center">RD</span>
                  <span className="text-[10px] text-[#666]">Peso Dom.</span>
                </div>
                <span className="text-base font-black text-[#041224]">${fx.dop.toFixed(2)}</span>
              </div>
            </div>
          )}
          {fx.fechaActualizacion && <div className="text-[7px] text-[#CCC] mt-1.5 text-right">{new Date(fx.fechaActualizacion).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>}
        </div>

        {/* Proyección */}
        <div className={`rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] border p-2.5 flex flex-col justify-center ${forecast >= totalPpto ? "bg-[#F0FDF4] border-[#16A34A]/30" : "bg-[#FEF2F2] border-[#DC2626]/30"}`}>
          <div className="text-[8px] text-[#999] uppercase font-bold tracking-wider">Proyección al cierre</div>
          <div className={`text-3xl font-black leading-none mt-1 ${forecast >= totalPpto ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
            ${(forecast / 1e6).toFixed(1)}M
          </div>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex-1 h-1 bg-[#E5E7E9] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${forecast >= totalPpto ? "bg-[#16A34A]" : "bg-[#DC2626]"}`} style={{ width: `${Math.min(100, (dp / dim) * 100)}%` }} />
            </div>
            <span className="text-[8px] text-[#999]">{dp}/{dim} días</span>
          </div>
        </div>
      </div>

      {/* ═══ ROW 3: Bar chart — fills rest ═══ */}
      <div className="bg-white rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E8E8E8] px-3 py-2 flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 mb-1 flex-shrink-0">
          <span className="text-[10px] font-bold text-[#041224]">Prima neta por línea</span>
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-2.5 h-2.5 bg-[#041224] rounded-sm" /><span className="text-[9px] text-[#888]">Prima cobrada</span>
          </div>
          {chartData.some(d => d.ppto > 0) && <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-[#D1D5DB] rounded-sm" /><span className="text-[9px] text-[#888]">Presupuesto</span></div>}
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 50, left: 0, bottom: 0 }} barGap={2} barSize={16}>
              <CartesianGrid horizontal vertical={false} stroke="#F5F5F5" />
              <XAxis type="number" domain={[0, "auto"]} tickFormatter={(v: unknown) => `$${v}M`} fontSize={9} tick={{ fill: "#CCC" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nombre" width={110} fontSize={10} tick={{ fill: "#333", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Bar dataKey="pn" radius={[0, 4, 4, 0]}>
                {chartData.map((e, i) => <Cell key={i} fill="#041224" opacity={!selected || e.full === selected ? 1 : 0.15} />)}
                <LabelList dataKey="pn" position="right" formatter={(v: unknown) => `$${v}M`} fontSize={10} fill="#555" fontWeight={600} />
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
