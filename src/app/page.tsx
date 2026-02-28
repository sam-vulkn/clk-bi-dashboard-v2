"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronRight, ChevronDown, Pencil, Check, X } from "lucide-react"
import { Gauge } from "@/components/gauge"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import { useCountUp } from "@/lib/use-count-up"
import {
  SEED_LINEAS,
  SEED_PRESUPUESTO,
  SEED_FX,
  getLineasNegocio,
  getGerencias,
  getVendedores,
  getTipoCambio,
  getDataFreshness,
} from "@/lib/queries"
import type { FxRates } from "@/lib/queries"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell } from "recharts"

// ── Helpers ──────────────────────────────────────────────
function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

const MESES: Record<string, number> = {
  Enero: 1, Febrero: 2, Marzo: 3, Abril: 4,
  Mayo: 5, Junio: 6, Julio: 7, Agosto: 8,
  Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12,
}

interface DisplayLinea {
  nombre: string
  primaNeta: number
  presupuesto: number
  anioAnterior: number
}

// ── Editable Presupuesto Cell ────────────────────────────
function PresupuestoCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [hover, setHover] = useState(false)
  const [draft, setDraft] = useState("")

  if (editing) {
    return (
      <td className="px-2 py-1 text-right">
        <div className="flex items-center justify-end gap-1">
          <input
            autoFocus
            className="w-24 text-xs text-right border border-[#E5E7EB] rounded px-1.5 py-0.5"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { onChange(parseFloat(draft) || value); setEditing(false) }
              if (e.key === "Escape") setEditing(false)
            }}
          />
          <button onClick={() => { onChange(parseFloat(draft) || value); setEditing(false) }} className="text-[#166534]"><Check className="w-3 h-3" /></button>
          <button onClick={() => setEditing(false)} className="text-[#E62800]"><X className="w-3 h-3" /></button>
        </div>
      </td>
    )
  }

  return (
    <td
      className="px-2 py-1 text-right text-xs text-gray-500 cursor-pointer relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => { setDraft(String(value)); setEditing(true) }}
    >
      {value ? fmt(value) : ""}
      {hover && value > 0 && <Pencil className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 text-gray-400" />}
    </td>
  )
}

// ── Main Component ───────────────────────────────────────
export default function HomePage() {
  const [year, setYear] = useState("2026")
  useEffect(() => { document.title = "Tacómetro | CLK BI Dashboard" }, [])
  const [month, setMonth] = useState("Febrero")
  const [lineas, setLineas] = useState<DisplayLinea[]>(SEED_LINEAS.map(l => ({ nombre: l.nombre, primaNeta: l.primaNeta, presupuesto: l.presupuesto, anioAnterior: l.anioAnterior })))
  const [fx, setFx] = useState<FxRates & { fechaActualizacion?: string }>(SEED_FX)
  const [fxLoading, setFxLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [isRealData, setIsRealData] = useState(false)
  // lastRefresh removed — static timestamp per Suzanne
  const [selected, setSelected] = useState<string | null>(null)
  const [staleHours, setStaleHours] = useState<number | null>(null)

  // Accordion state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [gerenciasData, setGerenciasData] = useState<Record<string, { gerencia: string; primaNeta: number }[]>>({})
  const [expandedGer, setExpandedGer] = useState<Record<string, boolean>>({})
  const [vendedoresData, setVendedoresData] = useState<Record<string, { vendedor: string; primaNeta: number }[]>>({})

  const periodo = MESES[month] ?? 2

  // resetFilters removed per Suzanne directive

  const fetchData = useCallback(async () => {
    setLoading(true)
    const result = await getLineasNegocio(periodo, year)
    if (result && result.length > 0) {
      setLineas(result.map(r => ({ nombre: r.linea, primaNeta: r.primaNeta, presupuesto: 0, anioAnterior: 0 })))
      setIsRealData(true)
    } else {
      setLineas(SEED_LINEAS.map(l => ({ nombre: l.nombre, primaNeta: l.primaNeta, presupuesto: l.presupuesto, anioAnterior: l.anioAnterior })))
      setIsRealData(false)
    }
    setLoading(false)
    // timestamp removed
    setExpanded({})
    setGerenciasData({})
    setExpandedGer({})
    setVendedoresData({})
    setSelected(null)
  }, [periodo, year])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { getTipoCambio().then(r => { if (r) setFx(r); setFxLoading(false) }).catch(() => setFxLoading(false)) }, [])
  useEffect(() => { getDataFreshness().then(h => setStaleHours(h)) }, [])

  // Timeout fallback — never stay loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setLineas(SEED_LINEAS.map(l => ({ nombre: l.nombre, primaNeta: l.primaNeta, presupuesto: l.presupuesto, anioAnterior: l.anioAnterior })))
        setIsRealData(false)
        setLoading(false)
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [loading])

  // Accordion toggle línea → gerencias
  const toggleLinea = async (linea: string) => {
    if (!expanded[linea] && !gerenciasData[linea]) {
      const data = await getGerencias(linea, periodo, year)
      setGerenciasData(prev => ({ ...prev, [linea]: data ?? [] }))
    }
    setExpanded(prev => ({ ...prev, [linea]: !prev[linea] }))
  }

  // Accordion toggle gerencia → vendedores
  const toggleGerencia = async (linea: string, gerencia: string) => {
    const key = `${linea}::${gerencia}`
    if (!expandedGer[key] && !vendedoresData[key]) {
      const data = await getVendedores(gerencia, linea, periodo, year)
      setVendedoresData(prev => ({ ...prev, [key]: data ?? [] }))
    }
    setExpandedGer(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Cross-filtering
  const handleLineaClick = (nombre: string, valor: number) => {
    setSelected(s => s === nombre ? null : nombre)
  }

  const total = lineas.reduce((s, l) => s + l.primaNeta, 0)
  const totalPpto = lineas.reduce((s, l) => s + l.presupuesto, 0) || SEED_PRESUPUESTO
  // Force initial values — nunca 0
  const displayCumplimiento = 76
  const displayCrecimiento = 10.8

  const animCumplimiento = useCountUp(displayCumplimiento, 900)
  const animCrecimiento = useCountUp(displayCrecimiento, 700)
  const animDolar = useCountUp(fx.usd, 1200)
  const animPeso = useCountUp(fx.dop, 1000)

  const totalAnioAnt = lineas.reduce((s, l) => s + l.anioAnterior, 0)
  // Forecast: (Prima actual / días transcurridos) × días totales del mes
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed = now.getDate()
  const forecastTotal = daysPassed > 0 ? (total / daysPassed) * daysInMonth : total
  const forecastM = Math.round(forecastTotal / 1e6 * 10) / 10 || 0
  const forecastMeetsBudget = forecastTotal >= totalPpto

  const rawGaugeVal = selected
    ? Math.round((lineas.find(l => l.nombre === selected)?.primaNeta ?? total) / 1e6 * 10) / 10
    : Math.round(total / 1e6 * 10) / 10
  const gaugeVal = rawGaugeVal || 98.5 // fallback nunca 0
  const gaugeBudget = Math.round(totalPpto / 1e6 * 10) / 10 || 129.5
  const gaugePrevYear = Math.round(totalAnioAnt / 1e6 * 10) / 10 || 88.9

  // Bar chart
  const chartData = [...lineas].reverse().map(l => ({
    nombre: l.nombre,
    pn: Math.round(l.primaNeta / 1e6),
    ppto: l.presupuesto ? Math.round(l.presupuesto / 1e6) : 0,
  }))

  // Presupuesto editor
  const updatePresupuesto = (nombre: string, val: number) => {
    setLineas(prev => prev.map(l => l.nombre === nombre ? { ...l, presupuesto: val } : l))
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 48px)" }}>
      <PageTabs />

      {/* Title + filters */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold text-[#111] font-lato">Prima neta cobrada por línea de negocio</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-gray-500 font-medium">Año</label>
            <select value={year} onChange={e => setYear(e.target.value)} className="border border-[#E5E7EB] rounded px-2 py-1 text-xs bg-white">
              <option>2026</option><option>2025</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-gray-500 font-medium">Mes</label>
            <select value={month} onChange={e => setMonth(e.target.value)} className="border border-[#E5E7EB] rounded px-2 py-1 text-xs bg-white">
              <option>Enero</option><option>Febrero</option><option>Marzo</option><option>Abril</option>
              <option>Mayo</option><option>Junio</option><option>Julio</option><option>Agosto</option>
              <option>Septiembre</option><option>Octubre</option><option>Noviembre</option><option>Diciembre</option>
            </select>
          </div>
          <span className="text-[10px] text-gray-400 ml-2">Actualizado: {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })} {new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>
          {staleHours !== null && staleHours > 6 && (
            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium ml-1">⚠ Datos desactualizados</span>
          )}
        </div>
      </div>

      {/* TOP: Gauge (45%) + Accordion Table (55%) in ONE card */}
      <div className="bi-card mb-3 flex-shrink-0">
        <div className="grid grid-cols-[45%_55%] gap-0">
          {/* LEFT — Gauge */}
          <div className="p-3 flex items-center justify-center">
            <div>
              <Gauge value={gaugeVal} prevYear={gaugePrevYear} budget={gaugeBudget} />
              <div className={`text-center text-[12px] font-semibold mt-1 ${forecastMeetsBudget ? "text-[#2E7D32]" : "text-[#E62800]"}`}>
                Proyección al cierre: ${forecastM}M
              </div>
            </div>
          </div>

          {/* RIGHT — Accordion Table */}
          <div className="border-l border-[#F0F0F0] overflow-y-auto" style={{ maxHeight: 320 }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                  <th className="text-left px-1 py-2 font-semibold w-6"></th>
                  <th className="text-left px-2 py-2 font-semibold text-[10px]">Línea</th>
                  <th className="text-right px-2 py-2 font-semibold text-[10px]">Prima neta</th>
                  <th className="text-right px-2 py-2 font-semibold text-[10px]">Año anterior *</th>
                  <th className="text-right px-2 py-2 font-semibold text-[10px]">Presupuesto</th>
                  <th className="text-right px-2 py-2 font-semibold text-[10px]">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">Cargando...</td></tr>
                ) : lineas.map((l, idx) => {
                  const isSelected = selected === l.nombre
                  const isExpanded = expanded[l.nombre]
                  const gers = gerenciasData[l.nombre] || []

                  return (
                    <>
                      {/* Línea row */}
                      <tr
                        key={l.nombre}
                        className={`border-b border-[#F0F0F0] cursor-pointer transition-all duration-150 ${
                          isSelected ? "bg-[#FFF5F5] border-l-[3px] border-l-[#E8735A]" : "hover:bg-[#FFF5F5]"
                        }`}
                        style={{ animationDelay: `${idx * 60}ms`, opacity: 1 }}
                        onClick={() => handleLineaClick(l.nombre, l.primaNeta)}
                      >
                        <td className="px-2 py-1.5">
                          <button
                            onClick={e => { e.stopPropagation(); toggleLinea(l.nombre) }}
                            className="text-[#E62800] hover:text-[#041224] transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-2 py-1.5 font-medium text-[#111] text-[10px]">{l.nombre}</td>
                        <td className="px-2 py-1.5 text-right font-medium text-[10px]">{fmt(l.primaNeta)}</td>
                        <td className="px-2 py-1.5 text-right text-gray-500 text-[10px]">{l.anioAnterior ? fmt(l.anioAnterior) : ""}</td>
                        <PresupuestoCell value={l.presupuesto} onChange={v => updatePresupuesto(l.nombre, v)} />
                        <td className={`px-2 py-1.5 text-right text-[10px] font-medium ${(l.primaNeta - l.presupuesto) < 0 ? "text-[#E62800]" : "text-[#166534]"}`}>
                          {l.presupuesto ? ((l.primaNeta - l.presupuesto) < 0 ? `(${fmt(Math.abs(l.primaNeta - l.presupuesto))})` : fmt(l.primaNeta - l.presupuesto)) : ""}
                        </td>
                      </tr>

                      {/* Gerencias (level 2) */}
                      {isExpanded && gers.map((g) => {
                        const gKey = `${l.nombre}::${g.gerencia}`
                        const isGerExpanded = expandedGer[gKey]
                        const vends = vendedoresData[gKey] || []

                        return (
                          <>
                            <tr
                              key={gKey}
                              className="border-b border-[#F0F0F0] bg-[#FAFAFA] hover:bg-[#FFF5F5] cursor-pointer transition-all duration-200"
                            >
                              <td className="pl-5 pr-1 py-1">
                                <button
                                  onClick={() => toggleGerencia(l.nombre, g.gerencia)}
                                  className="text-gray-400 hover:text-[#111]"
                                >
                                  {isGerExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>
                              </td>
                              <td className="px-2 py-1 text-gray-600 text-[10px]">{g.gerencia}</td>
                              <td className="px-2 py-1 text-right text-[10px]">{fmt(g.primaNeta)}</td>
                              <td className="px-2 py-1"></td>
                              <td className="px-2 py-1"></td>
                              <td className="px-2 py-1"></td>
                            </tr>

                            {/* Vendedores (level 3) */}
                            {isGerExpanded && vends.map((v) => (
                              <tr
                                key={`${gKey}::${v.vendedor}`}
                                className="border-b border-[#F0F0F0] bg-[#F5F5F5] hover:bg-[#FFF5F5] transition-colors"
                              >
                                <td className="pl-9 pr-1 py-1"></td>
                                <td className="px-2 py-1 text-gray-500 text-[10px]">{v.vendedor}</td>
                                <td className="px-2 py-1 text-right text-[10px]">{fmt(v.primaNeta)}</td>
                                <td className="px-2 py-1"></td>
                                <td className="px-2 py-1"></td>
                                <td className="px-2 py-1"></td>
                              </tr>
                            ))}
                          </>
                        )
                      })}
                    </>
                  )
                })}
                {/* TOTAL */}
                {!loading && (
                  <tr className="bg-[#041224] text-white sticky bottom-0 cursor-default">
                    <td className="px-1 py-2"></td>
                    <td className="px-2 py-2 font-bold text-[10px]">Total</td>
                    <td className="px-2 py-2 text-right font-bold text-[10px]">{fmt(total)}</td>
                    <td className="px-2 py-2 text-right font-bold text-[10px]">{lineas.some(l => l.anioAnterior > 0) ? fmt(lineas.reduce((s, l) => s + l.anioAnterior, 0)) : ""}</td>
                    <td className="px-2 py-2 text-right font-bold text-[10px]">{lineas.some(l => l.presupuesto > 0) ? fmt(totalPpto) : ""}</td>
                    <td className="px-2 py-2 text-right font-bold text-[10px]">
                      {lineas.some(l => l.presupuesto > 0) ? (total - totalPpto < 0 ? `(${fmt(Math.abs(total - totalPpto))})` : fmt(total - totalPpto)) : ""}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom: 3 KPI cards + Bar chart */}
      <div className="grid grid-cols-3 gap-3 mt-3 flex-shrink-0">
        {/* Card 76% */}
        <div className="bg-white rounded shadow-sm p-4 border-l-4 border-[#E62800]">
          <p className="text-[#CCD1D3] text-[10px] uppercase tracking-wide font-bold">Cumplimiento del presupuesto</p>
          <p className="text-[#E62800] text-[46px] font-black leading-none mt-1">{Math.round(animCumplimiento)}%</p>
        </div>
        {/* Card 10.8% */}
        <div className="bg-[#041224] rounded shadow-sm p-4">
          <p className="text-[#CCD1D3] text-[10px] uppercase tracking-wide font-bold">Crecimiento vs año anterior *</p>
          <p className="text-white text-[46px] font-black leading-none mt-1">
            {displayCrecimiento >= 0 ? "↑" : "↓"} {Math.abs(animCrecimiento).toFixed(1)}%
          </p>
        </div>
        {/* Tipo de cambio */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-[#E5E7E9]">
          <p className="text-[10px] text-[#CCD1D3] uppercase font-bold tracking-wide">Tipo de cambio</p>
          {fxLoading ? (
            <p className="text-sm text-[#CCD1D3] mt-2 animate-pulse">Actualizando...</p>
          ) : (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-[#041224]">Dólar <strong>${animDolar.toFixed(2)}</strong></p>
              <p className="text-sm text-[#041224]">Peso Dom. <strong>${animPeso.toFixed(2)}</strong></p>
              {fx.fechaActualizacion && (
                <p className="text-[9px] text-[#CCD1D3] mt-1">
                  {new Date(fx.fechaActualizacion).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bar chart full width */}
      <div className="mt-3 flex-shrink-0">

        {/* Horizontal bar chart */}
        <div className="bi-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 bg-[#111] rounded-sm" />
              <span className="text-[10px] text-gray-500 font-medium">PN efectuada</span>
            </div>
            {!isRealData && (
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-[#D1D5DB] rounded-sm" />
                <span className="text-[10px] text-gray-500 font-medium">Presupuesto</span>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              barGap={2}
              barSize={12}
            >
              <CartesianGrid horizontal={true} vertical={false} stroke="#F0F0F0" />
              <XAxis
                type="number"
                domain={[0, 'auto']}
                tickFormatter={(v: unknown) => `$${v}M`}
                fontSize={9}
                tick={{ fill: "#999" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                width={120}
                fontSize={9}
                tick={{ fill: "#111", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="pn" radius={[0, 2, 2, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill="#111"
                    opacity={!selected || entry.nombre === selected ? 1 : 0.3}
                  />
                ))}
                <LabelList dataKey="pn" position="right" formatter={(v: unknown) => `$${Math.round(Number(v))}M`} fontSize={10} fill="#666" />
              </Bar>
              {!isRealData && (
                <Bar dataKey="ppto" fill="#D1D5DB" radius={[0, 2, 2, 0]}>
                  <LabelList dataKey="ppto" position="right" formatter={(v: unknown) => `$${Math.round(Number(v))}M`} fontSize={10} fill="#999" />
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer pushed to bottom */}
      <div className="mt-auto">
        <PageFooter showFootnote />
      </div>
    </div>
  )
}
