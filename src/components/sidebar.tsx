"use client"

import { useState } from "react"
import { Menu, X, LayoutDashboard, Table2, TrendingUp, Building2, Globe, FileText } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  if (pathname === "/login") return null

  const isActive = (href: string) => pathname === href

  const navItems = [
    { href: "/", label: "Tacómetro", icon: LayoutDashboard },
    { href: "/tabla-detalle", label: "Tabla Detalle", icon: Table2 },
    { href: "/compromisos", label: "Compromisos", icon: TrendingUp },
    { href: "/corporate", label: "Corporate", icon: Building2 },
    { href: "/internacional", label: "Internacional", icon: Globe },
    { href: "/convenios", label: "Convenios", icon: FileText },
  ]

  const cobranzaItems = [
    { href: "/cobranza-dia", label: "Por día" },
    { href: "/cobranza-pendiente", label: "Pendiente" },
  ]

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
        className={`fixed top-0 left-0 h-full bg-gray-50 flex flex-col z-40 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} border-r border-gray-200`}
        style={{ width: 180 }}
      >
        {/* Logo */}
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <div className="text-center">
            <span className="text-lg font-black text-gray-900">Click</span>
            <span className="text-lg font-black text-orange-600">SEGUROS</span>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          <div className="px-2 py-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Dashboard</span>
          </div>
          
          {navItems.slice(0, 2).map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                isActive(item.href)
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}

          <div className="px-2 py-2 mt-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Cobranza</span>
          </div>
          
          {cobranzaItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                isActive(item.href)
                  ? "bg-orange-100 text-orange-700"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {item.label}
            </Link>
          ))}

          <div className="px-2 py-2 mt-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Reportes</span>
          </div>
          
          {navItems.slice(2).map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                isActive(item.href)
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <div className="text-[10px] text-gray-400 text-center">
            v2.0 • CLK BI
          </div>
        </div>
      </aside>
    </>
  )
}
