package recon

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"path/filepath"
	"io/ioutil"

	"github.com/spf13/cobra"
)

type SubdomainResult struct {
	Domain     string   `json:"domain"`
	Subdomains []string `json:"subdomains"`
	Count      int      `json:"count"`
}

func NewReconCommand() *cobra.Command {
	var domain string
	var passive bool

	cmd := &cobra.Command{
		Use:   "recon",
		Short: "Reconnaissance and OSINT gathering",
		Run: func(cmd *cobra.Command, args []string) {
			result := performSubdomainEnum(domain, passive)
			outputJSON(result) // uses the shared function from amass.go
		},
	}

	cmd.Flags().StringVarP(&domain, "domain", "d", "", "Target domain")
	cmd.Flags().BoolVarP(&passive, "passive", "p", true, "Passive reconnaissance only")
	_ = cmd.MarkFlagRequired("domain")

	return cmd
}

func performSubdomainEnum(domain string, passive bool) SubdomainResult {
	res := SubdomainResult{Domain: domain}

	// Check if subfinder is installed
	if !isSubfinderInstalled() {
		res.Subdomains = []string{"error: subfinder not installed or not in PATH"}
		return res
	}

	// Create temporary output file
	tmpDir, err := ioutil.TempDir("", "subfinder-")
	if err != nil {
		res.Subdomains = []string{fmt.Sprintf("temp-dir-error: %v", err)}
		return res
	}
	defer os.RemoveAll(tmpDir)

	outputFile := filepath.Join(tmpDir, "results.txt")

	// Build subfinder command
	args := []string{
		"-d", domain,
		"-o", outputFile,
		"-silent", // Only output subdomains
		"-timeout", "30",
		"-max-time", "10",
	}

	// Configure sources based on passive flag
	if passive {
		// Use specific passive sources
		sources := []string{"crtsh", "virustotal", "shodan", "hackertarget", "censys"}
		args = append(args, "-s", strings.Join(sources, ","))
	} else {
		// Use all sources
		args = append(args, "-all")
	}

	// Execute subfinder command
	cmd := exec.Command("subfinder", args...)
	
	// Capture stderr for error messages
	stderr, err := cmd.StderrPipe()
	if err != nil {
		res.Subdomains = []string{fmt.Sprintf("stderr-pipe-error: %v", err)}
		return res
	}

	// Start the command
	if err := cmd.Start(); err != nil {
		res.Subdomains = []string{fmt.Sprintf("start-error: %v", err)}
		return res
	}

	// Read any error output
	stderrScanner := bufio.NewScanner(stderr)
	var errorMessages []string
	go func() {
		for stderrScanner.Scan() {
			errorMessages = append(errorMessages, stderrScanner.Text())
		}
	}()

	// Wait for command to finish
	if err := cmd.Wait(); err != nil {
		if len(errorMessages) > 0 {
			res.Subdomains = []string{fmt.Sprintf("exec-error: %v, stderr: %s", err, strings.Join(errorMessages, "; "))}
		} else {
			res.Subdomains = []string{fmt.Sprintf("exec-error: %v", err)}
		}
		return res
	}

	// Read results from output file
	if _, err := os.Stat(outputFile); os.IsNotExist(err) {
		res.Subdomains = []string{"no results found - check if domain exists or sources are accessible"}
		return res
	}

	content, err := ioutil.ReadFile(outputFile)
	if err != nil {
		res.Subdomains = []string{fmt.Sprintf("read-error: %v", err)}
		return res
	}

	// Parse results
	lines := strings.Split(strings.TrimSpace(string(content)), "\n")
	seen := make(map[string]bool)

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" && strings.Contains(line, ".") && !strings.HasPrefix(line, "#") {
			// Basic validation for domain format
			if isValidDomain(line) && !seen[line] {
				res.Subdomains = append(res.Subdomains, line)
				seen[line] = true
			}
		}
	}

	res.Count = len(res.Subdomains)
	
	// Add warning messages if any
	if len(errorMessages) > 0 {
		res.Subdomains = append(res.Subdomains, fmt.Sprintf("warnings: %s", strings.Join(errorMessages, "; ")))
	}

	return res
}

// isSubfinderInstalled checks if subfinder is available in PATH
func isSubfinderInstalled() bool {
	_, err := exec.LookPath("subfinder")
	return err == nil
}

// isValidDomain performs basic domain validation
func isValidDomain(domain string) bool {
	if len(domain) == 0 || len(domain) > 253 {
		return false
	}
	
	// Basic checks
	if strings.Contains(domain, " ") || strings.Contains(domain, "\t") {
		return false
	}
	
	// Must contain at least one dot
	if !strings.Contains(domain, ".") {
		return false
	}
	
	// Should not start or end with dot or hyphen
	if strings.HasPrefix(domain, ".") || strings.HasSuffix(domain, ".") ||
		strings.HasPrefix(domain, "-") || strings.HasSuffix(domain, "-") {
		return false
	}
	
	return true
}

// Alternative function using subfinder with JSON output
func performSubdomainEnumJSON(domain string, passive bool) SubdomainResult {
	res := SubdomainResult{Domain: domain}

	if !isSubfinderInstalled() {
		res.Subdomains = []string{"error: subfinder not installed or not in PATH"}
		return res
	}

	// Build command with JSON output
	args := []string{
		"-d", domain,
		"-oJ", // JSON output
		"-silent",
		"-timeout", "30",
		"-max-time", "10",
	}

	if passive {
		sources := []string{"crtsh", "virustotal", "shodan", "hackertarget"}
		args = append(args, "-s", strings.Join(sources, ","))
	} else {
		args = append(args, "-all")
	}

	// Execute command and capture output
	cmd := exec.Command("subfinder", args...)
	output, err := cmd.Output()
	if err != nil {
		res.Subdomains = []string{fmt.Sprintf("exec-error: %v", err)}
		return res
	}

	// Parse JSON lines output
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	seen := make(map[string]bool)

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			// For JSON output, we'd need to parse JSON, but for simplicity
			// we can also just extract domains if they're in plain format
			if strings.Contains(line, domain) && isValidDomain(line) && !seen[line] {
				res.Subdomains = append(res.Subdomains, line)
				seen[line] = true
			}
		}
	}

	res.Count = len(res.Subdomains)
	return res
}