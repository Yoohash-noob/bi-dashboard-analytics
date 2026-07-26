import React, { useMemo, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
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
  ChartTitle, 
  Tooltip, 
  Legend, 
  Filler
);

const AdminHomeTab = ({ 
  revenue, 
  rawData, 
  tokens, 
  accountsCount, 
  withdrawHistory, 
  onFileUpload, 
  loadSampleData,
  uploadError,
  username,
  resetData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const headerFileInputRef = useRef(null);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Compute stats from rawData for e-commerce realism
  const stats = useMemo(() => {
    if (!rawData) {
      return {
        totalRevenue: 'Rp 0',
        monthlySales: 'Rp 0',
        conversionRate: '0.00%',
        conversions1: 'Rp 0',
        conversions2: 'Rp 0'
      };
    }

    // Sum revenue
    const totalRevVal = rawData.reduce((sum, row) => sum + (Number(row.Revenue) || 0), 0);
    // Standard scale for display
    let displayRevenue = formatRupiah(totalRevVal);
    if (totalRevVal >= 1000000000) {
      displayRevenue = `Rp ${(totalRevVal / 1000000000).toFixed(2)}B`;
    } else if (totalRevVal >= 1000000) {
      displayRevenue = `Rp ${(totalRevVal / 1000000).toFixed(0)}M`;
    }

    // Monthly sales simulation (e.g. 27% of total)
    const monthlyVal = totalRevVal * 0.27;
    let displayMonthly = formatRupiah(monthlyVal);
    if (monthlyVal >= 1000000000) {
      displayMonthly = `Rp ${(monthlyVal / 1000000000).toFixed(2)}B`;
    } else if (monthlyVal >= 1000000) {
      displayMonthly = `Rp ${(monthlyVal / 1000000).toFixed(0)}M`;
    }

    // Simulated values matching layout screenshot style
    const conv1 = totalRevVal * 0.0055;
    let displayConv1 = formatRupiah(conv1);
    if (displayConv1.includes('Rp') && conv1 >= 1000000) {
      displayConv1 = `Rp ${(conv1 / 1000000).toFixed(1)}M`;
    }

    return {
      totalRevenue: displayRevenue,
      monthlySales: displayMonthly,
      conversionRate: '3.15%',
      conversions1: displayConv1,
      conversions2: displayConv1
    };
  }, [rawData]);

  // Gradient earnings chart matching exactly blue/pink tone in image
  const chartData = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Smooth wave earnings pattern matching mockup image curves
    const baseVal = revenue ? Math.floor(revenue / 7) : 1000000;
    const dataPoints = [
      baseVal * 2.2,  // Mon (Peak 1)
      baseVal * 1.5,  // Tue
      baseVal * 1.2,  // Wed (Low)
      baseVal * 3.2,  // Thu (Peak 2)
      baseVal * 2.8,  // Fri
      baseVal * 3.9,  // Sat
      baseVal * 5.8   // Sun (Grand Peak)
    ];

    return {
      labels,
      datasets: [
        {
          fill: true,
          label: 'Weekly Ad Earnings',
          data: dataPoints,
          borderColor: '#d946ef', // Pink gradient edge
          borderWidth: 3,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(217, 70, 239, 0.4)'); // Pink
            gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.25)'); // Teal
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0)'); // Transparent
            return gradient;
          },
          tension: 0.45,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#d946ef',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  }, [revenue]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        callbacks: {
          label: (context) => ` Pendapatan: ${formatRupiah(context.raw)}`
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: 'rgba(241, 245, 249, 0.4)', font: { family: 'Inter', size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(241, 245, 249, 0.4)', font: { family: 'Inter', size: 10 } }
      }
    }
  };

  // Activity logs with search filter
  const logs = useMemo(() => {
    let items = [
      { time: '15:30', text: `System initialized & ready for Admin ${username || 'Sarah'}`, type: 'info' },
      { time: '13:45', text: 'Database backup successful', type: 'success' },
      { time: '11:10', text: `Admin ${username || 'Sarah'} exported sales report`, type: 'primary' }
    ];

    if (rawData) {
      items.unshift({
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        text: `Sales database updated (${rawData.length} rows)`,
        type: 'success'
      });
    }

    if (withdrawHistory && withdrawHistory.length > 0) {
      const latest = withdrawHistory[0];
      items.unshift({
        time: latest.date.split(' ')[1] || 'Just now',
        text: `Withdraw ${formatRupiah(latest.amount)} successful`,
        type: 'danger'
      });
    }

    if (searchTerm.trim()) {
      items = items.filter(l => l.text.toLowerCase().includes(searchTerm.toLowerCase()) || l.time.includes(searchTerm));
    }

    return items;
  }, [rawData, withdrawHistory, username, searchTerm]);

  return (
    <div className="admin-dashboard-container">
      
      {/* Hidden file input for header folder button */}
      <input 
        type="file" 
        accept=".csv" 
        ref={headerFileInputRef} 
        onChange={onFileUpload} 
        style={{ display: 'none' }} 
      />

      {/* Welcome Top Banner bar */}
      <div className="admin-welcome-row">
        <h2 className="admin-welcome-text">Welcome back, Admin {username || 'Sarah'}!</h2>
        <div className="admin-welcome-tools" style={{ position: 'relative' }}>
          
          {/* Folder Button: Quick CSV Upload */}
          <button 
            className="tool-btn" 
            onClick={() => headerFileInputRef.current?.click()} 
            title="Unggah File CSV Database"
          >
            📂
          </button>

          {/* Notification Bell with Popup */}
          <button 
            className="tool-btn badge-trigger" 
            onClick={() => setShowNotifications(prev => !prev)} 
            title="Pemberitahuan Sistem"
          >
            🔔<span className="tool-badge">2</span>
          </button>

          {/* Notification Dropdown Panel */}
          {showNotifications && (
            <div className="glass-card-neon" style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              zIndex: 999,
              width: '300px',
              padding: '1rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              border: '1px solid rgba(124, 58, 237, 0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#4ea8de' }}>🔔 Notifikasi Sistem</span>
                <span style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'rgba(241,245,249,0.5)' }} onClick={() => setShowNotifications(false)}>✕</span>
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ padding: '0.4rem', background: 'rgba(45,212,191,0.1)', borderRadius: '6px', color: '#2dd4bf' }}>
                  🟢 Status Database: {rawData ? `Terhubung (${rawData.length} baris)` : 'Belum Dimuat'}
                </div>
                <div style={{ padding: '0.4rem', background: 'rgba(124,58,237,0.1)', borderRadius: '6px', color: '#c4b5fd' }}>
                  👥 Total Akun Terdaftar: {accountsCount} akun
                </div>
              </div>
            </div>
          )}

          {/* Search Input Filter */}
          <div className="search-bar-placeholder" style={{ opacity: 1 }}>
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Cari aktivitas..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ color: '#f1f5f9', background: 'transparent', outline: 'none', border: 'none' }}
            />
          </div>

        </div>
      </div>

      {/* KPI Cards Row (Grid of 4 neon bordered cards) */}
      <div className="admin-kpi-row">
        
        {/* Total Revenue */}
        <div className="kpi-neon-card blue">
          <div className="kpi-neon-header">
            <span className="kpi-neon-title">Total Revenue (Rp)</span>
            <span className="kpi-neon-pill up">▲ +18.2%</span>
          </div>
          <div className="kpi-neon-value">{stats.totalRevenue}</div>
          <div className="kpi-neon-sparkline spark-blue"></div>
        </div>

        {/* Monthly Sales */}
        <div className="kpi-neon-card green">
          <div className="kpi-neon-header">
            <span className="kpi-neon-title">Monthly Sales (Rp)</span>
            <span className="kpi-neon-pill up">▲ +8.7%</span>
          </div>
          <div className="kpi-neon-value">{stats.monthlySales}</div>
          <div className="kpi-neon-sparkline spark-green"></div>
        </div>

        {/* Active Users */}
        <div className="kpi-neon-card purple">
          <div className="kpi-neon-header">
            <span className="kpi-neon-title">Active Users</span>
            <span className="kpi-neon-pill up">▲ +4.1%</span>
          </div>
          <div className="kpi-neon-value">{accountsCount}</div>
          <div className="kpi-neon-sparkline spark-purple"></div>
        </div>

        {/* Database Connection */}
        <div className="kpi-neon-card emerald">
          <div className="kpi-neon-header">
            <span className="kpi-neon-title">Database Status</span>
            <span className="kpi-connection-dot active"></span>
          </div>
          <div className="kpi-neon-value" style={{ color: rawData ? '#10b981' : '#94a3b8' }}>
            {rawData ? 'Connected' : 'Disconnected'}
          </div>
          <div className="kpi-neon-footer-text">
            {rawData ? '99.98% Uptime' : 'No Database Loaded'}
          </div>
        </div>

      </div>

      {/* Main Split Grid (Left widgets / Right metrics) */}
      <div className="admin-split-grid">
        
        {/* Left Column (Upload + Activity Log) */}
        <div className="admin-col-left">
          
          {/* CSV File Upload Card */}
          <div className="glass-card-neon upload-card">
            <div className="card-header-simple">
              <span className="card-title">CSV Data Upload</span>
              <span className="card-menu-dots">•••</span>
            </div>
            
            {rawData ? (
              <div className="upload-dropzone" style={{ padding: '2rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🟢</div>
                <h3 style={{ color: '#f8fafc', fontWeight: 'bold', marginBottom: '0.5rem' }}>Dataset Aktif</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  {rawData.length.toLocaleString('id-ID')} baris data siap untuk dianalisis.
                </p>
                <button 
                  onClick={resetData}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                >
                  Tutup Data
                </button>
              </div>
            ) : (
              <div className="upload-dropzone">
                <div className="cloud-upload-icon">☁️</div>
                <p className="upload-instruction">Drag & Drop your CSV/excel files here</p>
                <p className="upload-formats">File formats: CSV, XLSX, XML, etc</p>
                {uploadError && <div className="profile-error" style={{ margin: '0.5rem 0' }}>{uploadError}</div>}
                
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                  <label className="btn-upload-neon" style={{ cursor: 'pointer' }}>
                    📤 Upload Data
                    <input type="file" accept=".csv" onChange={onFileUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Activity Log Card */}
          <div className="glass-card-neon log-card">
            <div className="card-header-simple">
              <span className="card-title">Recent System Activity Log</span>
              <span className="card-menu-dots">•••</span>
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

        {/* Right Column (Conversions Grid + Chart) */}
        <div className="admin-col-right">
          
          {/* Conversions / Rates Row */}
          <div className="admin-conversion-row">
            
            <div className="conv-small-card">
              <div className="conv-card-header">
                <span className="conv-title">Conversions</span>
                <span className="conv-dot active"></span>
              </div>
              <div className="conv-value">{stats.conversions1}</div>
            </div>

            <div className="conv-small-card">
              <div className="conv-card-header">
                <span className="conv-title">Conversions</span>
                <span className="conv-pill-up">▲ +11%</span>
              </div>
              <div className="conv-value">{stats.conversions2}</div>
              <div className="conv-sparkline-mini blue"></div>
            </div>

            <div className="conv-small-card">
              <div className="conv-card-header">
                <span className="conv-title">Conversion Rate</span>
                <span className="conv-pill-up gold">▲ +0.5%</span>
              </div>
              <div className="conv-value">{stats.conversionRate}</div>
              <div className="conv-sparkline-mini gold"></div>
            </div>

          </div>

          {/* Large Graph Area */}
          <div className="glass-card-neon chart-card-neon">
            <div className="chart-header-neon">
              <span className="chart-title-neon">Weekly Ad Earnings (Rp)</span>
              <div className="chart-header-filters">
                <span className="filter-pill">IDR Million</span>
                <span className="filter-pill active">Jan 1 - 7</span>
              </div>
            </div>

            <div className="chart-wrapper-neon">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminHomeTab;
