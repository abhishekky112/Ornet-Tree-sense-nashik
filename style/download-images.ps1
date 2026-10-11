$ErrorActionPreference = "Stop"

$baseUrl = "https://www.ornettreecensus.com/geoserver/styles"
$target = Join-Path $PSScriptRoot "images"

New-Item -ItemType Directory -Force -Path $target | Out-Null

$files = @(
    "treecut.png",
    "dangerous.png",
    "yellow.png",
    "exotic.png",
    "tree-icon.png"
)

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $out = Join-Path $target $file

    Write-Host "Downloading $file ..."
    Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing

    if (-not (Test-Path $out) -or (Get-Item $out).Length -eq 0) {
        throw "Download failed or returned an empty file: $file"
    }

    Write-Host "Saved: $out"
}

Write-Host ""
Write-Host "Done. Exact Ornet icon files have been downloaded to:"
Write-Host $target
