import React from 'react';

const DescriptionModal = ({ tab, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getDescription = () => {
    switch (tab) {
      case 'integration':
        return {
          title: '🔄 Deskripsi Hasil — Integration Services',
          icon: '🔄',
          color: '#4ea8de',
          sections: [
            {
              heading: 'Hasil ETL Pipeline',
              content: 'Bagian ini menampilkan hasil proses pembersihan data (ETL). Terdapat 3 kartu yang merepresentasikan tahap Extract, Transform, dan Load. Angka pada kartu Extract menunjukkan jumlah baris data mentah yang berhasil dibaca, sedangkan angka pada kartu Load menunjukkan jumlah data bersih yang lolos validasi. Jika selisihnya besar, artinya banyak data yang tidak valid dan harus dibuang.',
            },
            {
              heading: 'Cara Membaca Log ETL',
              items: [
                { label: 'Log berwarna hijau (✅)', desc: 'Menandakan tahapan berhasil dieksekusi tanpa masalah. Contoh: "Berhasil membersihkan 14.832 baris data".' },
                { label: 'Log berwarna biru (🔄/📦)', desc: 'Menandakan proses sedang berjalan atau sedang memuat data. Ini bersifat informatif.' },
                { label: 'Log berwarna kuning (⚠)', desc: 'Menandakan ada data yang bermasalah dan dibuang, misalnya baris dengan Revenue kosong atau bernilai 0.' },
              ]
            },
            {
              heading: 'Cara Membaca Star Schema',
              content: 'Diagram di bawah log menunjukkan struktur Star Schema. Tabel pusat (Fact_Sales) menyimpan data transaksi utama. Empat tabel di bawahnya (Dim_Date, Dim_Customer, Dim_Location, Dim_Product) adalah tabel dimensi yang memisahkan atribut deskriptif agar query analisis berjalan lebih efisien. Angka "unique" pada tiap dimensi menunjukkan jumlah entitas unik yang teridentifikasi dari data.',
            },
            {
              heading: 'Output yang Bisa Diunduh',
              content: 'Tombol "Download SQL Schema" menghasilkan file SQL berisi perintah CREATE TABLE sesuai Star Schema. Tombol "Download Data Bersih" menghasilkan file CSV berisi data yang sudah melewati proses ETL dan siap dianalisis lebih lanjut.',
            }
          ]
        };

      case 'analysis':
        return {
          title: '📊 Deskripsi Hasil — Analysis Services',
          icon: '📊',
          color: '#7c3aed',
          sections: [
            {
              heading: 'Cara Membaca Pivot Table',
              content: 'Tabel pivot menampilkan data yang sudah diagregasi berdasarkan dimensi baris dan kolom yang dipilih. Setiap sel berisi nilai metrik (Revenue, Profit, dll.) yang sudah dijumlahkan untuk kombinasi baris dan kolom tersebut. Kolom "Total" di sisi kanan menunjukkan total per baris, sedangkan baris "Grand Total" di bawah menunjukkan total keseluruhan per kolom.',
            },
            {
              heading: 'Memahami Angka dalam Tabel',
              items: [
                { label: 'Revenue', desc: 'Total pendapatan kotor dari seluruh transaksi pada kombinasi dimensi tersebut.' },
                { label: 'Profit', desc: 'Total keuntungan bersih setelah dikurangi biaya. Jika negatif, artinya terjadi kerugian pada segmen tersebut.' },
                { label: 'Quantity', desc: 'Total jumlah unit barang yang terjual.' },
                { label: 'Avg Unit Price', desc: 'Rata-rata harga per unit barang. Berguna untuk membandingkan segmen harga antar kategori.' },
                { label: 'Profit Margin', desc: 'Rasio keuntungan terhadap pendapatan dalam persen. Nilai di atas 20% umumnya dianggap baik.' },
              ]
            },
            {
              heading: 'Fitur Drill-Down',
              content: 'Klik pada baris yang memiliki ikon ▶ untuk melihat rincian level di bawahnya. Misalnya, jika dimensi baris adalah Category, klik pada "Technology" untuk melihat breakdown per Sub_Category (Phones, Accessories, dll). Data sub-baris juga sudah teragregasi sesuai metrik yang dipilih.',
            },
            {
              heading: 'Filter & Dimensi',
              content: 'Dropdown filter di atas tabel berfungsi untuk menyaring data sebelum diagregasi. Jika Region diset ke "East", maka seluruh angka di tabel hanya menampilkan data wilayah East. Perubahan dimensi baris/kolom akan merestrukturisasi tabel secara real-time.',
            }
          ]
        };

      case 'mining':
        return {
          title: '⛏️ Deskripsi Hasil — Data Mining',
          icon: '⛏️',
          color: '#f72585',
          sections: [
            {
              heading: 'Cara Membaca Grafik Forecasting',
              content: 'Grafik menampilkan tren penjualan bulanan. Garis solid menunjukkan data historis (aktual), sedangkan garis putus-putus menunjukkan prediksi ke depan. Jika garis prediksi naik, tren penjualan sedang positif. Nilai R² di samping grafik menunjukkan akurasi model — semakin mendekati 1.0, semakin akurat prediksinya. R² di bawah 0.5 berarti pola penjualan cukup fluktuatif dan prediksi kurang andal.',
            },
            {
              heading: 'Cara Membaca Matriks Korelasi',
              items: [
                { label: 'Nilai mendekati +1 (warna merah/gelap)', desc: 'Kedua variabel bergerak searah. Contoh: Revenue dan Profit bernilai +0.9 artinya ketika Revenue naik, Profit juga cenderung naik.' },
                { label: 'Nilai mendekati -1 (warna biru)', desc: 'Kedua variabel bergerak berlawanan. Jarang terjadi di data penjualan, tapi bisa terjadi misalnya antara diskon besar dan profit.' },
                { label: 'Nilai mendekati 0 (warna netral)', desc: 'Tidak ada hubungan linear yang signifikan antara kedua variabel tersebut.' },
              ]
            },
            {
              heading: 'Cara Membaca Market Basket Analysis',
              content: 'Tabel menampilkan pasangan kategori produk yang paling sering dibeli bersamaan oleh pelanggan yang sama. Kolom "Count" menunjukkan berapa kali kombinasi tersebut muncul, dan kolom "Support %" menunjukkan persentase pelanggan yang membeli keduanya dari total seluruh pelanggan. Support di atas 10% menandakan asosiasi yang cukup kuat dan layak dipertimbangkan untuk strategi bundling.',
            },
          ]
        };

      case 'reporting':
        return {
          title: '📈 Deskripsi Hasil — Reporting Services',
          icon: '📈',
          color: '#2dd4bf',
          sections: [
            {
              heading: 'Cara Membaca KPI Cards',
              items: [
                { label: 'Total Revenue', desc: 'Akumulasi seluruh nilai penjualan. Angka ini menjadi indikator utama volume bisnis.' },
                { label: 'Total Profit', desc: 'Akumulasi keuntungan bersih. Bandingkan dengan Revenue untuk menilai efisiensi operasional.' },
                { label: 'Total Pelanggan', desc: 'Jumlah pelanggan unik yang pernah bertransaksi. Berguna untuk mengukur jangkauan pasar.' },
                { label: 'Rata-rata Nilai Pesanan', desc: 'Revenue dibagi jumlah order unik. Jika angka ini meningkat dari waktu ke waktu, artinya pelanggan cenderung belanja lebih banyak per transaksi.' },
              ]
            },
            {
              heading: 'Grafik Revenue per Kategori',
              content: 'Grafik batang menunjukkan perbandingan total penjualan antar kategori produk. Kategori dengan batang paling tinggi adalah kontributor pendapatan terbesar. Informasi ini berguna untuk menentukan prioritas stok dan alokasi budget pemasaran.',
            },
            {
              heading: 'Grafik Tren Bulanan',
              content: 'Grafik garis menampilkan pergerakan Revenue dan Profit dari bulan ke bulan. Perhatikan pola naik-turun — jika ada lonjakan di bulan tertentu, bisa jadi karena musim belanja atau promo. Penurunan berturut-turut perlu diinvestigasi lebih lanjut.',
            },
            {
              heading: 'Top 10 Produk & Pelanggan',
              content: 'Tabel ranking menampilkan 10 produk/pelanggan dengan kontribusi Revenue tertinggi. Ini membantu identifikasi produk andalan dan pelanggan bernilai tinggi (high-value customer) yang perlu mendapat perhatian khusus.',
            },
          ]
        };

      case 'clustering':
        return {
          title: '🎯 Deskripsi Hasil — Clustering Support',
          icon: '🎯',
          color: '#fbbf24',
          sections: [
            {
              heading: 'Cara Membaca Scatter Plot',
              content: 'Setiap titik pada grafik mewakili satu pelanggan (atau kota, tergantung mode yang dipilih). Posisi horizontal (sumbu X) menunjukkan total Revenue, dan posisi vertikal (sumbu Y) menunjukkan total Quantity. Titik-titik dengan warna yang sama berarti berada dalam satu cluster (kelompok) yang memiliki karakteristik belanja serupa.',
            },
            {
              heading: 'Profil Cluster',
              items: [
                { label: 'Pembeli VIP', desc: 'Cluster dengan rata-rata Revenue dan Quantity tinggi. Pelanggan ini berkontribusi besar terhadap pendapatan dan perlu dijaga loyalitasnya.' },
                { label: 'Pembeli Premium', desc: 'Revenue cukup tinggi namun frekuensi atau quantity lebih rendah. Biasanya membeli produk bernilai tinggi dalam jumlah terbatas.' },
                { label: 'Pembeli Grosir', desc: 'Quantity tinggi namun Revenue per unit relatif rendah. Cenderung membeli produk murah dalam jumlah besar.' },
                { label: 'Pembeli Kasual', desc: 'Revenue dan Quantity rendah. Merupakan segmen terbesar secara jumlah pelanggan, potensial untuk ditingkatkan melalui promo atau retensi.' },
              ]
            },
            {
              heading: 'Statistik Cluster',
              content: 'Kartu profil menampilkan jumlah anggota tiap cluster, rata-rata Revenue, rata-rata Quantity, dan profit margin. Perbandingan antar cluster membantu menentukan strategi pemasaran yang berbeda — misalnya program loyalitas untuk VIP, promo volume untuk Grosir, dan diskon first-time untuk Kasual.',
            },
            {
              heading: 'Jumlah Cluster (K)',
              content: 'Nilai K yang dipilih (default: 4) menentukan berapa kelompok yang dibentuk. K yang terlalu kecil membuat pengelompokan terlalu umum, K yang terlalu besar membuat perbedaan antar kelompok tidak signifikan. Coba variasikan nilai K dan perhatikan apakah profil cluster yang terbentuk masih memiliki perbedaan yang bermakna.',
            }
          ]
        };

      default:
        return null;
    }
  };

  const desc = getDescription();
  if (!desc) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="desc-modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="desc-modal-header" style={{ borderColor: desc.color }}>
          <h2 className="desc-modal-title">{desc.title}</h2>
          <button className="btn-close-modal" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="desc-modal-body">
          {desc.sections.map((section, idx) => (
            <div key={idx} className="desc-section">
              <h3 className="desc-section-heading" style={{ color: desc.color }}>
                {section.heading}
              </h3>

              {section.content && (
                <p className="desc-section-text">{section.content}</p>
              )}

              {section.items && (
                <div className="desc-items">
                  {section.items.map((item, i) => (
                    <div key={i} className="desc-item" style={{ borderLeftColor: desc.color }}>
                      <span className="desc-item-label">{item.label}</span>
                      <span className="desc-item-desc">{item.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Footer tip */}
          <div className="desc-footer-tip">
            <span className="desc-tip-icon">💡</span>
            <span>Untuk melihat rumus dan kode Python di balik teknik ini, klik tombol <strong>"Lihat Logika & Proses ⚙️"</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DescriptionModal;
