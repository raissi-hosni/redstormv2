"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Globe,
  Server,
  Shield,
  Eye,
  Database,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
} from "lucide-react"

interface ReconData {
  domain: string
  subdomains: string[]
  technologies: string[]
  certificates: any[]
  whoisData: any
  dnsRecords: any[]
  socialMedia: string[]
  employees: string[]
}

export function ReconnaissancePhase({ target }: { target: string }) {
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentPhase, setCurrentPhase] = useState("")
  const [reconData, setReconData] = useState<ReconData | null>(null)

  const phases = [
    "DNS Enumeration",
    "Subdomain Discovery",
    "Technology Fingerprinting",
    "Certificate Analysis",
    "WHOIS Lookup",
    "Social Media Intelligence",
    "Employee Enumeration",
  ]

  const startReconnaissance = async () => {
    setIsScanning(true)
    setProgress(0)

    // Simulate reconnaissance phases
    for (let i = 0; i < phases.length; i++) {
      setCurrentPhase(phases[i])
      setProgress(((i + 1) / phases.length) * 100)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    // Mock data after completion
    setReconData({
      domain: target,
      subdomains: ["www.example.com", "api.example.com", "admin.example.com", "mail.example.com"],
      technologies: ["Apache/2.4.41", "PHP/7.4.3", "MySQL", "WordPress 5.8", "jQuery 3.6.0"],
      certificates: [{ issuer: "Let's Encrypt", expires: "2024-12-15", san: ["example.com", "*.example.com"] }],
      whoisData: {
        registrar: "GoDaddy",
        created: "2015-03-12",
        expires: "2025-03-12",
        nameservers: ["ns1.example.com", "ns2.example.com"],
      },
      dnsRecords: [
        { type: "A", value: "192.168.1.100" },
        { type: "MX", value: "mail.example.com" },
        { type: "TXT", value: "v=spf1 include:_spf.google.com ~all" },
      ],
      socialMedia: ["LinkedIn: company-page", "Twitter: @company"],
      employees: ["john.doe@example.com", "jane.smith@example.com", "admin@example.com"],
    })

    setIsScanning(false)
    setCurrentPhase("Complete")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>OSINT Reconnaissance</span>
            <Badge variant="outline">Phase 1</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Target: {target}</p>
              {isScanning && <p className="text-sm font-medium text-primary">Current: {currentPhase}</p>}
            </div>
            <Button onClick={startReconnaissance} disabled={isScanning} className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>{isScanning ? "Scanning..." : "Start Reconnaissance"}</span>
            </Button>
          </div>

          {isScanning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
            </div>
          )}
        </CardContent>
      </Card>

      {reconData && (
        <Tabs defaultValue="subdomains" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="subdomains">Subdomains</TabsTrigger>
            <TabsTrigger value="technology">Technology</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          </TabsList>

          <TabsContent value="subdomains" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Subdomain Discovery</span>
                  <Badge variant="secondary">{reconData.subdomains.length} found</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {reconData.subdomains.map((subdomain, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{subdomain}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Active</Badge>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technology" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Technology Stack</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {reconData.technologies.map((tech, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{tech}</span>
                      <div className="flex items-center space-x-2">
                        {tech.includes("WordPress") && <Badge variant="destructive">High Risk</Badge>}
                        {tech.includes("Apache") && <Badge variant="secondary">Web Server</Badge>}
                        {tech.includes("PHP") && <Badge variant="outline">Backend</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>SSL/TLS Certificates</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reconData.certificates.map((cert, index) => (
                  <div key={index} className="p-4 border rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Issuer: {cert.issuer}</span>
                      <Badge variant="secondary">Valid</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Expires: {cert.expires}</p>
                      <p>SAN: {cert.san.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Info className="h-5 w-5" />
                    <span>WHOIS Data</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <p>
                      <strong>Registrar:</strong> {reconData.whoisData.registrar}
                    </p>
                    <p>
                      <strong>Created:</strong> {reconData.whoisData.created}
                    </p>
                    <p>
                      <strong>Expires:</strong> {reconData.whoisData.expires}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Social Intelligence</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reconData.socialMedia.map((social, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{social}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                  <span>Email Addresses Found</span>
                  <Badge variant="destructive">{reconData.employees.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {reconData.employees.map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{email}</span>
                      <Badge variant="outline">Potential Target</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
