# deploy.ps1
# Script to push to GitHub and deploy to Netlify using local CLI sessions

# Prepend Git and gh to Path
$env:PATH = "C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;" + $env:PATH

Write-Host "Memulai proses integrasi..."

# 1. Pastikan Git diinisialisasi
if (-not (Test-Path .git)) {
    Write-Host "Menginisialisasi repositori Git lokal..."
    git init
    git config user.name "Yoohash-noob"
    git config user.email "arpanmualiefsaprizal@gmail.com"
}

git branch -M main

# 2. Add files dan Commit
Write-Host "Menambahkan file dan membuat commit pertama..."
git add .
git commit -m "Initial commit: BI Dashboard & Planning"

# 3. Buat Repositori GitHub menggunakan gh CLI
$repoName = "bi-dashboard-analytics"
Write-Host "Memeriksa repositori di GitHub..."
$repoCheck = gh repo view "Yoohash-noob/$repoName" 2>&1

if ($repoCheck -match "could not resolve to a Repository") {
    Write-Host "Membuat repositori baru '$repoName' di GitHub..."
    gh repo create $repoName --public --confirm
} else {
    Write-Host "Repositori '$repoName' sudah ada di GitHub."
}

# 4. Hubungkan remote dan Push
Write-Host "Menghubungkan remote dan push ke GitHub..."
git remote remove origin 2>$null
git remote add origin "https://github.com/Yoohash-noob/$repoName.git"

Write-Host "Mengunggah kode ke GitHub (proses ini memakan waktu beberapa detik)..."
git push -u origin main --force
$githubLink = "https://github.com/Yoohash-noob/$repoName"
Write-Host "Berhasil diunggah ke GitHub: $githubLink"

# 5. Deployment ke Netlify
Write-Host "Mendeploy ke Netlify..."
$siteName = "bi-dashboard-yoohash-noob"

# Cari tahu apakah site sudah ada, jika belum buat baru
$siteCheck = npx netlify status --json | ConvertFrom-Json
$siteId = ""

Write-Host "Membuat site baru di Netlify..."
# Coba buat site, jika gagal (misal nama sudah dipakai), biarkan Netlify buat nama acak
$createSite = npx netlify sites:create --name $siteName --json 2>&1
if ($createSite -match "site_id") {
    # Ambil JSON output
    $siteData = $createSite | ConvertFrom-Json
    $siteId = $siteData.site_id
    Write-Host "Site berhasil dibuat dengan nama $siteName (ID: $siteId)"
} else {
    Write-Host "Nama '$siteName' mungkin sudah terpakai atau terjadi masalah lain. Melakukan deployment otomatis..."
}

# Jalankan deployment
Write-Host "Menjalankan Netlify deploy..."
if ($siteId -ne "") {
    npx netlify deploy --dir=dist --prod --site $siteId
} else {
    npx netlify deploy --dir=dist --prod
}

Write-Host "Semua proses selesai dengan sukses!"
