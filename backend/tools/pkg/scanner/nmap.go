package scanner

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/Ullaakut/nmap/v3"
    "github.com/spf13/cobra"
)

type NmapResult struct {
    Host     string      `json:"host"`
    Ports    []PortInfo  `json:"ports"`
    OS       string      `json:"os"`
    Services []Service   `json:"services"`
}

type PortInfo struct {
    Port     int    `json:"port"`
    Protocol string `json:"protocol"`
    State    string `json:"state"`
    Service  string `json:"service"`
    Version  string `json:"version"`
}

type Service struct {
    Name    string `json:"name"`
    Version string `json:"version"`
    Banner  string `json:"banner"`
}

func NewScanCommand() *cobra.Command {
    var target string
    var ports string
    var scanType string

    cmd := &cobra.Command{
        Use:   "scan",
        Short: "Network scanning with Nmap",
        Run: func(cmd *cobra.Command, args []string) {
            result := performNmapScan(target, ports, scanType)
            outputJSON(result)
        },
    }

    cmd.Flags().StringVarP(&target, "target", "t", "", "Target IP or domain")
    cmd.Flags().StringVarP(&ports, "ports", "p", "1-1000", "Port range to scan")
    cmd.Flags().StringVarP(&scanType, "type", "s", "syn", "Scan type (syn, tcp, udp)")
    cmd.MarkFlagRequired("target")

    return cmd
}

func performNmapScan(target, ports, scanType string) NmapResult {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
    defer cancel()

    // Prepare scanner options
    options := []nmap.Option{
        nmap.WithTargets(target),
        nmap.WithPorts(ports),
        nmap.WithServiceInfo(),
        nmap.WithOSDetection(),
    }

    // Add scan type specific options
    switch scanType {
    case "syn":
        options = append(options, nmap.WithSYNScan())
    case "tcp":
        options = append(options, nmap.WithConnectScan())
    case "udp":
        options = append(options, nmap.WithUDPScan())
    }

    // Configure Nmap scanner with context as first parameter
    scanner, err := nmap.NewScanner(ctx, options...)
    if err != nil {
        return NmapResult{
            Host:     target,
            Ports:    []PortInfo{},
            Services: []Service{},
        }
    }

    result, _, err := scanner.Run()
    if err != nil {
        return NmapResult{
            Host:     target,
            Ports:    []PortInfo{},
            Services: []Service{},
        }
    }

    // Parse results
    nmapResult := NmapResult{
        Host:     target,
        Ports:    []PortInfo{},
        Services: []Service{},
    }

    for _, host := range result.Hosts {
        if len(host.Ports) == 0 || len(host.Addresses) == 0 {
            continue
        }

        for _, port := range host.Ports {
            portInfo := PortInfo{
                Port:     int(port.ID),
                Protocol: port.Protocol,
                State:    string(port.State.State),
                Service:  port.Service.Name,
                Version:  port.Service.Version,
            }
            nmapResult.Ports = append(nmapResult.Ports, portInfo)

            // Add service information
            if port.Service.Name != "" {
                service := Service{
                    Name:    port.Service.Name,
                    Version: port.Service.Version,
                    Banner:  port.Service.Product + " " + port.Service.Version,
                }
                nmapResult.Services = append(nmapResult.Services, service)
            }
        }

        // Extract OS information
        if len(host.OS.Matches) > 0 {
            nmapResult.OS = host.OS.Matches[0].Name
        }
    }

    return nmapResult
}

func outputJSON(result interface{}) {
    jsonData, _ := json.MarshalIndent(result, "", "  ")
    fmt.Println(string(jsonData))
}