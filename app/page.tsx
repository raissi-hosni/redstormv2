import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardOverview } from "@/components/dashboard-overview"
import { TargetInput } from "@/components/target-input"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">RedStorm Dashboard</h1>
                <p className="text-muted-foreground">AI-Powered Real-Time Attack Simulator</p>
              </div>
            </div>

            <TargetInput />
            <DashboardOverview />
          </div>
        </main>
      </div>
    </div>
  )
}
