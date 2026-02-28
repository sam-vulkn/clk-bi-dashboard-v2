"use client"

import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import { Cylinder } from "@/components/cylinder"
import { Search } from "lucide-react"

function fmtFull(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(v)
}

// Donut gauge for cards 1 & 2
function DonutCard({ label, pct, objective, diff, year, pnLabel, pnValue, convLabel, convValue }: {
  label: string; pct: number; objective: number; diff: number; year?: number
  pnLabel: string; pnValue: string; convLabel: string; convValue: string
}) {
  const r = 48
  const circumference = 2 * Math.PI * r
  const progress = (pct / 100) * circumference
  const color = pct >= objective ? "#375623" : "#C00000"

  return (
    <div className="bi-card p-4">
      <div className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-2">{label}</div>
      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
            <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`} transform="rotate(-90 60 60)" className="transition-all duration-1000" />
            <text x="60" y="56" textAnchor="middle" fill={color} fontSize="20" fontWeight="bold" fontFamily="Lato">{pct.toFixed(1)}%</text>
            <text x="60" y="72" textAnchor="middle" fill="#999" fontSize="8">Obj: {objective}%</text>
          </svg>
        </div>
        <div className="min-w-0">
          {year && <div className="text-xs text-gray-400 mb-1">{year}</div>}
          <div className={`text-xs font-bold ${diff >= 0 ? "text-[#375623]" : "text-[#C00000]"}`}>
            {diff >= 0 ? "+" : ""}{diff.toFixed(2)}%
          </div>
          <div className="mt-3 space-y-1.5">
            <div>
              <div className="text-[9px] text-gray-400 uppercase">{pnLabel}</div>
              <div className="text-xs font-bold text-[#111]">{pnValue}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 uppercase">{convLabel}</div>
              <div className="text-xs font-bold text-[#111]">{convValue}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Ramo data
const RAMOS = [
  { nombre: "Vehículos", pnEfectuada: 787742854, polizas: 160499 },
  { nombre: "Acc. y Enf.", pnEfectuada: 276612477, polizas: 10476 },
  { nombre: "Daños", pnEfectuada: 144378444, polizas: 6455 },
  { nombre: "Vida", pnEfectuada: 59636744, polizas: 4202 },
  { nombre: "Otros", pnEfectuada: 8013999, polizas: 545 },
]
const TOTAL_PN = RAMOS.reduce((s, r) => s + r.pnEfectuada, 0)
const TOTAL_POLIZAS = RAMOS.reduce((s, r) => s + r.polizas, 0)

// Company data
const COMPANIES = [
  { nombre: "AFIRME", primaNeta: 15109066, convenio: 15000000, pnAnioAnterior: 9836221, pendiente: 44534, primaNetaCia: 5677131, difCia: 9430936 },
  { nombre: "AIG", primaNeta: 8200000, convenio: 9500000, pnAnioAnterior: 7100000, pendiente: 120000, primaNetaCia: 3200000, difCia: 5000000 },
  { nombre: "ATLAS", primaNeta: 5400000, convenio: 6200000, pnAnioAnterior: 4800000, pendiente: 85000, primaNetaCia: 2100000, difCia: 3300000 },
  { nombre: "AXA", primaNeta: 42000000, convenio: 45000000, pnAnioAnterior: 38500000, pendiente: 350000, primaNetaCia: 18000000, difCia: 24000000 },
  { nombre: "CHUBB", primaNeta: 28500000, convenio: 30000000, pnAnioAnterior: 25000000, pendiente: 200000, primaNetaCia: 12000000, difCia: 16500000 },
  { nombre: "GNP", primaNeta: 95000000, convenio: 98000000, pnAnioAnterior: 82000000, pendiente: 500000, primaNetaCia: 40000000, difCia: 55000000 },
  { nombre: "HDI", primaNeta: 18000000, convenio: 20000000, pnAnioAnterior: 16000000, pendiente: 150000, primaNetaCia: 7500000, difCia: 10500000 },
  { nombre: "MAPFRE", primaNeta: 12000000, convenio: 13000000, pnAnioAnterior: 10500000, pendiente: 95000, primaNetaCia: 5000000, difCia: 7000000 },
  { nombre: "QUÁLITAS", primaNeta: 185000000, convenio: 180000000, pnAnioAnterior: 160000000, pendiente: 800000, primaNetaCia: 80000000, difCia: 105000000 },
  { nombre: "ZURICH", primaNeta: 22000000, convenio: 24000000, pnAnioAnterior: 19000000, pendiente: 180000, primaNetaCia: 9000000, difCia: 13000000 },
]

function pctStr(val: number, base: number) {
  if (base === 0) return "N/A"
  const p = ((val - base) / Math.abs(base)) * 100
  return `${p > 0 ? "+" : ""}${p.toFixed(1)}%`
}

function DifCell({ val, base }: { val: number; base: number }) {
  const dif = val - base
  const neg = dif < 0
  return (
    <td className={`px-2.5 py-2 text-right text-xs font-medium ${neg ? "text-[#C00000]" : "text-[#375623]"}`}>
      {neg ? `(${fmtFull(Math.abs(dif))})` : fmtFull(dif)}
    </td>
  )
}

function PctCell({ val, base }: { val: number; base: number }) {
  if (base === 0) return <td className="px-2.5 py-2 text-right text-xs">N/A</td>
  const p = ((val - base) / Math.abs(base)) * 100
  return (
    <td className={`px-2.5 py-2 text-right text-xs font-medium ${p < 0 ? "text-[#C00000]" : "text-[#375623]"}`}>
      {pctStr(val, base)}
    </td>
  )
}

export default function CobranzaPage() {
  return (
    <div>
      <PageTabs />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-[#111] font-lato">Aseguradoras</h1>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select className="border border-[#E5E7EB] rounded px-2.5 py-1.5 bg-white"><option>2026</option></select>
          <select className="border border-[#E5E7EB] rounded px-2.5 py-1.5 bg-white"><option>Febrero</option></select>
          <select className="border border-[#E5E7EB] rounded px-2.5 py-1.5 bg-white"><option>Línea de Negocio</option></select>
          <select className="border border-[#E5E7EB] rounded px-2.5 py-1.5 bg-white"><option>Gerencia</option></select>
          <select className="border border-[#E5E7EB] rounded px-2.5 py-1.5 bg-white"><option>Ramo</option></select>
          <select className="border border-[#E5E7EB] rounded px-2.5 py-1.5 bg-white"><option>Tipo compañía</option></select>
          <select className="border border-[#E5E7EB] rounded px-2.5 py-1.5 bg-white"><option>Compañía</option></select>
          <button className="text-[11px] text-gray-500 underline">Personalizar columnas</button>
        </div>
      </div>

      {/* 3 Metric cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4 mb-6">
        <DonutCard
          label="META CONVENIO"
          pct={94.5} objective={90} diff={6.4} year={2025}
          pnLabel="PN Efectuada Mensual" pnValue="$1.3 mil M"
          convLabel="Convenio Mensual" convValue="$1.4 mil M"
        />
        <DonutCard
          label="ACUMULADO"
          pct={94.5} objective={90} diff={5.05}
          pnLabel="Acumulado PN" pnValue="1,276.4 mill."
          convLabel="Convenio Acumulado" convValue="$1.4 mil M"
        />
        <div className="bi-card p-4 flex flex-col items-center justify-center min-w-[280px]">
          <Cylinder value={1292820000} maxValue={2585640000} pct={94.7} objective={90} />
          <div className="mt-2 grid grid-cols-2 gap-x-4 text-center">
            <div>
              <div className="text-[9px] text-gray-400 uppercase">PN Efectuada Anual</div>
              <div className="text-xs font-bold text-[#111]">1,276.4 mill.</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-400 uppercase">Convenio Anual</div>
              <div className="text-xs font-bold text-[#111]">$1,348.0 mill.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen por ramo */}
      <div className="bi-card overflow-hidden mb-6">
        <div className="px-4 py-2.5 border-b border-[#E5E7EB] bg-[#2D2D2D]">
          <h2 className="text-xs font-bold text-white uppercase">Resumen por Ramo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#2D2D2D]">
                <th className="text-left px-3 py-2 font-semibold text-white text-xs"></th>
                {RAMOS.map((r) => <th key={r.nombre} className="text-right px-3 py-2 font-semibold text-white text-xs">{r.nombre}</th>)}
                <th className="text-right px-3 py-2 font-semibold text-white text-xs">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#E5E7EB]/50 hover:bg-[#FFF5F5] cursor-pointer transition-colors duration-150">
                <td className="px-3 py-2 text-xs font-medium text-[#111]">PN Efectuada</td>
                {RAMOS.map((r) => <td key={r.nombre} className="px-3 py-2 text-right text-xs font-medium">{fmtFull(r.pnEfectuada)}</td>)}
                <td className="px-3 py-2 text-right text-xs font-bold">{fmtFull(TOTAL_PN)}</td>
              </tr>
              <tr className="border-b border-[#E5E7EB]/50 hover:bg-[#FFF5F5] cursor-pointer transition-colors duration-150">
                <td className="px-3 py-2 text-xs font-medium text-[#111]">% PN Efectuada</td>
                {RAMOS.map((r) => <td key={r.nombre} className="px-3 py-2 text-right text-xs text-gray-500">{((r.pnEfectuada / TOTAL_PN) * 100).toFixed(2)}%</td>)}
                <td className="px-3 py-2 text-right text-xs font-bold">100%</td>
              </tr>
              <tr className="hover:bg-[#FFF5F5] cursor-pointer transition-colors duration-150">
                <td className="px-3 py-2 text-xs font-medium text-[#111]">No. Pólizas</td>
                {RAMOS.map((r) => <td key={r.nombre} className="px-3 py-2 text-right text-xs font-medium">{new Intl.NumberFormat("es-MX").format(r.polizas)}</td>)}
                <td className="px-3 py-2 text-right text-xs font-bold">{new Intl.NumberFormat("es-MX").format(TOTAL_POLIZAS)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution bar */}
      <div className="bi-card p-4 mb-6">
        <div className="flex h-7 rounded overflow-hidden mb-2">
          {RAMOS.map((r, i) => {
            const pct = (r.pnEfectuada / TOTAL_PN) * 100
            const colors = ["#111", "#375623", "#B8860B", "#C00000", "#666"]
            return <div key={r.nombre} className="h-full flex items-center justify-center text-white text-[9px] font-bold" style={{ width: `${pct}%`, backgroundColor: colors[i] }} title={`${r.nombre}: ${pct.toFixed(1)}%`}>{pct > 5 ? `${pct.toFixed(0)}%` : ""}</div>
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          {RAMOS.map((r, i) => {
            const colors = ["#111", "#375623", "#B8860B", "#C00000", "#666"]
            return <div key={r.nombre} className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors[i] }} /><span className="text-[9px] text-gray-500">{r.nombre}</span></div>
          })}
        </div>
      </div>

      {/* Companies table */}
      <div className="bi-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5E7EB]">
          <h2 className="text-xs font-bold text-[#111] uppercase">Detalle por Compañía</h2>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input type="text" placeholder="Buscar..." className="pl-6 pr-3 py-1 border border-[#E5E7EB] rounded text-[10px] w-28 focus:outline-none focus:border-[#E8735A]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#2D2D2D]">
                <th className="text-left px-2.5 py-2 font-semibold text-white text-[11px] min-w-[120px]">Compañía</th>
                <th className="text-right px-2.5 py-2 font-semibold text-white text-[11px]">Prima Neta</th>
                <th className="text-right px-2.5 py-2 font-semibold text-white text-[11px]">Convenio</th>
                <th className="text-right px-2.5 py-2 font-semibold text-white text-[11px]">Diferencia</th>
                <th className="text-right px-2.5 py-2 font-semibold text-white text-[11px]">% Dif Compr</th>
                <th className="text-right px-2.5 py-2 font-semibold text-white text-[11px]">PN Año Ant.</th>
                <th className="text-right px-2.5 py-2 font-semibold text-white text-[11px]">Dif PN AA</th>
                <th className="text-right px-2.5 py-2 font-semibold text-white text-[11px]">% Dif PN AA</th>
                <th className="text-right px-2.5 py-2 font-semibold text-white text-[11px]">Pendiente</th>
                <th className="text-right px-2.5 py-2 font-semibold text-white text-[11px]">Prima Neta CIA</th>
                <th className="text-right px-2.5 py-2 font-semibold text-white text-[11px]">Dif CIA</th>
              </tr>
            </thead>
            <tbody>
              {COMPANIES.map((c, idx) => (
                <tr key={c.nombre} className={`border-b border-[#E5E7EB]/30 cursor-pointer hover:bg-[#FFF5F5] transition-colors duration-150 ${idx % 2 === 1 ? "bg-[#F8F8F8]" : "bg-white"}`}>
                  <td className="px-2.5 py-2 text-xs font-medium text-[#111]">{c.nombre}</td>
                  <td className="px-2.5 py-2 text-right text-xs font-medium">{fmtFull(c.primaNeta)}</td>
                  <td className="px-2.5 py-2 text-right text-xs text-gray-500">{fmtFull(c.convenio)}</td>
                  <DifCell val={c.primaNeta} base={c.convenio} />
                  <PctCell val={c.primaNeta} base={c.convenio} />
                  <td className="px-2.5 py-2 text-right text-xs text-gray-500">{fmtFull(c.pnAnioAnterior)}</td>
                  <DifCell val={c.primaNeta} base={c.pnAnioAnterior} />
                  <PctCell val={c.primaNeta} base={c.pnAnioAnterior} />
                  <td className="px-2.5 py-2 text-right text-xs font-medium">{fmtFull(c.pendiente)}</td>
                  <td className="px-2.5 py-2 text-right text-xs font-medium">{fmtFull(c.primaNetaCia)}</td>
                  <td className="px-2.5 py-2 text-right text-xs font-medium">{fmtFull(c.difCia)}</td>
                </tr>
              ))}
              {/* Total */}
              {(() => {
                const t = COMPANIES.reduce((a, c) => ({
                  primaNeta: a.primaNeta + c.primaNeta, convenio: a.convenio + c.convenio,
                  pnAnioAnterior: a.pnAnioAnterior + c.pnAnioAnterior, pendiente: a.pendiente + c.pendiente,
                  primaNetaCia: a.primaNetaCia + c.primaNetaCia, difCia: a.difCia + c.difCia,
                }), { primaNeta: 0, convenio: 0, pnAnioAnterior: 0, pendiente: 0, primaNetaCia: 0, difCia: 0 })
                return (
                  <tr className="bg-black text-white">
                    <td className="px-2.5 py-2.5 text-xs font-bold">TOTAL</td>
                    <td className="px-2.5 py-2.5 text-right text-xs font-bold">{fmtFull(t.primaNeta)}</td>
                    <td className="px-2.5 py-2.5 text-right text-xs font-bold">{fmtFull(t.convenio)}</td>
                    <td className={`px-2.5 py-2.5 text-right text-xs font-bold ${t.primaNeta >= t.convenio ? "text-green-300" : "text-[#ff6b6b]"}`}>
                      {t.primaNeta >= t.convenio ? fmtFull(t.primaNeta - t.convenio) : `(${fmtFull(Math.abs(t.primaNeta - t.convenio))})`}
                    </td>
                    <td className={`px-2.5 py-2.5 text-right text-xs font-bold ${t.primaNeta >= t.convenio ? "text-green-300" : "text-[#ff6b6b]"}`}>
                      {pctStr(t.primaNeta, t.convenio)}
                    </td>
                    <td className="px-2.5 py-2.5 text-right text-xs font-bold">{fmtFull(t.pnAnioAnterior)}</td>
                    <td className="px-2.5 py-2.5 text-right text-xs font-bold text-green-300">{fmtFull(t.primaNeta - t.pnAnioAnterior)}</td>
                    <td className="px-2.5 py-2.5 text-right text-xs font-bold text-green-300">{pctStr(t.primaNeta, t.pnAnioAnterior)}</td>
                    <td className="px-2.5 py-2.5 text-right text-xs font-bold">{fmtFull(t.pendiente)}</td>
                    <td className="px-2.5 py-2.5 text-right text-xs font-bold">{fmtFull(t.primaNetaCia)}</td>
                    <td className="px-2.5 py-2.5 text-right text-xs font-bold">{fmtFull(t.difCia)}</td>
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <PageFooter />
    </div>
  )
}
