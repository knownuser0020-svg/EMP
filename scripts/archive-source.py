"""Create a complete source archive that excludes credentials and generated caches."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
root=Path(__file__).resolve().parent.parent
output=Path('/workspace/artifacts/EMP-source.zip')
output.parent.mkdir(exist_ok=True)
excluded={'.git','node_modules','.local','release','dist','dist-electron','target','test-results','playwright-report','downloads'}
with ZipFile(output,'w',ZIP_DEFLATED,compresslevel=6) as archive:
 for p in sorted(root.rglob('*')):
  relative=p.relative_to(root)
  if any(part in excluded for part in relative.parts):continue
  if p.is_file() and not p.is_symlink() and not (p.name.startswith('.env') and p.name!='.env.example') and not p.name.endswith('.log'):
   archive.write(p,Path('enterprise-ems')/relative)
with ZipFile(output) as archive:
 assert archive.testzip() is None
 assert 'enterprise-ems/package-lock.json' in archive.namelist()
 assert 'enterprise-ems/.env' not in archive.namelist()
print(f'Verified source archive: {output} ({output.stat().st_size} bytes)')
