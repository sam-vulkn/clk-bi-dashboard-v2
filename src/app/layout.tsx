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
            <main className="flex-1 lg:ml-64 min-h-screen bg-clk-bg">
              <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
