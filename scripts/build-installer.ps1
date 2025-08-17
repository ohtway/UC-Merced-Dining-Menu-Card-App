<#  scripts/build-installer.ps1
    Builds a runnable shaded JAR and a Windows installer (EXE) via jpackage.
    Requirements: JDK 17+ (with jpackage), Maven 3.8+, Windows.
    Usage:
      powershell -ExecutionPolicy Bypass -File .\scripts\build-installer.ps1
      # optional: -Port 8080 (default is 8080)
#>

[CmdletBinding()]
param(
  [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

function Fail($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red; exit 1 }

# 0) Resolve paths
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$serverDir = Join-Path $repoRoot "server"
$iconPath  = Join-Path $repoRoot "packaging\icon.ico"

# 1) Quick sanity checks
if (-not (Test-Path $serverDir)) { Fail "Missing 'server' directory at $serverDir" }
if (-not (Test-Path (Join-Path $serverDir "pom.xml"))) { Fail "Missing server\pom.xml" }
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) { Fail "Maven not found in PATH" }
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { Fail "Java (JDK 17+) not found in PATH" }
try {
  $javaVer = & java -version 2>&1
  if ($javaVer -notmatch 'version "1?7\.') {
    Write-Host "[WARN] JDK 17+ recommended. Detected:`n$javaVer" -ForegroundColor Yellow
  }
} catch { }

# 2) Verify jpackage availability (the Maven plugin uses the JDK's jpackage)
try {
  $null = Get-Command jpackage -ErrorAction Stop
} catch {
  Write-Host "[WARN] 'jpackage' not found on PATH. Ensure your JDK 17+ provides it and PATH is updated." -ForegroundColor Yellow
}

# 3) Ensure icon exists (not fatal, but nicer)
if (-not (Test-Path $iconPath)) {
  Write-Host "[WARN] packaging\icon.ico not found; installer will use default icon." -ForegroundColor Yellow
}

# 4) Build shaded JAR + Installer (jpackage is bound to 'package' phase in the POM)
Push-Location $serverDir
try {
  Write-Host "`n[1/3] Cleaning & packaging shaded JAR (and installer)..." -ForegroundColor Cyan
  mvn -q clean package
} catch {
  Pop-Location
  Fail "Maven build failed."
}

# 5) (No explicit plugin call needed; POM runs jpackage during 'package')
Write-Host "`n[2/3] Creating installer with jpackage..." -ForegroundColor Cyan
Write-Host "   (Handled automatically during the previous Maven step.)"

# 6) Show output + quick run instructions
$distDir = Join-Path (Join-Path $serverDir "target") "dist"
$exe = $null
if (Test-Path $distDir) {
  $exe = Get-ChildItem -Path $distDir -Filter "*.exe" -File -ErrorAction SilentlyContinue `
    | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

Pop-Location

Write-Host "`n[3/3] Build complete." -ForegroundColor Green
if ($exe) {
  Write-Host "Installer: $($exe.FullName)"
  Write-Host "Double-click the EXE to install. A Start Menu shortcut named 'Menu Card Maker' will be created."
} else {
  Write-Host "[WARN] No EXE found under $distDir" -ForegroundColor Yellow
  Write-Host "       If this persists, ensure <type>EXE</type> is set in server\pom.xml and re-run." -ForegroundColor Yellow
}

# 7) Optional: default port note
Write-Host "`nTip: To change the default port at launch time, you can create a shortcut and add:" -ForegroundColor Gray
Write-Host "      --jvm '-DPORT=$Port'" -ForegroundColor Gray

# 8) Done
