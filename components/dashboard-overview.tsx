import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, CheckCircle, Clock, Target, Zap, Bug } from "lucide-react"

export function DashboardOverview() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Active Scans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Scans</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground">+2 from last hour</p>
          <Progress value={75} className="mt-2" />
        </CardContent>
      </Card>

      {/* Vulnerabilities Found */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
          <Bug className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">12</div>
          <p className="text-xs text-muted-foreground">4 critical, 8 medium</p>
          <div className="flex space-x-1 mt-2">
            <Badge variant="destructive" className="text-xs">
              Critical
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Medium
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Targets Scanned */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Targets Scanned</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">Last 24 hours</p>
          <div className="flex items-center space-x-1 mt-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-xs text-muted-foreground">All completed</span>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">94%</div>
          <p className="text-xs text-muted-foreground">+5% from last week</p>
          <Progress value={94} className="mt-2" />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Port scan completed on 192.168.1.100</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
              <Badge variant="secondary">Completed</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Vulnerability scan started on example.com</p>
                <p className="text-xs text-muted-foreground">5 minutes ago</p>
              </div>
              <Badge variant="outline">In Progress</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-destructive rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Critical vulnerability found: SQL Injection</p>
                <p className="text-xs text-muted-foreground">12 minutes ago</p>
              </div>
              <Badge variant="destructive">Critical</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
