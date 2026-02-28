import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Sidebar } from "@/components/sidebar"

export const metadata: Metadata = {
  title: "CLK BI Dashboard",
  description: "Dashboard de inteligencia de negocios — Click Seguros",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-[140px] min-h-screen bg-[#F0F0F0]">
              <div className="p-5 lg:p-6 max-w-[1400px] mx-auto">{children}</div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
