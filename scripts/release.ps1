[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Version
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$changes = @(git status --porcelain=v1 --untracked-files=all)
if ($LASTEXITCODE -ne 0) {
    throw "无法读取 Git 工作区状态。"
}
if ($changes.Count -gt 0) {
    Write-Host "检测到未提交修改。请先提交或暂存后继续。" -ForegroundColor Yellow
    $changes | ForEach-Object { Write-Host $_ }
    exit 1
}

$currentBranch = (git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0 -or $currentBranch -ne "zh-i18n") {
    throw "请在 zh-i18n 分支发布；当前分支：$currentBranch"
}

$tag = "v$Version"
& (Join-Path $PSScriptRoot "version-check.ps1") -Version $Version -Tag $tag
if (-not $?) {
    throw "版本检查失败。"
}

git show-ref --verify --quiet "refs/tags/$tag"
if ($LASTEXITCODE -eq 0) {
    throw "Tag 已存在：$tag"
}
if ($LASTEXITCODE -ne 1) {
    throw "无法检查 Tag：$tag (exit $LASTEXITCODE)"
}

pnpm check
if ($LASTEXITCODE -ne 0) {
    throw "pnpm check 失败，退出码：$LASTEXITCODE"
}

$env:PI_GUI_RELEASE_VERSION = $Version
try {
    pnpm package:win
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm package:win 失败，退出码：$LASTEXITCODE"
    }
}
finally {
    Remove-Item Env:PI_GUI_RELEASE_VERSION -ErrorAction SilentlyContinue
}

& (Join-Path $PSScriptRoot "version-check.ps1") -Version $Version -Tag $tag -RequireArtifacts
if (-not $?) {
    throw "发布产物版本检查失败。"
}

$changes = @(git status --porcelain=v1 --untracked-files=all)
if ($LASTEXITCODE -ne 0 -or $changes.Count -gt 0) {
    throw "打包后工作区出现修改，请检查后再创建 Tag：$($changes -join ', ')"
}

git tag $tag
if ($LASTEXITCODE -ne 0) {
    throw "创建 Tag 失败：$tag (exit $LASTEXITCODE)"
}

Write-Host "发布准备完成：$tag"
Write-Host "下一步：git push origin zh-i18n"
Write-Host "然后：git push origin $tag"
