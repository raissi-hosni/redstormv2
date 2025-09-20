package recon

import (
    "strings"
    "time"

    "github.com/likexian/whois"
    "github.com/spf13/cobra"
)

type WhoisResult struct {
    Domain         string    `json:"domain"`
    Registrar      string    `json:"registrar"`
    CreationDate   string    `json:"creation_date"`
    ExpirationDate string    `json:"expiration_date"`
    UpdatedDate    string    `json:"updated_date"`
    NameServers    []string  `json:"name_servers"`
    Status         []string  `json:"status"`
    Contacts       Contacts  `json:"contacts"`
    DNSSEC         string    `json:"dnssec"`
}

type Contacts struct {
    Registrant Contact `json:"registrant"`
    Admin      Contact `json:"admin"`
    Tech       Contact `json:"tech"`
}

type Contact struct {
    Name         string `json:"name"`
    Organization string `json:"organization"`
    Email        string `json:"email"`
    Phone        string `json:"phone"`
    Country      string `json:"country"`
}

func NewWhoisCommand() *cobra.Command {
    var domain string

    cmd := &cobra.Command{
        Use:   "whois",
        Short: "WHOIS domain information lookup",
        Run: func(cmd *cobra.Command, args []string) {
            result := performWhoisLookup(domain)
            outputJSON(result)
        },
    }

    cmd.Flags().StringVarP(&domain, "domain", "d", "", "Domain to lookup")
    cmd.MarkFlagRequired("domain")

    return cmd
}

func performWhoisLookup(domain string) WhoisResult {
    result := WhoisResult{
        Domain:      domain,
        NameServers: []string{},
        Status:      []string{},
        Contacts:    Contacts{},
    }

    // Perform WHOIS lookup
    whoisResult, err := whois.Whois(domain)
    if err != nil {
        return result
    }

    // Parse WHOIS data (simplified parsing)
    lines := strings.Split(whoisResult, "\n")
    
    for _, line := range lines {
        line = strings.TrimSpace(line)
        if line == "" {
            continue
        }

        parts := strings.SplitN(line, ":", 2)
        if len(parts) != 2 {
            continue
        }

        key := strings.TrimSpace(strings.ToLower(parts[0]))
        value := strings.TrimSpace(parts[1])

        switch {
        case strings.Contains(key, "registrar"):
            if result.Registrar == "" {
                result.Registrar = value
            }
        case strings.Contains(key, "creation") || strings.Contains(key, "created"):
            if result.CreationDate == "" {
                result.CreationDate = parseDate(value)
            }
        case strings.Contains(key, "expir"):
            if result.ExpirationDate == "" {
                result.ExpirationDate = parseDate(value)
            }
        case strings.Contains(key, "updated") || strings.Contains(key, "modified"):
            if result.UpdatedDate == "" {
                result.UpdatedDate = parseDate(value)
            }
        case strings.Contains(key, "name server") || strings.Contains(key, "nserver"):
            if value != "" && !contains(result.NameServers, value) {
                result.NameServers = append(result.NameServers, value)
            }
        case strings.Contains(key, "status"):
            if value != "" && !contains(result.Status, value) {
                result.Status = append(result.Status, value)
            }
        case strings.Contains(key, "dnssec"):
            result.DNSSEC = value
        }
    }

    return result
}

func parseDate(dateStr string) string {
    // Try to parse common date formats
    formats := []string{
        "2006-01-02T15:04:05Z",
        "2006-01-02 15:04:05",
        "2006-01-02",
        "02-Jan-2006",
        "2006.01.02",
    }

    for _, format := range formats {
        if t, err := time.Parse(format, dateStr); err == nil {
            return t.Format("2006-01-02")
        }
    }

    return dateStr
}

func contains(slice []string, item string) bool {
    for _, s := range slice {
        if s == item {
            return true
        }
    }
    return false
}
