"use client"

import { KPICard } from "@/components/ui/kpi-card"
import { Target, TrendingUp } from "lucide-react"

const DEMO_GERENCIAS = [
  { nombre: "Gerencia Corporativo", meta: 15000000, actual: 13200000 },
  { nombre: "Gerencia PyME", meta: 8000000, actual: 7400000 },
  { nombre: "Gerencia Individual", meta: 5000000, actual: 3800000 },
  { nombre: "Gerencia Gobierno", meta: 12000000, actual: 11500000 },
]

function ProgressBar({ label, meta, actual }: { label: string; meta: number; actual: number }) {
  const pct = Math.min((actual / meta) * 100, 100)
  const fmt = (v: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, notation: "compact" }).format(v)

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-clk-dark">{label}</span>
        <span className="text-xs text-clk-gray-medium">
          {fmt(actual)} / {fmt(meta)} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-3 bg-clk-gray-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            pct >= 90 ? "bg-green-500" : pct >= 70 ? "bg-clk-yellow" : "bg-clk-red"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function CompromisosPage() {
  const totalMeta = DEMO_GERENCIAS.reduce((s, g) => s + g.meta, 0)
  const totalActual = DEMO_GERENCIAS.reduce((s, g) => s + g.actual, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-clk-dark font-lato mb-1">Compromisos</h1>
      <p className="text-sm text-clk-gray-medium mb-6">Seguimiento de metas por gerencia</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <KPICard
          title="Meta Global"
          value={totalMeta}
          format="currency"
          icon={<Target className="w-5 h-5" />}
          subtitle="mensual"
        />
        <KPICard
          title="Avance Global"
          value={(totalActual / totalMeta) * 100}
          format="percentage"
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: ((totalActual / totalMeta) * 100) - 85, isPositive: (totalActual / totalMeta) > 0.85 }}
          subtitle="del total"
        />
      </div>

      <div className="bg-white rounded-lg border border-clk-gray-light p-6">
        <h2 className="text-lg font-bold text-clk-dark mb-5">Meta vs Actual por Gerencia</h2>
        {DEMO_GERENCIAS.map((g) => (
          <ProgressBar key={g.nombre} label={g.nombre} meta={g.meta} actual={g.actual} />
        ))}
      </div>
    </div>
  )
}
