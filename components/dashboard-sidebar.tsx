import { Target, Search, Scan, Bug, Zap, FileText, Activity, Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const navigationItems = [
  { icon: Activity, label: "Overview", active: true },
  { icon: Target, label: "Target Setup" },
  { icon: Search, label: "Reconnaissance" },
  { icon: Scan, label: "Scanning" },
  { icon: Bug, label: "Vulnerabilities" },
  { icon: Zap, label: "Exploitation" },
  { icon: FileText, label: "Reports" },
  { icon: Shield, label: "Defense" },
]

export function DashboardSidebar() {
  return (
    <aside className="w-64 border-r border-border bg-card">
      <div className="p-4">
        <div className="space-y-2">
          {navigationItems.map((item, index) => (
            <Button
              key={item.label}
              variant={item.active ? "default" : "ghost"}
              className="w-full justify-start"
              size="sm"
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
              {item.label === "Vulnerabilities" && (
                <Badge variant="destructive" className="ml-auto">
                  12
                </Badge>
              )}
              {item.label === "Reports" && (
                <Badge variant="secondary" className="ml-auto">
                  5
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <div className="mt-6 p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">System Status</span>
          </div>
          <div className="text-xs text-muted-foreground">All systems operational</div>
        </div>
      </div>
    </aside>
  )
}
