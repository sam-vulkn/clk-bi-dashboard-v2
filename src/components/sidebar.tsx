"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  if (pathname === "/login") return null

  const isActive = (href: string) => pathname === href
  const isGrupoActive = isActive("/") || isActive("/tabla-detalle") || isActive("/compromisos") || isActive("/corporate") || isActive("/internacional")

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#041224] text-white p-2 rounded-md shadow-lg"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed top-0 left-0 h-full bg-[#F7F7F7] flex flex-col z-40 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} border-r border-[#E5E7E9] shadow-[2px_0_10px_rgba(0,0,0,0.05)]`}
        style={{ width: 170, minWidth: 170, maxWidth: 170 }}
      >
        {/* Logo */}
        <div className="bg-white px-4 py-4 border-b border-[#E5E7E9] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
          <div className="text-[#E62800] font-black text-base tracking-tight">
            Click<span className="text-[#041224]">SEGUROS</span>
          </div>
        </div>

        {/* ═══ GRUPO CLICK BOX — Power BI style ═══ */}
        <div className="mx-3 mt-4 bg-white rounded-lg border border-[#E5E7E9] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className={`px-3 py-2 border-b transition-colors ${isGrupoActive ? "bg-[#041224]" : "bg-[#041224]/90"}`}>
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Grupo Click</span>
          </div>
          <div className="flex flex-col">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={`text-center py-2.5 px-3 text-[11px] font-semibold no-underline transition-all border-b border-[#F0F0F0] ${
                isActive("/") ? "bg-[#FDECEA] text-[#E62800]" : "text-[#041224] hover:bg-[#F5F5F5]"
              }`}
            >
              Tacómetro
            </Link>
            <Link
              href="/tabla-detalle"
              onClick={() => setOpen(false)}
              className={`text-center py-2.5 px-3 text-[11px] font-semibold no-underline transition-all ${
                isActive("/tabla-detalle") ? "bg-[#FDECEA] text-[#E62800]" : "text-[#041224] hover:bg-[#F5F5F5]"
              }`}
            >
              Tabla Detalle
            </Link>
          </div>
        </div>

        {/* ═══ COBRANZA BOX — Power BI style ═══ */}
        <div className="mx-3 mt-3 bg-white rounded-lg border border-[#E5E7E9] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="bg-[#FEE2E2] px-3 py-2 border-b border-[#E62800]/15">
            <span className="text-[11px] font-bold text-[#E62800] uppercase tracking-wider">Cobranza</span>
          </div>
          <div className="flex flex-col">
            <Link
              href="/cobranza-dia"
              onClick={() => setOpen(false)}
              className={`text-center py-2.5 px-3 text-[11px] font-semibold no-underline transition-all border-b border-[#F0F0F0] ${
                isActive("/cobranza-dia") ? "bg-[#FEE2E2] text-[#E62800]" : "text-[#041224] hover:bg-[#FEE2E2]/30"
              }`}
            >
              Cobranza por día
            </Link>
            <Link
              href="/cobranza-pendiente"
              onClick={() => setOpen(false)}
              className={`text-center py-2.5 px-3 text-[11px] font-semibold no-underline transition-all ${
                isActive("/cobranza-pendiente") ? "bg-[#FEE2E2] text-[#E62800]" : "text-[#041224] hover:bg-[#FEE2E2]/30"
              }`}
            >
              Cobranza pendiente
            </Link>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="px-3 pb-4">
          <div className="bg-white rounded-lg border border-[#E5E7E9] p-2 text-center">
            <div className="text-[9px] text-[#999] leading-tight">
              CLK BI Dashboard<br />
              <span className="text-[#041224] font-semibold">v2.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
