"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "#", label: "Gobierno", style: "text-[#6B7280]" },
  { href: "/", label: "Grupo Click", style: "text-white font-bold", activeOn: ["/", "/tabla-detalle", "/compromisos", "/internacional", "/corporate", "/cobranza"] },
  { href: "#", label: "RD", style: "text-[#6B7280]" },
  { href: "/cobranza-dia", label: "Cobranza por día", style: "text-[#E8735A]" },
  { href: "/cobranza-pendiente", label: "Cobranza pendiente", style: "text-[#E8735A]" },
]

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#0D1117] text-white p-2 rounded-md"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-[#0D1117] flex flex-col z-40 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: 90, minWidth: 90, maxWidth: 90 }}
      >
        {/* Logo */}
        <div className="px-2 py-4 border-b border-[#1F2937] flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded bg-[#C00000] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-[9px]">CLK</span>
          </div>
          <span className="text-white font-bold text-[10px] font-lato leading-tight text-center">Click Seguros</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-1 py-3 flex flex-col gap-0">
          {NAV_ITEMS.map((item) => {
            const isActive = item.activeOn
              ? item.activeOn.includes(pathname)
              : pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "px-2 py-2 text-[11px] leading-tight transition-colors duration-150 hover:bg-[#1F2937]",
                  item.style,
                  isActive && "bg-[#1F2937] font-bold border-l-2 border-l-[#C00000]"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
