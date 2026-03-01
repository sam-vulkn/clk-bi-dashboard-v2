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
  const isGrupoActive = ["/", "/tabla-detalle"].includes(pathname)
  const isCobranzaActive = ["/cobranza-dia", "/cobranza-pendiente"].includes(pathname)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-3 left-3 z-50 lg:hidden bg-gray-900 text-white p-2 rounded-lg shadow-lg"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed top-0 left-0 h-full bg-white flex flex-col z-40 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} border-r border-gray-200 shadow-sm`}
        style={{ width: 180 }}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="text-center">
            <span className="text-lg font-black text-gray-900">Click</span>
            <span className="text-lg font-black text-orange-600">SEGUROS</span>
          </div>
        </div>

        <div className="flex-1 py-3 px-3 space-y-3 overflow-y-auto">
          
          {/* GRUPO CLICK Box */}
          <div className={`rounded-lg border overflow-hidden ${isGrupoActive ? 'border-gray-900 shadow-sm' : 'border-gray-200'}`}>
            <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wide ${isGrupoActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Grupo Click
            </div>
            <div className="bg-white">
              <Link href="/" onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm border-b border-gray-100 transition-colors ${isActive("/") ? "bg-orange-50 text-orange-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                Tacómetro
              </Link>
              <Link href="/tabla-detalle" onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm transition-colors ${isActive("/tabla-detalle") ? "bg-orange-50 text-orange-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                Tabla Detalle
              </Link>
            </div>
          </div>

          {/* COBRANZA Box */}
          <div className={`rounded-lg border overflow-hidden ${isCobranzaActive ? 'border-orange-400 shadow-sm' : 'border-gray-200'}`}>
            <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wide ${isCobranzaActive ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700'}`}>
              Cobranza
            </div>
            <div className="bg-white">
              <Link href="/cobranza-dia" onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm border-b border-gray-100 transition-colors ${isActive("/cobranza-dia") ? "bg-orange-50 text-orange-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                Cobranza por día
              </Link>
              <Link href="/cobranza-pendiente" onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm transition-colors ${isActive("/cobranza-pendiente") ? "bg-orange-50 text-orange-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                Cobranza pendiente
              </Link>
            </div>
          </div>

          {/* Other links */}
          <div className="pt-2 space-y-1">
            <Link href="/compromisos" onClick={() => setOpen(false)}
              className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isActive("/compromisos") ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              Compromisos 2025
            </Link>
            <Link href="/internacional" onClick={() => setOpen(false)}
              className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isActive("/internacional") ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              Internacional
            </Link>
            <Link href="/corporate" onClick={() => setOpen(false)}
              className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isActive("/corporate") ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              Corporate
            </Link>
            <Link href="/cobranza" onClick={() => setOpen(false)}
              className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isActive("/cobranza") ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              Convenios
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <div className="text-[10px] text-gray-400 text-center">
            CLK BI Dashboard • v2.0
          </div>
        </div>
      </aside>
    </>
  )
}
