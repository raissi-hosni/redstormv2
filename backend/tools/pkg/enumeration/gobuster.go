package enumeration

import (
    "bufio"
    "context"
    "encoding/json"
    "fmt"
    "os/exec"
    "strings"
    "time"

    "github.com/spf13/cobra"
)

type GobusterResult struct {
    Target      string           `json:"target"`
    Directories []DirectoryInfo  `json:"directories"`
    Files       []FileInfo       `json:"files"`
    Status      string           `json:"status"`
}

type DirectoryInfo struct {
    Path       string `json:"path"`
    StatusCode int    `json:"status_code"`
    Size       int64  `json:"size"`
    Redirect   string `json:"redirect,omitempty"`
}

type FileInfo struct {
    Path       string `json:"path"`
    StatusCode int    `json:"status_code"`
    Size       int64  `json:"size"`
    Extension  string `json:"extension"`
}

func NewEnumCommand() *cobra.Command {
    var target string
    var wordlist string
    var extensions string
    var threads int

    cmd := &cobra.Command{
        Use:   "enum",
        Short: "Directory and file enumeration",
        Run: func(cmd *cobra.Command, args []string) {
            result := performGobusterScan(target, wordlist, extensions, threads)
            outputJSON(result)
        },
    }

    cmd.Flags().StringVarP(&target, "target", "t", "", "Target URL")
    cmd.Flags().StringVarP(&wordlist, "wordlist", "w", "/usr/share/wordlists/dirb/common.txt", "Wordlist file")
    cmd.Flags().StringVarP(&extensions, "extensions", "x", "php,html,js,txt", "File extensions")
    cmd.Flags().IntVarP(&threads, "threads", "T", 10, "Number of threads")
    cmd.MarkFlagRequired("target")

    return cmd
}

func performGobusterScan(target, wordlist, extensions string, threads int) GobusterResult {
    result := GobusterResult{
        Target:      target,
        Directories: []DirectoryInfo{},
        Files:       []FileInfo{},
        Status:      "running",
    }

    // Prepare gobuster command
    args := []string{
        "dir",
        "-u", target,
        "-w", wordlist,
        "-x", extensions,
        "-t", fmt.Sprintf("%d", threads),
        "-q", // Quiet mode
        "--no-error",
    }

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
    defer cancel()

    cmd := exec.CommandContext(ctx, "gobuster", args...)
    
    stdout, err := cmd.StdoutPipe()
    if err != nil {
        result.Status = "error"
        return result
    }

    if err := cmd.Start(); err != nil {
        result.Status = "error"
        return result
    }

    scanner := bufio.NewScanner(stdout)
    for scanner.Scan() {
        line := strings.TrimSpace(scanner.Text())
        if line == "" {
            continue
        }

        // Parse gobuster output
        if strings.Contains(line, "(Status:") {
            parts := strings.Fields(line)
            if len(parts) >= 3 {
                path := parts[0]
                statusStr := strings.Trim(strings.Split(parts[1], ":")[1], ")")
                
                // Determine if it's a directory or file
                if strings.HasSuffix(path, "/") {
                    result.Directories = append(result.Directories, DirectoryInfo{
                        Path:       path,
                        StatusCode: parseStatusCode(statusStr),
                        Size:       0,
                    })
                } else {
                    ext := ""
                    if dotIndex := strings.LastIndex(path, "."); dotIndex != -1 {
                        ext = path[dotIndex+1:]
                    }
                    
                    result.Files = append(result.Files, FileInfo{
                        Path:       path,
                        StatusCode: parseStatusCode(statusStr),
                        Size:       0,
                        Extension:  ext,
                    })
                }
            }
        }
    }

    cmd.Wait()
    result.Status = "completed"
    return result
}

func parseStatusCode(statusStr string) int {
    // Simple status code parsing
    switch statusStr {
    case "200":
        return 200
    case "301":
        return 301
    case "302":
        return 302
    case "403":
        return 403
    case "404":
        return 404
    default:
        return 0
    }
}

func outputJSON(result interface{}) {
    jsonData, _ := json.MarshalIndent(result, "", "  ")
    fmt.Println(string(jsonData))
}
