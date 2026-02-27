"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Table2,
  Target,
  Wallet,
  LogOut,
  Menu,
  X,
  Shield,
  UserCircle,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

const navItems = [
  { href: "/", label: "Home Ejecutivo", icon: LayoutDashboard },
  { href: "/tabla-detalle", label: "Tabla Detalle", icon: Table2 },
  { href: "/compromisos", label: "Compromisos", icon: Target },
  { href: "/cobranza", label: "Cobranza", icon: Wallet },
]

const roleBadge: Record<string, { label: string; color: string }> = {
  director: { label: "Director", color: "bg-clk-red" },
  gerente: { label: "Gerente", color: "bg-clk-yellow text-clk-dark" },
  vendedor: { label: "Vendedor", color: "bg-blue-500" },
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, role, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  const badge = role ? roleBadge[role] : null

  const nav = (
    <>
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-clk-red" />
          <div>
            <div className="text-white font-bold text-lg font-lato tracking-tight">CLK</div>
            <div className="text-white/50 text-[10px] uppercase tracking-widest">BI Dashboard</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white border-l-[3px] border-clk-red -ml-[3px]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      {user && (
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <UserCircle className="w-8 h-8 text-white/40" />
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {user.email}
              </div>
              {badge && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1",
                    badge.color,
                    !badge.color.includes("text-") && "text-white"
                  )}
                >
                  <Shield className="w-2.5 h-2.5" />
                  {badge.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-white/40 hover:text-white text-xs transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-clk-dark text-white p-2 rounded-md"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-clk-dark flex flex-col z-40 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>
    </>
  )
}
