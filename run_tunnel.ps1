# Keep-alive loop for localtunnel with a fixed subdomain
$subdomain = "boardingpass-prank"
while ($true) {
    Write-Host "Starting tunnel on port 8080 with subdomain '$subdomain'..."
    npx -y localtunnel --port 8080 --subdomain $subdomain
    Write-Host "Tunnel disconnected. Re-establishing connection in 5 seconds..."
    Start-Sleep -Seconds 5
}
