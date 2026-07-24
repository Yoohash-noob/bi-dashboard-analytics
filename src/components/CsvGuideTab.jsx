import React from 'react';

const CsvGuideTab = () => {
  const columns = [
    { name: 'Order_Date', type: 'Tanggal (MM-DD-YY atau YYYY-MM-DD)', req: 'Wajib', desc: 'Tanggal dilakukannya transaksi. Contoh: 07-21-26 atau 2026-07-21' },
    { name: 'Customer_Name', type: 'Teks', req: 'Opsional', desc: 'Nama pelanggan yang melakukan transaksi.' },
    { name: 'City', type: 'Teks', req: 'Opsional', desc: 'Kota lokasi transaksi.' },
    { name: 'State', type: 'Teks', req: 'Opsional', desc: 'Provinsi/Negara Bagian lokasi transaksi.' },
    { name: 'Region', type: 'Teks', req: 'Opsional', desc: 'Wilayah penjualan. Contoh: East, West, South, Central' },
    { name: 'Category', type: 'Teks', req: 'Opsional', desc: 'Kategori produk. Contoh: Technology, Furniture, Office Supplies' },
    { name: 'Sub_Category', type: 'Teks', req: 'Opsional', desc: 'Sub-kategori produk.' },
    { name: 'Product_Name', type: 'Teks', req: 'Opsional', desc: 'Nama produk yang terjual.' },
    { name: 'Quantity', type: 'Angka (Integer)', req: 'Wajib', desc: 'Jumlah barang yang dibeli. Harus berupa angka bulat.' },
    { name: 'Unit_Price', type: 'Angka (Decimal/Float)', req: 'Wajib', desc: 'Harga per unit barang.' },
    { name: 'Revenue', type: 'Angka (Decimal/Float)', req: 'Wajib', desc: 'Total pendapatan dari transaksi (Quantity * Unit_Price).' },
    { name: 'Profit', type: 'Angka (Decimal/Float)', req: 'Wajib', desc: 'Total keuntungan bersih dari transaksi.' },
  ];

  return (
    <div className="admin-panel fadeIn">
      <div className="admin-welcome">
        <h2 className="admin-welcome-title">📖 Panduan Format Database CSV</h2>
        <p className="admin-welcome-subtitle">
          Gunakan panduan berikut untuk memastikan file CSV yang Anda unggah dapat diproses dengan benar oleh sistem ETL.
        </p>
      </div>

      <div className="glass-card-neon" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#4ea8de' }}>
          ⚠️ Kolom Wajib (Required Columns)
        </h3>
        <p style={{ color: 'rgba(241, 245, 249, 0.7)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          Agar 5 teknik BI (Integration, Analysis, Mining, Reporting, Clustering) dapat dihitung dan divisualisasikan tanpa error, file CSV Anda <strong>wajib memiliki header kolom</strong> berikut (penulisan huruf besar/kecil tidak sensitif, spasi di ujung nama kolom akan otomatis dibersihkan oleh sistem):
        </p>

        <div className="acct-table-wrapper" style={{ padding: 0, border: 'none', background: 'transparent' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Kolom</th>
                <th>Tipe Data</th>
                <th>Status</th>
                <th>Keterangan & Contoh</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: col.req === 'Wajib' ? '#4ea8de' : '#f1f5f9' }}>
                    {col.name}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(241, 245, 249, 0.6)' }}>
                    {col.type}
                  </td>
                  <td>
                    <span className={`acct-role-badge ${col.req === 'Wajib' ? 'admin' : 'user'}`}>
                      {col.req}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'rgba(241, 245, 249, 0.8)' }}>
                    {col.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card-neon" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#2dd4bf' }}>
          💡 Tips & Troubleshooting
        </h3>
        <ul style={{ color: 'rgba(241, 245, 249, 0.7)', fontSize: '0.875rem', lineHeight: '1.8', paddingLeft: '1.25rem' }}>
          <li>
            <strong>Separator / Pembatas:</strong> Pastikan file menggunakan pembatas koma (<code>,</code>). Jika file Anda menggunakan titik koma (<code>;</code>), Anda bisa mengonversinya terlebih dahulu di Excel.
          </li>
          <li>
            <strong>Nama Header Bersih:</strong> Jika header kolom Anda mengandung spasi (misalnya <code>" Revenue "</code> atau <code>"Profit"</code>), sistem ETL kami akan otomatis merapikan spasi tersebut agar tetap terbaca.
          </li>
          <li>
            <strong>Dataset Demo:</strong> Jika Anda tidak memiliki dataset sendiri saat ini, Anda bisa menekan tombol <strong>"Muat Dataset Sampel"</strong> di tab <strong>Beranda Admin</strong> untuk langsung mencoba seluruh visualisasi.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CsvGuideTab;
