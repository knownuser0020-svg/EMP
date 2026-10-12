$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$downloads = Join-Path $repo 'downloads'
$manifest = Get-Content -Raw (Join-Path $downloads 'bundle-manifest.json') | ConvertFrom-Json
foreach ($bundle in $manifest) {
    $output = Join-Path $downloads $bundle.name
    $temporary = "$output.partial"
    $target = [System.IO.File]::Create($temporary)
    try {
        foreach ($part in $bundle.parts) {
            $inputFile = [System.IO.File]::OpenRead((Join-Path $downloads $part))
            try { $inputFile.CopyTo($target) } finally { $inputFile.Dispose() }
        }
    } finally { $target.Dispose() }
    $actual = (Get-FileHash -Algorithm SHA256 $temporary).Hash.ToLowerInvariant()
    if ($actual -ne $bundle.sha256) {
        Remove-Item $temporary
        throw "Checksum verification failed for $($bundle.name). Download all parts again."
    }
    Move-Item -Force $temporary $output
    Write-Host "Ready: $output"
}
Write-Host 'Both ZIP bundles are ready. Extract each ZIP completely before running its EXE.'
