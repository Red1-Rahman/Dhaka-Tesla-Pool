$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Frontend = Join-Path $Root "frontend"

Set-Location $Frontend

npm.cmd install
npm.cmd run build
npm.cmd run dev