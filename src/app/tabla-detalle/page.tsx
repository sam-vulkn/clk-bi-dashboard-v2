"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, Search, RefreshCw, Eraser, SlidersHorizontal, Maximize2, Pencil } from "lucide-react"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import { getLineasNegocio, getGerencias, getVendedores } from "@/lib/queries"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

const MESES: Record<string, number> = {
  Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
  Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12,
}

// Seed with all 9 columns — pre-computed from Power BI reference
interface LineaFull {
  linea: string; primaNeta: number; presupuesto: number; diferencia: number; pctDifPpto: number; pnAnioAnt: number; difYoY: number; pctDifYoY: number; pendiente: number
}
const SEED: LineaFull[] = [
  { linea: "Click Franquicias", primaNeta: 52577939, presupuesto: 68989976, diferencia: -16412037, pctDifPpto: -23.8, pnAnioAnt: 45038829, difYoY: 7539110, pctDifYoY: 16.74, pendiente: 37639869 },
  { linea: "Click Promotoras", primaNeta: 20017383, presupuesto: 25534211, diferencia: -5516828, pctDifPpto: -21.6, pnAnioAnt: 19422359, difYoY: 595024, pctDifYoY: 3.06, pendiente: 21892390 },
  { linea: "Corporate", primaNeta: 12708705, presupuesto: 16242717, diferencia: -3534012, pctDifPpto: -21.8, pnAnioAnt: 13539625, difYoY: -830920, pctDifYoY: -6.14, pendiente: 8763272 },
  { linea: "Cartera Tradicional", primaNeta: 10632028, presupuesto: 12322087, diferencia: -1690059, pctDifPpto: -13.7, pnAnioAnt: 10057425, difYoY: 574603, pctDifYoY: 5.71, pendiente: 7416036 },
  { linea: "Call Center", primaNeta: 2602364, presupuesto: 6398081, diferencia: -3795717, pctDifPpto: -59.3, pnAnioAnt: 853685, difYoY: 1748679, pctDifYoY: 204.84, pendiente: 12236199 },
]

type DrillLevel = "linea" | "gerencia" | "vendedor"

export default function TablaDetallePage() {
  const [year, setYear] = useState("2026")
  const [month, setMonth] = useState("Febrero")
  const [search, setSearch] = useState("")
  const [lineas, setLineas] = useState<LineaFull[]>(SEED)
  const [loading, setLoading] = useState(true)
  const [isReal, setIsReal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [drillLevel, setDrillLevel] = useState<DrillLevel>("linea")
  const [fetchKey, setFetchKey] = useState(0)

  useEffect(() => { document.title = "Tabla detalle | CLK BI Dashboard" }, [])

  // Accordion
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [gerenciasData, setGerenciasData] = useState<Record<string, { gerencia: string; primaNeta: number }[]>>({})
  const [expandedGer, setExpandedGer] = useState<Record<string, boolean>>({})
  const [vendedoresData, setVendedoresData] = useState<Record<string, { vendedor: string; primaNeta: number }[]>>({})

  const periodo = MESES[month] ?? 2

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setExpanded({}); setGerenciasData({}); setExpandedGer({}); setVendedoresData({})

    const load = async () => {
      try {
        const result = await getLineasNegocio(periodo, year)
        if (!cancelled) {
          if (result && result.length > 0) {
            setLineas(result.map(r => ({ linea: r.linea, primaNeta: r.primaNeta, presupuesto: 0, diferencia: 0, pctDifPpto: 0, pnAnioAnt: 0, difYoY: 0, pctDifYoY: 0, pendiente: 0 })))
            setIsReal(true)
          } else {
            setLineas(SEED)
            setIsReal(false)
          }
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setLineas(SEED)
          setIsReal(false)
          setLoading(false)
        }
      }
    }

    const killSwitch = setTimeout(() => {
      if (!cancelled) {
        cancelled = true
        setLineas(SEED)
        setIsReal(false)
        setLoading(false)
      }
    }, 1500)

    load()
    return () => { cancelled = true; clearTimeout(killSwitch) }
  }, [periodo, year, fetchKey])

  const toggleLinea = async (linea: string) => {
    if (!expanded[linea] && !gerenciasData[linea]) {
      const data = await getGerencias(linea, periodo, year)
      setGerenciasData(prev => ({ ...prev, [linea]: data ?? [] }))
    }
    setExpanded(prev => ({ ...prev, [linea]: !prev[linea] }))
  }

  const toggleGerencia = async (linea: string, gerencia: string) => {
    const key = `${linea}::${gerencia}`
    if (!expandedGer[key] && !vendedoresData[key]) {
      const data = await getVendedores(gerencia, linea, periodo, year)
      setVendedoresData(prev => ({ ...prev, [key]: data ?? [] }))
    }
    setExpandedGer(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const resetFilters = () => { setYear("2026"); setMonth("Febrero"); setSearch("") }

  const filtered = search ? lineas.filter(l => l.linea.toLowerCase().includes(search.toLowerCase())) : lineas
  const total = {
    primaNeta: filtered.reduce((s, l) => s + l.primaNeta, 0),
    presupuesto: filtered.reduce((s, l) => s + l.presupuesto, 0),
    pnAnioAnt: filtered.reduce((s, l) => s + l.pnAnioAnt, 0),
    pendiente: filtered.reduce((s, l) => s + l.pendiente, 0),
  }
  const totalDif = filtered.reduce((s, l) => s + l.diferencia, 0)
  const totalDifPct = total.presupuesto > 0 ? ((totalDif / total.presupuesto) * 100).toFixed(1) : ""
  const totalDifYoy = filtered.reduce((s, l) => s + l.difYoY, 0)
  const totalDifYoyPct = total.pnAnioAnt > 0 ? ((totalDifYoy / total.pnAnioAnt) * 100).toFixed(2) : ""

  const drillButtons: { level: DrillLevel; label: string }[] = [
    { level: "linea", label: "Línea de negocio" },
    { level: "gerencia", label: "Gerencia" },
    { level: "vendedor", label: "Vendedor" },
  ]

  return (
    <div>
      <PageTabs />

      {/* Title + drill buttons */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold text-[#111] font-lato">Prima neta cobrada</h1>
        <div className="flex items-center gap-1.5">
          {drillButtons.map(b => (
            <button
              key={b.level}
              onClick={() => setDrillLevel(b.level)}
              className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
                drillLevel === b.level
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-[#FEE2E2] text-[#666]"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs">
          <label className="text-gray-500 font-medium">Año</label>
          <select value={year} onChange={e => setYear(e.target.value)} className="border border-[#E5E7EB] rounded px-2 py-1 text-xs bg-white">
            <option>2026</option><option>2025</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <label className="text-gray-500 font-medium">Mes</label>
          <select value={month} onChange={e => setMonth(e.target.value)} className="border border-[#E5E7EB] rounded px-2 py-1 text-xs bg-white">
            {Object.keys(MESES).map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-7 pr-3 py-1 border border-[#E5E7EB] rounded text-xs w-44 bg-white" />
        </div>
        <button onClick={() => { setShowToast(true); setTimeout(() => setShowToast(false), 2000) }} className="text-gray-400 hover:text-[#111]" title="Editar"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setFetchKey(k => k + 1)} className="text-gray-400 hover:text-[#111]" title="Refrescar"><RefreshCw className="w-4 h-4" /></button>
        <button onClick={resetFilters} className="text-gray-400 hover:text-[#111]" title="Limpiar"><Eraser className="w-4 h-4" /></button>
        <button className="text-gray-400 hover:text-[#111]" title="Columnas"><SlidersHorizontal className="w-4 h-4" /></button>
        <button onClick={() => document.documentElement.requestFullscreen?.()} className="text-gray-400 hover:text-[#111]" title="Pantalla completa"><Maximize2 className="w-4 h-4" /></button>
      </div>

      {showToast && <div className="fixed top-4 right-4 bg-[#111] text-white px-4 py-2 rounded shadow-lg text-xs z-50 animate-pulse">Modo edición</div>}

      {/* Table — all 9 columns */}
      <div className="bi-card overflow-hidden overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-[#2D2D2D] text-white border-b-2 border-b-[#C00000]">
              <th className="w-6 px-1 py-2"></th>
              <th className="text-left px-2 py-2 font-semibold">Línea de negocio</th>
              <th className="text-right px-2 py-2 font-semibold">Prima neta</th>
              <th className="text-right px-2 py-2 font-semibold">Presupuesto</th>
              <th className="text-right px-2 py-2 font-semibold">Diferencia</th>
              <th className="text-right px-2 py-2 font-semibold">% Dif ppto</th>
              <th className="text-right px-2 py-2 font-semibold">PN año anterior *</th>
              <th className="text-right px-2 py-2 font-semibold">Dif PN año ant</th>
              <th className="text-right px-2 py-2 font-semibold">% Dif PN AA</th>
              <th className="text-right px-2 py-2 font-semibold">Pendiente</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : filtered.map((l, idx) => {
              const isExp = expanded[l.linea]
              const gers = gerenciasData[l.linea] || []
              const dif = l.diferencia
              const difPct = l.pctDifPpto
              const difYoy = l.difYoY
              const difYoyPct = l.pctDifYoY
              const isCritical = l.presupuesto > 0 && l.pctDifPpto < -15

              return (
                <>
                  <tr
                    key={l.linea}
                    className={`border-b border-[#F0F0F0] cursor-pointer hover:bg-[#FFF5F5] transition-colors ${
                      isExp ? "border-l-[3px] border-l-[#E8735A]" : ""
                    } ${isCritical ? "bg-[#FFF2F2]" : idx % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}
                    onClick={() => toggleLinea(l.linea)}
                  >
                    <td className="px-1 py-1.5 text-center">
                      {isExp ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 inline" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 inline" />}
                    </td>
                    <td className="px-2 py-1.5 font-medium text-[#111]">{l.linea}</td>
                    <td className="px-2 py-1.5 text-right font-medium">{fmt(l.primaNeta)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-500">{l.presupuesto ? fmt(l.presupuesto) : ""}</td>
                    <td className={`px-2 py-1.5 text-right font-medium ${dif < 0 ? "text-[#C00000]" : "text-[#375623]"}`}>
                      {l.presupuesto ? (dif < 0 ? `(${fmt(Math.abs(dif))})` : fmt(dif)) : ""}
                    </td>
                    <td className={`px-2 py-1.5 text-right ${dif < 0 ? "text-[#C00000]" : "text-[#375623]"}`}>
                      {difPct ? `${difPct > 0 ? "+" : ""}${difPct}%` : ""}
                    </td>
                    <td className="px-2 py-1.5 text-right text-gray-500">{l.pnAnioAnt ? fmt(l.pnAnioAnt) : ""}</td>
                    <td className={`px-2 py-1.5 text-right font-medium ${difYoy < 0 ? "text-[#C00000]" : "text-[#375623]"}`}>
                      {l.pnAnioAnt ? (difYoy < 0 ? `(${fmt(Math.abs(difYoy))})` : fmt(difYoy)) : ""}
                    </td>
                    <td className={`px-2 py-1.5 text-right ${difYoy < 0 ? "text-[#C00000]" : "text-[#375623]"}`}>
                      {difYoyPct ? `${difYoyPct > 0 ? "+" : ""}${difYoyPct}%` : ""}
                    </td>
                    <td className="px-2 py-1.5 text-right text-gray-500">{l.pendiente ? fmt(l.pendiente) : ""}</td>
                  </tr>

                  {/* Gerencias */}
                  {isExp && gers.map((g) => {
                    const gKey = `${l.linea}::${g.gerencia}`
                    const isGerExp = expandedGer[gKey]
                    const vends = vendedoresData[gKey] || []
                    return (
                      <>
                        <tr key={gKey} className="border-b border-[#F0F0F0] bg-[#FAFAFA] hover:bg-[#FFF5F5] cursor-pointer" onClick={() => toggleGerencia(l.linea, g.gerencia)}>
                          <td className="pl-5 pr-1 py-1 text-center">
                            {isGerExp ? <ChevronDown className="w-3 h-3 text-gray-500 inline" /> : <ChevronRight className="w-3 h-3 text-gray-400 inline" />}
                          </td>
                          <td className="px-2 py-1 text-gray-600 pl-5">{g.gerencia}</td>
                          <td className="px-2 py-1 text-right">{fmt(g.primaNeta)}</td>
                          <td colSpan={7}></td>
                        </tr>
                        {isGerExp && vends.map((v) => (
                          <tr key={`${gKey}::${v.vendedor}`} className="border-b border-[#F0F0F0] bg-[#F5F5F5] hover:bg-[#FFF5F5]">
                            <td className="pl-9 pr-1 py-1"></td>
                            <td className="px-2 py-1 text-gray-500 pl-9">{v.vendedor}</td>
                            <td className="px-2 py-1 text-right">{fmt(v.primaNeta)}</td>
                            <td colSpan={7}></td>
                          </tr>
                        ))}
                      </>
                    )
                  })}
                </>
              )
            })}

            {/* TOTAL — white text on black, negatives stay white */}
            {!loading && (
              <tr className="bg-black text-white border-t-2 border-t-black cursor-default">
                <td className="px-1 py-2"></td>
                <td className="px-2 py-2 font-bold">Total</td>
                <td className="px-2 py-2 text-right font-bold">{fmt(total.primaNeta)}</td>
                <td className="px-2 py-2 text-right font-bold">{total.presupuesto ? fmt(total.presupuesto) : ""}</td>
                <td className="px-2 py-2 text-right font-bold">{total.presupuesto ? (totalDif < 0 ? `(${fmt(Math.abs(totalDif))})` : fmt(totalDif)) : ""}</td>
                <td className="px-2 py-2 text-right font-bold">{totalDifPct ? `${totalDifPct}%` : ""}</td>
                <td className="px-2 py-2 text-right font-bold">{total.pnAnioAnt ? fmt(total.pnAnioAnt) : ""}</td>
                <td className="px-2 py-2 text-right font-bold">{total.pnAnioAnt ? (totalDifYoy < 0 ? `(${fmt(Math.abs(totalDifYoy))})` : fmt(totalDifYoy)) : ""}</td>
                <td className="px-2 py-2 text-right font-bold">{totalDifYoyPct ? `${totalDifYoyPct}%` : ""}</td>
                <td className="px-2 py-2 text-right font-bold">{total.pendiente ? fmt(total.pendiente) : ""}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PageFooter showFootnote />
    </div>
  )
}
