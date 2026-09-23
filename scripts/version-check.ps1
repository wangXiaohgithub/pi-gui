[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Version,

    [string]$Tag,

    [switch]$RequireArtifacts
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$packagePaths = @(
    "package.json",
    "apps/desktop/package.json",
    "apps/website/package.json"
)
$packageVersions = @(
    foreach ($packagePath in $packagePaths) {
        $absolutePath = Join-Path $repoRoot $packagePath
        $package = Get-Content -LiteralPath $absolutePath -Raw -Encoding UTF8 | ConvertFrom-Json
        [pscustomobject]@{ Path = $packagePath; Version = [string]$package.version }
    }
)
$officialVersion = $packageVersions[0].Version
foreach ($package in $packageVersions) {
    if ($package.Version -ne $officialVersion) {
        throw "Package 版本不一致：$($package.Path)=$($package.Version)，package.json=$officialVersion"
    }
}

$expectedPattern = '^' + [regex]::Escape($officialVersion) + '-cn\.[1-9]\d*$'
if ($Version -cnotmatch $expectedPattern) {
    throw "中文版版本必须符合 ${officialVersion}-cn.<补丁号>，实际为：$Version"
}

$expectedTag = "v$Version"
if ($Tag -and $Tag -cne $expectedTag) {
    throw "Tag 与中文版版本不一致：期望 $expectedTag，实际 $Tag"
}

$builderPath = Join-Path $repoRoot "apps/desktop/electron-builder.yml"
$builderConfig = Get-Content -LiteralPath $builderPath -Raw -Encoding UTF8
foreach ($artifactTemplate in @(
    'artifactName: ${productName}-${version}-${arch}-setup.${ext}',
    'artifactName: ${productName}-${version}-${arch}-portable.${ext}'
)) {
    if (-not $builderConfig.Contains($artifactTemplate)) {
        throw "electron-builder 缺少预期的 Windows 产物命名规则：$artifactTemplate"
    }
}

$releaseDir = Join-Path $repoRoot "apps/desktop/release"
$artifactNames = @(
    "pi-gui-$Version-x64-setup.exe",
    "pi-gui-$Version-x64-portable.exe"
)
if ($RequireArtifacts) {
    foreach ($artifactName in $artifactNames) {
        $artifactPath = Join-Path $releaseDir $artifactName
        if (-not (Test-Path -LiteralPath $artifactPath -PathType Leaf)) {
            throw "缺少发布产物：$artifactPath"
        }
    }
}

Write-Host "版本检查通过：$expectedTag"
$artifactNames | ForEach-Object { Write-Host $_ }
