[CmdletBinding()]
param(
    [switch]$Continue,
    [switch]$SkipPackage,
    [switch]$DirectoryOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($SkipPackage -and $DirectoryOnly) {
    Write-Error "-SkipPackage 与 -DirectoryOnly 不能同时使用。"
    exit 2
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ExpectedUpstream = "https://github.com/minghinmatthewlam/pi-gui.git"
$ReleaseDir = Join-Path $RepoRoot "apps\desktop\release"
$InstallStatus = "未运行"
$CheckStatus = "未运行"
$DirectoryStatus = "已跳过"
$InstallerStatus = "已跳过"

Set-Location -LiteralPath $RepoRoot

function Write-Stage {
    param([string]$Number, [string]$Message)
    Write-Host "[$Number/7] $Message" -ForegroundColor Cyan
}

function Stop-WithError {
    param([string]$Message, [int]$Code = 1)
    Write-Host ""
    Write-Host "ERROR" -ForegroundColor Red
    Write-Host $Message -ForegroundColor Red
    exit $Code
}

function Invoke-NativeStep {
    param([string]$FailureMessage, [scriptblock]$Command)
    & $Command
    if ($LASTEXITCODE -ne 0) {
        Stop-WithError $FailureMessage $LASTEXITCODE
    }
}

function Assert-CleanWorkingTree {
    $changes = @(git status --porcelain=v1 --untracked-files=all)
    if ($LASTEXITCODE -ne 0) {
        Stop-WithError "无法读取 Git 工作区状态。"
    }
    if ($changes.Count -gt 0) {
        Write-Host "检测到未提交修改。" -ForegroundColor Yellow
        Write-Host ""
        $changes | ForEach-Object { Write-Host $_ }
        Write-Host ""
        Stop-WithError "为了避免覆盖当前工作，请先提交或暂存这些修改，然后重新运行 update-upstream.ps1。"
    }
}

function Assert-UpstreamRemote {
    $upstreamUrl = (git remote get-url upstream 2>$null)
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($upstreamUrl)) {
        Stop-WithError @"
未检测到 upstream remote。

请执行：
git remote add upstream $ExpectedUpstream
"@
    }

    $normalized = $upstreamUrl.Trim().TrimEnd("/")
    $valid = $normalized -match "^(https://github\.com/|git@github\.com:)minghinmatthewlam/pi-gui(?:\.git)?$"
    if (-not $valid) {
        Stop-WithError "upstream 地址不是官方仓库：$upstreamUrl`n请人工检查；脚本不会自动覆盖现有 remote。"
    }
}

Write-Stage "1" "检查 Git 工作区"
if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot ".git"))) {
    Stop-WithError "请在 pi-gui Git 仓库中运行此脚本。"
}
Assert-CleanWorkingTree

$currentBranch = (git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0 -or $currentBranch -ne "zh-i18n") {
    Stop-WithError "请先切换到 zh-i18n 分支，再运行此脚本。当前分支：$currentBranch"
}

$unmergedFiles = @(git diff --name-only --diff-filter=U)
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "无法检查未解决的合并冲突。"
}
if ($unmergedFiles.Count -gt 0) {
    Stop-WithError "仍有未解决的合并冲突：`n$($unmergedFiles -join "`n")"
}

Assert-UpstreamRemote

if (-not $Continue) {
    Write-Stage "2" "获取 upstream"
    Invoke-NativeStep "git fetch upstream 失败。" { git fetch upstream }
    Invoke-NativeStep "未找到 upstream/main。" { git show-ref --verify --quiet refs/remotes/upstream/main }

    Write-Stage "3" "更新 main"
    Invoke-NativeStep "无法切换到 main；请检查本地分支状态。" { git switch main }
    & git merge --ff-only upstream/main
    if ($LASTEXITCODE -ne 0) {
        & git switch zh-i18n | Out-Null
        Stop-WithError "本地 main 包含官方 upstream/main 之外的提交，无法安全 fast-forward。`n请检查 main 分支。"
    }

    Write-Stage "4" "合并 zh-i18n"
    Invoke-NativeStep "无法切换回 zh-i18n。" { git switch zh-i18n }
    & git merge main
    if ($LASTEXITCODE -ne 0) {
        $conflicts = @(git diff --name-only --diff-filter=U)
        if ($conflicts.Count -gt 0) {
            Write-Host ""
            Write-Host "官方更新与中文版发生冲突。" -ForegroundColor Yellow
            Write-Host ""
            $conflicts | ForEach-Object { Write-Host $_ }
            Write-Host ""
            Write-Host "请解决以上冲突，然后执行："
            Write-Host "git add <files>"
            Write-Host "git commit"
            Write-Host ""
            Write-Host "完成后重新运行："
            Write-Host ".\scripts\update-upstream.ps1 -Continue"
            exit 3
        }
        Stop-WithError "main 合并到 zh-i18n 失败。Git 未报告未解决冲突，请检查上方输出。"
    }
} else {
    Write-Stage "2" "继续模式：跳过 fetch"
    Write-Stage "3" "继续模式：跳过 main 更新"
    Write-Stage "4" "继续模式：验证 zh-i18n"
    Assert-CleanWorkingTree
}

Write-Stage "5" "安装依赖"
Invoke-NativeStep "pnpm install 失败；已停止后续流程。" { pnpm install }
$InstallStatus = "PASS"

Write-Stage "6" "运行检查"
Invoke-NativeStep "pnpm check 失败；不会生成 Windows 安装包。" { pnpm check }
$CheckStatus = "PASS"

Write-Stage "7" "Windows 打包"
if ($SkipPackage) {
    Write-Host "已按 -SkipPackage 跳过 Windows 打包。"
} else {
    Invoke-NativeStep "Windows directory build 失败。" { pnpm package:win:dir }
    $DirectoryStatus = "PASS"
    if (-not $DirectoryOnly) {
        Invoke-NativeStep "Windows installer build 失败。" { pnpm package:win }
        $InstallerStatus = "PASS"
    }
}

$mainCommit = (git rev-parse --short main).Trim()
$zhCommit = (git rev-parse --short zh-i18n).Trim()
$installerFiles = @()
$portableFiles = @()
$unpackedDirs = @()
if (Test-Path -LiteralPath $ReleaseDir) {
    $installerFiles = @(Get-ChildItem -LiteralPath $ReleaseDir -File -Filter "*-setup.exe" | Sort-Object LastWriteTime -Descending)
    $portableFiles = @(Get-ChildItem -LiteralPath $ReleaseDir -File -Filter "*-portable.exe" | Sort-Object LastWriteTime -Descending)
    $unpackedDirs = @(Get-ChildItem -LiteralPath $ReleaseDir -Directory -Filter "win-unpacked" | Sort-Object LastWriteTime -Descending)
}

Write-Host ""
Write-Host "========================================"
Write-Host "pi-gui 中文版更新完成"
Write-Host "========================================"
Write-Host ""
Write-Host "官方分支：main @ $mainCommit"
Write-Host "中文版：zh-i18n @ $zhCommit"
Write-Host ""
Write-Host "pnpm install: $InstallStatus"
Write-Host "pnpm check: $CheckStatus"
Write-Host "Windows directory build: $DirectoryStatus"
Write-Host "Windows installer: $InstallerStatus"
Write-Host ""
Write-Host "输出文件："
$installerFiles | ForEach-Object { Write-Host $_.FullName }
$portableFiles | ForEach-Object { Write-Host $_.FullName }
Write-Host ""
Write-Host "Unpacked："
$unpackedDirs | ForEach-Object { Write-Host $_.FullName }
Write-Host ""
Write-Host "========================================"
