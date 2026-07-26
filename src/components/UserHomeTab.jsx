import React, { useRef } from 'react';

const UserHomeTab = ({
  user,
  rawData,
  tokens,
  onFileUpload,
  loadSampleData,
  uploadError,
  resetData,
  setActiveTab,
  setAdModalOpen
}) => {
  const fileInputRef = useRef(null);

  return (
    <div className="admin-dashboard-container">
      {/* Welcome Banner */}
      <div className="admin-welcome-row">
        <h2 className="admin-welcome-text">Welcome back, {user?.username || 'User'}!</h2>
        <div className="admin-welcome-tools">
          <span className="tool-btn badge-trigger" style={{ cursor: 'default' }}>
            🪙 <span className="tool-badge">{tokens}</span>
          </span>
        </div>
      </div>

      <div className="admin-main-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '2rem' }}>
        
        {/* Data Status & Reset/Upload Area */}
        <div className="glass-card section-block">
          {rawData ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🟢</div>
              <h3 className="section-title" style={{ marginBottom: '0.5rem' }}>Dataset Aktif</h3>
              <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                {rawData.length.toLocaleString('id-ID')} baris data siap untuk dianalisis.
              </p>
              
              <button 
                onClick={resetData}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.8)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
              >
                ✖ Tutup / Hapus Data Saat Ini
              </button>
            </div>
          ) : (
            <div>
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
                  className="hidden" 
                  style={{ display: 'none' }}
                />
              </div>

              {uploadError && (
                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-center">
                  ⚠️ {uploadError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BI Modules Grid */}
      <h3 className="section-title" style={{ marginBottom: '1rem', marginTop: '1rem' }}>Eksplorasi Modul BI</h3>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        
        {/* Ad / Token Module */}
        <div 
          className="glass-card stat-card" 
          onClick={() => setAdModalOpen(true)}
          style={{ cursor: 'pointer', borderTop: '4px solid #d946ef' }}
        >
          <div className="stat-label">DOMPET TOKEN</div>
          <div className="stat-value">{tokens} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Token</span></div>
          <div className="stat-trend trend-up mt-2" style={{ color: '#d946ef' }}>▶ Tonton Iklan (+1 Token)</div>
        </div>

        {/* Integration */}
        <div 
          className="glass-card stat-card" 
          onClick={() => setActiveTab('integration')}
          style={{ cursor: 'pointer', borderTop: '4px solid #3b82f6' }}
        >
          <div className="stat-label">1. INTEGRATION (ETL)</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>Pembersihan Data</div>
          <div className="stat-trend mt-2 text-slate-400" style={{ color: '#94a3b8' }}>Lihat proses transformasi CSV.</div>
        </div>

        {/* Analysis */}
        <div 
          className="glass-card stat-card" 
          onClick={() => setActiveTab('analysis')}
          style={{ cursor: 'pointer', borderTop: '4px solid #10b981' }}
        >
          <div className="stat-label">2. ANALYSIS (SSAS)</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>Pivot & Dimensi</div>
          <div className="stat-trend mt-2 text-slate-400" style={{ color: '#94a3b8' }}>Eksplorasi data interaktif (OLAP).</div>
        </div>

        {/* Reporting */}
        <div 
          className="glass-card stat-card" 
          onClick={() => setActiveTab('reporting')}
          style={{ cursor: 'pointer', borderTop: '4px solid #f59e0b' }}
        >
          <div className="stat-label">3. REPORTING</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>Dashboard Visual</div>
          <div className="stat-trend mt-2 text-slate-400" style={{ color: '#94a3b8' }}>KPI Utama & Grafik Kinerja.</div>
        </div>

        {/* Mining */}
        <div 
          className="glass-card stat-card" 
          onClick={() => setActiveTab('mining')}
          style={{ cursor: 'pointer', borderTop: '4px solid #8b5cf6' }}
        >
          <div className="stat-label">4. DATA MINING</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>Forecasting & Asosiasi</div>
          <div className="stat-trend mt-2 text-slate-400" style={{ color: '#94a3b8' }}>Prediksi tren & keranjang belanja.</div>
        </div>

        {/* Clustering */}
        <div 
          className="glass-card stat-card" 
          onClick={() => setActiveTab('clustering')}
          style={{ cursor: 'pointer', borderTop: '4px solid #ec4899' }}
        >
          <div className="stat-label">5. CLUSTERING</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>Segmentasi Pelanggan</div>
          <div className="stat-trend mt-2 text-slate-400" style={{ color: '#94a3b8' }}>Pemetaan RFM & loyalitas.</div>
        </div>

      </div>

    </div>
  );
};

export default UserHomeTab;
