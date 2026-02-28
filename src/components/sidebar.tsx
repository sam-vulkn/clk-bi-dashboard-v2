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

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#041224] text-white p-2 rounded-md"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed top-0 left-0 h-full bg-[#F5F5F5] flex flex-col z-40 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} border-r border-[#E5E7E9]`}
        style={{ width: 160, minWidth: 160, maxWidth: 160 }}
      >
        {/* Logo */}
        <div className="bg-white px-4 py-3 border-b border-[#E5E7E9] flex items-center justify-center">
          <div className="text-[#E62800] font-black text-sm tracking-tight" style={{ height: 28, lineHeight: "28px" }}>
            Click<span className="text-[#041224]">SEGUROS</span>
          </div>
        </div>

        {/* Grupo Click block — main nav */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className={`mx-3 mt-4 rounded-lg text-center py-5 px-3 font-bold text-sm no-underline transition-all duration-200 ${
            isActive("/") || isActive("/tabla-detalle") || isActive("/compromisos") || isActive("/corporate") || isActive("/internacional")
              ? "bg-[#041224] text-white shadow-md"
              : "bg-[#041224]/80 text-white/90 hover:bg-[#041224]"
          }`}
        >
          Grupo Click
        </Link>

        {/* Cobranza buttons — coral style */}
        <div className="flex flex-col gap-2 mx-3 mt-3">
          <Link
            href="/cobranza-dia"
            onClick={() => setOpen(false)}
            className={`rounded-lg text-center py-3 px-3 text-xs font-semibold no-underline transition-all duration-200 ${
              isActive("/cobranza-dia")
                ? "bg-[#FEE2E2] text-[#E62800] shadow-sm border border-[#E62800]/20"
                : "bg-[#FEE2E2]/60 text-[#041224] hover:bg-[#FEE2E2] hover:text-[#E62800]"
            }`}
          >
            Cobranza por día
          </Link>
          <Link
            href="/cobranza-pendiente"
            onClick={() => setOpen(false)}
            className={`rounded-lg text-center py-3 px-3 text-xs font-semibold no-underline transition-all duration-200 ${
              isActive("/cobranza-pendiente")
                ? "bg-[#FEE2E2] text-[#E62800] shadow-sm border border-[#E62800]/20"
                : "bg-[#FEE2E2]/60 text-[#041224] hover:bg-[#FEE2E2] hover:text-[#E62800]"
            }`}
          >
            Cobranza pendiente
          </Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Subtle footer */}
        <div className="px-3 pb-3">
          <div className="text-[8px] text-[#CCD1D3] text-center leading-tight">
            CLK BI Dashboard<br />v1.0
          </div>
        </div>
      </aside>
    </>
  )
}
