$hosts = @{
    "TVPeru" = "cablered.iptvperu.tv:1936"
    "LatinaRedirector" = "redirector.rudo.video:443"
    "LatinaTarget" = "jireh-7-hls-video-us-isp.dps.live:443"
    "America" = "live-bd1.tv360.bitel.com.pe:443"
    "Exitosa" = "luna-4-video.mediaserver.digital:443"
}

foreach ($name in $hosts.Keys) {
    Write-Host "================ SSL Check: $name ($($hosts[$name])) ================"
    $parts = $hosts[$name].Split(':')
    $h = $parts[0]
    $p = [int]$parts[1]
    
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient($h, $p)
        $ssl = New-Object System.Net.Security.SslStream($tcp.GetStream(), $false, ({$true}))
        # Test TLS 1.0, 1.1, 1.2
        $ssl.AuthenticateAsClient($h)
        Write-Host "SSL Protocol: $($ssl.SslProtocol)"
        Write-Host "Cipher: $($ssl.CipherAlgorithm) ($($ssl.CipherStrength) bits)"
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($ssl.RemoteCertificate)
        Write-Host "Subject: $($cert.Subject)"
        Write-Host "Issuer: $($cert.Issuer)"
        Write-Host "NotBefore: $($cert.NotBefore) - NotAfter: $($cert.NotAfter)"
        $ssl.Close()
        $tcp.Close()
    } catch {
        Write-Host "SSL Handshake Error: $_"
    }
}
