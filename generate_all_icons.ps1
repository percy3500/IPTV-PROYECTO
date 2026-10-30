Add-Type -AssemblyName System.Drawing

# ============================================================
# 1. GENERAR ICONOS DE LA APLICACIÓN: PERCY TV (icon.png y largeIcon.png)
# ============================================================
function Generate-AppIcon($filePath, $size, $isLarge) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Fondo degradado moderno Magenta -> Morado oscuro
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 30, 6, 45),     # Morado profundo
        [System.Drawing.Color]::FromArgb(255, 12, 3, 20),     # Casi negro violeta
        45.0
    )
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Marco exterior brillante con gradiente magenta a violeta
    $margin = [float]($size * 0.08)
    $innerSize = [float]($size - (2 * $margin))
    $frameRect = New-Object System.Drawing.RectangleF($margin, $margin, $innerSize, $innerSize)
    $framePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 225, 29, 140), [float]($size * 0.04))
    $g.DrawRectangle($framePen, $margin, $margin, $innerSize, $innerSize)

    # Resplandor de pantalla de TV moderna
    $tvMarginX = [float]($size * 0.14)
    $tvMarginY = [float]($size * 0.16)
    $tvW = [float]($size - (2 * $tvMarginX))
    $tvH = [float]($size * 0.44)
    $tvRect = New-Object System.Drawing.RectangleF($tvMarginX, $tvMarginY, $tvW, $tvH)

    $tvBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle([int]$tvMarginX, [int]$tvMarginY, [int]$tvW, [int]$tvH)),
        [System.Drawing.Color]::FromArgb(255, 192, 38, 211),   # Fucsia/Magenta vivo
        [System.Drawing.Color]::FromArgb(255, 109, 40, 217),   # Morado eléctrico
        60.0
    )
    $g.FillRectangle($tvBrush, $tvRect)

    # Borde de pantalla
    $tvBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), [float]($size * 0.02))
    $g.DrawRectangle($tvBorderPen, $tvMarginX, $tvMarginY, $tvW, $tvH)

    # Símbolo PLAY / P de PERCY en el centro de la pantalla
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $fontFamily = [System.Drawing.FontFamily]::GenericSansSerif
    $playFontSize = if ($isLarge) { 26.0 } else { 16.0 }
    $playFont = New-Object System.Drawing.Font($fontFamily, [float]$playFontSize, [System.Drawing.FontStyle]::Bold)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.DrawString("PERCY", $playFont, $whiteBrush, $tvRect, $sf)

    # Texto inferior: "TV" con brillo magenta
    $subFontSize = if ($isLarge) { 15.0 } else { 9.5 }
    $subFont = New-Object System.Drawing.Font($fontFamily, [float]$subFontSize, [System.Drawing.FontStyle]::Bold)
    $magentaBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 244, 114, 182))
    $subY = [float]($tvMarginY + $tvH + ($size * 0.04))
    $subRect = New-Object System.Drawing.RectangleF([float]0.0, $subY, [float]$size, [float]($size - $subY))
    $g.DrawString("TV EN VIVO", $subFont, $magentaBrush, $subRect, $sf)

    $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generado icono de app: $filePath ($size x $size)"
}

Generate-AppIcon "icon.png" 80 $false
Generate-AppIcon "largeIcon.png" 130 $true

# ============================================================
# 2. GENERAR ICONOS DE CANALES (400x400)
# ============================================================
function Create-ChannelIcon {
    param(
        [string]$fileName,
        [string]$title,
        [string]$tag,
        [string]$badgeText,
        [int]$accentR, [int]$accentG, [int]$accentB,
        [int]$bgR = 18, [int]$bgG = 8, [int]$bgB = 28
    )

    $size = 400
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Fondo degradado oscuro con tinte magenta/morado
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, [Math]::Min(255, $bgR + 30), [Math]::Min(255, $bgG + 15), [Math]::Min(255, $bgB + 40)),
        [System.Drawing.Color]::FromArgb(255, $bgR, $bgG, $bgB),
        45.0
    )
    $g.FillRectangle($bgBrush, $rect)

    # Marco de la tarjeta
    $pad = 16
    $cardW = $size - ($pad * 2)
    $cardH = $size - ($pad * 2)
    $cardRect = New-Object System.Drawing.Rectangle($pad, $pad, $cardW, $cardH)
    
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, $accentR, $accentG, $accentB), 4.0)
    $g.DrawRectangle($borderPen, $cardRect)

    # Barra superior con degradado vivo
    $barBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle($pad, $pad, $cardW, 14)),
        [System.Drawing.Color]::FromArgb(255, $accentR, $accentG, $accentB),
        [System.Drawing.Color]::FromArgb(160, [Math]::Min(255, $accentR + 50), [Math]::Min(255, $accentG + 50), [Math]::Min(255, $accentB + 50)),
        0.0
    )
    $g.FillRectangle($barBrush, $pad, $pad, $cardW, 12)

    # Emblema central
    $emblemW = 210
    $emblemH = 115
    $emblemX = [int](($size - $emblemW) / 2)
    $emblemY = 60
    $emblemRect = New-Object System.Drawing.Rectangle($emblemX, $emblemY, $emblemW, $emblemH)
    
    $emblemBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $emblemRect,
        [System.Drawing.Color]::FromArgb(245, $accentR, $accentG, $accentB),
        [System.Drawing.Color]::FromArgb(210, [int]($accentR * 0.6), [int]($accentG * 0.6), [int]($accentB * 0.6)),
        60.0
    )
    $g.FillRectangle($emblemBrush, $emblemRect)

    # Borde de emblema
    $emblemBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 3.0)
    $g.DrawRectangle($emblemBorderPen, $emblemRect)

    # Texto dentro del emblema
    $fontFamily = [System.Drawing.FontFamily]::GenericSansSerif
    $emblemFont = New-Object System.Drawing.Font($fontFamily, [float]26.0, [System.Drawing.FontStyle]::Bold)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    
    $sfCenter = New-Object System.Drawing.StringFormat
    $sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
    $sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $emblemRectF = New-Object System.Drawing.RectangleF([float]$emblemX, [float]$emblemY, [float]$emblemW, [float]$emblemH)
    $g.DrawString($badgeText, $emblemFont, $whiteBrush, $emblemRectF, $sfCenter)

    # Título del canal (área media inferior)
    $titleFontSize = if ($title.Length -gt 15) { 21.0 } elseif ($title.Length -gt 11) { 25.0 } else { 30.0 }
    $titleFont = New-Object System.Drawing.Font($fontFamily, [float]$titleFontSize, [System.Drawing.FontStyle]::Bold)
    
    $tX = [float]($pad + 10)
    $tY = [float]200.0
    $tW = [float]($cardW - 20)
    $tH = [float]95.0
    $titleRectF = New-Object System.Drawing.RectangleF($tX, $tY, $tW, $tH)
    $shadowRectF = New-Object System.Drawing.RectangleF([float]($tX + 2.0), [float]($tY + 2.0), $tW, $tH)
    
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 0, 0, 0))
    $g.DrawString($title, $titleFont, $shadowBrush, $shadowRectF, $sfCenter)
    $g.DrawString($title, $titleFont, $whiteBrush, $titleRectF, $sfCenter)

    # Pill de categoría en la parte inferior
    $pillW = 180
    $pillH = 36
    $pillX = [int](($size - $pillW) / 2)
    $pillY = 325
    $pillRect = New-Object System.Drawing.Rectangle($pillX, $pillY, $pillW, $pillH)
    
    $pillBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 20, 10, 35))
    $g.FillRectangle($pillBgBrush, $pillRect)
    
    $pillPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(240, $accentR, $accentG, $accentB), 2.5)
    $g.DrawRectangle($pillPen, $pillRect)
    
    $pillFont = New-Object System.Drawing.Font($fontFamily, [float]12.5, [System.Drawing.FontStyle]::Bold)
    $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, [Math]::Min(255, $accentR + 60), [Math]::Min(255, $accentG + 60), [Math]::Min(255, $accentB + 60)))
    $pillRectF = New-Object System.Drawing.RectangleF([float]$pillX, [float]$pillY, [float]$pillW, [float]$pillH)
    $g.DrawString($tag, $pillFont, $accentBrush, $pillRectF, $sfCenter)

    $outPath = Join-Path "ICONOS" $fileName
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generado icono de canal: $outPath"
}

# 28 canales restantes
Create-ChannelIcon "DISCOVERY.png"       "DISCOVERY"        "DOCUMENTAL HD"  "DISC"     29 78 216
Create-ChannelIcon "L1MAX.png"           "L1 MAX"           "LIGA 1 EN VIVO" "L1 MAX"   249 115 22
Create-ChannelIcon "GOLDENEDGE.png"      "GOLDEN EDGE"      "CINE ESTRENOS"  "GOLDEN"   217 119 6
Create-ChannelIcon "GOLDENPLUS.png"      "GOLDEN PLUS"      "CINE PREMIUM"   "G+ PLUS"  202 138 4
Create-ChannelIcon "AXN.png"             "AXN"              "ACCION Y SERIES""AXN"      220 38 38
Create-ChannelIcon "WARNER.png"          "WARNER TV"        "CINE Y SERIES"  "WARNER"   6 182 212
Create-ChannelIcon "CINEPREMIUM.png"     "CINE PREMIUM"     "ESTRENOS HD"    "PREMIUM"  168 85 247
Create-ChannelIcon "MAXCINE.png"         "MAXCINE"          "CINE 24/7"      "MAXCINE"  225 29 72
Create-ChannelIcon "MAXCINEFAMILIA.png"  "MAXCINE FAMILIA"  "CINE FAMILIAR"  "FAMILIA"  219 39 119
Create-ChannelIcon "MAXCINEKIDS.png"     "MAXCINE KIDS"     "CINE INFANTIL"  "KIDS"     245 158 11
Create-ChannelIcon "MEGACINE.png"        "MEGACINE"         "PELICULAS HD"   "MEGA"     194 65 12
Create-ChannelIcon "AVIREWINDS.png"      "AVI REWINDS"      "CINE RETRO"     "REWINDS"  249 115 22
Create-ChannelIcon "DEPELICULA.png"      "DE PELICULA"      "CINE SIN CORTE" "PELICULA" 180 83 9
Create-ChannelIcon "CINEHISPANO.png"     "CINE HISPANO"     "CINE EN ESPAÑOL""HISPANO"  225 29 72
Create-ChannelIcon "ANIMALPLANET.png"    "ANIMAL PLANET"    "NATURALEZA HD"  "ANIMAL"   22 163 74
Create-ChannelIcon "TOONCAST.png"        "TOONCAST"         "ANIMACION HD"   "TOON"     234 88 12
Create-ChannelIcon "ENERGEEKWEB.png"     "ENERGEEK WEB"     "MUSICA Y MAS"   "ENERGEEK" 34 211 238
Create-ChannelIcon "ENERGEEKFAN.png"     "ENERGEEK FAN"     "FAN EDITION"    "EG FAN"   8 145 178
Create-ChannelIcon "CINEFAMILIAR.png"    "CINE FAMILIAR"    "PARA TODOS"     "FAMILIAR" 34 197 94
Create-ChannelIcon "HTV.png"             "HTV MUSICA"       "EN VIVO 24/7"   "HTV"      219 39 119
Create-ChannelIcon "TELEANGOL.png"       "TELEANGOL"        "SENAL DIGITAL"  "ANGOL"    245 158 11
Create-ChannelIcon "SUPERCABLE.png"      "SUPERCABLE"       "CABLE LOCAL"    "SUPERCAB" 14 165 233
Create-ChannelIcon "SUPERCANAL.png"      "SUPER CANAL"      "VARIEDADES HD"  "SUPER"    99 102 241
Create-ChannelIcon "MAXCINE2.png"        "MAXCINE 2"        "MAS CINE HD"    "MAX 2"    219 39 119
Create-ChannelIcon "MYTIMEMEXICO.png"    "MYTIME MEXICO"    "PELICULAS HD"   "MYTIME"   14 165 233
Create-ChannelIcon "MYTIMESPAIN.png"     "MYTIME SPAIN"     "CINE EN ESPAÑOL""MYTIME"   245 158 11
Create-ChannelIcon "CMAXCINECOMEDY.png"  "CMAX COMEDY"      "COMEDIA 24/7"   "COMEDY"   234 179 8
Create-ChannelIcon "CLAROCINEMA.png"     "CLARO CINEMA"     "CINE PREMIUM"   "CLARO"    239 68 68

