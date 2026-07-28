import React, { useState, useMemo, useRef } from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { kMeansClustering, prepareCustomerData, prepareCityData, getClusterProfiles } from '../utils/clustering';
import { downloadCSV, downloadChartPNG } from '../utils/download';

ChartJS.register(...registerables);

const colors = ['#4ea8de','#7c3aed','#f72585','#2dd4bf','#fbbf24','#06d6a0'];

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

export default function ClusteringTab({ data }) {
  const [mode, setMode] = useState('customer'); // 'customer' | 'city'
  const [k, setK] = useState(4);
  const [xAxis, setXAxis] = useState('totalRevenue');
  const [yAxis, setYAxis] = useState('totalProfit');
  const [triggerRun, setTriggerRun] = useState(0);

  const scatterRef = useRef(null);

  const { chartData, profiles, info, rawPoints } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: null, profiles: [], info: {}, rawPoints: [] };
    
    // Prepare Data
    const preparedData = mode === 'customer' ? prepareCustomerData(data) : prepareCityData(data);
    if (preparedData.length === 0) return { chartData: null, profiles: [], info: {}, rawPoints: [] };

    // Map prepared data so x and y have the selected xAxis and yAxis variables
    const mappedData = preparedData.map(item => ({
      ...item,
      x: item[xAxis],
      y: item[yAxis],
      id: item.label
    }));

    // Run Clustering on normalized dynamically selected x and y
    const result = kMeansClustering(mappedData, k);
    
    // Profiles
    const clusterProfiles = getClusterProfiles(result);

    // Build flat raw points for CSV export
    const pts = [];
    result.clusters.forEach((cluster, i) => {
      cluster.points.forEach(p => {
        pts.push({
          Cluster: `Cluster ${i + 1}`,
          Label: p.id,
          [xAxis]: p.x,
          [yAxis]: p.y,
        });
      });
    });

    // Chart Datasets
    const datasets = [];
    result.clusters.forEach((cluster, i) => {
      datasets.push({
        label: `Cluster ${i + 1}`,
        data: cluster.points.map(p => ({ x: p.x, y: p.y, label: p.id })),
        backgroundColor: colors[i % colors.length],
        pointRadius: 5,
        pointHoverRadius: 8
      });
    });

    // Centroids Dataset (White Triangles)
    datasets.push({
      label: 'Centroids (Pusat Cluster ▲)',
      data: result.centroids.map(c => ({ x: c.x, y: c.y })),
      backgroundColor: '#ffffff',
      borderColor: '#333333',
      borderWidth: 2,
      pointStyle: 'triangle',
      pointRadius: 12,
      pointHoverRadius: 15
    });

    return {
      chartData: { datasets },
      profiles: clusterProfiles,
      info: {
        iterations: result.iterations,
        k: k,
        totalPoints: preparedData.length,
        method: `K-Means Clustering pada ${mode === 'customer' ? 'Pelanggan (Customer)' : 'Kota (City)'}`
      },
      rawPoints: pts,
    };
  }, [data, mode, k, xAxis, yAxis, triggerRun]);

  const xOptions = [
    { value: 'totalRevenue', label: 'Total Revenue (Pendapatan)' },
    { value: 'avgUnitPrice', label: 'Avg Unit Price (Harga Rata-rata)' },
    { value: 'orderCount', label: 'Order Count (Jumlah Transaksi)' }
  ];
  const yOptions = [
    { value: 'totalProfit', label: 'Total Profit (Keuntungan)' },
    { value: 'totalQuantity', label: 'Total Quantity (Jumlah Unit)' },
    { value: 'profitMargin', label: 'Profit Margin (%)' }
  ];

  const handleDownloadCSV = () => {
    if (!rawPoints || rawPoints.length === 0) return;
    downloadCSV(rawPoints, `clustering_result_k${k}_${mode}`);
  };

  const handleDownloadProfiles = () => {
    if (!profiles || profiles.length === 0) return;
    const rows = profiles.map((p, i) => ({
      Cluster: `Cluster ${i + 1}`,
      Profile: p.profileName,
      Items: p.points ? p.points.length : 0,
      [`Centroid_${xAxis}`]: p.centroid?.x?.toFixed(4),
      [`Centroid_${yAxis}`]: p.centroid?.y?.toFixed(4),
    }));
    downloadCSV(rows, `cluster_profiles_k${k}_${mode}`);
  };

  const handleDownloadChart = () => {
    downloadChartPNG(scatterRef, `cluster_scatter_k${k}_${mode}`);
  };

  return (
    <div className="tab-content">
      {/* Overview Explanation */}
      <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(78, 168, 222, 0.3)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#38bdf8', margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 'bold' }}>
          💡 Penjelasan Teknik: Clustering Support (Segmentasi K-Means)
        </h4>
        <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6', margin: '0 0 0.75rem 0' }}>
          Modul ini menerapkan algoritma <strong>K-Means Clustering (Machine Learning Unsupervised)</strong> untuk mengelompokkan <strong>{mode === 'customer' ? 'Pelanggan' : 'Kota'}</strong> berdasarkan kesamaan karakteristik bisnis. Setiap titik mewakili satu entitas, dan warna menunjukkan grup/cluster tempat entitas tersebut berada.
        </p>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.8rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          <strong style={{ color: '#fbbf24' }}>Arti Simbol & Pembagian Segmen Cluster:</strong>
          <ul style={{ margin: '0.3rem 0 0 0', paddingLeft: '1.2rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            <li><strong>Segitiga Putih ▲ (Centroids)</strong>: Titik pusat geometris dari suatu kelompok (Rata-rata posisi cluster).</li>
            <li><strong style={{ color: '#4ea8de' }}>Pembeli VIP</strong>: High Revenue & High Profit (Pelanggan/Kota berkontribusi paling besar).</li>
            <li><strong style={{ color: '#7c3aed' }}>Premium</strong>: High Revenue & Low Profit (Volume besar tetapi marjin tipis).</li>
            <li><strong style={{ color: '#f72585' }}>Grosir</strong>: Low Revenue & High Profit (Volume kecil namun marjin sangat menguntungkan).</li>
            <li><strong style={{ color: '#2dd4bf' }}>Kasual</strong>: Low Revenue & Low Profit (Kelompok umum berskala kecil).</li>
          </ul>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="glass-card section-block">
        <h2 className="text-xl font-bold mb-4">Pengaturan Parameter K-Means</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Entitas Segmentasi (Mode)</label>
            <select 
              value={mode} 
              onChange={e => setMode(e.target.value)}
              className="bg-slate-700 text-white rounded p-2 border border-slate-600 focus:ring-2 focus:ring-teal-500"
            >
              <option value="customer">Pelanggan (Customer)</option>
              <option value="city">Kota (City)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Jumlah Cluster (K)</label>
            <select 
              value={k} 
              onChange={e => setK(Number(e.target.value))}
              className="bg-slate-700 text-white rounded p-2 border border-slate-600 focus:ring-2 focus:ring-teal-500"
            >
              {[2,3,4,5,6].map(v => <option key={v} value={v}>{v} Cluster</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Sumbu Horizontal (X-Axis)</label>
            <select 
              value={xAxis} 
              onChange={e => setXAxis(e.target.value)}
              className="bg-slate-700 text-white rounded p-2 border border-slate-600 focus:ring-2 focus:ring-teal-500"
            >
              {xOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Sumbu Vertikal (Y-Axis)</label>
            <select 
              value={yAxis} 
              onChange={e => setYAxis(e.target.value)}
              className="bg-slate-700 text-white rounded p-2 border border-slate-600 focus:ring-2 focus:ring-teal-500"
            >
              {yOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <button 
            onClick={() => setTriggerRun(prev => prev + 1)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-teal-500"
          >
            ⚡ Hitung Ulang Clustering
          </button>
        </div>
      </div>

      <div className="chart-grid">
        {/* Scatter Plot */}
        <div className="lg:col-span-2 glass-card section-block flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Cluster Scatter Plot (Diagram Sebar Multi-Variabel)</h3>
              <p className="text-xs text-slate-400 mt-1">Sumbu X: {xAxis} vs Sumbu Y: {yAxis}</p>
            </div>
            <div className="btn-group">
              <DownloadBtn onClick={handleDownloadChart} label="PNG" icon="🖼️" variant="png" />
              <DownloadBtn onClick={handleDownloadCSV} label="CSV Data" icon="📥" variant="csv" />
            </div>
          </div>
          <div className="flex-grow" style={{ minHeight: '420px' }}>
            {chartData && (
              <Scatter 
                ref={scatterRef}
                options={{
                  ...commonOptions,
                  scales: {
                    x: { ...commonOptions.scales.x, title: { display: true, text: xAxis, color: 'rgba(255,255,255,0.7)' } },
                    y: { ...commonOptions.scales.y, title: { display: true, text: yAxis, color: 'rgba(255,255,255,0.7)' } }
                  },
                  plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                      callbacks: {
                        label: (ctx) => `${ctx.raw.label || 'Centroid'}: (${ctx.raw.x.toFixed(2)}, ${ctx.raw.y.toFixed(2)})`
                      }
                    }
                  }
                }} 
                data={chartData} 
              />
            )}
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
            💡 <strong>Petunjuk:</strong> Arahkan kursor (hover) di atas titik mana saja pada grafik untuk melihat nama spesifik {mode === 'customer' ? 'pelanggan' : 'kota'} beserta koordinat nilainya.
          </div>
        </div>

        {/* Info & Cluster Profiles */}
        <div className="glass-card section-block">
          <h3 className="text-lg font-semibold mb-4">Statistik Algoritma K-Means</h3>
          <ul className="space-y-3 mb-6 text-sm text-slate-300">
            <li className="flex justify-between border-b border-slate-700/50 pb-2">
              <span>Metode:</span> <span className="font-medium text-white">{info.method}</span>
            </li>
            <li className="flex justify-between border-b border-slate-700/50 pb-2">
              <span>Total Data Point:</span> <span className="font-medium text-white">{info.totalPoints}</span>
            </li>
            <li className="flex justify-between border-b border-slate-700/50 pb-2">
              <span>Jumlah Cluster (K):</span> <span className="font-medium text-white">{info.k}</span>
            </li>
            <li className="flex justify-between border-b border-slate-700/50 pb-2">
              <span>Iterasi Konvergensi:</span> <span className="font-medium text-white">{info.iterations} iterasi</span>
            </li>
          </ul>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Profil Profil Cluster</h3>
            <DownloadBtn onClick={handleDownloadProfiles} label="CSV" icon="📥" variant="csv" />
          </div>
          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
            {profiles.map((profile, i) => (
              <div 
                key={i} 
                className="p-4 rounded-lg bg-slate-800/80 border-l-4"
                style={{ borderLeftColor: colors[i % colors.length] }}
              >
                <div className="font-bold mb-1 text-white">Cluster {i + 1}: {profile.profileName}</div>
                <div className="text-xs text-emerald-400 mb-2 font-medium">({profile.points ? profile.points.length : 0} {mode === 'customer' ? 'pelanggan' : 'kota'})</div>
                <div className="text-xs text-slate-300 grid grid-cols-2 gap-2 bg-slate-900/50 p-2 rounded">
                  <div>Rata-rata X ({xAxis}): <br/><span className="text-sky-300 font-semibold">{profile.centroid?.x?.toFixed(2)}</span></div>
                  <div>Rata-rata Y ({yAxis}): <br/><span className="text-purple-300 font-semibold">{profile.centroid?.y?.toFixed(2)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
