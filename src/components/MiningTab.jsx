import React, { useState, useMemo, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { getMonthlySales, forecastSales, correlationMatrix, marketBasketAnalysis } from '../utils/mining';
import { downloadCSV, downloadChartPNG } from '../utils/download';

ChartJS.register(...registerables);

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  color: 'rgba(241,245,249,0.7)',
  scales: {
    x: {
      ticks: { color: 'rgba(241,245,249,0.7)', font: { family: 'Inter' } },
      grid: { color: 'rgba(255,255,255,0.06)' },
    },
    y: {
      ticks: { color: 'rgba(241,245,249,0.7)', font: { family: 'Inter' } },
      grid: { color: 'rgba(255,255,255,0.06)' },
    },
  },
  plugins: {
    legend: {
      labels: { color: 'rgba(241,245,249,0.7)', font: { family: 'Inter' } }
    },
    tooltip: {
      bodyFont: { family: 'Inter' },
      titleFont: { family: 'Inter' }
    }
  }
};

const colors = ['#4ea8de','#7c3aed','#f72585','#2dd4bf','#fbbf24','#06d6a0','#e76f51','#8338ec','#ff6b6b','#48cae4'];

function DownloadBtn({ onClick, label, icon = '⬇️', variant = 'csv' }) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border';
  const styles = {
    csv: 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border-emerald-600/40 hover:border-emerald-500',
    png: 'bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border-sky-600/40 hover:border-sky-500',
  };
  return (
    <button onClick={onClick} className={`${base} ${styles[variant]}`} title={label}>
      {icon} {label}
    </button>
  );
}

export default function MiningTab({ data }) {
  const [forecastMonths, setForecastMonths] = useState(6);

  const forecastRef = useRef(null);
  const basketRef   = useRef(null);

  // Forecasting
  const { historical, forecast, stats } = useMemo(() => {
    if (!data || data.length === 0) return { historical: [], forecast: [], stats: {} };
    const monthlySales = getMonthlySales(data);
    const forecastResult = forecastSales(monthlySales, forecastMonths);
    return {
      historical: monthlySales,
      forecast: forecastResult.forecast,
      stats: forecastResult.regression
    };
  }, [data, forecastMonths]);

  const forecastChartData = {
    labels: [...historical.map(d => d.month), ...forecast.map(d => d.month)],
    datasets: [
      {
        label: 'Historical Sales (Data Historis)',
        data: [...historical.map(d => d.revenue), ...Array(forecast.length).fill(null)],
        borderColor: '#4ea8de',
        backgroundColor: 'rgba(78, 168, 222, 0.2)',
        fill: true,
      },
      {
        label: 'Forecast (Prediksi Proyeksi Masa Depan)',
        data: [...Array(historical.length - 1).fill(null), historical[historical.length - 1]?.revenue, ...forecast.map(d => d.predicted_revenue)],
        borderColor: '#7c3aed',
        borderDash: [5, 5],
        fill: false,
      }
    ]
  };

  // Correlation Matrix
  const correlations = useMemo(() => {
    if (!data || data.length === 0) return [];
    const result = correlationMatrix(data, ['Quantity', 'Unit_Price', 'Revenue', 'Profit']);
    return result.labels.map((label, i) => ({
      field: label,
      values: result.matrix[i]
    }));
  }, [data]);

  const getCellColor = (val) => {
    if (val > 0) return `rgba(45, 212, 191, ${Math.abs(val)})`;  // teal for positive
    if (val < 0) return `rgba(247, 37, 133, ${Math.abs(val)})`;  // pink for negative
    return 'transparent';
  };

  // Market Basket
  const basketRules = useMemo(() => {
    if (!data || data.length === 0) return [];
    const rules = marketBasketAnalysis(data).slice(0, 10);
    return rules.map(r => ({
      itemA: r.item1,
      itemB: r.item2,
      count: r.count,
      support: (r.support * 100).toFixed(2)
    }));
  }, [data]);

  const basketChartData = {
    labels: basketRules.map(r => `${r.itemA} + ${r.itemB}`),
    datasets: [{
      label: 'Frekuensi Kombinasi (Count)',
      data: basketRules.map(r => r.count),
      backgroundColor: colors.slice(0, 10),
    }]
  };

  const handleDownloadForecastCSV = () => {
    const rows = [
      ...historical.map(d => ({ Month: d.month, Revenue: d.revenue.toFixed(2), Type: 'Historical' })),
      ...forecast.map(d => ({ Month: d.month, Revenue: d.predicted_revenue.toFixed(2), Type: 'Forecast' })),
    ];
    downloadCSV(rows, 'sales_forecast');
  };

  const handleDownloadCorrelationCSV = () => {
    const fields = ['Quantity', 'Unit_Price', 'Revenue', 'Profit'];
    const rows = correlations.map(row => {
      const obj = { Field: row.field };
      row.values.forEach((v, j) => { obj[fields[j]] = v.toFixed(4); });
      return obj;
    });
    downloadCSV(rows, 'correlation_matrix');
  };

  const handleDownloadBasketCSV = () => {
    downloadCSV(
      basketRules.map(r => ({ Item_A: r.itemA, Item_B: r.itemB, Count: r.count, Support_pct: r.support })),
      'market_basket_rules'
    );
  };

  return (
    <div className="tab-content">
      {/* Overview Explanation */}
      <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(78, 168, 222, 0.3)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#38bdf8', margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 'bold' }}>
          💡 Penjelasan Teknik: Data Mining (Penambangan Data Pemasaran)
        </h4>
        <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
          Modul ini menerapkan 3 algoritma <strong>Data Mining</strong> untuk mengekstrak pengetahuan tersembunyi dari dataset penjualan: 
          (1) <em>Linear Regression Forecasting</em> untuk proyeksi penjualan, (2) <em>Pearson Correlation Matrix</em> untuk mengukur hubungan antar-variabel, dan (3) <em>Market Basket Analysis (Association Rules)</em> untuk pola pembeliaan produk bersamaan.
        </p>
      </div>

      {/* Sales Forecasting */}
      <section className="glass-card section-block">
        <div className="section-header">
          <div>
            <h2 className="text-xl font-semibold">1. Sales Forecasting (Prediksi Proyeksi Penjualan)</h2>
            <p className="text-xs text-slate-400 mt-1">Menggunakan metode Regresi Linear Time-Series untuk memprediksi tren penjualan masa depan.</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={forecastMonths} 
              onChange={e => setForecastMonths(Number(e.target.value))}
              className="bg-slate-700 text-white rounded p-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
            >
              {[3, 6, 9, 12].map(m => <option key={m} value={m}>Proyeksi {m} Bulan</option>)}
            </select>
            <DownloadBtn onClick={() => downloadChartPNG(forecastRef, 'sales_forecast_chart')} label="PNG" icon="🖼️" variant="png" />
            <DownloadBtn onClick={handleDownloadForecastCSV} label="CSV" icon="📥" variant="csv" />
          </div>
        </div>
        
        <div style={{ height: '300px' }}>
          <Line ref={forecastRef} data={forecastChartData} options={commonOptions} />
        </div>

        {stats && (
          <div className="mt-4 p-3 bg-slate-800/60 rounded-lg border border-slate-700/50 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex gap-6 text-slate-300">
              <div><span className="font-semibold text-sky-400">Kemiringan (Slope):</span> {stats.slope?.toFixed(2)}</div>
              <div><span className="font-semibold text-purple-400">Akurasi Model (R² Score):</span> {stats.r2?.toFixed(4)}</div>
              <div><span className="font-semibold text-emerald-400">Arah Tren:</span> {stats.slope > 0 ? '📈 Meningkat (Positive Trend)' : '📉 Menurun (Negative Trend)'}</div>
            </div>
          </div>
        )}

        {/* Explanation Card */}
        <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', color: '#94a3b8' }}>
          <strong style={{ color: '#fbbf24' }}>🔍 Cara Membaca Grafik Proyeksi:</strong>
          <ul style={{ margin: '0.3rem 0 0 0', paddingLeft: '1.2rem', color: '#cbd5e1' }}>
            <li><strong style={{ color: '#4ea8de' }}>Garis Biru Solid (Historical Sales)</strong>: Data aktual realisasi penjualan historis per bulan dari database.</li>
            <li><strong style={{ color: '#7c3aed' }}>Garis Putus-putus Ungu (Forecast)</strong>: Hasil matematis prediksi regresi linear untuk {forecastMonths} bulan ke depan.</li>
            <li><strong>Slope & R² Score</strong>: Slope mengindikasikan besar kenaikan/penurunan omset per bulan. R² bernilai 0-1, semakin mendekati 1 menandakan pola tren historis sangat stabil dan akurat.</li>
          </ul>
        </div>
      </section>

      {/* Correlation Matrix */}
      <section className="glass-card section-block">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">2. Correlation Matrix (Matriks Korelasi Variabel)</h2>
            <p className="text-xs text-slate-400 mt-1">Mengukur keeratan hubungan matematis antar atribut menggunakan Koefisien Korelasi Pearson (-1.0 s/d +1.0).</p>
          </div>
          <DownloadBtn onClick={handleDownloadCorrelationCSV} label="CSV" icon="📥" variant="csv" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr>
                <th className="p-3 border-b border-slate-700"></th>
                {['Quantity', 'Unit_Price', 'Revenue', 'Profit'].map(h => (
                  <th key={h} className="p-3 border-b border-slate-700 font-medium text-slate-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlations.map((row, i) => (
                <tr key={row.field}>
                  <td className="p-3 border-b border-slate-700 font-medium text-left text-slate-300">{row.field}</td>
                  {row.values.map((val, j) => (
                    <td 
                      key={j} 
                      className="p-3 border-b border-slate-700 font-semibold"
                      style={{ backgroundColor: getCellColor(val), color: Math.abs(val) > 0.5 ? '#fff' : '#cbd5e1' }}
                    >
                      {val.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Explanation Card */}
        <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', color: '#94a3b8' }}>
          <strong style={{ color: '#fbbf24' }}>🔍 Cara Membaca Matriks Korelasi:</strong>
          <ul style={{ margin: '0.3rem 0 0 0', paddingLeft: '1.2rem', color: '#cbd5e1' }}>
            <li><strong style={{ color: '#2dd4bf' }}>Warna Hijau/Teal (Positif mendekati +1.0)</strong>: Berbanding lurus. Jika variabel A naik, maka variabel B ikut naik (misal: Quantity naik → Revenue naik).</li>
            <li><strong style={{ color: '#f72585' }}>Warna Merah/Pink (Negatif mendekati -1.0)</strong>: Berbanding terbalik. Jika A naik, B justru turun.</li>
            <li><strong>Nilai 0.00</strong>: Tidak memiliki hubungan linear sama sekali.</li>
          </ul>
        </div>
      </section>

      {/* Market Basket Analysis */}
      <section className="glass-card section-block">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">3. Market Basket Analysis (Analisis Asosiasi Produk)</h2>
            <p className="text-xs text-slate-400 mt-1">Menemukan pasangan produk yang paling sering dibeli secara bersamaan dalam satu order transaksi.</p>
          </div>
          <div className="btn-group">
            <DownloadBtn onClick={() => downloadChartPNG(basketRef, 'market_basket_chart')} label="PNG" icon="🖼️" variant="png" />
            <DownloadBtn onClick={handleDownloadBasketCSV} label="CSV" icon="📥" variant="csv" />
          </div>
        </div>

        <div className="chart-grid">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-3 border-b border-slate-700 text-slate-300">Produk A</th>
                  <th className="p-3 border-b border-slate-700 text-slate-300">Produk B</th>
                  <th className="p-3 border-b border-slate-700 text-slate-300">Jumlah Pasangan (Count)</th>
                  <th className="p-3 border-b border-slate-700 text-slate-300">Dukungan (Support %)</th>
                </tr>
              </thead>
              <tbody>
                {basketRules.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 border-b border-slate-700/50 text-slate-200">{r.itemA}</td>
                    <td className="p-3 border-b border-slate-700/50 text-slate-200">{r.itemB}</td>
                    <td className="p-3 border-b border-slate-700/50 font-bold text-sky-400">{r.count} kali</td>
                    <td className="p-3 border-b border-slate-700/50 font-bold text-emerald-400">{r.support}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ height: '300px' }}>
            <Bar 
              ref={basketRef}
              data={basketChartData} 
              options={{ ...commonOptions, indexAxis: 'y' }} 
            />
          </div>
        </div>

        {/* Explanation Card */}
        <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', color: '#94a3b8' }}>
          <strong style={{ color: '#fbbf24' }}>🔍 Cara Membaca Market Basket Analysis:</strong>
          <ul style={{ margin: '0.3rem 0 0 0', paddingLeft: '1.2rem', color: '#cbd5e1' }}>
            <li><strong>Pasangan Produk (Item A + Item B)</strong>: Menunjukkan kombinasi produk yang paling sering muncul dalam transaksi yang sama.</li>
            <li><strong>Support %</strong>: Persentase seberapa sering kombinasi produk tersebut terjadi dibanding total seluruh transaksi.</li>
            <li><strong>Rekomendasi Bisnis</strong>: Pasangan produk dengan Support tinggi dapat bundel bersama (Cross-Selling) atau ditempatkan berdekatan.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
