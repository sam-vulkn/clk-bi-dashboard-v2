"use client"

import { KPICard } from "@/components/ui/kpi-card"
import { DollarSign, FileText, TrendingUp, AlertTriangle } from "lucide-react"

export default function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-clk-dark font-lato mb-1">
        Home Ejecutivo
      </h1>
      <p className="text-sm text-clk-gray-medium mb-6">
        Resumen general de producción y cobranza
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Prima Cobrada"
          value={48520000}
          format="currency"
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: 12.3, isPositive: true }}
          subtitle="vs mes anterior"
        />
        <KPICard
          title="Cumplimiento Meta"
          value={87.4}
          format="percentage"
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 3.1, isPositive: true }}
          subtitle="meta mensual"
        />
        <KPICard
          title="Pólizas Emitidas"
          value={1243}
          format="number"
          icon={<FileText className="w-5 h-5" />}
          trend={{ value: -2.1, isPositive: false }}
          subtitle="este mes"
        />
        <KPICard
          title="Cobranza Pendiente"
          value={12380000}
          format="currency"
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={{ value: 8.5, isPositive: false }}
          subtitle="total vencido"
        />
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-clk-gray-light p-6">
          <h2 className="text-lg font-bold text-clk-dark mb-4">Prima por Línea de Negocio</h2>
          <div className="h-64 flex items-center justify-center text-clk-gray-medium text-sm">
            Gráfica — Fase 2
          </div>
        </div>
        <div className="bg-white rounded-lg border border-clk-gray-light p-6">
          <h2 className="text-lg font-bold text-clk-dark mb-4">Tendencia Mensual</h2>
          <div className="h-64 flex items-center justify-center text-clk-gray-medium text-sm">
            Gráfica — Fase 2
          </div>
        </div>
      </div>
    </div>
  )
}
