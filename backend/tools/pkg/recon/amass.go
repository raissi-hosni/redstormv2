package recon

import (
    "context"
    "encoding/json"
    "fmt"
    "os/exec"
    "strings"
    "time"

    "github.com/spf13/cobra"
)

type AmassResult struct {
    Domain     string                 `json:"domain"`
    Subdomains []SubdomainInfo        `json:"subdomains"`
    Sources    map[string]int         `json:"sources"`
    Count      int                    `json:"count"`
    Timestamp  string                 `json:"timestamp"`
}

type SubdomainInfo struct {
    Name    string   `json:"name"`
    IPs     []string `json:"ips"`
    Sources []string `json:"sources"`
}

func NewAmassCommand() *cobra.Command {
    var domain string
    var passive bool
    var timeout int

    cmd := &cobra.Command{
        Use:   "amass",
        Short: "Advanced subdomain enumeration using Amass",
        Run: func(cmd *cobra.Command, args []string) {
            result := performAmassEnum(domain, passive, timeout)
            outputJSON(result)
        },
    }

    cmd.Flags().StringVarP(&domain, "domain", "d", "", "Target domain")
    cmd.Flags().BoolVarP(&passive, "passive", "p", true, "Passive enumeration only")
    cmd.Flags().IntVarP(&timeout, "timeout", "t", 300, "Timeout in seconds")
    cmd.MarkFlagRequired("domain")

    return cmd
}

func performAmassEnum(domain string, passive bool, timeout int) AmassResult {
    result := AmassResult{
        Domain:     domain,
        Subdomains: []SubdomainInfo{},
        Sources:    make(map[string]int),
        Timestamp:  time.Now().Format(time.RFC3339),
    }

    ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
    defer cancel()

    var cmd *exec.Cmd
    if passive {
        cmd = exec.CommandContext(ctx, "amass", "enum", "-passive", "-d", domain, "-json")
    } else {
        cmd = exec.CommandContext(ctx, "amass", "enum", "-active", "-d", domain, "-json", "-brute")
    }

    output, err := cmd.Output()
    if err != nil {
        // Add error handling to provide more information
        if exitError, ok := err.(*exec.ExitError); ok {
            // Create a subdomain entry with error information for debugging
            result.Subdomains = append(result.Subdomains, SubdomainInfo{
                Name:    fmt.Sprintf("Error running amass: %s", string(exitError.Stderr)),
                IPs:     []string{},
                Sources: []string{"error"},
            })
        } else {
            result.Subdomains = append(result.Subdomains, SubdomainInfo{
                Name:    fmt.Sprintf("Execution error: %v", err),
                IPs:     []string{},
                Sources: []string{"error"},
            })
        }
        return result
    }

    // Parse Amass JSON output
    lines := strings.Split(string(output), "\n")
    for _, line := range lines {
        if strings.TrimSpace(line) == "" {
            continue
        }

        var amassEntry map[string]interface{}
        if err := json.Unmarshal([]byte(line), &amassEntry); err != nil {
            continue
        }

        if name, ok := amassEntry["name"].(string); ok {
            subdomainInfo := SubdomainInfo{
                Name:    name,
                IPs:     []string{},
                Sources: []string{},
            }

            // Extract IP addresses
            if addresses, ok := amassEntry["addresses"].([]interface{}); ok {
                for _, addr := range addresses {
                    if addrMap, ok := addr.(map[string]interface{}); ok {
                        if ip, ok := addrMap["ip"].(string); ok {
                            subdomainInfo.IPs = append(subdomainInfo.IPs, ip)
                        }
                    }
                }
            }

            // Extract sources
            if sources, ok := amassEntry["sources"].([]interface{}); ok {
                for _, source := range sources {
                    if sourceStr, ok := source.(string); ok {
                        subdomainInfo.Sources = append(subdomainInfo.Sources, sourceStr)
                        result.Sources[sourceStr]++
                    }
                }
            }

            result.Subdomains = append(result.Subdomains, subdomainInfo)
        }
    }

    result.Count = len(result.Subdomains)
    return result
}

// Added the missing outputJSON function
func outputJSON(result interface{}) {
    jsonData, _ := json.MarshalIndent(result, "", "  ")
    fmt.Println(string(jsonData))
}