import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ReportingSystem } from "@/components/reporting-system"

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Security Reports</h1>
                <p className="text-muted-foreground">Comprehensive Assessment Reports & Export</p>
              </div>
            </div>

            <ReportingSystem target="example.com" />
          </div>
        </main>
      </div>
    </div>
  )
}
