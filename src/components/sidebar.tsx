"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  if (pathname === "/login") return null

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
        className={`fixed top-0 left-0 h-full bg-[#F0F0F0] flex flex-col z-40 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 160, minWidth: 160, maxWidth: 160 }}
      >
        {/* Logo — fondo blanco, zona de seguridad */}
        <div className="bg-white px-4 py-3 border-b border-[#E5E7E9] flex items-center justify-center">
          <div className="text-[#E62800] font-black text-sm tracking-tight" style={{ height: 28, lineHeight: "28px" }}>
            Click<span className="text-[#041224]">SEGUROS</span>
          </div>
        </div>

        {/* Grupo Click — bloque oscuro */}
        <Link
          href="/"
          className="bg-[#2D2D2D] text-white font-bold text-sm px-4 py-6 text-center block italic no-underline hover:bg-[#3D3D3D] transition-colors"
        >
          Grupo Click
        </Link>

        {/* Cobranza links */}
        <div className="p-3 flex flex-col gap-2">
          <Link
            href="/cobranza-dia"
            className={`bg-[#FEE2E2] text-[#1A1A1A] font-bold text-sm px-4 py-3 rounded-md text-center no-underline hover:bg-[#FECACA] transition-colors ${pathname === "/cobranza-dia" ? "ring-2 ring-[#E62800]" : ""}`}
          >
            Cobranza por día
          </Link>
          <Link
            href="/cobranza-pendiente"
            className={`bg-[#FEE2E2] text-[#1A1A1A] font-bold text-sm px-4 py-3 rounded-md text-center no-underline hover:bg-[#FECACA] transition-colors ${pathname === "/cobranza-pendiente" ? "ring-2 ring-[#E62800]" : ""}`}
          >
            Cobranza pendiente
          </Link>
        </div>
      </aside>
    </>
  )
}
