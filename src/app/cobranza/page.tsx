"use client"

import { KPICard } from "@/components/ui/kpi-card"
import { Wallet, Clock, CheckCircle, AlertTriangle } from "lucide-react"

const AGING_BUCKETS = [
  { label: "0–30 días", count: 142, monto: 4200000, color: "bg-green-500" },
  { label: "31–60 días", count: 87, monto: 3100000, color: "bg-clk-yellow" },
  { label: "61–90 días", count: 34, monto: 2800000, color: "bg-orange-500" },
  { label: "90+ días", count: 18, monto: 2280000, color: "bg-clk-red" },
]

const DEMO_PENDING = [
  { poliza: "AUT-2026-001", cliente: "María López García", aseguradora: "GNP", monto: 18500, vencimiento: "2026-02-28", dias: 0 },
  { poliza: "DAÑ-2026-103", cliente: "Comercializadora ABC S.A.", aseguradora: "AXA", monto: 52000, vencimiento: "2026-01-15", dias: 43 },
  { poliza: "GMM-2026-087", cliente: "Roberto Sánchez M.", aseguradora: "Metlife", monto: 29700, vencimiento: "2025-12-01", dias: 88 },
  { poliza: "VID-2026-042", cliente: "Ana Martínez López", aseguradora: "Chubb", monto: 14000, vencimiento: "2025-11-10", dias: 109 },
]

function diasColor(dias: number) {
  if (dias <= 30) return "text-green-600"
  if (dias <= 60) return "text-yellow-600"
  if (dias <= 90) return "text-orange-600"
  return "text-clk-red font-bold"
}

export default function CobranzaPage() {
  const totalPendiente = AGING_BUCKETS.reduce((s, b) => s + b.monto, 0)
  const totalRecibos = AGING_BUCKETS.reduce((s, b) => s + b.count, 0)
  const fmt = (v: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(v)

  return (
    <div>
      <h1 className="text-2xl font-bold text-clk-dark font-lato mb-1">Cobranza</h1>
      <p className="text-sm text-clk-gray-medium mb-6">Estado de cartera y cobranza pendiente</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Total Pendiente"
          value={totalPendiente}
          format="currency"
          icon={<Wallet className="w-5 h-5" />}
        />
        <KPICard
          title="Recibos Pendientes"
          value={totalRecibos}
          format="number"
          icon={<Clock className="w-5 h-5" />}
        />
        <KPICard
          title="Tasa de Cobro"
          value={78.3}
          format="percentage"
          icon={<CheckCircle className="w-5 h-5" />}
          trend={{ value: 2.1, isPositive: true }}
        />
        <KPICard
          title="Vencidos 90+ días"
          value={2280000}
          format="currency"
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={{ value: -5.4, isPositive: false }}
        />
      </div>

      {/* Aging buckets */}
      <div className="bg-white rounded-lg border border-clk-gray-light p-6 mb-6">
        <h2 className="text-lg font-bold text-clk-dark mb-4">Antigüedad de Cartera</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {AGING_BUCKETS.map((b) => (
            <div key={b.label} className="text-center">
              <div className={`h-2 rounded-full mb-3 ${b.color}`} />
              <div className="text-xs text-clk-gray-medium font-medium uppercase mb-1">{b.label}</div>
              <div className="text-lg font-bold text-clk-dark">{fmt(b.monto)}</div>
              <div className="text-xs text-clk-gray-medium">{b.count} recibos</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending table */}
      <div className="bg-white rounded-lg border border-clk-gray-light overflow-hidden">
        <div className="px-4 py-3 border-b border-clk-gray-light">
          <h2 className="text-lg font-bold text-clk-dark">Recibos Pendientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-clk-gray-light bg-clk-bg/50">
                <th className="text-left px-4 py-3 font-semibold text-clk-dark">Póliza</th>
                <th className="text-left px-4 py-3 font-semibold text-clk-dark">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-clk-dark">Aseguradora</th>
                <th className="text-right px-4 py-3 font-semibold text-clk-dark">Monto</th>
                <th className="text-left px-4 py-3 font-semibold text-clk-dark">Vencimiento</th>
                <th className="text-right px-4 py-3 font-semibold text-clk-dark">Días Mora</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_PENDING.map((r) => (
                <tr key={r.poliza} className="border-b border-clk-gray-light/50 hover:bg-clk-bg/30">
                  <td className="px-4 py-3 font-medium text-clk-red">{r.poliza}</td>
                  <td className="px-4 py-3">{r.cliente}</td>
                  <td className="px-4 py-3">{r.aseguradora}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(r.monto)}</td>
                  <td className="px-4 py-3">{r.vencimiento}</td>
                  <td className={`px-4 py-3 text-right ${diasColor(r.dias)}`}>{r.dias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
