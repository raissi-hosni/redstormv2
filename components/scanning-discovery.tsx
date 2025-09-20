"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Scan,
  Wifi,
  Server,
  Shield,
  Zap,
  Activity,
  Play,
  Pause,
  Settings,
  AlertTriangle,
  CheckCircle,
  Network,
} from "lucide-react"

interface PortScanResult {
  port: number
  service: string
  state: "open" | "closed" | "filtered"
  version?: string
  banner?: string
}

interface HostDiscovery {
  ip: string
  hostname?: string
  status: "up" | "down"
  os?: string
  ports: PortScanResult[]
}

export function ScanningDiscovery({ target }: { target: string }) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanType, setScanType] = useState("quick")
  const [progress, setProgress] = useState(0)
  const [currentPhase, setCurrentPhase] = useState("")
  const [hosts, setHosts] = useState<HostDiscovery[]>([])
  const [scanResults, setScanResults] = useState<PortScanResult[]>([])

  const scanTypes = {
    quick: { name: "Quick Scan", ports: "1-1000", time: "2-5 min" },
    comprehensive: { name: "Comprehensive", ports: "1-65535", time: "15-30 min" },
    stealth: { name: "Stealth Scan", ports: "1-1000", time: "5-10 min" },
    aggressive: { name: "Aggressive", ports: "1-10000", time: "10-15 min" },
  }

  const startScan = async () => {
    setIsScanning(true)
    setProgress(0)
    setHosts([])
    setScanResults([])

    const phases = ["Host Discovery", "Port Scanning", "Service Detection", "OS Fingerprinting", "Banner Grabbing"]

    // Simulate scanning phases
    for (let i = 0; i < phases.length; i++) {
      setCurrentPhase(phases[i])
      setProgress(((i + 1) / phases.length) * 100)

      // Add mock results during scanning
      if (i === 1) {
        // Port scanning phase
        const mockPorts: PortScanResult[] = [
          { port: 22, service: "SSH", state: "open", version: "OpenSSH 8.2", banner: "SSH-2.0-OpenSSH_8.2p1" },
          { port: 80, service: "HTTP", state: "open", version: "Apache 2.4.41", banner: "Apache/2.4.41 (Ubuntu)" },
          {
            port: 443,
            service: "HTTPS",
            state: "open",
            version: "Apache 2.4.41",
            banner: "Apache/2.4.41 (Ubuntu) OpenSSL/1.1.1f",
          },
          { port: 3306, service: "MySQL", state: "open", version: "MySQL 8.0.25" },
          { port: 21, service: "FTP", state: "filtered" },
          { port: 25, service: "SMTP", state: "closed" },
          { port: 53, service: "DNS", state: "open", version: "BIND 9.16.1" },
          { port: 8080, service: "HTTP-Alt", state: "open", version: "Jetty 9.4.43" },
        ]
        setScanResults(mockPorts)
      }

      if (i === 3) {
        // OS fingerprinting
        const mockHosts: HostDiscovery[] = [
          {
            ip: "192.168.1.100",
            hostname: "web-server.local",
            status: "up",
            os: "Ubuntu 20.04.3 LTS",
            ports: scanResults,
          },
        ]
        setHosts(mockHosts)
      }

      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    setIsScanning(false)
    setCurrentPhase("Scan Complete")
  }

  const getPortStatusColor = (state: string) => {
    switch (state) {
      case "open":
        return "text-green-500"
      case "closed":
        return "text-red-500"
      case "filtered":
        return "text-yellow-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getServiceRisk = (service: string, port: number) => {
    const highRisk = ["ftp", "telnet", "smtp", "mysql", "ssh"]
    const mediumRisk = ["http", "https", "dns"]

    if (highRisk.some((s) => service.toLowerCase().includes(s))) return "destructive"
    if (mediumRisk.some((s) => service.toLowerCase().includes(s))) return "secondary"
    return "outline"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scan className="h-5 w-5" />
            <span>Network Scanning & Discovery</span>
            <Badge variant="outline">Phase 2</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Scan Type</label>
              <Select value={scanType} onValueChange={setScanType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(scanTypes).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center justify-between w-full">
                        <span>{config.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {config.time}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end space-x-2">
              <Button onClick={startScan} disabled={isScanning} className="flex items-center space-x-2">
                <Play className="h-4 w-4" />
                <span>{isScanning ? "Scanning..." : "Start Scan"}</span>
              </Button>
              <Button variant="outline" disabled={!isScanning}>
                <Pause className="h-4 w-4" />
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Target: {target} | Ports: {scanTypes[scanType as keyof typeof scanTypes].ports} | Estimated time:{" "}
              {scanTypes[scanType as keyof typeof scanTypes].time}
            </p>
          </div>

          {isScanning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{currentPhase}</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {(scanResults.length > 0 || hosts.length > 0) && (
        <Tabs defaultValue="ports" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ports">Port Scan Results</TabsTrigger>
            <TabsTrigger value="hosts">Host Discovery</TabsTrigger>
            <TabsTrigger value="services">Service Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="ports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Network className="h-5 w-5" />
                    <span>Open Ports</span>
                  </div>
                  <Badge variant="secondary">{scanResults.filter((p) => p.state === "open").length} open</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scanResults.map((port, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-bold">{port.port}</span>
                        </div>
                        <div>
                          <p className="font-medium">{port.service}</p>
                          {port.version && <p className="text-xs text-muted-foreground">{port.version}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getServiceRisk(port.service, port.port) as any} className="text-xs">
                          {port.service === "SSH" || port.service === "MySQL"
                            ? "High Risk"
                            : port.service === "HTTP" || port.service === "HTTPS"
                              ? "Medium Risk"
                              : "Low Risk"}
                        </Badge>
                        <span className={`text-sm font-medium ${getPortStatusColor(port.state)}`}>
                          {port.state.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hosts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5" />
                  <span>Discovered Hosts</span>
                  <Badge variant="secondary">{hosts.length} active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hosts.map((host, index) => (
                  <div key={index} className="p-4 border rounded space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono font-bold">{host.ip}</p>
                        {host.hostname && <p className="text-sm text-muted-foreground">{host.hostname}</p>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">Online</span>
                      </div>
                    </div>

                    {host.os && (
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">OS: {host.os}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {host.ports.filter((p) => p.state === "open").length} open ports detected
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span>High Risk Services</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scanResults
                      .filter((port) => ["SSH", "MySQL", "FTP"].includes(port.service))
                      .map((port, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">
                              {port.service} ({port.port})
                            </p>
                            <p className="text-xs text-muted-foreground">{port.version}</p>
                          </div>
                          <Badge variant="destructive">Critical</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-accent" />
                    <span>Web Services</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scanResults
                      .filter((port) => ["HTTP", "HTTPS", "HTTP-Alt"].includes(port.service))
                      .map((port, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">
                              {port.service} ({port.port})
                            </p>
                            <p className="text-xs text-muted-foreground">{port.banner}</p>
                          </div>
                          <Badge variant="secondary">Web</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
