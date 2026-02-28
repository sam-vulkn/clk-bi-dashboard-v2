"use client"

import { useEffect, useState } from "react"

export function PageFooter({ showFootnote = false }: { showFootnote?: boolean }) {
  const [now, setNow] = useState("")
  useEffect(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    setNow(`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
  }, [])

  return (
    <footer className="mt-8 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-[10px]">
      <div className="flex items-center gap-2">
        {/* IntraClick logo */}
        <div className="flex items-center gap-1.5 bg-[#1a1a2e] rounded px-2.5 py-1.5">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#E8735A" strokeWidth="1.5" />
            <circle cx="8" cy="8" r="2.5" fill="#E8735A" />
          </svg>
          <span className="text-white text-[9px] font-bold tracking-wide">INTRA</span>
          <span className="text-[#E8735A] text-[9px] font-bold tracking-wide">CLICK</span>
        </div>
      </div>
      <div className="text-[#111] text-center max-w-lg italic text-[9px]">
        {showFootnote ? "* El total de la prima neta del año anterior está al corte del día: 26/febrero/2025" : "\u00A0"}
      </div>
      <div className="text-gray-500 text-right leading-tight">
        <div>Fecha de actualización.</div>
        <div className="font-semibold text-[#111]">{now}</div>
      </div>
    </footer>
  )
}
