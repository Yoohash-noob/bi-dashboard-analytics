import React, { useMemo, useRef, useState } from 'react';
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

const AdminHomeTab = ({ 
  revenue, 
  rawData, 
  cleanData,
  tokens, 
  accountsCount, 
  onFileUpload, 
  uploadError,
  username,
  resetData,
  withdrawHistory
}) => {
  const headerFileInputRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  // Compute Metrics if cleanData exists (keys are trimmed by ETL)
  const metrics = useMemo(() => {
    const data = cleanData || rawData;
    if (!data || data.length === 0) return null;
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalQuantity = 0;
    
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

    const sortedMonths = Object.keys(salesByMonth).sort().slice(0, 12);

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
          borderColor: '#4ea8de',
          backgroundColor: 'rgba(78, 168, 222, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      barData: {
        labels: Object.keys(categorySales),
        datasets: [{
          label: 'Revenue by Category',
          data: Object.values(categorySales),
          backgroundColor: '#8b5cf6',
          borderRadius: 4
        }]
      },
      doughnutData: {
        labels: Object.keys(regionSales).slice(0, 5),
        datasets: [{
          data: Object.values(regionSales).slice(0, 5),
          backgroundColor: ['#4ea8de', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
          borderWidth: 0
        }]
      }
    };
  }, [cleanData, rawData]);

  // Activity logs
  const logs = useMemo(() => {
    let items = [
      { time: '15:30', text: `System initialized & ready for Admin ${username || 'Sarah'}`, type: 'info' }
    ];
    if (rawData) {
      items.unshift({ time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), text: `Dataset uploaded (${rawData.length} rows)`, type: 'success' });
    }
    if (withdrawHistory && withdrawHistory.length > 0) {
      const latest = withdrawHistory[0];
      items.unshift({ time: latest.date.split(' ')[1] || 'Just now', text: `Withdraw ${formatRupiah(latest.amount)}`, type: 'danger' });
    }
    return items;
  }, [rawData, withdrawHistory, username]);

  return (
    <div className="admin-dashboard-container">
      <input type="file" accept=".csv" ref={headerFileInputRef} onChange={onFileUpload} style={{ display: 'none' }} />

      {/* Top Welcome Bar */}
      <div className="admin-welcome-row">
        <h2 className="admin-welcome-text">Welcome back, Admin {username || 'Sarah'}!</h2>
        <div className="admin-welcome-tools" style={{ position: 'relative' }}>
          <button className="tool-btn" onClick={() => headerFileInputRef.current?.click()} title="Unggah File CSV">📂</button>
          <button className="tool-btn badge-trigger" onClick={() => setShowNotifications(prev => !prev)}>🔔<span className="tool-badge">2</span></button>
          
          {showNotifications && (
            <div className="glass-card-neon" style={{ position: 'absolute', top: '110%', right: 0, zIndex: 999, width: '300px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold' }}>Notifications</span>
                <span style={{ fontSize: '0.8rem', color: '#4ea8de', cursor: 'pointer' }}>Mark all read</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                <div style={{ marginBottom: '0.5rem' }}>🔵 System update completed</div>
                <div>🔵 Weekly report is ready</div>
              </div>
            </div>
          )}
          {rawData && (
            <button onClick={resetData} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Hapus Data</button>
          )}
        </div>
      </div>

      <div className="admin-main-grid">
        <div className="admin-col-left">
          
          {/* Admin specific stats */}
          <div className="admin-stats-row">
            <div className="stat-card-neon primary">
              <span className="stat-title-neon">Monetization Revenue</span>
              <span className="stat-value-neon">{formatRupiah(revenue)}</span>
              <div className="stat-sparkline blue"></div>
            </div>
            <div className="stat-card-neon secondary">
              <span className="stat-title-neon">Active User Accounts</span>
              <span className="stat-value-neon">{accountsCount} <span style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)'}}>Users</span></span>
              <div className="stat-sparkline purple"></div>
            </div>
          </div>

          {!rawData ? (
            <div className="glass-card-neon upload-card">
              <div className="card-header-simple">
                <span className="card-title">Database Upload (CSV/Excel)</span>
              </div>
              <div className="upload-dropzone" onClick={() => headerFileInputRef.current?.click()}>
                <span className="dropzone-icon">📤</span>
                <p className="dropzone-text">Click or drag file here to upload</p>
                <p className="dropzone-subtext">Supported formats: CSV, XLSX (Data Penjualan)</p>
              </div>
              {uploadError && <div style={{ marginTop: '1rem', color: '#f87171', fontSize: '0.9rem', textAlign: 'center' }}>⚠️ {uploadError}</div>}
            </div>
          ) : (
            <div className="glass-card-neon">
              <div className="card-header-simple">
                <span className="card-title">Dataset Status</span>
              </div>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🟢</div>
                <h3 style={{ marginBottom: '0.5rem', color: '#10b981' }}>Dataset Aktif</h3>
                <p style={{ color: '#94a3b8' }}>{rawData.length.toLocaleString('id-ID')} baris data siap untuk dianalisis.</p>
              </div>
            </div>
          )}

          <div className="glass-card-neon log-card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header-simple">
              <span className="card-title">System Activity Log</span>
            </div>
            <div className="activity-logs-list">
              {logs.map((log, index) => (
                <div className="log-row-neon" key={index}>
                  <div className="log-icon-pill">⚙️</div>
                  <div className="log-details">
                    <span className="log-time">{log.time}</span>
                    <p className="log-desc">{log.text}</p>
                  </div>
                  <span className={`log-status-badge ${log.type}`}>Status</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="admin-col-right">
          {!rawData ? (
            <div className="glass-card-neon chart-card-neon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <p style={{ color: '#94a3b8' }}>Upload dataset to view analytical dashboard.</p>
            </div>
          ) : (
            <>
              <div className="admin-conversion-row">
                <div className="conv-small-card">
                  <div className="conv-card-header">
                    <span className="conv-title">Total Revenue</span>
                    <span className="conv-dot active"></span>
                  </div>
                  <div className="conv-value text-xl">Rp {(metrics.totalRevenue / 1000000).toFixed(1)}M</div>
                </div>
                <div className="conv-small-card">
                  <div className="conv-card-header">
                    <span className="conv-title">Total Profit</span>
                    <span className="conv-pill-up">▲ +11%</span>
                  </div>
                  <div className="conv-value text-xl">Rp {(metrics.totalProfit / 1000000).toFixed(1)}M</div>
                </div>
                <div className="conv-small-card">
                  <div className="conv-card-header">
                    <span className="conv-title">Total Orders</span>
                    <span className="conv-pill-up gold">▲ +0.5%</span>
                  </div>
                  <div className="conv-value text-xl">{metrics.totalOrders.toLocaleString('id-ID')}</div>
                </div>
              </div>

              <div className="glass-card-neon chart-card-neon" style={{ marginTop: '1.5rem' }}>
                <div className="chart-header-neon">
                  <span className="chart-title-neon">Revenue Trend</span>
                </div>
                <div className="chart-wrapper-neon" style={{ height: '250px' }}>
                  <Line data={metrics.lineData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { color: 'rgba(255,255,255,0.05)' } } } }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div className="glass-card-neon chart-card-neon">
                  <div className="chart-header-neon"><span className="chart-title-neon">Categories</span></div>
                  <div className="chart-wrapper-neon" style={{ height: '200px' }}>
                    <Bar data={metrics.barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                  </div>
                </div>
                <div className="glass-card-neon chart-card-neon">
                  <div className="chart-header-neon"><span className="chart-title-neon">Regions</span></div>
                  <div className="chart-wrapper-neon" style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
                    <Doughnut data={metrics.doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHomeTab;
