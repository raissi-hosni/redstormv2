package preengagement

import (
    "context"
    "encoding/json"
    "fmt"
    "os/exec"
    "strings"
    "time"

    "github.com/spf13/cobra"
    "github.com/Ullaakut/nmap/v3"
)

type AvailabilityResult struct {
    Target        string            `json:"target"`
    IsAvailable   bool              `json:"is_available"`
    ResponseTime  float64           `json:"response_time_ms"`
    FirewallRules map[string]string `json:"firewall_rules"`
    Methods       []string          `json:"methods_used"`
    Timestamp     string            `json:"timestamp"`
}

func NewPreEngagementCommand() *cobra.Command {
    var target string
    var timeout int

    cmd := &cobra.Command{
        Use:   "preengagement",
        Short: "Pre-engagement planning and target availability testing",
        Run: func(cmd *cobra.Command, args []string) {
            result := performAvailabilityTest(target, timeout)
            outputJSON(result)
        },
    }

    cmd.Flags().StringVarP(&target, "target", "t", "", "Target IP or domain")
    cmd.Flags().IntVarP(&timeout, "timeout", "T", 30, "Timeout in seconds")
    cmd.MarkFlagRequired("target")

    return cmd
}

func performAvailabilityTest(target string, timeout int) AvailabilityResult {
    result := AvailabilityResult{
        Target:        target,
        IsAvailable:   false,
        FirewallRules: make(map[string]string),
        Methods:       []string{},
        Timestamp:     time.Now().Format(time.RFC3339),
    }

    if fpingAvailable := testWithFping(target); fpingAvailable {
        result.IsAvailable = true
        result.Methods = append(result.Methods, "fping")
    }

    firewallRules := testFirewallWithHping3(target)
    result.FirewallRules = firewallRules
    if len(firewallRules) > 0 {
        result.Methods = append(result.Methods, "hping3")
    }

    nmapResults := testWithNmap(target, timeout)
    if nmapResults["available"] == "true" {
        result.IsAvailable = true
        result.Methods = append(result.Methods, "nmap")
    }
    
    // Merge firewall rules from nmap
    for k, v := range nmapResults {
        if k != "available" {
            result.FirewallRules[k] = v
        }
    }

    return result
}

func testWithFping(target string) bool {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    cmd := exec.CommandContext(ctx, "fping", "-c", "3", "-q", target)
    err := cmd.Run()
    return err == nil
}

func testFirewallWithHping3(target string) map[string]string {
    rules := make(map[string]string)
    
    // Test common firewall detection techniques
    tests := map[string][]string{
        "tcp_syn":    {"hping3", "-S", "-p", "80", "-c", "3", target},
        "tcp_fin":    {"hping3", "-F", "-p", "80", "-c", "3", target},
        "tcp_ack":    {"hping3", "-A", "-p", "80", "-c", "3", target},
        "icmp_ping":  {"hping3", "-1", "-c", "3", target},
    }

    for testName, cmdArgs := range tests {
        ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
        cmd := exec.CommandContext(ctx, cmdArgs[0], cmdArgs[1:]...)
        output, err := cmd.CombinedOutput()
        cancel()

        if err != nil {
            rules[testName] = "blocked"
        } else {
            outputStr := string(output)
            if strings.Contains(outputStr, "100% packet loss") {
                rules[testName] = "filtered"
            } else if strings.Contains(outputStr, "0% packet loss") {
                rules[testName] = "open"
            } else {
                rules[testName] = "partial"
            }
        }
    }

    return rules
}

func testWithNmap(target string, timeout int) map[string]string {
    results := make(map[string]string)
    
    ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
    defer cancel()

    // Updated nmap API - correct way to create scanner
    scanner, err := nmap.NewScanner(ctx,
        nmap.WithTargets(target),
        nmap.WithPorts("22,80,443"),
        nmap.WithServiceInfo(),
        nmap.WithScripts("firewall-bypass", "firewalk"),
        nmap.WithTimingTemplate(nmap.TimingAggressive),
    )

    if err != nil {
        results["available"] = "false"
        results["error"] = fmt.Sprintf("Scanner creation failed: %v", err)
        return results
    }

    nmapResult, _, err := scanner.Run()
    if err != nil {
        results["available"] = "false"
        results["error"] = fmt.Sprintf("Scan failed: %v", err)
        return results
    }

    if len(nmapResult.Hosts) > 0 {
        host := nmapResult.Hosts[0]
        results["available"] = "true"
        
        // Analyze firewall behavior
        for _, port := range host.Ports {
            portKey := fmt.Sprintf("port_%d", port.ID)
            results[portKey] = string(port.State.State)
        }

        // Add host state information
        results["host_state"] = string(host.Status.State)
        
        // Add OS detection if available
        if len(host.OS.Matches) > 0 {
            results["os_detection"] = host.OS.Matches[0].Name
        }
    } else {
        results["available"] = "false"
        results["reason"] = "No hosts found"
    }

    return results
}

func outputJSON(result interface{}) {
    jsonData, _ := json.MarshalIndent(result, "", "  ")
    fmt.Println(string(jsonData))
}