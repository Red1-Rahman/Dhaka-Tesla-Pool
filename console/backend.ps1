$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Backend = Join-Path $Root "backend"

Set-Location $Backend

npm.cmd install
npx.cmd prisma generate
npx.cmd prisma migrate dev
npm.cmd run build
npm.cmd run start:dev