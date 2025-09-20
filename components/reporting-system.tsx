"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download, Share, Eye, Calendar, Clock, Target, AlertTriangle, Shield, BarChart3 } from "lucide-react"

interface ReportData {
  id: string
  title: string
  target: string
  date: string
  status: "draft" | "completed" | "exported"
  type: "executive" | "technical" | "compliance"
  findings: {
    critical: number
    high: number
    medium: number
    low: number
  }
  phases_completed: string[]
  executive_summary: string
  recommendations: string[]
}

export function ReportingSystem({ target }: { target: string }) {
  const [selectedReport, setSelectedReport] = useState<string>("current")
  const [reportFormat, setReportFormat] = useState("pdf")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  const mockReportData: ReportData = {
    id: "rpt-001",
    title: "RedStorm Security Assessment",
    target: target,
    date: new Date().toISOString().split("T")[0],
    status: "completed",
    type: "technical",
    findings: {
      critical: 2,
      high: 3,
      medium: 5,
      low: 8,
    },
    phases_completed: ["Reconnaissance", "Port Scanning", "Vulnerability Assessment", "Exploitation Simulation"],
    executive_summary:
      "The security assessment of " +
      target +
      " revealed multiple critical vulnerabilities that require immediate attention. The target system shows signs of outdated software components and insufficient security controls. While no actual exploitation was performed, simulation results indicate a high probability of successful compromise.",
    recommendations: [
      "Immediately patch Apache Log4j2 to version 2.15.0 or later",
      "Implement Web Application Firewall (WAF) protection",
      "Update all system components to latest security patches",
      "Implement network segmentation and access controls",
      "Establish continuous vulnerability monitoring",
      "Conduct regular security awareness training for staff",
    ],
  }

  const generateReport = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    const steps = [
      "Collecting scan data...",
      "Analyzing vulnerabilities...",
      "Generating executive summary...",
      "Creating technical details...",
      "Formatting report...",
      "Finalizing export...",
    ]

    for (let i = 0; i < steps.length; i++) {
      setGenerationProgress(((i + 1) / steps.length) * 100)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setIsGenerating(false)

    // Simulate file download
    const reportContent = generateReportContent(mockReportData)
    const blob = new Blob([reportContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `RedStorm_Report_${target}_${new Date().toISOString().split("T")[0]}.${reportFormat}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateReportContent = (data: ReportData) => {
    return `
REDSTORM SECURITY ASSESSMENT REPORT
====================================

Target: ${data.target}
Date: ${data.date}
Report Type: ${data.type.toUpperCase()}

EXECUTIVE SUMMARY
-----------------
${data.executive_summary}

VULNERABILITY SUMMARY
---------------------
Critical: ${data.findings.critical}
High: ${data.findings.high}
Medium: ${data.findings.medium}
Low: ${data.findings.low}

PHASES COMPLETED
----------------
${data.phases_completed.map((phase) => `✓ ${phase}`).join("\n")}

RECOMMENDATIONS
---------------
${data.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

DISCLAIMER
----------
This report was generated using RedStorm AI-powered security assessment tool.
All exploitation attempts were simulated and no actual attacks were performed.
This assessment is for authorized security testing purposes only.

Generated on: ${new Date().toLocaleString()}
    `.trim()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-500"
      case "high":
        return "text-orange-500"
      case "medium":
        return "text-yellow-500"
      case "low":
        return "text-blue-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Security Assessment Report</span>
            <Badge variant="outline">Phase 5</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select defaultValue="technical">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive Summary</SelectItem>
                  <SelectItem value="technical">Technical Report</SelectItem>
                  <SelectItem value="compliance">Compliance Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="html">HTML Report</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                  <SelectItem value="csv">CSV Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={generateReport} disabled={isGenerating} className="w-full flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>{isGenerating ? "Generating..." : "Generate Report"}</span>
              </Button>
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <Progress value={generationProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">{Math.round(generationProgress)}% complete</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Assessment Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Target:</span>
                  <span className="text-sm font-mono">{mockReportData.target}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Assessment Date:</span>
                  <span className="text-sm">{mockReportData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Report Status:</span>
                  <Badge variant="secondary">{mockReportData.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Phases Completed:</span>
                  <span className="text-sm">{mockReportData.phases_completed.length}/4</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Risk Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-sm">Critical</span>
                    </div>
                    <span className="text-sm font-bold">{mockReportData.findings.critical}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span className="text-sm">High</span>
                    </div>
                    <span className="text-sm font-bold">{mockReportData.findings.high}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span className="text-sm">Medium</span>
                    </div>
                    <span className="text-sm font-bold">{mockReportData.findings.medium}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm">Low</span>
                    </div>
                    <span className="text-sm font-bold">{mockReportData.findings.low}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={mockReportData.executive_summary} readOnly className="min-h-[120px] bg-muted" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>Critical Vulnerabilities</span>
                  <Badge variant="destructive">{mockReportData.findings.critical}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Apache Log4j2 RCE</span>
                      <Badge variant="destructive">CVE-2021-44228</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Remote code execution vulnerability in Log4j2 library affecting port 8080
                    </p>
                  </div>
                  <div className="p-3 border rounded border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Spring Framework RCE</span>
                      <Badge variant="destructive">CVE-2022-22965</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Spring4Shell vulnerability allowing remote code execution
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>High Risk Vulnerabilities</span>
                  <Badge variant="secondary">{mockReportData.findings.high}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">Windows Print Spooler Privilege Escalation</span>
                    <Badge variant="outline">CVE-2021-34527</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">Microsoft Outlook Privilege Escalation</span>
                    <Badge variant="outline">CVE-2023-23397</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">SSH Service Configuration Issue</span>
                    <Badge variant="outline">CONFIG-001</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReportData.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{recommendation}</p>
                    </div>
                    <Badge variant={index < 2 ? "destructive" : "secondary"} className="text-xs">
                      {index < 2 ? "Critical" : "Important"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Assessment Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReportData.phases_completed.map((phase, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{phase}</p>
                      <p className="text-xs text-muted-foreground">
                        Completed on {new Date(Date.now() - (3 - index) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">Completed</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Additional Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview Report
            </Button>
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share Report
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Re-test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
