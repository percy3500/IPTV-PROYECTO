Add-Type -AssemblyName System.Drawing

function Generate-AppIcon($filePath, $size, $isLarge) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Dark gradient background
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 15, 23, 42),
        [System.Drawing.Color]::FromArgb(255, 2, 6, 23),
        45.0
    )
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Top Peruvian flag bar
    $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 220, 38, 38))
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    
    $accentHeight = [int]($size * 0.08)
    $w1 = [int]($size / 3)
    $g.FillRectangle($redBrush, 0, 0, $w1, $accentHeight)
    $g.FillRectangle($whiteBrush, $w1, 0, $w1, $accentHeight)
    $g.FillRectangle($redBrush, ($w1 * 2), 0, ($size - $w1 * 2), $accentHeight)

    # TV frame in red
    $framePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 225, 29, 72), [float]($size * 0.06))
    $margin = [float]($size * 0.16)
    $tvW = [float]($size - (2 * $margin))
    $tvH = [float]($size * 0.50)
    $tvY = [float]($margin + 4)
    $g.DrawRectangle($framePen, $margin, $tvY, $tvW, $tvH)

    # Text "PERU"
    $fontFamily = [System.Drawing.FontFamily]::GenericSansSerif
    $fontSize = if ($isLarge) { 17.0 } else { 11.0 }
    $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold)
    
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $textRect = New-Object System.Drawing.RectangleF($margin, $tvY, $tvW, $tvH)
    $g.DrawString("PERÚ", $font, $whiteBrush, $textRect, $sf)

    # Subtitle "IPTV" or "EN VIVO"
    $subFontSize = if ($isLarge) { 9.0 } else { 7.0 }
    $subFont = New-Object System.Drawing.Font($fontFamily, $subFontSize, [System.Drawing.FontStyle]::Bold)
    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 52, 211, 153))
    $subY = [float]($tvY + $tvH + 4)
    $subRect = New-Object System.Drawing.RectangleF([float]0.0, $subY, [float]$size, [float]($size - $subY))
    $g.DrawString("EN VIVO", $subFont, $subBrush, $subRect, $sf)

    $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Success: $filePath ($size x $size)"
}

Generate-AppIcon "icon.png" 80 $false
Generate-AppIcon "largeIcon.png" 130 $true
