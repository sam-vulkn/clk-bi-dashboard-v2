"use client"

import { useState } from "react"
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react"

const DEMO_DATA = [
  { poliza: "AUT-2026-001", asegurado: "María López García", aseguradora: "GNP", ramo: "Autos", prima: 18500, fecha: "2026-02-15", estatus: "Vigente" },
  { poliza: "VID-2026-042", asegurado: "Carlos Hernández R.", aseguradora: "Quálitas", ramo: "Vida", prima: 42000, fecha: "2026-02-10", estatus: "Vigente" },
  { poliza: "DAÑ-2026-103", asegurado: "Comercializadora ABC S.A.", aseguradora: "AXA", ramo: "Daños", prima: 156000, fecha: "2026-01-28", estatus: "Vigente" },
  { poliza: "GMM-2026-087", asegurado: "Roberto Sánchez M.", aseguradora: "Metlife", ramo: "GMM", prima: 89000, fecha: "2026-02-20", estatus: "Pendiente" },
  { poliza: "AUT-2026-112", asegurado: "Ana Martínez López", aseguradora: "Chubb", ramo: "Autos", prima: 22300, fecha: "2026-02-18", estatus: "Vigente" },
]

const estatusColor: Record<string, string> = {
  Vigente: "bg-green-100 text-green-700",
  Pendiente: "bg-clk-yellow/20 text-yellow-700",
  Cancelada: "bg-red-100 text-clk-red",
  Vencida: "bg-clk-gray-light text-clk-text",
}

export default function TablaDetallePage() {
  const [search, setSearch] = useState("")

  const filtered = DEMO_DATA.filter(
    (r) =>
      r.poliza.toLowerCase().includes(search.toLowerCase()) ||
      r.asegurado.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-clk-dark font-lato mb-1">Tabla Detalle</h1>
      <p className="text-sm text-clk-gray-medium mb-6">Detalle de pólizas emitidas</p>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clk-gray-medium" />
          <input
            type="text"
            placeholder="Buscar por póliza o asegurado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-clk-gray-light rounded-md text-sm focus:outline-none focus:border-clk-red"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-clk-dark text-white rounded-md text-sm hover:bg-clk-dark/90 transition-colors">
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-clk-gray-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-clk-gray-light bg-clk-bg/50">
                <th className="text-left px-4 py-3 font-semibold text-clk-dark">Póliza</th>
                <th className="text-left px-4 py-3 font-semibold text-clk-dark">Asegurado</th>
                <th className="text-left px-4 py-3 font-semibold text-clk-dark">Aseguradora</th>
                <th className="text-left px-4 py-3 font-semibold text-clk-dark">Ramo</th>
                <th className="text-right px-4 py-3 font-semibold text-clk-dark">Prima</th>
                <th className="text-left px-4 py-3 font-semibold text-clk-dark">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-clk-dark">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-clk-gray-medium">
                    Sin resultados
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.poliza} className="border-b border-clk-gray-light/50 hover:bg-clk-bg/30">
                    <td className="px-4 py-3 font-medium text-clk-red">{r.poliza}</td>
                    <td className="px-4 py-3">{r.asegurado}</td>
                    <td className="px-4 py-3">{r.aseguradora}</td>
                    <td className="px-4 py-3">{r.ramo}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(r.prima)}
                    </td>
                    <td className="px-4 py-3">{r.fecha}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estatusColor[r.estatus] || ""}`}>
                        {r.estatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-clk-gray-light">
          <span className="text-xs text-clk-gray-medium">
            Mostrando {filtered.length} de {DEMO_DATA.length} registros
          </span>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded hover:bg-clk-gray-light disabled:opacity-30" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-clk-red text-white rounded text-xs font-medium">1</span>
            <button className="p-1.5 rounded hover:bg-clk-gray-light disabled:opacity-30" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
