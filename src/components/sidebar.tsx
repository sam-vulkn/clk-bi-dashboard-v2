"use client"

import { useState } from "react"
import { Menu, X, Home, Table2, Handshake, CalendarDays, Clock } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tabla-detalle", label: "Tabla Detalle", icon: Table2 },
  { href: "/compromisos", label: "Compromisos", icon: Handshake },
  { href: "/cobranza-dia", label: "Cobranza por día", icon: CalendarDays },
  { href: "/cobranza-pendiente", label: "Cobranza pendiente", icon: Clock },
]

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
        {/* Logo */}
        <div className="bg-white px-4 py-3 border-b border-[#E5E7E9] flex items-center justify-center">
          <div className="text-[#E62800] font-black text-sm tracking-tight" style={{ height: 28, lineHeight: "28px" }}>
            Click<span className="text-[#041224]">SEGUROS</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 p-2 mt-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-[12px] font-medium no-underline transition-all duration-150 ${
                  active
                    ? "bg-white text-[#041224] border-l-[3px] border-l-[#E62800] shadow-sm font-bold"
                    : "text-[#666] hover:bg-white hover:text-[#041224] border-l-[3px] border-l-transparent"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="leading-tight">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
