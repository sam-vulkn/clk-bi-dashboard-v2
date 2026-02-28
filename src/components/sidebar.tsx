"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Hide sidebar on login
  if (pathname === "/login") return null

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#2D2D2D] text-white p-2 rounded-md"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed top-0 left-0 h-full bg-[#F5F5F5] flex flex-col z-40 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 140, minWidth: 140, maxWidth: 140, padding: 8 }}
      >
        {/* Grupo Click block */}
        <Link
          href="/"
          className="block bg-[#2D2D2D] text-white font-bold text-center py-10 px-4 mb-2 text-sm"
          style={{ fontStyle: "italic" }}
        >
          Grupo Click
        </Link>

        {/* Cobranza por día */}
        <Link
          href="/cobranza-dia"
          className={`block bg-[#FEE2E2] text-[#1A1A1A] font-bold py-3 px-4 rounded mb-1.5 text-xs no-underline hover:opacity-80 transition-opacity ${pathname === "/cobranza-dia" ? "ring-2 ring-[#C00000]" : ""}`}
        >
          Cobranza por día
        </Link>

        {/* Cobranza pendiente */}
        <Link
          href="/cobranza-pendiente"
          className={`block bg-[#FEE2E2] text-[#1A1A1A] font-bold py-3 px-4 rounded text-xs no-underline hover:opacity-80 transition-opacity ${pathname === "/cobranza-pendiente" ? "ring-2 ring-[#C00000]" : ""}`}
        >
          Cobranza pendiente
        </Link>
      </aside>
    </>
  )
}
