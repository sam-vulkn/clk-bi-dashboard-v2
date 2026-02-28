"use client"

import { useEffect } from "react"
import { PageTabs } from "@/components/page-tabs"
import { PageFooter } from "@/components/page-footer"
import { Construction } from "lucide-react"

export default function CorporatePage() {
  useEffect(() => { document.title = "Corporate | CLK BI Dashboard" }, [])
  return (
    <div>
      <PageTabs />
      <div className="bi-card flex flex-col items-center justify-center py-24 text-center">
        <Construction className="w-12 h-12 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-[#111] font-lato mb-2">Corporate</h1>
        <p className="text-sm text-gray-400">En construcción</p>
      </div>
      <PageFooter />
    </div>
  )
}
