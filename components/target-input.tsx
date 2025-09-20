"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, Play, Globe, Server, Shield, AlertCircle, CheckCircle } from "lucide-react"

export function TargetInput() {
  const [target, setTarget] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<"idle" | "valid" | "invalid">("idle")

  const handleValidate = async () => {
    if (!target) return

    setIsValidating(true)
    // Simulate validation
    setTimeout(() => {
      setValidationStatus(target.includes(".") ? "valid" : "invalid")
      setIsValidating(false)
    }, 1500)
  }

  const handleStartScan = () => {
    console.log("[v0] Starting scan for target:", target)
    // This would trigger the reconnaissance phase
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Target Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              placeholder="Enter target URL or IP address (e.g., example.com, 192.168.1.1)"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value)
                setValidationStatus("idle")
              }}
              className="font-mono"
            />
          </div>
          <Button onClick={handleValidate} disabled={!target || isValidating} variant="outline">
            {isValidating ? "Validating..." : "Validate"}
          </Button>
        </div>

        {validationStatus !== "idle" && (
          <div className="flex items-center space-x-2">
            {validationStatus === "valid" ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Target is reachable</span>
                <Badge variant="secondary">
                  <Globe className="h-3 w-3 mr-1" />
                  Web Server
                </Badge>
                <Badge variant="outline">
                  <Shield className="h-3 w-3 mr-1" />
                  Firewall Detected
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">Invalid target or unreachable</span>
              </>
            )}
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            onClick={handleStartScan}
            disabled={validationStatus !== "valid"}
            className="flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Start Reconnaissance</span>
          </Button>
          <Button variant="outline">
            <Server className="h-4 w-4 mr-2" />
            Advanced Options
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>⚠️ Only scan targets you own or have explicit permission to test.</p>
          <p>RedStorm operates in simulation mode for ethical security testing.</p>
        </div>
      </CardContent>
    </Card>
  )
}
