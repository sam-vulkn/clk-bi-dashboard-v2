"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronRight, ChevronLeft, Search, Download, AlertTriangle } from "lucide-react"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import { getLineasNegocio, getGerencias, getVendedores, getGrupos, getClientes, getPolizas } from "@/lib/queries"
import type { PolizaRow } from "@/lib/queries"
import { exportExcel, exportPDF } from "@/lib/export"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

const MESES: Record<string, number> = {
  Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
  Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12,
}

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

// Umbral configurable de alerta por desviación (default -20%)
const ALERT_THRESHOLD = -20

type DrillLevel = "linea" | "gerencia" | "vendedor" | "grupo" | "cliente" | "poliza"

interface Crumb { level: DrillLevel; label: string }

// Simple row for levels 2-5 (name + primaNeta)
interface SimpleRow { name: string; primaNeta: number }

export default function TablaDetallePage() {
  const [year, setYear] = useState("2026")
  const [month, setMonth] = useState("Febrero")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [compareMode, setCompareMode] = useState<"yoy" | "mom" | "qoq" | "ytd">("yoy")

  // Drill state
  const [drillLevel, setDrillLevel] = useState<DrillLevel>("linea")
  const [crumbs, setCrumbs] = useState<Crumb[]>([])
  // Selections for building queries deeper
  const [sel, setSel] = useState<{ linea?: string; gerencia?: string; vendedor?: string; grupo?: string; cliente?: string }>({})

  // Data
  const [lineas, setLineas] = useState<LineaFull[]>(SEED)
  const [rows, setRows] = useState<SimpleRow[]>([])
  const [polizas, setPolizas] = useState<PolizaRow[]>([])

  const tableRef = useRef<HTMLDivElement>(null)
  useEffect(() => { document.title = "Tabla detalle | CLK BI Dashboard" }, [])
  const periodo = MESES[month] ?? 2

  // Load líneas
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setDrillLevel("linea"); setCrumbs([]); setSel({})

    const load = async () => {
      try {
        const result = await getLineasNegocio(periodo, year)
        if (!cancelled) {
          if (result && result.length > 0) {
            setLineas(result.map(r => ({ linea: r.linea, primaNeta: r.primaNeta, presupuesto: 0, diferencia: 0, pctDifPpto: 0, pnAnioAnt: 0, difYoY: 0, pctDifYoY: 0, pendiente: 0 })))
          } else { setLineas(SEED) }
          setLoading(false)
        }
      } catch { if (!cancelled) { setLineas(SEED); setLoading(false) } }
    }
    const ks = setTimeout(() => { if (!cancelled) { cancelled = true; setLineas(SEED); setLoading(false) } }, 3000)
    load()
    return () => { cancelled = true; clearTimeout(ks) }
  }, [periodo, year])

  // Generic drill function
  const drill = async (level: DrillLevel, label: string, newSel: typeof sel) => {
    setLoading(true)
    setSel(newSel)
    setCrumbs(prev => [...prev, { level: drillLevel, label }])

    try {
      if (level === "gerencia") {
        const data = await getGerencias(newSel.linea!, periodo, year)
        setRows((data ?? []).map(d => ({ name: d.gerencia, primaNeta: d.primaNeta })))
      } else if (level === "vendedor") {
        const data = await getVendedores(newSel.gerencia!, newSel.linea!, periodo, year)
        setRows((data ?? []).map(d => ({ name: d.vendedor, primaNeta: d.primaNeta })))
      } else if (level === "grupo") {
        const data = await getGrupos(newSel.vendedor!, newSel.gerencia!, newSel.linea!, periodo, year)
        setRows((data ?? []).map(d => ({ name: d.grupo, primaNeta: d.primaNeta })))
      } else if (level === "cliente") {
        const data = await getClientes(newSel.grupo!, newSel.vendedor!, newSel.gerencia!, newSel.linea!, periodo, year)
        setRows((data ?? []).map(d => ({ name: d.cliente, primaNeta: d.primaNeta })))
      } else if (level === "poliza") {
        const data = await getPolizas(newSel.cliente!, newSel.grupo!, newSel.vendedor!, newSel.gerencia!, newSel.linea!, periodo, year)
        setPolizas(data ?? [])
      }
    } catch { setRows([]); setPolizas([]) }

    setDrillLevel(level)
    setLoading(false)
  }

  const goBack = () => {
    if (crumbs.length === 0) return
    const prev = crumbs[crumbs.length - 1]
    setCrumbs(c => c.slice(0, -1))

    // Restore selection
    if (prev.level === "linea") {
      setDrillLevel("linea"); setSel({})
    } else {
      // Re-drill to the previous level
      const newCrumbs = crumbs.slice(0, -1)
      // Reconstruct sel from crumbs
      const newSel: typeof sel = {}
      const levels: DrillLevel[] = ["linea", "gerencia", "vendedor", "grupo", "cliente", "poliza"]
      const selKeys = ["linea", "gerencia", "vendedor", "grupo", "cliente"] as const
      for (let i = 0; i < newCrumbs.length; i++) {
        const idx = levels.indexOf(newCrumbs[i].level)
        if (idx >= 0 && idx < selKeys.length) {
          (newSel as Record<string, string>)[selKeys[idx]] = newCrumbs[i].label
        }
      }
      // Also include the "prev" level's label as sel
      const prevIdx = levels.indexOf(prev.level)
      if (prevIdx > 0 && prevIdx - 1 < selKeys.length) {
        // prev.level is what we're going BACK to
      }
      drill(prev.level, "", { ...newSel }).then(() => {
        setCrumbs(newCrumbs)
      })
      return
    }
  }

  const goToCrumb = (idx: number) => {
    if (idx < 0) { setDrillLevel("linea"); setCrumbs([]); setSel({}); return }
    // Reconstruct and re-drill
    const target = crumbs[idx]
    const newCrumbs = crumbs.slice(0, idx)
    const levels: DrillLevel[] = ["linea", "gerencia", "vendedor", "grupo", "cliente"]
    const selKeys = ["linea", "gerencia", "vendedor", "grupo", "cliente"] as const
    const newSel: typeof sel = {}
    for (const c of newCrumbs) {
      const li = levels.indexOf(c.level)
      if (li >= 0 && li < selKeys.length) (newSel as Record<string, string>)[selKeys[li]] = c.label
    }
    const nextLevel = levels[levels.indexOf(target.level) + 1] || target.level
    drill(nextLevel as DrillLevel, target.label, { ...newSel, [selKeys[levels.indexOf(target.level)]]: target.label }).then(() => {
      setCrumbs([...newCrumbs, target])
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterSearch = <T,>(items: T[], key: string): T[] => {
    if (!search) return items
    return items.filter(item => String((item as any)[key]).toLowerCase().includes(search.toLowerCase()))
  }

  // Column label for current level
  const levelLabels: Record<DrillLevel, string> = {
    linea: "Línea de negocio", gerencia: "Gerencia", vendedor: "Vendedor",
    grupo: "Grupo", cliente: "Cliente / Asegurado", poliza: "Póliza",
  }

  const filteredLineas = filterSearch(lineas, "linea")
  const totalLineas = { primaNeta: filteredLineas.reduce((s, l) => s + l.primaNeta, 0), presupuesto: filteredLineas.reduce((s, l) => s + l.presupuesto, 0), pnAnioAnt: filteredLineas.reduce((s, l) => s + l.pnAnioAnt, 0), pendiente: filteredLineas.reduce((s, l) => s + l.pendiente, 0) }
  const totalDif = filteredLineas.reduce((s, l) => s + l.diferencia, 0)
  const totalDifPct = totalLineas.presupuesto > 0 ? ((totalDif / totalLineas.presupuesto) * 100).toFixed(1) : ""
  const totalDifYoy = filteredLineas.reduce((s, l) => s + l.difYoY, 0)
  const totalDifYoyPct = totalLineas.pnAnioAnt > 0 ? ((totalDifYoy / totalLineas.pnAnioAnt) * 100).toFixed(2) : ""

  // Alert count: líneas with % dif ppto <= threshold
  const alertCount = filteredLineas.filter(l => l.presupuesto > 0 && l.pctDifPpto <= ALERT_THRESHOLD).length

  const drillTabs: { level: DrillLevel; label: string }[] = [
    { level: "linea", label: "Línea" },
    { level: "gerencia", label: "Gerencia" },
    { level: "vendedor", label: "Vendedor" },
  ]

  const filteredRows = filterSearch(rows, "name")
  const filteredPolizas = filterSearch(polizas, "documento")
  const rowTotal = filteredRows.reduce((s, r) => s + r.primaNeta, 0)
  const polizaTotal = filteredPolizas.reduce((s, p) => s + p.primaNeta, 0)

  // Compare mode labels
  const compareLabels = {
    yoy: { col: "PN año anterior *", difCol: "Dif PN año ant", pctCol: "% Dif PN AA" },
    mom: { col: "PN mes anterior", difCol: "Dif PN mes ant", pctCol: "% Dif mes ant" },
    qoq: { col: "PN trim. anterior", difCol: "Dif PN trim ant", pctCol: "% Dif trim ant" },
    ytd: { col: "YTD año anterior", difCol: "Dif YTD", pctCol: "% Dif YTD" },
  }
  const cmpLabel = compareLabels[compareMode]

  const handleExcelExport = () => {
    const levelName = levelLabels[drillLevel]
    const filename = `CLK_PrimaNetaCobrada_${levelName.replace(/\s/g, "")}_${year}${month}.xlsx`

    if (drillLevel === "linea") {
      exportExcel(
        filteredLineas.map(l => ({ "Línea": l.linea, "Prima neta": l.primaNeta, "Presupuesto": l.presupuesto, "Diferencia": l.diferencia, "% Dif ppto": l.pctDifPpto, "PN año anterior": l.pnAnioAnt, "Dif PN año ant": l.difYoY, "% Dif PN AA": l.pctDifYoY, "Pendiente": l.pendiente })),
        ["Línea", "Prima neta", "Presupuesto", "Diferencia", "% Dif ppto", "PN año anterior", "Dif PN año ant", "% Dif PN AA", "Pendiente"],
        ["Línea", "Prima neta", "Presupuesto", "Diferencia", "% Dif ppto", "PN año anterior", "Dif PN año ant", "% Dif PN AA", "Pendiente"],
        filename
      )
    } else if (drillLevel === "poliza") {
      exportExcel(
        filteredPolizas.map(p => ({ "Documento": p.documento, "Aseguradora": p.aseguradora, "Ramo": p.ramo, "Subramo": p.subramo, "F. Liquidación": p.fechaLiquidacion, "F. Lím. Pago": p.fechaLimPago, "Prima neta": p.primaNeta })),
        ["Documento", "Aseguradora", "Ramo", "Subramo", "F. Liquidación", "F. Lím. Pago", "Prima neta"],
        ["Documento", "Aseguradora", "Ramo", "Subramo", "F. Liquidación", "F. Lím. Pago", "Prima neta"],
        filename
      )
    } else {
      exportExcel(
        filteredRows.map(r => ({ [levelName]: r.name, "Prima neta": r.primaNeta })),
        [levelName, "Prima neta"],
        [levelName, "Prima neta"],
        filename
      )
    }
  }

  const handlePDFExport = () => {
    if (!tableRef.current) return
    const filters = `${month} ${year} | Nivel: ${levelLabels[drillLevel]} | ${crumbs.map(c => c.label).join(" > ") || "Todas las líneas"}`
    exportPDF(tableRef.current, "Prima Neta Cobrada", filters)
  }

  return (
    <div>
      <PageTabs alertCount={alertCount} />

      {/* Title + drill tabs */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h1 className="text-base font-bold text-[#111] font-lato">Prima neta cobrada</h1>
        <div className="flex items-center gap-1.5">
          {drillTabs.map(b => (
            <button
              key={b.level}
              onClick={() => { if (b.level === "linea") { setDrillLevel("linea"); setCrumbs([]); setSel({}) } }}
              className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${
                drillLevel === b.level ? "bg-[#041224] text-white" : "bg-[#FDECEA] text-[#041224]"
              }`}
            >
              {b.label}
            </button>
          ))}
          <span className="w-px h-5 bg-[#E5E7E9] mx-1" />
          <button onClick={handleExcelExport} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border border-[#041224] text-[#041224] hover:bg-[#F5F5F5] transition-colors">
            <Download className="w-3 h-3" /> Excel
          </button>
          <button onClick={handlePDFExport} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium border border-[#041224] text-[#041224] hover:bg-[#F5F5F5] transition-colors">
            <Download className="w-3 h-3" /> PDF
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {crumbs.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button onClick={goBack} className="flex items-center gap-1 text-xs text-[#041224] hover:text-[#E62800] transition-colors font-medium">
            <ChevronLeft className="w-4 h-4" /> Atrás
          </button>
          <div className="flex items-center gap-1 text-xs text-[#888] flex-wrap">
            <button onClick={() => { setDrillLevel("linea"); setCrumbs([]); setSel({}) }} className="hover:text-[#041224] underline">Líneas</button>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => goToCrumb(i)} className={`transition-colors ${i === crumbs.length - 1 ? "text-[#041224] font-semibold" : "hover:text-[#041224] underline"}`}>
                  {c.label}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs">
          <label className="text-gray-500 font-medium">Año</label>
          <select value={year} onChange={e => setYear(e.target.value)} className="border border-[#E5E7EB] rounded px-2 py-1 text-xs bg-white">
            <option>2026</option><option>2025</option><option>2024</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <label className="text-gray-500 font-medium">Mes</label>
          <select value={month} onChange={e => setMonth(e.target.value)} className="border border-[#E5E7EB] rounded px-2 py-1 text-xs bg-white">
            {Object.keys(MESES).map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <label className="text-gray-500 font-medium">Comparar</label>
          <select value={compareMode} onChange={e => setCompareMode(e.target.value as typeof compareMode)} className="border border-[#E5E7EB] rounded px-2 py-1 text-xs bg-white">
            <option value="yoy">Vs Año Anterior</option>
            <option value="mom">Vs Mes Anterior</option>
            <option value="qoq">Vs Trimestre Anterior</option>
            <option value="ytd">YTD vs YTD</option>
          </select>
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-7 pr-3 py-1 border border-[#E5E7EB] rounded text-xs w-44 bg-white" />
        </div>
        <span className="text-xs text-[#CCD1D3]">Actualizado: {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
      </div>

      {/* Table */}
      <div ref={tableRef} className="bi-card overflow-hidden overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            {drillLevel === "linea" ? (
              <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                <th className="w-6 px-1 py-2"></th>
                <th className="text-left px-2 py-2 font-semibold">Línea de negocio</th>
                <th className="text-right px-2 py-2 font-semibold">Prima neta</th>
                <th className="text-right px-2 py-2 font-semibold">Presupuesto</th>
                <th className="text-right px-2 py-2 font-semibold">Diferencia</th>
                <th className="text-right px-2 py-2 font-semibold">% Dif ppto</th>
                <th className="text-right px-2 py-2 font-semibold">{cmpLabel.col}</th>
                <th className="text-right px-2 py-2 font-semibold">{cmpLabel.difCol}</th>
                <th className="text-right px-2 py-2 font-semibold">{cmpLabel.pctCol}</th>
                <th className="text-right px-2 py-2 font-semibold">Pendiente</th>
              </tr>
            ) : drillLevel === "poliza" ? (
              <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                <th className="text-left px-2 py-2 font-semibold">Documento</th>
                <th className="text-left px-2 py-2 font-semibold">Aseguradora</th>
                <th className="text-left px-2 py-2 font-semibold">Ramo</th>
                <th className="text-left px-2 py-2 font-semibold">Subramo</th>
                <th className="text-left px-2 py-2 font-semibold">F. Liquidación</th>
                <th className="text-left px-2 py-2 font-semibold">F. Lím. Pago</th>
                <th className="text-right px-2 py-2 font-semibold">Prima neta</th>
              </tr>
            ) : (
              <tr className="bg-[#041224] text-white border-b-2 border-b-[#E62800]">
                <th className="w-6 px-1 py-2"></th>
                <th className="text-left px-2 py-2 font-semibold">{levelLabels[drillLevel]}</th>
                <th className="text-right px-2 py-2 font-semibold">Prima neta</th>
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">Cargando...</td></tr>

            ) : drillLevel === "linea" ? (
              /* ─── LEVEL 1: LÍNEAS (9 columns) ─── */
              <>
                {filteredLineas.map((l, idx) => {
                  const dif = l.diferencia
                  const difYoy = l.difYoY
                  const isAlert = l.presupuesto > 0 && l.pctDifPpto <= ALERT_THRESHOLD
                  const isCritical = l.presupuesto > 0 && l.pctDifPpto < -15
                  return (
                    <tr key={l.linea} className={`border-b border-[#F0F0F0] cursor-pointer hover:bg-[#FFF5F5] transition-colors ${isAlert ? "bg-[#FFF3F3]" : isCritical ? "bg-[#FFF2F2]" : idx % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}
                      onClick={() => drill("gerencia", l.linea, { linea: l.linea })}>
                      <td className="px-1 py-1.5 text-center">
                        {isAlert ? (
                          <span title={`Desviación crítica: ${l.pctDifPpto}%`}>
                            <AlertTriangle className="w-3.5 h-3.5 text-[#E62800] inline" />
                          </span>
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[#E62800] inline" />
                        )}
                      </td>
                      <td className="px-2 py-1.5 font-medium text-[#111]">{l.linea}</td>
                      <td className="px-2 py-1.5 text-right font-medium">{fmt(l.primaNeta)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-500">{l.presupuesto ? fmt(l.presupuesto) : ""}</td>
                      <td className={`px-2 py-1.5 text-right font-medium ${dif < 0 ? "text-[#E62800]" : "text-[#166534]"}`}>{l.presupuesto ? (dif < 0 ? `(${fmt(Math.abs(dif))})` : fmt(dif)) : ""}</td>
                      <td className={`px-2 py-1.5 text-right ${dif < 0 ? "text-[#E62800]" : "text-[#166534]"}`}>{l.pctDifPpto ? `${l.pctDifPpto > 0 ? "+" : ""}${l.pctDifPpto}%` : ""}</td>
                      <td className="px-2 py-1.5 text-right text-gray-500">{l.pnAnioAnt ? fmt(l.pnAnioAnt) : ""}</td>
                      <td className={`px-2 py-1.5 text-right font-medium ${difYoy < 0 ? "text-[#E62800]" : "text-[#166534]"}`}>{l.pnAnioAnt ? (difYoy < 0 ? `(${fmt(Math.abs(difYoy))})` : fmt(difYoy)) : ""}</td>
                      <td className={`px-2 py-1.5 text-right ${difYoy < 0 ? "text-[#E62800]" : "text-[#166534]"}`}>{l.pctDifYoY ? `${l.pctDifYoY > 0 ? "+" : ""}${l.pctDifYoY}%` : ""}</td>
                      <td className="px-2 py-1.5 text-right text-gray-500">{l.pendiente ? fmt(l.pendiente) : ""}</td>
                    </tr>
                  )
                })}
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

            ) : drillLevel === "poliza" ? (
              /* ─── LEVEL 6: PÓLIZAS ─── */
              <>
                {filteredPolizas.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-[#888]">Datos en integración</td></tr>
                ) : filteredPolizas.map((p, idx) => (
                  <tr key={`${p.documento}-${idx}`} className={`border-b border-[#F0F0F0] hover:bg-[#FFF5F5] ${idx % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}>
                    <td className="px-2 py-1.5 font-medium text-[#111]">{p.documento}</td>
                    <td className="px-2 py-1.5 text-[#333]">{p.aseguradora}</td>
                    <td className="px-2 py-1.5 text-[#333]">{p.ramo}</td>
                    <td className="px-2 py-1.5 text-[#666]">{p.subramo}</td>
                    <td className="px-2 py-1.5 text-[#666]">{p.fechaLiquidacion}</td>
                    <td className="px-2 py-1.5 text-[#666]">{p.fechaLimPago}</td>
                    <td className={`px-2 py-1.5 text-right font-medium ${p.primaNeta < 0 ? "text-[#E62800]" : ""}`}>{p.primaNeta < 0 ? `(${fmt(Math.abs(p.primaNeta))})` : fmt(p.primaNeta)}</td>
                  </tr>
                ))}
                <tr className="bg-[#041224] text-white border-t-2 cursor-default">
                  <td className="px-2 py-2 font-bold" colSpan={6}>Total</td>
                  <td className="px-2 py-2 text-right font-bold">{fmt(polizaTotal)}</td>
                </tr>
              </>

            ) : (
              /* ─── LEVELS 2-5: GENERIC (name + primaNeta) ─── */
              <>
                {filteredRows.length === 0 ? (
                  <tr><td colSpan={3} className="px-3 py-8 text-center text-[#888]">
                    {drillLevel === "cliente" || drillLevel === "grupo" ? "Datos en integración" : `Sin datos para ${month} ${year}`}
                  </td></tr>
                ) : filteredRows.map((r, idx) => {
                  // Determine next level
                  const nextLevel: DrillLevel | null =
                    drillLevel === "gerencia" ? "vendedor" :
                    drillLevel === "vendedor" ? "grupo" :
                    drillLevel === "grupo" ? "cliente" :
                    drillLevel === "cliente" ? "poliza" : null
                  const selKey =
                    drillLevel === "gerencia" ? "gerencia" :
                    drillLevel === "vendedor" ? "vendedor" :
                    drillLevel === "grupo" ? "grupo" :
                    drillLevel === "cliente" ? "cliente" : null

                  return (
                    <tr key={r.name} className={`border-b border-[#F0F0F0] ${nextLevel ? "cursor-pointer" : ""} hover:bg-[#FFF5F5] transition-colors ${idx % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"}`}
                      onClick={() => nextLevel && selKey && drill(nextLevel, r.name, { ...sel, [selKey]: r.name })}>
                      <td className="px-1 py-1.5 text-center">
                        {nextLevel && <ChevronRight className="w-3 h-3 text-[#E62800] inline" />}
                      </td>
                      <td className="px-2 py-1.5 font-medium text-[#111]">{r.name}</td>
                      <td className={`px-2 py-1.5 text-right font-medium ${r.primaNeta < 0 ? "text-[#E62800]" : ""}`}>
                        {r.primaNeta < 0 ? `(${fmt(Math.abs(r.primaNeta))})` : fmt(r.primaNeta)}
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-[#041224] text-white border-t-2 cursor-default">
                  <td className="px-1 py-2"></td>
                  <td className="px-2 py-2 font-bold">Total</td>
                  <td className="px-2 py-2 text-right font-bold">{fmt(rowTotal)}</td>
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
