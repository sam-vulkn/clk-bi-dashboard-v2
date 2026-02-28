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
        className={`fixed top-0 left-0 h-full bg-[#F5F5F5] flex flex-col z-40 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 160, minWidth: 160, maxWidth: 160 }}
      >
        {/* Logo — fondo blanco */}
        <div className="bg-white px-4 py-3 border-b border-[#E5E7E9] flex items-center justify-center">
          <div className="text-[#E62800] font-black text-sm tracking-tight" style={{ height: 28, lineHeight: "28px" }}>
            Click<span className="text-[#041224]">SEGUROS</span>
          </div>
        </div>

        {/* Grupo Click — azul marino */}
        <Link
          href="/"
          className="bg-[#041224] text-white font-bold text-sm px-4 py-7 text-center block italic no-underline hover:bg-[#0a1e38] transition-colors"
        >
          Grupo Click
        </Link>

        {/* Cobranza links — rosa pálido */}
        <div className="p-2 flex flex-col gap-1.5">
          <Link
            href="/cobranza-dia"
            className={`block bg-[#FEE2E2] text-[#041224] font-bold text-[13px] py-3 px-4 rounded-md text-center no-underline hover:bg-[#FECACA] transition-colors ${pathname === "/cobranza-dia" ? "ring-2 ring-[#E62800]" : ""}`}
          >
            Cobranza por día
          </Link>
          <Link
            href="/cobranza-pendiente"
            className={`block bg-[#FEE2E2] text-[#041224] font-bold text-[13px] py-3 px-4 rounded-md text-center no-underline hover:bg-[#FECACA] transition-colors ${pathname === "/cobranza-pendiente" ? "ring-2 ring-[#E62800]" : ""}`}
          >
            Cobranza pendiente
          </Link>
        </div>
      </aside>
    </>
  )
}
