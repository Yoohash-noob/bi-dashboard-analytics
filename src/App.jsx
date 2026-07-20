import React, { useState } from 'react';
import Papa from 'papaparse';
import IntegrationTab from './components/IntegrationTab';
import AnalysisTab from './components/AnalysisTab';
import MiningTab from './components/MiningTab';
import ReportingTab from './components/ReportingTab';
import ClusteringTab from './components/ClusteringTab';
import ErrorBanner from './components/ErrorBanner';
import AlgorithmModal from './components/AlgorithmModal';
import { runETL } from './utils/etl';

function App() {
  const [rawData, setRawData] = useState(null);
  const [cleanData, setCleanData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(false);
  const [etlLogs, setEtlLogs] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [activeModal, setActiveModal] = useState(null);

  const processETL = (data) => {
    // Assuming runETL returns an object with cleanedData and logs
    const result = runETL(data);
    setCleanData(result?.cleanedData || data);
    setEtlLogs(result?.logs || []);
    setActiveTab('all');
    setUploadError(''); // clear any previous error
  };

  const loadSampleData = () => {
    setIsLoading(true);
    fetch('/product_sales_dataset_15k.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            setRawData(results.data);
            processETL(results.data);
            setIsLoading(false);
          },
          error: (err) => {
            console.error("Error parsing sample data:", err);
            setIsLoading(false);
          }
        });
      })
      .catch(err => {
        console.error("Error fetching sample data:", err);
        setIsLoading(false);
      });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsLoading(true);
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const required = ['Revenue', 'Profit', 'Order_Date', 'Quantity', 'Unit_Price'];
          const headerFields = results.meta.fields.map(f => f.trim());
          const missing = required.filter(col => !headerFields.includes(col));
          if (missing.length) {
            setUploadError(`Kolom wajib tidak ditemukan: ${missing.join(', ')}`);
            setIsLoading(false);
            return;
          }
          setRawData(results.data);
          processETL(results.data);
          setIsLoading(false);
        },
        error: (err) => {
          console.error("Error parsing uploaded file:", err);
          setIsLoading(false);
        }
      });
    }
  };




    

  const resetData = () => {
    setRawData(null);
    setCleanData(null);
    setEtlLogs([]);
    setActiveTab('home');
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!rawData) {
    return (
      <div className="landing-page">
        <div className="landing-hero">
          <h1 className="landing-title">Business Intelligence Dashboard</h1>
          <p className="landing-subtitle">Unggah file CSV data penjualan Anda untuk menganalisis dengan 5 teknik BI utama</p>
          {uploadError && <ErrorBanner message={uploadError} onClose={() => setUploadError('')} />}
          <div className="landing-actions">
            <label className="btn-primary" style={{ cursor: 'pointer' }}>
              📂 Unggah File CSV Anda
              <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
          <div className="feature-grid">
            <div className="feature-card glass-card">
              <div className="feature-icon">🔄</div>
              <h3 className="feature-title">Integration Services</h3>
              <p className="feature-desc">ETL Pipeline & Star Schema</p>
            </div>
            <div className="feature-card glass-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Analysis Services</h3>
              <p className="feature-desc">OLAP Pivot Table & Drill-down</p>
            </div>
            <div className="feature-card glass-card">
              <div className="feature-icon">⛏️</div>
              <h3 className="feature-title">Data Mining</h3>
              <p className="feature-desc">Forecasting & Korelasi</p>
            </div>
            <div className="feature-card glass-card">
              <div className="feature-icon">📈</div>
              <h3 className="feature-title">Reporting Services</h3>
              <p className="feature-desc">Dashboard & Grafik Visual</p>
            </div>
            <div className="feature-card glass-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Clustering Support</h3>
              <p className="feature-desc">Segmentasi K-Means</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-title">BI Dashboard</div>
        <div className="navbar-info">
          Data Loaded: {rawData.length} rows
        </div>
        <button className="btn-reset" onClick={resetData}>Reset Data</button>
      </nav>
      
      <div className="tab-nav">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Semua Teknik BI
        </button>
        <button 
          className={`tab-btn ${activeTab === 'integration' ? 'active' : ''}`}
          onClick={() => setActiveTab('integration')}
        >
          Integration Services
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis Services
        </button>
        <button 
          className={`tab-btn ${activeTab === 'mining' ? 'active' : ''}`}
          onClick={() => setActiveTab('mining')}
        >
          Data Mining
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reporting' ? 'active' : ''}`}
          onClick={() => setActiveTab('reporting')}
        >
          Reporting Services
        </button>
        <button 
          className={`tab-btn ${activeTab === 'clustering' ? 'active' : ''}`}
          onClick={() => setActiveTab('clustering')}
        >
          Clustering Support
        </button>
      </div>

      <div className="tab-content">
        {(activeTab === 'all' || activeTab === 'integration') && (
          <div className="section-block">
            <div className="section-header">
              <h2 className="section-title">Integration Services</h2>
              <button className="btn-algorithm" onClick={() => setActiveModal('integration')}>
                Lihat Logika & Proses ⚙️
              </button>
            </div>
            <IntegrationTab rawData={rawData} cleanData={cleanData} etlLogs={etlLogs} />
          </div>
        )}
        
        {(activeTab === 'all' || activeTab === 'analysis') && (
          <div className="section-block">
            <div className="section-header">
              <h2 className="section-title">Analysis Services</h2>
              <button className="btn-algorithm" onClick={() => setActiveModal('analysis')}>
                Lihat Logika & Proses ⚙️
              </button>
            </div>
            <AnalysisTab data={cleanData} />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'mining') && (
          <div className="section-block">
            <div className="section-header">
              <h2 className="section-title">Data Mining</h2>
              <button className="btn-algorithm" onClick={() => setActiveModal('mining')}>
                Lihat Logika & Proses ⚙️
              </button>
            </div>
            <MiningTab data={cleanData} />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'reporting') && (
          <div className="section-block">
            <div className="section-header">
              <h2 className="section-title">Reporting Services</h2>
            </div>
            <ReportingTab data={cleanData} />
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'clustering') && (
          <div className="section-block">
            <div className="section-header">
              <h2 className="section-title">Clustering Support</h2>
              <button className="btn-algorithm" onClick={() => setActiveModal('clustering')}>
                Lihat Logika & Proses ⚙️
              </button>
            </div>
            <ClusteringTab data={cleanData} />
          </div>
        )}
      </div>

      <AlgorithmModal tab={activeModal} isOpen={activeModal !== null} onClose={() => setActiveModal(null)} />
    </div>
  );
}

export default App;
