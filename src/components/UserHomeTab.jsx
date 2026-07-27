import React, { useRef, useMemo } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title as ChartTitle, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  ChartTitle, 
  Tooltip, 
  Legend, 
  Filler
);

const UserHomeTab = ({
  user,
  rawData,
  cleanData,
  tokens,
  onFileUpload,
  resetData,
  setActiveTab,
  setAdModalOpen
}) => {
  const fileInputRef = useRef(null);

  // Compute Metrics if cleanData exists (keys are trimmed by ETL)
  const metrics = useMemo(() => {
    const data = cleanData || rawData;
    if (!data || data.length === 0) return null;
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalQuantity = 0;
    
    // For trends
    const salesByMonth = {};
    const categorySales = {};
    const regionSales = {};

    data.forEach(row => {
      const rev = Number(row.Revenue) || 0;
      const prof = Number(row.Profit) || 0;
      const qty = Number(row.Quantity) || 0;
      
      totalRevenue += rev;
      totalProfit += prof;
      totalQuantity += qty;

      // Extract month from Order_Date (assuming YYYY-MM-DD or MM/DD/YYYY)
      // We'll just group by the raw string prefix for simplicity if it's YYYY-MM
      let month = 'Unknown';
      if (row.Order_Date) {
         const parts = String(row.Order_Date).split('-');
         if(parts.length >= 2) month = `${parts[0]}-${parts[1]}`;
         else month = String(row.Order_Date).substring(0, 7);
      }
      salesByMonth[month] = (salesByMonth[month] || 0) + rev;

      const cat = row.Category || 'Unknown';
      categorySales[cat] = (categorySales[cat] || 0) + rev;

      const reg = row.Region || 'Unknown';
      regionSales[reg] = (regionSales[reg] || 0) + rev;
    });

    // Sort months
    const sortedMonths = Object.keys(salesByMonth).sort().slice(0, 12); // Take first 12 months for cleanliness

    return {
      totalRevenue,
      totalProfit,
      totalQuantity,
      totalOrders: data.length,
      lineData: {
        labels: sortedMonths,
        datasets: [{
          label: 'Revenue (Rp)',
          data: sortedMonths.map(m => salesByMonth[m]),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      barData: {
        labels: Object.keys(categorySales),
        datasets: [{
          label: 'Revenue by Category',
          data: Object.values(categorySales),
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      doughnutData: {
        labels: Object.keys(regionSales).slice(0, 5), // top 5 regions
        datasets: [{
          data: Object.values(regionSales).slice(0, 5),
          backgroundColor: ['#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#10b981'],
          borderWidth: 0
        }]
      }
    };
  }, [cleanData, rawData]);

  return (
    <div className="admin-dashboard-container">
      <div className="admin-welcome-row">
        <h2 className="admin-welcome-text">Executive Dashboard</h2>
        <div className="admin-welcome-tools">
          <span className="tool-btn badge-trigger" style={{ cursor: 'default' }}>
            🪙 <span className="tool-badge">{tokens}</span>
          </span>
          {rawData && (
            <button 
              onClick={resetData}
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Hapus Data
            </button>
          )}
        </div>
      </div>

      {!rawData ? (
        <div className="glass-card section-block" style={{ marginTop: '2rem' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title text-sm uppercase tracking-wider text-slate-400">UPLOAD DATA (CSV/Excel)</h3>
          </div>
          <div 
            className="upload-zone border-2 border-dashed border-slate-700/50 rounded-xl p-8 text-center bg-slate-800/20 hover:bg-slate-800/40 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-4xl mb-3 opacity-80">☁️</div>
            <h4 className="font-semibold text-slate-200 mb-1">Drag & Drop your CSV/excel files here</h4>
            <p className="text-xs text-slate-400 mb-4">File formats: CSV, XLSX, XML, etc</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', marginBottom: '1rem' }}>
              <button className="btn-export-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📥</span> Upload Data
              </button>
            </div>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={onFileUpload} 
              style={{ display: 'none' }}
            />
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginTop: '2rem' }}>
            <div className="kpi-neon-card blue">
              <div className="kpi-neon-header">
                <span className="kpi-neon-title">Total Revenue</span>
              </div>
              <div className="kpi-neon-value">Rp {metrics.totalRevenue.toLocaleString('id-ID')}</div>
            </div>
            <div className="kpi-neon-card emerald">
              <div className="kpi-neon-header">
                <span className="kpi-neon-title">Total Profit</span>
              </div>
              <div className="kpi-neon-value">Rp {metrics.totalProfit.toLocaleString('id-ID')}</div>
            </div>
            <div className="kpi-neon-card purple">
              <div className="kpi-neon-header">
                <span className="kpi-neon-title">Total Transactions</span>
              </div>
              <div className="kpi-neon-value">{metrics.totalOrders.toLocaleString('id-ID')}</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Tren Penjualan (Revenue)</h3>
              <div style={{ height: '300px' }}>
                <Line 
                  data={metrics.lineData} 
                  options={{ responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { color: 'rgba(255,255,255,0.05)' } } } }} 
                />
              </div>
            </div>
            
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Distribusi Region</h3>
              <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                <Doughnut 
                  data={metrics.doughnutData} 
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} 
                />
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Revenue per Kategori Produk</h3>
            <div style={{ height: '300px' }}>
              <Bar 
                data={metrics.barData} 
                options={{ responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { color: 'rgba(255,255,255,0.05)' } } } }} 
              />
            </div>
          </div>
        </>
      )}

      {/* BI Modules Link */}
      <h3 className="section-title" style={{ marginBottom: '1rem', marginTop: '3rem' }}>Eksplorasi Modul BI</h3>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {[
          { key: 'integration', label: '1. ETL', desc: 'Pembersihan Data', color: '#3b82f6' },
          { key: 'analysis', label: '2. OLAP', desc: 'Pivot & Dimensi', color: '#10b981' },
          { key: 'mining', label: '3. Data Mining', desc: 'K-Means Clustering', color: '#8b5cf6' },
          { key: 'datamanagement', label: '4. Data Management', desc: 'Live CRUD & Edit', color: '#f59e0b' }
        ].map(mod => (
          <div 
            key={mod.key}
            className="glass-card stat-card" 
            onClick={() => setActiveTab(mod.key)}
            style={{ cursor: 'pointer', borderTop: `4px solid ${mod.color}` }}
          >
            <div className="stat-label">{mod.label}</div>
            <div className="stat-value" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>{mod.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserHomeTab;
