$urls = [ordered]@{
    "Latina" = "https://redirector.rudo.video/hls-video/567ffde3fa319fadf3419efda25619456231dfea/latina/latina.smil/playlist.m3u8"
    "America" = "https://live-bd1.tv360.bitel.com.pe/manifest/america/master_clean_source.m3u8"
    "TVPeru" = "https://cablered.iptvperu.tv:1936/cablered/tvperu_new/playlist.m3u8"
    "Exitosa" = "https://luna-4-video.mediaserver.digital/exitosatv_233b-4b49-a726-5a451262/index.m3u8"
    "RPP" = "https://redirector.rudo.video/hls-video/567ffde3fa319fadf3419efda25619456231dfea/rpptv/rpptv.smil/playlist.m3u8"
}

foreach ($item in $urls.GetEnumerator()) {
    Write-Host "================ Testing $($item.Key) ================"
    Write-Host "URL: $($item.Value)"
    try {
        $resp = Invoke-WebRequest -Uri $item.Value -Method Head -TimeoutSec 7 -UserAgent "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.122 Safari/537.36 WebAppManager" -UseBasicParsing -ErrorAction Stop
        Write-Host "Status: $($resp.StatusCode)"
        Write-Host "ContentType: $($resp.Headers['Content-Type'])"
        Write-Host "Access-Control-Allow-Origin: $($resp.Headers['Access-Control-Allow-Origin'])"
    } catch {
        Write-Host "HEAD request failed: $($_.Exception.Message)"
        try {
            $resp2 = Invoke-WebRequest -Uri $item.Value -Method Get -TimeoutSec 7 -UserAgent "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.122 Safari/537.36 WebAppManager" -UseBasicParsing -ErrorAction Stop
            Write-Host "GET Status: $($resp2.StatusCode)"
            Write-Host "ContentType: $($resp2.Headers['Content-Type'])"
            Write-Host "Access-Control-Allow-Origin: $($resp2.Headers['Access-Control-Allow-Origin'])"
            Write-Host "First 150 chars: $($resp2.Content.Substring(0, [Math]::Min(150, $resp2.Content.Length)))"
        } catch {
            Write-Host "GET request also failed: $($_.Exception.Message)"
        }
    }
}
