"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/", label: "Tacómetro" },
  { href: "/tabla-detalle", label: "Tabla detalle" },
  { href: "/compromisos", label: "Compromisos 2024" },
  { href: "/internacional", label: "Internacional" },
  { href: "/corporate", label: "Corporate" },
  { href: "/cobranza", label: "Convenios" },
]

export function PageTabs() {
  const pathname = usePathname()

  return (
    <div className="flex items-center border-b border-[#E5E7EB] mb-5">
      {TABS.map((tab, i) => {
        const active = pathname === tab.href
        const prevIsActive = i > 0 && pathname === TABS[i - 1].href
        // Show separator before this tab if: not first, this tab is not active, previous tab is not active
        const showSep = i > 0 && !active && !prevIsActive
        return (
          <div key={tab.href} className="flex items-center">
            {showSep ? (
              <span className="text-[#D1D5DB] text-[13px] select-none px-0.5">|</span>
            ) : i > 0 ? (
              <span className="px-0.5" />
            ) : null}
            <Link
              href={tab.href}
              className={cn(
                "px-3 py-2.5 text-[13px] transition-colors relative -mb-px whitespace-nowrap",
                active
                  ? "text-[#111] font-bold border-b-2 border-[#C00000]"
                  : "text-[#666666] hover:text-[#111]"
              )}
            >
              {tab.label}
            </Link>
          </div>
        )
      })}
    </div>
  )
}
