"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, SlidersHorizontal, Maximize2 } from "lucide-react"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import { useCountUp } from "@/lib/use-count-up"
import { getGerencias } from "@/lib/queries"

function fmt(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

interface CompRow {
  gerencia: string
  primaNeta: number
  convenio: number
  pnAnioAnterior: number
  pendiente: number
}

const SEED: CompRow[] = [
  { gerencia: "Benito Juárez CDMX", primaNeta: 11375783, convenio: 15200000, pnAnioAnterior: 9904778, pendiente: 1706367 },
  { gerencia: "Chihuahua CHH", primaNeta: 21212861, convenio: 16900000, pnAnioAnterior: 17331269, pendiente: 3181929 },
  { gerencia: "Guadalajara JAL", primaNeta: 93887711, convenio: 54850000, pnAnioAnterior: 71835137, pendiente: 14083157 },
  { gerencia: "Monterrey NL", primaNeta: 47231050, convenio: 33550000, pnAnioAnterior: 32825000, pendiente: 7084658 },
  { gerencia: "Polanco CDMX", primaNeta: 57987200, convenio: 39000000, pnAnioAnterior: 18942000, pendiente: 8698080 },
  { gerencia: "Puebla PUE", primaNeta: 11285000, convenio: 12500000, pnAnioAnterior: 10100000, pendiente: 1692750 },
  { gerencia: "Querétaro QRO", primaNeta: 73102300, convenio: 51700000, pnAnioAnterior: 59860000, pendiente: 10965345 },
  { gerencia: "Tustla Giz2 CHP", primaNeta: 47456100, convenio: 76500000, pnAnioAnterior: 63790000, pendiente: 7118415 },
  { gerencia: "Villahermosa TAB", primaNeta: 32485000, convenio: 38900000, pnAnioAnterior: 27100000, pendiente: 4872750 },
  { gerencia: "León GTO", primaNeta: 31345000, convenio: 21000000, pnAnioAnterior: 18500000, pendiente: 4701750 },
  { gerencia: "Cuautitlán Izcalli MEX", primaNeta: 50507200, convenio: 22800000, pnAnioAnterior: 9000000, pendiente: 7576080 },
]

const MESES: Record<string, number> = {
  Enero: 1, Febrero: 2, Marzo: 3, Abril: 4, Mayo: 5, Junio: 6,
  Julio: 7, Agosto: 8, Septiembre: 9, Octubre: 10, Noviembre: 11, Diciembre: 12,
}

export default function CompromisosPage() {
  const [data, setData] = useState<CompRow[]>(SEED)
  useEffect(() => { document.title = "Compromisos 2024 | CLK BI Dashboard" }, [])
  const [isReal, setIsReal] = useState(false)
  const [year] = useState("2026")
  const [month] = useState("Febrero")

  const periodo = MESES[month] ?? 2

  const fetchData = useCallback(async () => {
    // Try fetching gerencias for all líneas combined
    const result = await getGerencias("Corporate", periodo, year)
    const result2 = await getGerencias("Cartera Tradicional", periodo, year)

    const allGers = [...(result || []), ...(result2 || [])]

    if (allGers.length > 0) {
      // Merge by gerencia name
      const merged: Record<string, number> = {}
      for (const g of allGers) {
        merged[g.gerencia] = (merged[g.gerencia] || 0) + g.primaNeta
      }
      setData(Object.entries(merged)
        .map(([gerencia, primaNeta]) => ({
          gerencia,
          primaNeta,
          convenio: 0,
          pnAnioAnterior: 0,
          pendiente: 0,
        }))
        .sort((a, b) => b.primaNeta - a.primaNeta)
      )
      setIsReal(true)
    }
  }, [periodo, year])

  useEffect(() => { fetchData() }, [fetchData])

  // Timeout — if Supabase doesn't respond in 3s, keep seed data
  useEffect(() => {
    const timer = setTimeout(() => { setIsReal(false) }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const totalPNRaw = data.reduce((s, r) => s + r.primaNeta, 0)
  const totalPN = totalPNRaw > 0 ? totalPNRaw : 477293997
  const totalConv = data.reduce((s, r) => s + r.convenio, 0)
  const totalPend = data.reduce((s, r) => s + r.pendiente, 0)
  const cumplimiento = totalConv > 0 ? ((totalPN / totalConv) * 100).toFixed(1) : "0"

  const animTotal = useCountUp(Math.round(totalPN / 1e6), 1200)

  return (
    <div>
      <PageTabs />
      <h1 className="text-base font-bold text-[#111] font-lato mb-3">Compromisos 2024</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bi-card border-l-4 border-l-[#C00000] p-3">
          <div className="text-[9px] text-gray-500 uppercase tracking-wide font-medium mb-1">Prima neta total</div>
          <div className="text-2xl font-bold text-[#111] font-lato">${Math.round(animTotal)}M</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{data.length} gerencias</div>
        </div>
        {!isReal && (
          <div className="bi-card border-l-4 border-l-[#E8735A] p-3">
            <div className="text-[9px] text-gray-500 uppercase tracking-wide font-medium mb-1">Total convenio</div>
            <div className="text-2xl font-bold text-[#111] font-lato">{fmt(totalConv)}</div>
          </div>
        )}
        <div className="bi-card p-3" style={{ background: "#375623" }}>
          <div className="text-[9px] text-white/70 uppercase tracking-wide font-medium mb-1">Cumplimiento</div>
          <div className="text-2xl font-bold text-white font-lato">
            {isReal ? `${data.length} gerencias` : `+${cumplimiento}%`}
          </div>
          {!isReal && <div className="text-[10px] text-white/60 mt-0.5">vs Convenio</div>}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 mb-2">
        <button onClick={fetchData} className="text-gray-400 hover:text-[#111]"><RefreshCw className="w-4 h-4" /></button>
        <button className="text-gray-400 hover:text-[#111]"><SlidersHorizontal className="w-4 h-4" /></button>
        <button onClick={() => document.documentElement.requestFullscreen?.()} className="text-gray-400 hover:text-[#111]"><Maximize2 className="w-4 h-4" /></button>
      </div>

      {/* Table */}
      <div className="bi-card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#2D2D2D] text-white border-b-2 border-b-[#C00000]">
              <th className="text-left px-3 py-2 font-semibold">Gerencia</th>
              <th className="text-right px-3 py-2 font-semibold">Prima neta</th>
              {!isReal && <th className="text-right px-3 py-2 font-semibold">Convenio</th>}
              {!isReal && <th className="text-right px-3 py-2 font-semibold">PN año anterior</th>}
              {!isReal && <th className="text-right px-3 py-2 font-semibold">Pendiente</th>}
              <th className="text-right px-3 py-2 font-semibold">% del total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => {
              const pct = totalPN > 0 ? ((r.primaNeta / totalPN) * 100).toFixed(1) : "0"
              return (
                <tr key={r.gerencia} className={`border-b border-[#F0F0F0] hover:bg-[#FFF5F5] ${i % 2 === 1 ? "bg-[#FAFAFA]" : ""}`}>
                  <td className="px-3 py-1.5 font-medium text-[#111]">{r.gerencia}</td>
                  <td className="px-3 py-1.5 text-right font-medium">{fmt(r.primaNeta)}</td>
                  {!isReal && <td className="px-3 py-1.5 text-right text-gray-500">{r.convenio ? fmt(r.convenio) : ""}</td>}
                  {!isReal && <td className="px-3 py-1.5 text-right text-gray-500">{r.pnAnioAnterior ? fmt(r.pnAnioAnterior) : ""}</td>}
                  {!isReal && <td className="px-3 py-1.5 text-right text-gray-500">{r.pendiente ? fmt(r.pendiente) : ""}</td>}
                  <td className="px-3 py-1.5 text-right text-gray-500">{pct}%</td>
                </tr>
              )
            })}
            <tr className="bg-black text-white border-t-2">
              <td className="px-3 py-2 font-bold">TOTAL</td>
              <td className="px-3 py-2 text-right font-bold">{fmt(totalPN)}</td>
              {!isReal && <td className="px-3 py-2 text-right font-bold">{totalConv ? fmt(totalConv) : ""}</td>}
              {!isReal && <td className="px-3 py-2 text-right font-bold"></td>}
              {!isReal && <td className="px-3 py-2 text-right font-bold">{totalPend ? fmt(totalPend) : ""}</td>}
              <td className="px-3 py-2 text-right font-bold">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <PageFooter />
    </div>
  )
}
