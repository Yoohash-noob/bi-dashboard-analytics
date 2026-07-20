import React, { useState } from 'react';

const AlgorithmModal = ({ tab, isOpen, onClose }) => {
  if (!isOpen) return null;

  const [activeSubTab, setActiveSubTab] = useState('teori');

  // Content definition based on tab
  const getContent = () => {
    switch (tab) {
      case 'integration':
        return {
          title: '🔄 Integration Services (ETL & Star Schema)',
          teori: (
            <div>
              <h3>Konsep & Alur ETL</h3>
              <p>
                <strong>Extract, Transform, Load (ETL)</strong> adalah fondasi dari Data Warehouse. 
                Dalam sistem ini, ETL memproses data penjualan mentah dari CSV agar siap untuk analisis multi-dimensi.
              </p>
              <div className="theory-card">
                <h4>1. Extract (Ekstraksi)</h4>
                <p>Membaca file data mentah (CSV) menggunakan parser data terstruktur. Pada tahap ini data masih memiliki format yang tidak konsisten dan spasi berlebih pada kolom.</p>
              </div>
              <div className="theory-card">
                <h4>2. Transform (Transformasi)</h4>
                <ul>
                  <li><strong>Pembersihan Kolom:</strong> Menghapus spasi kosong (*whitespace*) pada nama kolom (misal: <code>' Revenue '</code> menjadi <code>'Revenue'</code>).</li>
                  <li><strong>Konversi Tipe Data:</strong> Mengubah kolom kuantitas menjadi <em>Integer</em>, dan nilai finansial (Harga, Pendapatan, Profit) menjadi <em>Float</em>.</li>
                  <li><strong>Standardisasi Tanggal:</strong> Mengubah format tanggal acak (seperti <code>MM/DD/YY</code> atau <code>DD-MM-YYYY</code>) menjadi format standar ISO 8601 yaitu <code>YYYY-MM-DD</code>.</li>
                  <li><strong>Filtering Data:</strong> Membuang baris data yang memiliki nilai Pendapatan bernilai 0, kosong, atau bukan angka (NaN).</li>
                </ul>
              </div>
              <div className="theory-card">
                <h4>3. Load (Pemuatan & Star Schema)</h4>
                <p>
                  Memuat data bersih ke struktur <strong>Star Schema</strong>. Model ini membagi data menjadi:
                </p>
                <ul>
                  <li><strong>1 Tabel Fakta (Fact_Sales):</strong> Menyimpan kunci asing (*foreign keys*) dan metrik kuantitatif (Quantity, Revenue, Profit).</li>
                  <li><strong>4 Tabel Dimensi:</strong> Dim_Date (Tanggal/Waktu), Dim_Customer (Pelanggan), Dim_Location (Geografis), dan Dim_Product (Katalog).</li>
                </ul>
                <p>Struktur ini mengoptimalkan performa query agregasi (OLAP) di database relasional.</p>
              </div>
            </div>
          ),
          code: `import pandas as pd
import numpy as np

def run_etl(csv_path):
    # 1. EXTRACT
    df = pd.read_csv(csv_path)
    print(f"Berhasil memuat {len(df)} baris data mentah.")
    
    # 2. TRANSFORM
    # Merapikan spasi pada header kolom
    df.columns = df.columns.str.strip()
    
    # Konversi tipe data numerik
    df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce').fillna(0).astype(int)
    for col in ['Unit_Price', 'Revenue', 'Profit']:
        if col in df.columns:
            # Hapus simbol mata uang atau karakter non-numerik jika ada
            df[col] = df[col].astype(str).str.replace(r'[^0-9.-]', '', regex=True)
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)
            
    # Standardisasi format tanggal ke YYYY-MM-DD
    df['Order_Date'] = pd.to_datetime(df['Order_Date'], errors='coerce')
    
    # Membuang baris yang tidak valid (Revenue <= 0 atau NaN)
    df = df.dropna(subset=['Order_Date', 'Revenue'])
    df = df[df['Revenue'] > 0]
    
    # 3. LOAD (Membuat Star Schema)
    # Dimensi Tanggal (Dim_Date)
    dim_date = pd.DataFrame({
        'Order_Date': df['Order_Date'].unique()
    }).reset_index().rename(columns={'index': 'Date_ID'})
    dim_date['Date_ID'] += 1 # 1-indexed
    dim_date['Year'] = dim_date['Order_Date'].dt.year
    dim_date['Month'] = dim_date['Order_Date'].dt.month
    dim_date['Quarter'] = dim_date['Order_Date'].dt.quarter
    
    # Dimensi Pelanggan (Dim_Customer)
    dim_customer = pd.DataFrame({
        'Customer_Name': df['Customer_Name'].unique()
    }).reset_index().rename(columns={'index': 'Customer_ID'})
    dim_customer['Customer_ID'] += 1
    
    # Dimensi Lokasi (Dim_Location)
    dim_location = df[['City', 'State', 'Region', 'Country']].drop_duplicates().reset_index(drop=True)
    dim_location['Location_ID'] = dim_location.index + 1
    
    # Dimensi Produk (Dim_Product)
    dim_product = df[['Category', 'Sub_Category', 'Product_Name']].drop_duplicates().reset_index(drop=True)
    dim_product['Product_ID'] = dim_product.index + 1
    
    # Membuat Tabel Fakta (Fact_Sales) dengan menghubungkan ID Dimensi
    df_merged = df.merge(dim_date, on='Order_Date') \\
                  .merge(dim_customer, on='Customer_Name') \\
                  .merge(dim_location, on=['City', 'State', 'Region', 'Country']) \\
                  .merge(dim_product, on=['Category', 'Sub_Category', 'Product_Name'])
                  
    fact_sales = df_merged[[
        'Order_ID', 'Date_ID', 'Customer_ID', 'Location_ID', 'Product_ID', 
        'Quantity', 'Unit_Price', 'Revenue', 'Profit'
    ]].reset_index(drop=True)
    fact_sales.index.name = 'Fact_ID'
    fact_sales = fact_sales.reset_index()
    
    return {
        'fact_sales': fact_sales,
        'dim_date': dim_date,
        'dim_customer': dim_customer,
        'dim_location': dim_location,
        'dim_product': dim_product
    }`
        };
      case 'analysis':
        return {
          title: '📊 Analysis Services (OLAP Pivot Table)',
          teori: (
            <div>
              <h3>Online Analytical Processing (OLAP)</h3>
              <p>
                <strong>OLAP</strong> memfasilitasi analisis data multi-dimensi dengan kecepatan tinggi. 
                Data penjualan disusun dalam bentuk "Kubus Data" (Data Cube) agar pengguna dapat melihat metrik bisnis dari berbagai sudut pandang (dimensi).
              </p>
              <div className="theory-card">
                <h4>Konsep & Operasi OLAP</h4>
                <ul>
                  <li><strong>Roll-Up (Agregasi):</strong> Menggabungkan data ke tingkat yang lebih tinggi sepanjang hierarki dimensi (misal: menggabungkan data transaksi harian menjadi bulanan atau tahunan).</li>
                  <li><strong>Drill-Down (Detailing):</strong> Kebalikan dari Roll-Up. Memecah data agregat menjadi lebih detail (misal: melihat profit total kategori, lalu di-drill-down untuk melihat profit per sub-kategori).</li>
                  <li><strong>Slice & Dice:</strong> Mengambil sebagian data (*Slice*) berdasarkan kriteria tertentu (misal: hanya melihat Region 'West'), atau memotong data dari beberapa dimensi untuk membentuk tabel baru (*Dice*).</li>
                </ul>
              </div>
              <div className="theory-card">
                <h4>Algoritma Agregasi Pivot Table</h4>
                <p>
                  Sistem melakukan iterasi terhadap dataset bersih, menyaring data berdasarkan filter aktif (Tahun, Wilayah, Kategori), lalu melakukan pengelompokan (*grouping*) bertingkat menggunakan struktur Map:
                </p>
                <ul>
                  <li><strong>Kunci Baris (Row Dimension):</strong> Kategori, Wilayah, Negara, dll.</li>
                  <li><strong>Kunci Kolom (Column Dimension):</strong> Tahun, Kuartal, Bulan, dll.</li>
                  <li><strong>Metrik (Measures):</strong> 
                    <ul>
                      <li>Revenue / Profit / Quantity: Dijumlahkan secara kumulatif (Σx).</li>
                      <li>Avg Unit Price: Dihitung menggunakan rata-rata (Σx / n).</li>
                      <li>Profit Margin %: Dihitung di akhir menggunakan rumus: (Σ Profit / Σ Revenue) × 100.</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          ),
          code: `# Implementasi OLAP Pivot Table Dinamis menggunakan Pandas di Python

import pandas as pd

def generate_olap_pivot(df, row_dim, col_dim, measure, filters=None):
    """
    Menghasilkan agregasi Pivot Table OLAP dinamis.
    
    Parameters:
    - df: DataFrame data penjualan bersih
    - row_dim: Dimensi untuk baris (misal: 'Category')
    - col_dim: Dimensi untuk kolom (misal: 'Year')
    - measure: Metrik agregasi ('Revenue', 'Profit', 'Quantity', dll)
    - filters: Dictionary filter aktif, contoh: {'Region': 'East', 'Year': 2023}
    """
    filtered_df = df.copy()
    
    # 1. Terapkan Slice (Filtering)
    if filters:
        for dim, val in filters.items():
            if val and val != 'Semua':
                filtered_df = filtered_df[filtered_df[dim] == val]
                
    # 2. Lakukan Agregasi OLAP berdasarkan Metrik
    if measure == 'Profit_Margin':
        # Profit Margin memerlukan agregasi jumlah Profit & Revenue terlebih dahulu
        pivot_raw = filtered_df.pivot_table(
            index=row_dim,
            columns=col_dim,
            values=['Profit', 'Revenue'],
            aggfunc='sum',
            fill_value=0
        )
        # Hitung Rasio Margin (%)
        pivot = (pivot_raw['Profit'] / pivot_raw['Revenue']) * 100
        pivot = pivot.fillna(0)
    elif measure == 'Avg_Unit_Price':
        # Menggunakan fungsi Rata-rata (mean)
        pivot = filtered_df.pivot_table(
            index=row_dim,
            columns=col_dim,
            values='Unit_Price',
            aggfunc='mean',
            fill_value=0
        )
    else:
        # Untuk Revenue, Profit, dan Quantity menggunakan fungsi Jumlah (sum)
        pivot = filtered_df.pivot_table(
            index=row_dim,
            columns=col_dim,
            values=measure,
            aggfunc='sum',
            fill_value=0
        )
        
    # 3. Tambahkan baris/kolom Grand Total (Roll-up Total)
    pivot['Grand Total'] = pivot.sum(axis=1) if measure != 'Avg_Unit_Price' else pivot.mean(axis=1)
    
    return pivot`
        };
      case 'mining':
        return {
          title: '⛏️ Data Mining (Forecasting & Korelasi)',
          teori: (
            <div>
              <h3>Teknik Data Mining Terapan</h3>
              <p>
                Data Mining mengekstrak pola tersembunyi dari data historis. Web ini menerapkan tiga metode penting:
              </p>
              
              <div className="theory-card">
                <h4>1. Peramalan Deret Waktu (Linear Regression Forecasting)</h4>
                <p>
                  Memprediksi penjualan masa depan menggunakan metode <strong>Ordinary Least Squares (OLS)</strong>. 
                  Model membuat garis tren linear:
                </p>
                <div className="formula-block">
                  {`y = m * x + c`}
                </div>
                <p>Di mana:</p>
                <ul>
                  <li>y: Nilai prediksi (Revenue/Profit)</li>
                  <li>x: Indeks waktu (Bulan ke-n)</li>
                  <li>m (Slope/Kemiringan)</li>
                  <li>c (Intercept/Konstanta)</li>
                </ul>
                <p>
                  <strong>Koefisien Determinasi (R²)</strong> mengukur akurasi garis prediksi, berkisar antara 0 hingga 1.
                </p>
              </div>

              <div className="theory-card">
                <h4>2. Analisis Hubungan (Pearson Correlation Coefficient)</h4>
                <p>
                  Mengukur kekuatan dan arah hubungan linear antara dua variabel numerik (misal: Quantity vs Profit).
                </p>
                <ul>
                  <li>r = 1: Hubungan positif sempurna.</li>
                  <li>r = -1: Hubungan negatif sempurna (bertolak belakang).</li>
                  <li>r = 0: Tidak ada hubungan linear.</li>
                </ul>
              </div>

              <div className="theory-card">
                <h4>3. Market Basket Analysis (Asosiasi Co-occurrence)</h4>
                <p>
                  Mengidentifikasi kategori produk yang sering dibeli bersama dalam satu keranjang belanja. 
                  Sistem menghitung nilai <strong>Support</strong>, yaitu persentase transaksi yang mengandung Kombinasi Produk A & B terhadap total transaksi keseluruhan.
                </p>
              </div>
            </div>
          ),
          code: `# Implementasi Data Mining di Python menggunakan Numpy, Scipy, dan Pandas

import numpy as np
import pandas as pd
from scipy.stats import pearsonr

# 1. LINEAR REGRESSION FORECASTING (OLS)
def forecast_sales(monthly_data, months_ahead=6):
    """
    Prediksi penjualan bulanan menggunakan Regresi Linear OLS
    - monthly_data: DataFrame dengan kolom ['Revenue'] diindeks oleh urutan bulan
    """
    y = monthly_data['Revenue'].values
    x = np.arange(len(y))
    
    # Hitung Slope (m) dan Intercept (c)
    m, c = np.polyfit(x, y, 1)
    
    # Hitung R-squared (R2) untuk melihat akurasi
    y_pred = m * x + c
    ss_res = np.sum((y - y_pred) ** 2)
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
    
    # Prediksi N bulan ke depan
    x_forecast = np.arange(len(y), len(y) + months_ahead)
    forecast_values = m * x_forecast + c
    
    return {
        'slope': m,
        'intercept': c,
        'r2': r2,
        'forecast': forecast_values.tolist()
    }

# 2. PEARSON CORRELATION MATRIX
def get_correlation_matrix(df):
    """
    Menghitung koefisien korelasi Pearson antar variabel numerik
    """
    fields = ['Quantity', 'Unit_Price', 'Revenue', 'Profit']
    corr_matrix = df[fields].corr(method='pearson')
    return corr_matrix

# 3. MARKET BASKET ANALYSIS (Co-occurrence)
def market_basket_analysis(df):
    """
    Menganalisis hubungan asosiasi pembelian kategori produk secara bersamaan
    """
    # Kelompokkan produk berdasarkan ID Transaksi (Order_ID)
    transactions = df.groupby('Order_ID')['Category'].apply(list).tolist()
    
    # Buat kamus hitungan pasangan
    co_occurrence = {}
    total_transactions = len(transactions)
    
    for items in transactions:
        unique_items = sorted(list(set(items)))
        for i in range(len(unique_items)):
            for j in range(i + 1, len(unique_items)):
                pair = (unique_items[i], unique_items[j])
                co_occurrence[pair] = co_occurrence.get(pair, 0) + 1
                
    # Hitung persentase Support
    mba_results = []
    for pair, count in co_occurrence.items():
        support = (count / total_transactions) * 100
        mba_results.append({
            'Item_A': pair[0],
            'Item_B': pair[1],
            'Count': count,
            'Support_%': round(support, 2)
        })
        
    # Urutkan berdasarkan kemunculan terbanyak
    mba_df = pd.DataFrame(mba_results)
    return mba_df.sort_values(by='Count', ascending=False).head(10)`
        };
      case 'clustering':
        return {
          title: '🎯 Clustering Support (Segmentasi K-Means)',
          teori: (
            <div>
              <h3>Segmentasi dengan Algoritma K-Means</h3>
              <p>
                <strong>K-Means</strong> adalah algoritma pembelajaran tanpa pengawasan (*unsupervised learning*) 
                yang mempartisi data menjadi K kelompok (cluster) berdasarkan kemiripan jarak fitur.
              </p>
              
              <div className="theory-card">
                <h4>Langkah-Langkah Algoritma K-Means Terapan:</h4>
                <ol>
                  <li>
                    <strong>Normalisasi Min-Max:</strong> Mencegah fitur dengan rentang nilai besar (seperti total Revenue) mendominasi fitur dengan nilai kecil (seperti Kuantitas Pembelian).
                    <div className="formula-block">
                      {`x_scaled = (x - x_min) / (x_max - x_min)`}
                    </div>
                    Nilai akhir data akan terkompresi di rentang [0, 1].
                  </li>
                  <li>
                    <strong>Inisialisasi K-Means++:</strong> Memilih titik pusat cluster (*centroid*) awal secara cerdas dengan menempatkannya sejauh mungkin satu sama lain. Ini mencegah algoritma terjebak pada solusi suboptimal (lokal minimum).
                  </li>
                  <li>
                    <strong>Perhitungan Jarak Euclidean:</strong> Mengukur jarak antara setiap titik data x dengan pusat cluster c pada ruang 2 dimensi (X-axis vs Y-axis).
                    <div className="formula-block">
                      {`d(x, c) = √((x1 - c1)² + (x2 - c2)²)`}
                    </div>
                  </li>
                  <li>
                    <strong>Asosiasi Titik:</strong> Memasukkan data ke dalam cluster yang memiliki centroid terdekat dengannya.
                  </li>
                  <li>
                    <strong>Update Centroid:</strong> Menghitung ulang lokasi centroid baru dengan mencari rata-rata koordinat dari seluruh anggota cluster tersebut.
                  </li>
                  <li>
                    <strong>Konvergensi:</strong> Mengulangi langkah 3 sampai 5 hingga posisi centroid tidak lagi berpindah secara signifikan, atau batas maksimum iterasi tercapai.
                  </li>
                </ol>
              </div>

              <div className="theory-card">
                <h4>Profil Segmentasi Pelanggan (Interpretasi Bisnis)</h4>
                <ul>
                  <li><strong>Pembeli VIP (VIP Customer):</strong> Anggota cluster dengan Revenue tinggi dan Kuantitas belanja tinggi.</li>
                  <li><strong>Premium/Grosir (Wholesale/Premium):</strong> Anggota cluster dengan Revenue tinggi namun Kuantitas sedang, atau sebaliknya.</li>
                  <li><strong>Pelanggan Kasual (Casual Buyer):</strong> Anggota cluster dengan kontribusi Revenue dan Kuantitas rendah.</li>
                </ul>
              </div>
            </div>
          ),
          code: `# Implementasi Segmentasi K-Means di Python menggunakan Scikit-Learn

import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import MinMaxScaler

def segment_customers(df, k_clusters=4):
    """
    Melakukan clustering pelanggan berdasarkan total belanja (Revenue) dan kuantitas barang
    """
    # 1. Agregasi Data per Pelanggan
    customer_features = df.groupby('Customer_Name').agg(
        Total_Revenue=('Revenue', 'sum'),
        Total_Quantity=('Quantity', 'sum'),
        Avg_Unit_Price=('Unit_Price', 'mean'),
        Total_Profit=('Profit', 'sum')
    ).reset_index()
    
    # 2. Min-Max Normalization (Skala 0 - 1)
    scaler = MinMaxScaler()
    scaled_features = scaler.fit_transform(
        customer_features[['Total_Revenue', 'Total_Quantity']]
    )
    
    # 3. Jalankan K-Means dengan inisialisasi k-means++
    kmeans = KMeans(
        n_clusters=k_clusters,
        init='k-means++',
        max_iter=300,
        random_state=42
    )
    
    customer_features['Cluster_ID'] = kmeans.fit_predict(scaled_features)
    centroids = kmeans.cluster_centers_
    
    # Denormalisasi koordinat centroid untuk visualisasi nilai asli
    original_centroids = scaler.inverse_transform(centroids)
    
    # 4. Berikan Label Bisnis berdasarkan nilai centroid
    # Mengurutkan cluster berdasarkan kontribusi rata-rata Revenue
    cluster_summary = customer_features.groupby('Cluster_ID')['Total_Revenue'].mean().sort_values()
    labels_mapping = {}
    
    names = ['Casual Buyer', 'Regular Customer', 'High Value', 'VIP Platinum']
    for idx, (cluster_id, _) in enumerate(cluster_summary.items()):
        labels_mapping[cluster_id] = names[min(idx, len(names)-1)]
        
    customer_features['Segment_Profile'] = customer_features['Cluster_ID'].map(labels_mapping)
    
    return customer_features, original_centroids`
        };
      default:
        return { title: '', teori: '', code: '' };
    }
  };

  const content = getContent();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{content.title}</h2>
          <button className="btn-close-modal" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`modal-tab-btn ${activeSubTab === 'teori' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('teori')}
          >
            📖 Penjelasan & Rumus
          </button>
          <button 
            className={`modal-tab-btn ${activeSubTab === 'kode' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('kode')}
          >
            🐍 Kode Python (Pandas/ML)
          </button>
        </div>

        <div className="modal-body">
          {activeSubTab === 'teori' ? (
            <div className="theory-section">
              {content.teori}
            </div>
          ) : (
            <div className="code-section">
              <h3>Implementasi Algoritma di Python</h3>
              <p>Berikut adalah potongan kode Python standar industri yang memproses logika bisnis yang serupa dengan teknik BI ini:</p>
              <pre className="code-block">
                <code>{content.code}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlgorithmModal;
