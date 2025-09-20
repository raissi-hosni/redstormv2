import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ScanningDiscovery } from "@/components/scanning-discovery"

export default function ScanningPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Scanning & Discovery</h1>
                <p className="text-muted-foreground">Network Port Scanning & Service Detection</p>
              </div>
            </div>

            <ScanningDiscovery target="192.168.1.100" />
          </div>
        </main>
      </div>
    </div>
  )
}
