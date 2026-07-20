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

// ── Styled download button ────────────────────────────────────────────────────
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

    // Centroids Dataset
    datasets.push({
      label: 'Centroids',
      data: result.centroids.map(c => ({ x: c.x, y: c.y })),
      backgroundColor: '#fff',
      borderColor: '#333',
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
        method: `K-Means on ${mode}`
      },
      rawPoints: pts,
    };
  }, [data, mode, k, xAxis, yAxis, triggerRun]);

  const xOptions = ['totalRevenue', 'avgUnitPrice', 'orderCount'];
  const yOptions = ['totalQuantity', 'totalProfit', 'profitMargin'];

  // ── Download handlers ────────────────────────────────────────────────────
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
    <div className="p-6 space-y-8 text-slate-200 font-inter">
      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Clustering Configuration</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Mode</label>
            <select 
              value={mode} 
              onChange={e => setMode(e.target.value)}
              className="bg-slate-700 text-white rounded p-2 border border-slate-600 focus:ring-2 focus:ring-teal-500"
            >
              <option value="customer">Customer</option>
              <option value="city">City</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Clusters (K)</label>
            <select 
              value={k} 
              onChange={e => setK(Number(e.target.value))}
              className="bg-slate-700 text-white rounded p-2 border border-slate-600 focus:ring-2 focus:ring-teal-500"
            >
              {[2,3,4,5,6].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">X-Axis</label>
            <select 
              value={xAxis} 
              onChange={e => setXAxis(e.target.value)}
              className="bg-slate-700 text-white rounded p-2 border border-slate-600 focus:ring-2 focus:ring-teal-500"
            >
              {xOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Y-Axis</label>
            <select 
              value={yAxis} 
              onChange={e => setYAxis(e.target.value)}
              className="bg-slate-700 text-white rounded p-2 border border-slate-600 focus:ring-2 focus:ring-teal-500"
            >
              {yOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <button 
            onClick={() => setTriggerRun(prev => prev + 1)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-teal-500"
          >
            Run Algorithm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-sm flex flex-col">
          {/* Chart header with download buttons */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Cluster Scatter Plot</h3>
            <div className="flex gap-2">
              <DownloadBtn onClick={handleDownloadChart} label="PNG" icon="🖼️" variant="png" />
              <DownloadBtn onClick={handleDownloadCSV} label="CSV Data" icon="📥" variant="csv" />
            </div>
          </div>
          <div className="flex-grow" style={{ minHeight: '400px' }}>
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
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Algorithm Info</h3>
          <ul className="space-y-3 mb-8 text-sm text-slate-300">
            <li className="flex justify-between border-b border-slate-700/50 pb-2">
              <span>Method:</span> <span className="font-medium text-white">{info.method}</span>
            </li>
            <li className="flex justify-between border-b border-slate-700/50 pb-2">
              <span>Data Points:</span> <span className="font-medium text-white">{info.totalPoints}</span>
            </li>
            <li className="flex justify-between border-b border-slate-700/50 pb-2">
              <span>K Value:</span> <span className="font-medium text-white">{info.k}</span>
            </li>
            <li className="flex justify-between border-b border-slate-700/50 pb-2">
              <span>Iterations:</span> <span className="font-medium text-white">{info.iterations}</span>
            </li>
          </ul>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Cluster Profiles</h3>
            <DownloadBtn onClick={handleDownloadProfiles} label="CSV" icon="📥" variant="csv" />
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {profiles.map((profile, i) => (
              <div 
                key={i} 
                className="p-4 rounded-lg bg-slate-800 border-l-4"
                style={{ borderLeftColor: colors[i % colors.length] }}
              >
                <div className="font-bold mb-2">Cluster {i + 1}: {profile.profileName} ({profile.points ? profile.points.length : 0} items)</div>
                <div className="text-xs text-slate-400 grid grid-cols-2 gap-2">
                  <div>Avg X ({xAxis}): <br/><span className="text-white">{profile.centroid?.x?.toFixed(2)}</span></div>
                  <div>Avg Y ({yAxis}): <br/><span className="text-white">{profile.centroid?.y?.toFixed(2)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
