$urls = @{
    "Latina" = "https://redirector.rudo.video/hls-video/567ffde3fa319fadf3419efda25619456231dfea/latina/latina.smil/playlist.m3u8"
    "America" = "https://live-bd1.tv360.bitel.com.pe/manifest/america/master_clean_source.m3u8"
    "TVPeru" = "https://cablered.iptvperu.tv:1936/cablered/tvperu_new/playlist.m3u8"
    "Exitosa" = "https://luna-4-video.mediaserver.digital/exitosatv_233b-4b49-a726-5a451262/index.m3u8"
    "RPP" = "https://redirector.rudo.video/hls-video/567ffde3fa319fadf3419efda25619456231dfea/rpptv/rpptv.smil/playlist.m3u8"
}

foreach ($name in $urls.Keys) {
    Write-Host "================ $name ================"
    try {
        $curlOut = curl.exe -s -L -i "$($urls[$name])"
        Write-Host ($curlOut | Select-Object -First 30 | Out-String)
    } catch {
        Write-Host "Curl error: $_"
    }
}
