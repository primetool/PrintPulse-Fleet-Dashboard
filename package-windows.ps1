param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
Set-Location $ProjectRoot

$exe = Join-Path $ProjectRoot 'PrintPulse.exe'
$dist = Join-Path $ProjectRoot 'dist'
$start = Join-Path $ProjectRoot 'Start-PrintPulse.bat'
$install = Join-Path $ProjectRoot 'Install-PrintPulse.bat'
$readme = Join-Path $ProjectRoot 'windows-distribution\README.txt'
$stage = Join-Path $ProjectRoot 'windows-distribution\package'
$zip = Join-Path $ProjectRoot 'PrintPulse-Windows.zip'

foreach ($required in @($exe, $dist, (Join-Path $dist 'index.html'), $start, $install)) {
    if (-not (Test-Path -LiteralPath $required)) {
        throw "Required distribution file was not found: $required"
    }
}

if (Test-Path -LiteralPath $stage) {
    Remove-Item -LiteralPath $stage -Recurse -Force
}
New-Item -ItemType Directory -Path $stage | Out-Null

Copy-Item -LiteralPath $exe -Destination (Join-Path $stage 'PrintPulse.exe')
Copy-Item -LiteralPath $dist -Destination (Join-Path $stage 'dist') -Recurse
Copy-Item -LiteralPath $start -Destination (Join-Path $stage 'Start-PrintPulse.bat')
Copy-Item -LiteralPath $install -Destination (Join-Path $stage 'Install-PrintPulse.bat')
if (Test-Path -LiteralPath $readme) {
    Copy-Item -LiteralPath $readme -Destination (Join-Path $stage 'README.txt')
}

if (Test-Path -LiteralPath $zip) {
    Remove-Item -LiteralPath $zip -Force
}
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -CompressionLevel Optimal

# Keep a browsable copy alongside the source for local testing and future builds.
$distribution = Join-Path $ProjectRoot 'windows-distribution'
foreach ($item in @('PrintPulse.exe', 'Start-PrintPulse.bat', 'Install-PrintPulse.bat', 'dist')) {
    $source = Join-Path $stage $item
    $destination = Join-Path $distribution $item
    if (Test-Path -LiteralPath $destination) {
        Remove-Item -LiteralPath $destination -Recurse -Force
    }
    Copy-Item -LiteralPath $source -Destination $destination -Recurse
}

Write-Host "Created $zip"
