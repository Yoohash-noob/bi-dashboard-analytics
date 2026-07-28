import React from 'react';
import './PlanningTab.css';

const dataStructure = [
  { no: 1, name: 'Order_ID', type: 'Integer', desc: 'Nomor urut unik setiap transaksi', example: '1' },
  { no: 2, name: 'Order_Date', type: 'Date (MM-DD-YY)', desc: 'Tanggal transaksi dilakukan', example: '08-23-23' },
  { no: 3, name: 'Customer_Name', type: 'String', desc: 'Nama lengkap pelanggan', example: 'Bianca Brown' },
  { no: 4, name: 'City', type: 'String', desc: 'Kota tempat pelanggan berada', example: 'Jackson' },
  { no: 5, name: 'State', type: 'String', desc: 'Negara bagian / Provinsi', example: 'Mississippi' },
  { no: 6, name: 'Region', type: 'String', desc: 'Wilayah geografis (South, Centre, dll.)', example: 'South' },
  { no: 7, name: 'Country', type: 'String', desc: 'Negara asal transaksi', example: 'United States' },
  { no: 8, name: 'Category', type: 'String', desc: 'Kategori utama produk', example: 'Accessories' },
  { no: 9, name: 'Sub_Category', type: 'String', desc: 'Sub-kategori produk', example: 'Small Electronics' },
  { no: 10, name: 'Product_Name', type: 'String', desc: 'Nama produk yang dijual', example: 'Phone Case' },
  { no: 11, name: 'Quantity', type: 'Integer', desc: 'Jumlah unit yang terjual', example: '3' },
  { no: 12, name: 'Unit_Price', type: 'Float', desc: 'Harga per unit dalam USD', example: '201.01' },
  { no: 13, name: 'Revenue', type: 'Float', desc: 'Total pendapatan (Quantity × Unit_Price)', example: '603.03' },
  { no: 14, name: 'Profit', type: 'Float', desc: 'Keuntungan bersih dari transaksi', example: '221.49' },
];

const biTechniques = [
  {
    icon: '🔄',
    title: 'ETL (Extract-Transform-Load)',
    subtitle: 'Integration Services',
    color: '#4ea8de',
    what: 'Proses mengambil data mentah dari file CSV, membersihkan data yang tidak konsisten (seperti spasi berlebih pada nama kolom, nilai kosong, dan format yang tidak seragam), lalu menyiapkannya agar siap dianalisis.',
    result: 'Data yang tadinya berantakan menjadi rapi dan seragam. Kolom yang memiliki spasi berlebih sudah dipangkas, baris kosong dihapus, dan format tanggal diseragamkan.',
    benefit: 'Memastikan semua perhitungan dan grafik menggunakan data yang akurat dan bersih — sehingga hasil analisis bisa dipercaya.',
  },
  {
    icon: '📊',
    title: 'Analysis Services',
    subtitle: 'Analisis & Agregasi',
    color: '#8b5cf6',
    what: 'Proses mengelompokkan data berdasarkan kategori tertentu (bulan, wilayah, jenis produk), lalu menghitung total pendapatan, keuntungan, rata-rata, dan persentase.',
    result: 'Ringkasan penjualan per bulan, per kategori produk, dan per wilayah. Ditampilkan juga total pendapatan, total keuntungan, jumlah transaksi, serta tren naik-turunnya penjualan.',
    benefit: 'Membantu melihat pola dan tren penjualan tanpa harus membaca ribuan baris data satu per satu.',
  },
  {
    icon: '⛏️',
    title: 'Data Mining',
    subtitle: 'Penambangan Data',
    color: '#ec4899',
    what: 'Teknik menemukan pola tersembunyi dalam data yang tidak terlihat secara kasat mata, menggunakan algoritma statistik dan perhitungan otomatis.',
    result: 'Menemukan produk mana yang memberikan keuntungan tertinggi, pelanggan mana yang berkontribusi paling besar, dan pola musiman yang berulang setiap tahun.',
    benefit: 'Membantu bisnis membuat keputusan berdasarkan fakta dan data, bukan berdasarkan perasaan atau asumsi.',
  },
  {
    icon: '📈',
    title: 'Reporting Services',
    subtitle: 'Layanan Pelaporan',
    color: '#f59e0b',
    what: 'Mengubah data mentah menjadi laporan visual berupa grafik garis, grafik batang, grafik donat, dan tabel ringkasan yang mudah dibaca oleh siapa saja.',
    result: 'Dashboard interaktif dengan grafik yang bisa difilter berdasarkan tahun, menunjukkan tren pendapatan, perbandingan antar kategori, dan distribusi penjualan per wilayah.',
    benefit: 'Manajer dan pemilik bisnis dapat langsung memahami kondisi bisnis hanya dengan melihat sekilas — tanpa perlu membuka spreadsheet.',
  },
  {
    icon: '🎯',
    title: 'Clustering Support',
    subtitle: 'Segmentasi & Pengelompokan',
    color: '#10b981',
    what: 'Teknik mengelompokkan pelanggan atau produk ke dalam grup-grup berdasarkan kesamaan perilaku atau karakteristik, menggunakan algoritma K-Means.',
    result: 'Pelanggan dikelompokkan menjadi beberapa segmen (misalnya: pelanggan setia dengan transaksi besar, pelanggan baru dengan transaksi kecil), sehingga strategi pemasaran bisa disesuaikan untuk tiap kelompok.',
    benefit: 'Memungkinkan pendekatan yang lebih personal dan efisien dalam melayani pelanggan — menjual produk yang tepat kepada orang yang tepat.',
  },
];

const PlanningTab = () => {
  return (
    <div className="planning-container">
      {/* ── Section 1: Struktur Data ── */}
      <section className="planning-section">
        <div className="planning-section-header">
          <span className="planning-section-icon">🗂️</span>
          <div>
            <h2 className="planning-section-title">Struktur Data Dataset</h2>
            <p className="planning-section-subtitle">
              Penjelasan setiap kolom dalam file <code>product_sales_dataset_15k.csv</code> (15.000 baris data penjualan produk)
            </p>
          </div>
        </div>

        <div className="planning-table-wrapper">
          <table className="planning-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Kolom</th>
                <th>Tipe Data</th>
                <th>Deskripsi</th>
                <th>Contoh Nilai</th>
              </tr>
            </thead>
            <tbody>
              {dataStructure.map(col => (
                <tr key={col.no}>
                  <td className="planning-td-center">{col.no}</td>
                  <td><code className="planning-col-name">{col.name}</code></td>
                  <td><span className={`planning-type-badge planning-type-${col.type.split(' ')[0].toLowerCase()}`}>{col.type}</span></td>
                  <td>{col.desc}</td>
                  <td className="planning-td-example">{col.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="planning-info-box">
          <span className="planning-info-icon">ℹ️</span>
          <div>
            <strong>Catatan:</strong> Dataset ini berisi 15.000 baris data transaksi penjualan produk dari berbagai kategori dan wilayah.
            Data ini digunakan sebagai sumber utama untuk semua analisis dan visualisasi di dashboard ini.
          </div>
        </div>
      </section>

      {/* ── Section 2: Deskripsi Teknik BI ── */}
      <section className="planning-section">
        <div className="planning-section-header">
          <span className="planning-section-icon">🧠</span>
          <div>
            <h2 className="planning-section-title">Teknik BI yang Digunakan</h2>
            <p className="planning-section-subtitle">
              Penjelasan sederhana tentang setiap teknik Business Intelligence yang diterapkan di dashboard ini — ditulis agar mudah dipahami oleh siapa saja, termasuk yang bukan berlatar belakang IT.
            </p>
          </div>
        </div>

        <div className="planning-cards-grid">
          {biTechniques.map((tech, idx) => (
            <div
              className="planning-card"
              key={idx}
              style={{ '--card-accent': tech.color }}
            >
              <div className="planning-card-header">
                <span className="planning-card-icon">{tech.icon}</span>
                <div>
                  <h3 className="planning-card-title">{tech.title}</h3>
                  <span className="planning-card-subtitle">{tech.subtitle}</span>
                </div>
              </div>

              <div className="planning-card-body">
                <div className="planning-card-section">
                  <span className="planning-label">💬 Apa itu?</span>
                  <p>{tech.what}</p>
                </div>
                <div className="planning-card-section">
                  <span className="planning-label">📋 Hasilnya?</span>
                  <p>{tech.result}</p>
                </div>
                <div className="planning-card-section">
                  <span className="planning-label">✅ Manfaatnya?</span>
                  <p>{tech.benefit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PlanningTab;
