@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -Command "$ErrorActionPreference='Stop'; $manifest=Get-Content -Raw '.\downloads\bundle-manifest.json' | ConvertFrom-Json; foreach($b in $manifest){$out=Join-Path (Resolve-Path '.\downloads') $b.name; $tmp=$out+'.partial'; $dest=[IO.File]::Create($tmp); try{foreach($p in $b.parts){$src=[IO.File]::OpenRead((Join-Path (Resolve-Path '.\downloads') $p)); try{$src.CopyTo($dest)}finally{$src.Dispose()}}}finally{$dest.Dispose()}; if((Get-FileHash -Algorithm SHA256 $tmp).Hash.ToLowerInvariant() -ne $b.sha256){Remove-Item $tmp; throw ('Checksum failed: '+$b.name)}; Move-Item -Force $tmp $out; Write-Host ('Ready: '+$out)}"
if errorlevel 1 (
  echo.
  echo Download preparation failed. Check the error above.
  pause
  exit /b 1
)
echo.
echo DONE. Open downloads and extract both Windows ZIP files completely.
pause
