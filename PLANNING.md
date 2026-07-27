# 📊 PERENCANAAN PROYEK BUSINESS INTELLIGENCE
### Mata Kuliah: Business Intelligence — Semester 6
> **Nama Proyek:** BI Dashboard — Analisis Data Penjualan Produk  
> **Teknologi:** React.js · Chart.js · K-Means · Vite  
> **Dataset:** Data penjualan produk (CSV, ~15.000 baris)  
> **Hosting:** Netlify (Client-Side Only)  
> **Repository:** GitHub (Yoohash-noob/bi-dashboard-analytics)

---

## 📌 APA TUJUAN PROYEK INI?

Membuat sebuah **website dashboard Business Intelligence** yang bisa:
1. Menampilkan **Landing Page** profesional sebelum masuk ke sistem
2. Mendukung sistem **Login berbasis Role** (Admin & User/Eksekutif)
3. Menerima file data penjualan (CSV) dan membersihkannya secara otomatis (ETL)
4. Menampilkan **Executive Dashboard** dengan KPI & grafik interaktif
5. Menyediakan **5 teknik Business Intelligence** secara interaktif
6. Mendukung fitur **CRUD (tambah/edit/hapus)** data langsung di browser
7. Menyediakan fitur **download hasil** (grafik PNG & tabel CSV)

---

## 🗺️ BAGIAN 1 — ALUR KERJA SISTEM

> Bagaimana data bergerak dari file CSV sampai menjadi hasil analisis di layar?

```mermaid
flowchart TD
    A["🌐 Landing Page (Glassmorphism UI)"] --> B["🔐 Login — Role Admin / User"]
    B --> C["🏠 Dashboard Utama (sesuai role)"]
    C --> D["📂 Upload File CSV / Muat Sample Data"]
    D --> E["🔄 ETL: Bersihkan & Rapikan Data"]
    E --> F["🗄️ Star Schema: Struktur Data Warehouse"]
    F --> G["⚙️ Proses 5 Teknik BI"]

    G --> H["📊 OLAP Pivot Table\nAnalysis Services"]
    G --> I["🔮 Forecasting & Korelasi\nData Mining"]
    G --> J["📈 Dashboard Grafik\nReporting Services"]
    G --> K["🎯 K-Means Clustering\nClustering Support"]

    H & I & J & K --> L["🖥️ Tampil di Dashboard Interaktif"]
    L --> M["⬇️ Download Hasil\nPNG Grafik / CSV Data"]
```

### 📖 Penjelasan Alur (Mudah Dipresentasikan):

| Langkah | Nama | Penjelasan Singkat |
|---------|------|---------------------|
| 1️⃣ | **Landing Page** | Halaman depan dengan desain modern sebelum login |
| 2️⃣ | **Login** | Sistem autentikasi berbasis role (Admin/User) |
| 3️⃣ | **Input** | Pengguna upload file CSV berisi data penjualan |
| 4️⃣ | **ETL** | Sistem otomatis membersihkan data (buang duplikat, perbaiki format) |
| 5️⃣ | **Star Schema** | Data disimpan dalam struktur tabel yang terorganisir (1 fakta + 4 dimensi) |
| 6️⃣ | **Proses BI** | Data diolah dengan 5 teknik BI sekaligus |
| 7️⃣ | **Output** | Hasil muncul di dashboard sebagai grafik, tabel, dan angka statistik |
| 8️⃣ | **Download** | Pengguna bisa download grafik (PNG) atau data (CSV) |

---

## 🔐 BAGIAN 1B — SISTEM AKSES & ROLE

Aplikasi mendukung dua jenis pengguna dengan tampilan dashboard yang berbeda:

| Role | Username | Akses |
|------|----------|-------|
| **Admin** | admin | Upload data, CRUD tabel, lihat semua grafik, kelola sistem |
| **User (Eksekutif)** | user | Lihat dashboard KPI & grafik, analisis BI (read-only) |

---

## 🗄️ BAGIAN 2 — RANCANGAN DATABASE (Star Schema)

> **Star Schema** adalah cara menyimpan data warehouse. Ada 1 tabel utama (Fakta) yang dikelilingi oleh tabel pendukung (Dimensi), seperti bentuk bintang.

```mermaid
erDiagram
    FACT_SALES {
        int     Order_ID      PK  "ID unik tiap transaksi"
        int     Date_Key      FK  "Hubung ke tabel tanggal"
        int     Customer_Key  FK  "Hubung ke tabel pelanggan"
        int     Location_Key  FK  "Hubung ke tabel lokasi"
        int     Product_Key   FK  "Hubung ke tabel produk"
        int     Quantity          "Jumlah barang terjual"
        float   Unit_Price        "Harga per barang"
        float   Revenue           "Total pendapatan"
        float   Profit            "Keuntungan bersih"
    }

    DIM_DATE {
        int     Date_Key  PK  "Kunci tanggal"
        date    Order_Date    "Tanggal transaksi"
        int     Day           "Hari ke-berapa"
        int     Month         "Bulan"
        int     Quarter       "Kuartal Q1-Q4"
        int     Year          "Tahun"
        string  Day_of_Week   "Senin / Selasa / dst"
    }

    DIM_CUSTOMER {
        int     Customer_Key  PK  "Kunci pelanggan"
        string  Customer_Name     "Nama pelanggan"
    }

    DIM_LOCATION {
        int     Location_Key  PK  "Kunci lokasi"
        string  City              "Kota"
        string  State             "Provinsi / Negara Bagian"
        string  Region            "Wilayah Timur/Barat/dll"
        string  Country           "Negara"
    }

    DIM_PRODUCT {
        int     Product_Key   PK  "Kunci produk"
        string  Product_Name      "Nama produk"
        string  Sub_Category      "Sub-kategori produk"
        string  Category          "Kategori utama"
    }

    FACT_SALES }|--|| DIM_DATE     : "terjadi pada tanggal"
    FACT_SALES }|--|| DIM_CUSTOMER : "dibeli oleh"
    FACT_SALES }|--|| DIM_LOCATION : "dikirim ke"
    FACT_SALES }|--|| DIM_PRODUCT  : "berisi produk"
```

### 📖 Penjelasan Tabel (Untuk Presentasi):

| Tabel | Jenis | Isi | Fungsi |
|-------|-------|-----|--------|
| `FACT_SALES` | **Fakta** | Angka transaksi (Revenue, Profit, Qty) | Tabel utama tempat data bisnis |
| `DIM_DATE` | Dimensi | Info tanggal, bulan, kuartal, tahun | Filter data berdasarkan waktu |
| `DIM_CUSTOMER` | Dimensi | Nama pelanggan | Analisis per pelanggan |
| `DIM_LOCATION` | Dimensi | Kota, wilayah, negara | Analisis per lokasi/region |
| `DIM_PRODUCT` | Dimensi | Nama & kategori produk | Analisis per produk |

---

## 💡 BAGIAN 3 — PENJELASAN 5 FITUR BI

### 🔄 Fitur 1: Integration Services (ETL)
> *"Proses membersihkan data kotor agar siap dianalisis"*

**Cara kerjanya:**
- Sistem membaca file CSV yang di-upload pengguna
- Otomatis menghapus data duplikat dan baris kosong
- Memperbaiki format tanggal yang tidak konsisten
- Memisahkan data ke dalam tabel Star Schema

**Output yang bisa dilihat:**
- ✅ Log proses ETL (berhasil/gagal per langkah)
- ✅ **Preview Before/After** (tampilkan perubahan data sebelum dan sesudah ETL)
- ✅ **Visualisasi diagram Star Schema** langsung di antarmuka
- ✅ Statistik jumlah data: berapa yang bersih, berapa yang dibuang

---

### 📊 Fitur 2: Analysis Services (OLAP Pivot Table)
> *"Tabel interaktif untuk melihat data dari berbagai sudut pandang"*

**Cara kerjanya:**
- Pengguna bebas memilih: **baris** (misal: Kategori), **kolom** (misal: Tahun), dan **nilai** (misal: Revenue)
- Bisa difilter berdasarkan Region, Kategori, atau Tahun (Slice & Dice)
- Ada tombol expand untuk melihat detail sub-baris (drill-down)

**Contoh penggunaan:**
- "Berapa revenue Kategori Elektronik di setiap tahun?"
- "Bandingkan profit per wilayah di Q3"

**Output yang bisa dilihat:**
- ✅ **Simulator Slice & Dice** dengan UI premium (Glassmorphism)
- ✅ Tabel pivot interaktif dengan Grand Total
- ✅ Download hasil pivot sebagai CSV

---

### 🔮 Fitur 3: Data Mining
> *"Menemukan pola tersembunyi dan memprediksi masa depan"*

**3 sub-fitur:**

| Sub-fitur | Penjelasan | Output |
|-----------|------------|--------|
| **Forecasting** | Prediksi penjualan bulan ke depan (regresi linear OLS) | Grafik garis dengan prediksi |
| **Korelasi** | Ukur hubungan antar variabel (Qty, Harga, Profit) | Heatmap matriks korelasi |
| **Market Basket** | Produk yang sering dibeli bersamaan (Co-occurrence) | Tabel & grafik 10 pasangan |

**Output yang bisa dilihat:**
- ✅ Grafik Forecasting (pilih 3, 6, 9, atau 12 bulan ke depan)
- ✅ Koefisien R² dan Slope tren penjualan
- ✅ Download grafik PNG & data CSV

---

### 📈 Fitur 4: Reporting Services
> *"Dashboard laporan visual yang siap dipresentasikan"*

**KPI yang ditampilkan di Executive Dashboard:**
💰 Total Revenue · 💹 Total Profit · 📊 Profit Margin · 📦 Total Qty · 🛒 Avg Order Value · 🔢 Total Orders

**Grafik yang tersedia:**

| Grafik | Penjelasan |
|--------|------------|
| 📉 Monthly Trend | Tren pendapatan per bulan (Area Chart) |
| 🍩 Revenue by Category | Kontribusi tiap kategori (Bar Chart) |
| 🏆 Top 10 Products | Produk dengan revenue tertinggi |
| 🗺️ Revenue by Region | Proporsi per wilayah (Doughnut Chart) |

**Output yang bisa dilihat:**
- ✅ Dashboard eksekutif berbeda untuk Admin dan User
- ✅ KPI cards dengan data real-time dari dataset yang diupload
- ✅ 4 grafik interaktif menggunakan Chart.js
- ✅ Download tiap grafik (PNG) dan tiap tabel (CSV)

---

### 🎯 Fitur 5: Clustering Support (K-Means)
> *"Mengelompokkan pelanggan berdasarkan kemiripan perilaku belanja"*

**Cara kerjanya:**
- Algoritma K-Means mengelompokkan data ke dalam K kelompok
- Pengguna pilih: jumlah cluster (2–6), sumbu X dan Y, mode (Pelanggan atau Kota)
- Normalisasi Min-Max agar skala data setara
- Jarak Euclidean untuk menentukan keanggotaan cluster
- Algoritma berjalan langsung di browser (client-side, tanpa server)

**Contoh hasil:**

| Cluster | Profil | Ciri-ciri |
|---------|--------|-----------|
| Cluster 1 | VIP Customer | Revenue tinggi, sering beli |
| Cluster 2 | Bulk Buyer | Order banyak tapi nilai kecil |
| Cluster 3 | Occasional Spender | Jarang beli tapi sekali beli mahal |
| Cluster 4 | Casual Buyer | Revenue & kuantitas rendah |

**Output yang bisa dilihat:**
- ✅ Scatter Plot interaktif dengan warna tiap cluster
- ✅ Profil tiap cluster (nama, jumlah anggota, rata-rata nilai)
- ✅ Download scatter plot (PNG) dan data cluster (CSV)

---

## 🛠️ BAGIAN 3B — FITUR TAMBAHAN (REVISI)

### 📝 CRUD Data Management (Admin Only)
> *"Admin dapat mengelola data langsung dari browser tanpa perlu software eksternal"*

- **Create:** Tambah baris data baru ke tabel
- **Read:** Tampilkan 15.000+ baris data dengan sistem paginasi (10 baris/halaman)
- **Update:** Edit langsung nilai pada setiap sel tabel
- **Delete:** Hapus baris data yang tidak dibutuhkan
- **Export:** Download data yang sudah diedit sebagai CSV baru
- **Reactive:** Setiap perubahan data langsung diproses ulang ke semua chart & analisis

---

## 📁 BAGIAN 4 — STRUKTUR FOLDER PROYEK

```
📦 archive/                         ← Root folder proyek
│
├── 📁 src/                         ← Kode sumber utama (React)
│   ├── 📄 App.jsx                  ← Komponen utama + state management
│   ├── 📄 index.css                ← Styling & design sistem (2800+ baris)
│   │
│   ├── 📁 components/              ← Komponen UI per halaman/tab
│   │   ├── LandingPage.jsx         ← Halaman depan (Glassmorphism)
│   │   ├── AdminHomeTab.jsx        ← Dashboard Admin (upload + KPI + charts)
│   │   ├── UserHomeTab.jsx         ← Dashboard Eksekutif (KPI + charts)
│   │   ├── DataManagementTab.jsx   ← CRUD tabel data (Admin Only)
│   │   ├── IntegrationTab.jsx      ← Tab ETL & Star Schema
│   │   ├── AnalysisTab.jsx         ← Tab OLAP Pivot Table
│   │   ├── MiningTab.jsx           ← Tab Data Mining
│   │   ├── ReportingTab.jsx        ← Tab Dashboard Laporan
│   │   ├── ClusteringTab.jsx       ← Tab K-Means Clustering
│   │   ├── AlgorithmModal.jsx      ← Modal penjelasan algoritma & kode Python
│   │   └── ErrorBanner.jsx         ← Notifikasi error upload
│   │
│   └── 📁 utils/                   ← Fungsi logika/kalkulasi
│       ├── etl.js                  ← Proses ETL & transformasi data
│       ├── clustering.js           ← Algoritma K-Means
│       ├── mining.js               ← Forecasting & korelasi
│       └── download.js             ← Helper download PNG & CSV
│
├── 📁 public/                      ← File statis (dataset sampel)
├── 📁 sql/                         ← Script SQL Star Schema
├── 📁 ssis/                        ← Desain SSIS (ETL Microsoft)
├── 📁 ssas/                        ← Desain SSAS (Cube)
├── 📁 ssrs/                        ← Desain SSRS (Report)
│
├── 📄 package.json                 ← Konfigurasi Node.js
├── 📄 vite.config.js               ← Konfigurasi build
├── 📄 README.md                    ← Dokumentasi proyek
└── 📄 PLANNING.md                  ← Dokumen perencanaan ini
```

---

## 📅 BAGIAN 5 — TIMELINE PENGERJAAN

```mermaid
gantt
    title Rencana Pengembangan Proyek BI
    dateFormat  YYYY-MM-DD
    axisFormat  %d %b

    section Perencanaan
    Desain Star Schema & Flowchart    :done, w1a, 2026-07-17, 3d
    Buat Dokumen Perencanaan          :done, w1b, after w1a, 4d

    section ETL dan Analisis
    Modul ETL dan Integration Services :done, w2a, 2026-07-24, 3d
    OLAP Pivot Table                   :done, w2b, after w2a, 4d

    section Mining dan Clustering
    Forecasting dan Korelasi          :done, w3a, 2026-07-31, 3d
    K-Means Clustering                :done, w3b, after w3a, 4d

    section Revisi & Fitur Tambahan
    Landing Page & Login System       :done, w4a, 2026-07-27, 1d
    CRUD Data Management              :done, w4b, 2026-07-27, 1d
    Executive Dashboard (KPI+Charts)  :done, w4c, 2026-07-27, 1d
    Peningkatan 5 Teknik BI           :done, w4d, 2026-07-27, 1d

    section Final
    Testing dan Presentasi Akhir      :active, w5a, 2026-07-27, 1d
```

| Minggu | Fokus | Status |
|--------|-------|--------|
| **Minggu 1** | Perencanaan, desain database, buat dokumen | ✅ Selesai |
| **Minggu 2** | ETL pipeline, OLAP Pivot Table interaktif | ✅ Selesai |
| **Minggu 3** | Forecasting, korelasi, K-Means clustering | ✅ Selesai |
| **Minggu 4 (Revisi)** | Landing page, CRUD, Executive Dashboard, peningkatan BI | ✅ Selesai |
| **Presentasi** | 🔄 Berjalan |

---

## ⚙️ BAGIAN 6 — TEKNOLOGI YANG DIGUNAKAN

| Teknologi | Fungsi |
|-----------|--------|
| **React.js 18** | Framework UI komponen |
| **Vite 6** | Build tool & dev server cepat |
| **Chart.js 4** | Render grafik (Line, Bar, Scatter, Doughnut) |
| **react-chartjs-2** | Wrapper React untuk Chart.js |
| **PapaParse** | Parse file CSV langsung di browser |
| **Vanilla CSS** | Styling & dark mode premium (Glassmorphism) |
| **JavaScript ES6+** | Logika algoritma (K-Means, regresi linear, ETL) |
| **Netlify** | Hosting & deployment (CD otomatis dari GitHub) |

> 💡 **Catatan:** Semua proses berjalan 100% di browser (client-side). Tidak membutuhkan server backend atau database eksternal. Ini berarti aplikasi sangat cepat, portable, dan gratis untuk di-hosting.

---

## 🎯 BAGIAN 7 — RINGKASAN UNTUK PRESENTASI

Jika dosen bertanya *"Jelaskan proyekmu secara singkat"*, gunakan kalimat ini:

> *"Proyek ini adalah **website Business Intelligence** berbasis browser yang mengolah data penjualan CSV secara real-time. Sistemnya memiliki **Landing Page** modern, sistem **login berbasis role** (Admin & User), dan **5 teknik BI utama**: ETL untuk pembersihan data, OLAP Pivot Table untuk analisis multidimensi, Data Mining untuk prediksi dan korelasi, Reporting Dashboard dengan grafik interaktif, dan K-Means Clustering untuk segmentasi pelanggan. Admin juga dapat melakukan **CRUD** langsung terhadap data. Semua hasilnya bisa diunduh langsung sebagai file PNG atau CSV. Aplikasi di-hosting di Netlify secara gratis."*

---

*Dokumen ini di-update pada: 2026-07-27 — Versi Final (Revisi Lengkap)*
