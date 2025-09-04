# Simple PowerShell HTTP Server for Mobile Testing
# Run this with: powershell -ExecutionPolicy Bypass -File mobile-server.ps1

param(
    [int]$Port = 8000,
    [string]$Directory = "."
)

$ErrorActionPreference = "Stop"

try {
    # Get local IP addresses
    $LocalIPs = @()
    Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -match "^192\.168\.|^10\.|^172\."} | ForEach-Object {
        $LocalIPs += $_.IPAddress
    }
    
    Write-Host "=== 5ive Trackr Mobile Test Server ===" -ForegroundColor Green
    Write-Host "Starting server on port $Port..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Local URLs:" -ForegroundColor Cyan
    Write-Host "  http://localhost:$Port" -ForegroundColor White
    foreach ($IP in $LocalIPs) {
        Write-Host "  http://${IP}:$Port" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "For your mobile device (IP: 192.168.4.199):" -ForegroundColor Magenta
    Write-Host "  Try: http://192.168.4.85:$Port/simple-test.html" -ForegroundColor Yellow
    Write-Host "  Try: http://192.168.4.212:$Port/simple-test.html" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
    Write-Host ""

    # Create HTTP listener
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://+:$Port/")
    
    try {
        $listener.Start()
        Write-Host "Server started successfully!" -ForegroundColor Green
        
        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "[$timestamp] ${request.HttpMethod} ${request.Url} from ${request.RemoteEndPoint}" -ForegroundColor Gray
            
            # Get requested file path
            $urlPath = $request.Url.AbsolutePath
            if ($urlPath -eq "/") { $urlPath = "/index.html" }
            
            $filePath = Join-Path $Directory $urlPath.TrimStart('/')
            
            if (Test-Path $filePath -PathType Leaf) {
                try {
                    $content = Get-Content $filePath -Raw -Encoding UTF8
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
                    
                    # Set content type
                    $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
                    switch ($extension) {
                        ".html" { $response.ContentType = "text/html; charset=utf-8" }
                        ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                        ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                        ".json" { $response.ContentType = "application/json; charset=utf-8" }
                        default { $response.ContentType = "text/plain; charset=utf-8" }
                    }
                    
                    # CORS headers
                    $response.Headers.Add("Access-Control-Allow-Origin", "*")
                    $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
                    $response.Headers.Add("Cache-Control", "no-cache")
                    
                    $response.ContentLength64 = $bytes.Length
                    $response.StatusCode = 200
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    
                    Write-Host "  -> 200 OK (${bytes.Length} bytes)" -ForegroundColor Green
                } catch {
                    Write-Host "  -> 500 Error reading file: $($_.Exception.Message)" -ForegroundColor Red
                    $response.StatusCode = 500
                    $errorBytes = [System.Text.Encoding]::UTF8.GetBytes("Internal Server Error")
                    $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
                }
            } else {
                Write-Host "  -> 404 Not Found: $filePath" -ForegroundColor Yellow
                $response.StatusCode = 404
                $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("File Not Found")
                $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
            }
            
            $response.OutputStream.Close()
        }
    } catch [System.Net.HttpListenerException] {
        if ($_.Exception.ErrorCode -eq 5) {
            Write-Host ""
            Write-Host "ERROR: Access denied. Please run as Administrator!" -ForegroundColor Red
            Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
        } else {
            Write-Host "HTTP Listener Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Server Error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
        Write-Host "Server stopped." -ForegroundColor Yellow
    }
}
