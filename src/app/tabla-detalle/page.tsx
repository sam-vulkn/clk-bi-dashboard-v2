"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, ChevronLeft, Search } from "lucide-react"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import { getLineasNegocio, getGerencias, getVendedores, getGrupos } from "@/lib/queries"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

const MESES: Record<string, number> = {
  Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
  Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12,
}

// Seed with all 9 columns
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

type DrillLevel = "linea" | "gerencia" | "vendedor" | "grupo"

interface Breadcrumb {
  linea?: string
  gerencia?: string
  vendedor?: string
}

export default function TablaDetallePage() {
  const [year, setYear] = useState("2026")
  const [month, setMonth] = useState("Febrero")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  // Drill state
  const [drillLevel, setDrillLevel] = useState<DrillLevel>("linea")
  const [breadcrumb, setBreadcrumb] = useState<Breadcrumb>({})

  // Data per level
  const [lineas, setLineas] = useState<LineaFull[]>(SEED)
  const [gerencias, setGerencias] = useState<{ gerencia: string; primaNeta: number }[]>([])
  const [vendedores, setVendedores] = useState<{ vendedor: string; primaNeta: number }[]>([])
  const [grupos, setGrupos] = useState<{ grupo: string; cliente: string; primaNeta: number }[]>([])

  useEffect(() => { document.title = "Tabla detalle | CLK BI Dashboard" }, [])

  const periodo = MESES[month] ?? 2

  // Load líneas on mount / filter change
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setDrillLevel("linea")
    setBreadcrumb({})

    const load = async () => {
      try {
        const result = await getLineasNegocio(periodo, year)
        if (!cancelled) {
          if (result && result.length > 0) {
            setLineas(result.map(r => ({ linea: r.linea, primaNeta: r.primaNeta, presupuesto: 0, diferencia: 0, pctDifPpto: 0, pnAnioAnt: 0, difYoY: 0, pctDifYoY: 0, pendiente: 0 })))
          } else {
            setLineas(SEED)
          }
          setLoading(false)
        }
      } catch {
        if (!cancelled) { setLineas(SEED); setLoading(false) }
      }
    }

    const killSwitch = setTimeout(() => {
      if (!cancelled) { cancelled = true; setLineas(SEED); setLoading(false) }
    }, 1500)

    load()
    return () => { cancelled = true; clearTimeout(killSwitch) }
  }, [periodo, year])

  // Drill into a línea → show gerencias
  const drillToGerencias = async (linea: string) => {
    setLoading(true)
    setBreadcrumb({ linea })
    const data = await getGerencias(linea, periodo, year)
    setGerencias(data ?? [])
    setDrillLevel("gerencia")
    setLoading(false)
  }

  // Drill into a gerencia → show vendedores
  const drillToVendedores = async (gerencia: string) => {
    setLoading(true)
    setBreadcrumb(prev => ({ ...prev, gerencia }))
    const data = await getVendedores(gerencia, breadcrumb.linea!, periodo, year)
    setVendedores(data ?? [])
    setDrillLevel("vendedor")
    setLoading(false)
  }

  // Drill into a vendedor → show grupos
  const drillToGrupos = async (vendedor: string) => {
    setLoading(true)
    setBreadcrumb(prev => ({ ...prev, vendedor }))
    const data = await getGrupos(vendedor, breadcrumb.gerencia!, breadcrumb.linea!, periodo, year)
    setGrupos(data ?? [])
    setDrillLevel("grupo")
    setLoading(false)
  }

  // Navigate back one level
  const goBack = () => {
    if (drillLevel === "grupo") {
      setBreadcrumb(prev => ({ linea: prev.linea, gerencia: prev.gerencia }))
      setDrillLevel("vendedor")
    } else if (drillLevel === "vendedor") {
      setBreadcrumb(prev => ({ linea: prev.linea }))
      setDrillLevel("gerencia")
    } else if (drillLevel === "gerencia") {
      setBreadcrumb({})
      setDrillLevel("linea")
    }
  }

  // Navigate to specific level via breadcrumb
  const goToLevel = (level: DrillLevel) => {
    if (level === "linea") {
      setBreadcrumb({})
      setDrillLevel("linea")
    } else if (level === "gerencia" && breadcrumb.linea) {
      setBreadcrumb({ linea: breadcrumb.linea })
      drillToGerencias(breadcrumb.linea)
    } else if (level === "vendedor" && breadcrumb.gerencia) {
      setBreadcrumb({ linea: breadcrumb.linea, gerencia: breadcrumb.gerencia })
      drillToVendedores(breadcrumb.gerencia)
    }
  }

  // Tab quick-access: jump to flat view at that level
  const jumpToTab = async (level: DrillLevel) => {
    if (level === "linea") {
      setBreadcrumb({})
      setDrillLevel("linea")
    } else if (level === "gerencia") {
      // Show all gerencias for selected línea, or first línea
      const linea = breadcrumb.linea || lineas[0]?.linea
      if (linea) await drillToGerencias(linea)
    } else if (level === "vendedor") {
      // Need a gerencia context — if we have one, use it
      if (breadcrumb.gerencia && breadcrumb.linea) {
        await drillToVendedores(breadcrumb.gerencia)
      } else if (breadcrumb.linea) {
        // First drill to gerencias, then user picks
        await drillToGerencias(breadcrumb.linea)
      }
    }
  }

  // Search filtering
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applySearch = <T,>(items: T[], key: string): T[] => {
    if (!search) return items
    return items.filter(item => String((item as any)[key]).toLowerCase().includes(search.toLowerCase()))
  }

  // Compute totals for línea level
  const filteredLineas = applySearch(lineas, "linea")
  const totalLineas = {
    primaNeta: filteredLineas.reduce((s, l) => s + l.primaNeta, 0),
    presupuesto: filteredLineas.reduce((s, l) => s + l.presupuesto, 0),
    pnAnioAnt: filteredLineas.reduce((s, l) => s + l.pnAnioAnt, 0),
    pendiente: filteredLineas.reduce((s, l) => s + l.pendiente, 0),
  }
  const totalDif = filteredLineas.reduce((s, l) => s + l.diferencia, 0)
  const totalDifPct = totalLineas.presupuesto > 0 ? ((totalDif / totalLineas.presupuesto) * 100).toFixed(1) : ""
  const totalDifYoy = filteredLineas.reduce((s, l) => s + l.difYoY, 0)
  const totalDifYoyPct = totalLineas.pnAnioAnt > 0 ? ((totalDifYoy / totalLineas.pnAnioAnt) * 100).toFixed(2) : ""

  const drillTabs: { level: DrillLevel; label: string }[] = [
    { level: "linea", label: "Línea de negocio" },
    { level: "gerencia", label: "Gerencia" },
    { level: "vendedor", label: "Vendedor" },
  ]

  // Column header label changes per level
  const firstColLabel = drillLevel === "linea" ? "Línea de negocio"
    : drillLevel === "gerencia" ? "Gerencia"
    : drillLevel === "vendedor" ? "Vendedor"
    : "Grupo / Cliente"

  return (
    <div>
      <PageTabs />

      {/* Title + drill tabs */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold text-[#111] font-lato">Prima neta cobrada</h1>
        <div className="flex items-center gap-1.5">
          {drillTabs.map(b => (
            <button
              key={b.level}
              onClick={() => jumpToTab(b.level)}
              className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
                drillLevel === b.level || (drillLevel === "grupo" && b.level === "vendedor")
                  ? "bg-[#041224] text-white"
                  : "bg-[#FDECEA] text-[#041224]"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Breadcrumb + Back */}
      {drillLevel !== "linea" && (
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-xs text-[#041224] hover:text-[#E62800] transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </button>
          <div className="flex items-center gap-1 text-xs text-[#888]">
            <button onClick={() => goToLevel("linea")} className="hover:text-[#041224] transition-colors underline">
              Líneas
            </button>
            {breadcrumb.linea && (
              <>
                <ChevronRight className="w-3 h-3" />
                <button
                  onClick={() => goToLevel("gerencia")}
                  className={`transition-colors ${drillLevel === "gerencia" ? "text-[#041224] font-semibold" : "hover:text-[#041224] underline"}`}
                >
                  {breadcrumb.linea}
                </button>
              </>
            )}
            {breadcrumb.gerencia && (
              <>
                <ChevronRight className="w-3 h-3" />
                <button
                  onClick={() => goToLevel("vendedor")}
                  className={`transition-colors ${drillLevel === "vendedor" ? "text-[#041224] font-semibold" : "hover:text-[#041224] underline"}`}
                >
                  {breadcrumb.gerencia}
                </button>
              </>
            )}
            {breadcrumb.vendedor && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#041224] font-semibold">{breadcrumb.vendedor}</span>
              </>
            )}
          </div>
        </div>
      )}

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
        <span className="text-xs text-[#CCD1D3]">Actualizado: {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
      </div>

      {/* Table */}
      <div className="bi-card overflow-hidden overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
              {drillLevel === "linea" && <th className="w-6 px-1 py-2"></th>}
              <th className="text-left px-2 py-2 font-semibold">{firstColLabel}</th>
              <th className="text-right px-2 py-2 font-semibold">Prima neta</th>
              {drillLevel === "linea" && (
                <>
                  <th className="text-right px-2 py-2 font-semibold">Presupuesto</th>
                  <th className="text-right px-2 py-2 font-semibold">Diferencia</th>
                  <th className="text-right px-2 py-2 font-semibold">% Dif ppto</th>
                  <th className="text-right px-2 py-2 font-semibold">PN año anterior *</th>
                  <th className="text-right px-2 py-2 font-semibold">Dif PN año ant</th>
                  <th className="text-right px-2 py-2 font-semibold">% Dif PN AA</th>
                  <th className="text-right px-2 py-2 font-semibold">Pendiente</th>
                </>
              )}
              {drillLevel === "grupo" && (
                <th className="text-left px-2 py-2 font-semibold">Cliente</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : drillLevel === "linea" ? (
              /* ─── LEVEL 1: LÍNEAS ─── */
              <>
                {filteredLineas.map((l, idx) => {
                  const dif = l.diferencia
                  const difYoy = l.difYoY
                  const isCritical = l.presupuesto > 0 && l.pctDifPpto < -15

                  return (
                    <tr
                      key={l.linea}
                      className={`border-b border-[#F0F0F0] cursor-pointer hover:bg-[#FFF5F5] transition-colors ${isCritical ? "bg-[#FFF2F2]" : idx % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}
                      onClick={() => drillToGerencias(l.linea)}
                    >
                      <td className="px-1 py-1.5 text-center">
                        <ChevronRight className="w-3.5 h-3.5 text-[#E62800] inline" />
                      </td>
                      <td className="px-2 py-1.5 font-medium text-[#111]">{l.linea}</td>
                      <td className="px-2 py-1.5 text-right font-medium">{fmt(l.primaNeta)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-500">{l.presupuesto ? fmt(l.presupuesto) : ""}</td>
                      <td className={`px-2 py-1.5 text-right font-medium ${dif < 0 ? "text-[#E62800]" : "text-[#166534]"}`}>
                        {l.presupuesto ? (dif < 0 ? `(${fmt(Math.abs(dif))})` : fmt(dif)) : ""}
                      </td>
                      <td className={`px-2 py-1.5 text-right ${dif < 0 ? "text-[#E62800]" : "text-[#166534]"}`}>
                        {l.pctDifPpto ? `${l.pctDifPpto > 0 ? "+" : ""}${l.pctDifPpto}%` : ""}
                      </td>
                      <td className="px-2 py-1.5 text-right text-gray-500">{l.pnAnioAnt ? fmt(l.pnAnioAnt) : ""}</td>
                      <td className={`px-2 py-1.5 text-right font-medium ${difYoy < 0 ? "text-[#E62800]" : "text-[#166534]"}`}>
                        {l.pnAnioAnt ? (difYoy < 0 ? `(${fmt(Math.abs(difYoy))})` : fmt(difYoy)) : ""}
                      </td>
                      <td className={`px-2 py-1.5 text-right ${difYoy < 0 ? "text-[#E62800]" : "text-[#166534]"}`}>
                        {l.pctDifYoY ? `${l.pctDifYoY > 0 ? "+" : ""}${l.pctDifYoY}%` : ""}
                      </td>
                      <td className="px-2 py-1.5 text-right text-gray-500">{l.pendiente ? fmt(l.pendiente) : ""}</td>
                    </tr>
                  )
                })}
                {/* TOTAL row */}
                <tr className="bg-[#041224] text-white border-t-2 cursor-default">
                  <td className="px-1 py-2"></td>
                  <td className="px-2 py-2 font-bold">Total</td>
                  <td className="px-2 py-2 text-right font-bold">{fmt(totalLineas.primaNeta)}</td>
                  <td className="px-2 py-2 text-right font-bold">{totalLineas.presupuesto ? fmt(totalLineas.presupuesto) : ""}</td>
                  <td className="px-2 py-2 text-right font-bold">{totalLineas.presupuesto ? (totalDif < 0 ? `(${fmt(Math.abs(totalDif))})` : fmt(totalDif)) : ""}</td>
                  <td className="px-2 py-2 text-right font-bold">{totalDifPct ? `${totalDifPct}%` : ""}</td>
                  <td className="px-2 py-2 text-right font-bold">{totalLineas.pnAnioAnt ? fmt(totalLineas.pnAnioAnt) : ""}</td>
                  <td className="px-2 py-2 text-right font-bold">{totalLineas.pnAnioAnt ? (totalDifYoy < 0 ? `(${fmt(Math.abs(totalDifYoy))})` : fmt(totalDifYoy)) : ""}</td>
                  <td className="px-2 py-2 text-right font-bold">{totalDifYoyPct ? `${totalDifYoyPct}%` : ""}</td>
                  <td className="px-2 py-2 text-right font-bold">{totalLineas.pendiente ? fmt(totalLineas.pendiente) : ""}</td>
                </tr>
              </>
            ) : drillLevel === "gerencia" ? (
              /* ─── LEVEL 2: GERENCIAS ─── */
              <>
                {applySearch(gerencias, "gerencia").length === 0 ? (
                  <tr><td colSpan={3} className="px-3 py-8 text-center text-gray-400">Sin datos de gerencias para esta línea</td></tr>
                ) : applySearch(gerencias, "gerencia").map((g, idx) => (
                  <tr
                    key={g.gerencia}
                    className={`border-b border-[#F0F0F0] cursor-pointer hover:bg-[#FFF5F5] transition-colors ${idx % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}
                    onClick={() => drillToVendedores(g.gerencia)}
                  >
                    <td className="px-2 py-1.5 font-medium text-[#111]">
                      <ChevronRight className="w-3 h-3 text-[#E62800] inline mr-1" />
                      {g.gerencia}
                    </td>
                    <td className="px-2 py-1.5 text-right font-medium">{fmt(g.primaNeta)}</td>
                  </tr>
                ))}
                {/* TOTAL */}
                <tr className="bg-[#041224] text-white border-t-2 cursor-default">
                  <td className="px-2 py-2 font-bold">Total</td>
                  <td className="px-2 py-2 text-right font-bold">{fmt(gerencias.reduce((s, g) => s + g.primaNeta, 0))}</td>
                </tr>
              </>
            ) : drillLevel === "vendedor" ? (
              /* ─── LEVEL 3: VENDEDORES ─── */
              <>
                {applySearch(vendedores, "vendedor").length === 0 ? (
                  <tr><td colSpan={3} className="px-3 py-8 text-center text-gray-400">Sin datos de vendedores para esta gerencia</td></tr>
                ) : applySearch(vendedores, "vendedor").map((v, idx) => (
                  <tr
                    key={v.vendedor}
                    className={`border-b border-[#F0F0F0] cursor-pointer hover:bg-[#FFF5F5] transition-colors ${idx % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}
                    onClick={() => drillToGrupos(v.vendedor)}
                  >
                    <td className="px-2 py-1.5 font-medium text-[#111]">
                      <ChevronRight className="w-3 h-3 text-[#E62800] inline mr-1" />
                      {v.vendedor}
                    </td>
                    <td className="px-2 py-1.5 text-right font-medium">{fmt(v.primaNeta)}</td>
                  </tr>
                ))}
                {/* TOTAL */}
                <tr className="bg-[#041224] text-white border-t-2 cursor-default">
                  <td className="px-2 py-2 font-bold">Total</td>
                  <td className="px-2 py-2 text-right font-bold">{fmt(vendedores.reduce((s, v) => s + v.primaNeta, 0))}</td>
                </tr>
              </>
            ) : (
              /* ─── LEVEL 4: GRUPOS ─── */
              <>
                {applySearch(grupos, "grupo").length === 0 ? (
                  <tr><td colSpan={3} className="px-3 py-8 text-center text-gray-400">Sin datos de grupos para este vendedor</td></tr>
                ) : applySearch(grupos, "grupo").map((g, idx) => (
                  <tr
                    key={g.grupo}
                    className={`border-b border-[#F0F0F0] hover:bg-[#FFF5F5] transition-colors ${idx % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}
                  >
                    <td className="px-2 py-1.5 font-medium text-[#111]">{g.grupo}</td>
                    <td className="px-2 py-1.5 text-right font-medium">{fmt(g.primaNeta)}</td>
                    <td className="px-2 py-1.5 text-[#666] text-[9px]">{g.cliente}</td>
                  </tr>
                ))}
                {/* TOTAL */}
                <tr className="bg-[#041224] text-white border-t-2 cursor-default">
                  <td className="px-2 py-2 font-bold">Total</td>
                  <td className="px-2 py-2 text-right font-bold">{fmt(grupos.reduce((s, g) => s + g.primaNeta, 0))}</td>
                  <td className="px-2 py-2"></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <PageFooter showFootnote={drillLevel === "linea"} />
    </div>
  )
}
