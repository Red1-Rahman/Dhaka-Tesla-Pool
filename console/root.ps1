$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Set-Location $Root

docker compose up -d postgres
docker compose ps
