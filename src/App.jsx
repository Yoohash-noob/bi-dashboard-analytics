import React, { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import ProfileModal from './components/ProfileModal';
import AdModal from './components/AdModal';
import DataManagementTab from './components/DataManagementTab';
import RevenueTab from './components/RevenueTab';
import AccountManagementTab from './components/AccountManagementTab';
import AdminHomeTab from './components/AdminHomeTab';
import UserHomeTab from './components/UserHomeTab';
import IntegrationTab from './components/IntegrationTab';
import AnalysisTab from './components/AnalysisTab';
import MiningTab from './components/MiningTab';
import ReportingTab from './components/ReportingTab';
import ClusteringTab from './components/ClusteringTab';
import CsvGuideTab from './components/CsvGuideTab';
import ErrorBanner from './components/ErrorBanner';
import AlgorithmModal from './components/AlgorithmModal';
import DescriptionModal from './components/DescriptionModal';
import { runETL } from './utils/etl';

function App() {
  // Auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bi_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Landing Page state
  const [showLanding, setShowLanding] = useState(true);

  // Modals state
  const [showProfile, setShowProfile] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adTargetTab, setAdTargetTab] = useState(null); // 'integration' or 'mining'

  // Accounts state count
  const [accountsCount, setAccountsCount] = useState(2);

  // Monetization states synced with localStorage
  const [revenue, setRevenue] = useState(() => {
    const saved = localStorage.getItem('bi_revenue');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [tokens, setTokens] = useState(() => {
    const saved = localStorage.getItem('bi_tokens');
    return saved !== null ? parseInt(saved, 10) : 5; // 5 Free tokens for new users!
  });
  const [withdrawHistory, setWithdrawHistory] = useState(() => {
    const saved = localStorage.getItem('bi_wd_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Temporarily unlocked tabs for normal users in this session
  const [unlockedTabs, setUnlockedTabs] = useState(new Set());

  // Data state with session persistence
  const [rawData, setRawData] = useState(() => {
    const saved = sessionStorage.getItem('bi_raw_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [cleanData, setCleanData] = useState(null);
  
  // Set default tab: Admin defaults to command center, User defaults to analysis
  const [activeTab, setActiveTab] = useState(() => {
    const savedUser = localStorage.getItem('bi_current_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return parsed.role === 'admin' ? 'adminhome' : 'analysis';
    }
    return 'analysis';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [etlLogs, setEtlLogs] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [activeDescription, setActiveDescription] = useState(null);

  // Year filter state
  const [selectedYear, setSelectedYear] = useState('all');

  // Persist monetization states & load accounts count
  useEffect(() => {
    localStorage.setItem('bi_revenue', revenue.toString());
  }, [revenue]);

  useEffect(() => {
    localStorage.setItem('bi_tokens', tokens.toString());
  }, [tokens]);

  useEffect(() => {
    localStorage.setItem('bi_wd_history', JSON.stringify(withdrawHistory));
  }, [withdrawHistory]);

  const updateAccountsCount = () => {
    const data = localStorage.getItem('bi_accounts');
    if (data) {
      const parsed = JSON.parse(data);
      setAccountsCount(parsed.length);
    }
  };

  useEffect(() => {
    updateAccountsCount();
  }, [user]);

  // Extract available years from cleanData
  const availableYears = useMemo(() => {
    if (!cleanData) return [];
    const years = new Set();
    cleanData.forEach(row => {
      if (row.Order_Date) {
        const y = row.Order_Date.substring(0, 4);
        if (y && !isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort();
  }, [cleanData]);

  // Filter data by selected year
  const filteredData = useMemo(() => {
    if (!cleanData) return null;
    if (selectedYear === 'all') return cleanData;
    return cleanData.filter(row =>
      row.Order_Date && row.Order_Date.startsWith(selectedYear)
    );
  }, [cleanData, selectedYear]);

  const processETL = (data) => {
    try {
      sessionStorage.setItem('bi_raw_data', JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save to sessionStorage", e);
    }
    const result = runETL(data);
    setCleanData(result?.cleanedData || data);
    setEtlLogs(result?.logs || []);
    setUploadError('');
    if (user && user.role === 'admin') {
      setActiveTab('integration');
    }
  };

  // Restore cleanData and ETL logs if rawData was loaded from session
  useEffect(() => {
    if (rawData && !cleanData) {
      const result = runETL(rawData);
      setCleanData(result?.cleanedData || rawData);
      setEtlLogs(result?.logs || []);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSampleData = () => {
    setIsLoading(true);
    fetch('product_sales_dataset_15k.csv')
      .then(res => res.text())
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
            console.error('Error parsing sample data:', err);
            setIsLoading(false);
          }
        });
      })
      .catch(err => {
        console.error('Error fetching sample CSV:', err);
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
    sessionStorage.removeItem('bi_raw_data');
    setRawData(null);
    setCleanData(null);
    setEtlLogs([]);
    setSelectedYear('all');
    if (user && user.role === 'admin') {
      setActiveTab('adminhome');
    } else {
      setActiveTab('userhome');
    }
  };

  const handleUpdateData = (index, newRow) => {
    if (!rawData) return;
    const newData = [...rawData];
    newData[index] = newRow;
    setRawData(newData);
    processETL(newData);
  };

  const handleDeleteData = (index) => {
    if (!rawData) return;
    const newData = [...rawData];
    newData.splice(index, 1);
    setRawData(newData);
    processETL(newData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bi_current_user');
    resetData();
  };

  // Tab access rules per role: ALL 5 BI tabs are locked for normal users until unlocked with token
  const canAccessDirectly = (tabName) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return false; // All 5 BI technique tabs locked by default for User
  };

  const isTabUnlocked = (tabName) => {
    return canAccessDirectly(tabName) || unlockedTabs.has(tabName);
  };

  // Ad simulation finished callback
  const handleAdFinished = () => {
    setRevenue(prev => prev + 1500); // Rp 1.500 goes to Admin
    setTokens(prev => prev + 1); // 1 token goes to User
  };

  // Spend token to unlock a tab
  const handleUnlockWithToken = (tabName) => {
    if (tokens > 0) {
      setTokens(prev => prev - 1);
      setUnlockedTabs(prev => {
        const next = new Set(prev);
        next.add(tabName);
        return next;
      });
    }
  };

  // Admin withdraw action
  const handleWithdraw = (amount, method, account) => {
    setRevenue(prev => prev - amount);
    const newWd = {
      date: new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      ref: `WD-${Math.floor(100000 + Math.random() * 900000)}`,
      method,
      account,
      amount
    };
    setWithdrawHistory(prev => [newWd, ...prev]);
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'admin') {
      setActiveTab('adminhome');
    } else {
      setActiveTab('userhome');
    }
  };

  // ── LOGIN SCREEN & LANDING PAGE ──
  if (!user) {
    if (showLanding) {
      return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    }
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  // ── DECIDE LAYOUT ──
  const isAdmin = user.role === 'admin';

  // ── DASHBOARD MENU TABS CONFIGURATION ──
  const allTabs = [];
  
  if (isAdmin) {
    allTabs.push({ key: 'adminhome', label: 'Beranda Admin', icon: '🎛️' });
    if (rawData) {
      allTabs.push(
        { key: 'integration', label: 'Integration Services', icon: '🔄' },
        { key: 'analysis', label: 'Analysis Services', icon: '📊' },
        { key: 'mining', label: 'Data Mining', icon: '⛏️' },
        { key: 'reporting', label: 'Reporting Services', icon: '📈' },
        { key: 'clustering', label: 'Clustering Support', icon: '🎯' },
        { key: 'datamanagement', label: 'Data Management', icon: '📝' }
      );
    } else {
      allTabs.push({ key: 'csv-guide', label: 'Panduan Format CSV', icon: '📖' });
    }
    allTabs.push(
      { key: 'monetization', label: 'Monetisasi', icon: '💸' },
      { key: 'accounts', label: 'Manajemen Akun', icon: '👥' }
    );
  } else {
    // User POV: always show 5 BI technique tabs + userhome
    allTabs.push(
      { key: 'userhome', label: 'Beranda User', icon: '🏠' },
      { key: 'integration', label: 'Integration Services', icon: '🔄' },
      { key: 'analysis', label: 'Analysis Services', icon: '📊' },
      { key: 'mining', label: 'Data Mining', icon: '⛏️' },
      { key: 'reporting', label: 'Reporting Services', icon: '📈' },
      { key: 'clustering', label: 'Clustering Support', icon: '🎯' }
    );
  }

  // Access denied / locked tab placeholder component for normal users
  const LockedTab = ({ tabKey, tabName }) => (
    <div className="access-denied glass-card text-center p-8 space-y-6">
      <div className="access-denied-icon" style={{ fontSize: '3.5rem' }}>🔒</div>
      <div className="access-denied-title" style={{ fontSize: '1.5rem', color: '#fbbf24' }}>
        Fitur Premium Terkunci ({tabName})
      </div>
      <p className="text-slate-300 max-w-md mx-auto" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
        Anda masuk sebagai **User**. Fitur ini hanya tersedia untuk Admin secara langsung, atau dapat dibuka sementara menggunakan **1 Token Akses**.
      </p>

      <div className="year-filter-bar" style={{ display: 'inline-flex', margin: '1rem auto' }}>
        <span>Saldo Token Anda: <strong>{tokens} Token</strong></span>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4" style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button 
          className="btn-description" 
          onClick={() => {
            setAdTargetTab(tabKey);
            setShowAd(true);
          }}
          style={{ padding: '0.75rem 1.5rem' }}
        >
          📺 Nonton Iklan (+1 Token Gratis)
        </button>
        <button 
          className="login-btn"
          disabled={tokens === 0}
          onClick={() => handleUnlockWithToken(tabKey)}
          style={{ 
            marginTop: 0, 
            padding: '0.75rem 1.5rem', 
            background: tokens > 0 ? 'linear-gradient(135deg, #4ea8de, #7c3aed)' : 'rgba(255,255,255,0.05)',
            color: tokens > 0 ? 'white' : 'rgba(255,255,255,0.3)',
            cursor: tokens > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          🔑 Tukar 1 Token untuk Buka Fitur
        </button>
      </div>
    </div>
  );

  // No Data notice component (Shown inside dashboard when no database is loaded yet)
  const NoDataNotice = () => (
    <div className="no-data-notice glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
      <div className="no-data-notice-icon" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📂</div>
      <div className="no-data-notice-title" style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '0.5rem' }}>
        Database Penjualan Belum Dimuat
      </div>
      <p className="no-data-notice-text" style={{ maxWidth: '500px', margin: '0 auto 1.5rem', color: 'rgba(241,245,249,0.6)', lineHeight: '1.6' }}>
        Silakan unggah file CSV database Anda untuk mulai melihat visualisasi dan analisis BI.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
        <label className="btn-upload-neon" style={{ cursor: 'pointer', padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          📤 Unggah File CSV
          <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {user && user.role === 'user' && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9rem', color: 'rgba(241,245,249,0.7)' }}>🪙 Saldo Token: <strong>{tokens} Token</strong></span>
          <button className="btn-description" onClick={() => setShowAd(true)} style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            📺 Nonton Iklan (+1 Token Gratis)
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-layout">
      
      {/* LEFT VERTICAL SIDEBAR (Exactly like mockup) */}
      <aside className="sidebar-vertical">
        <div className="sidebar-logo" onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }} title="Pengaturan Profil">
          {user && user.avatar ? (
            <img src={user.avatar} alt="Profile" className="sidebar-logo-avatar" />
          ) : (
            <span className="logo-c">{user && user.username ? user.username.substring(0, 1).toUpperCase() : 'B'}</span>
          )}
        </div>

        <nav className="sidebar-nav">
          {allTabs.map(tab => {
            const isLocked = !isTabUnlocked(tab.key) && tab.key !== 'monetization' && tab.key !== 'accounts' && tab.key !== 'adminhome';
            return (
              <button
                key={tab.key}
                className={`sidebar-icon-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                title={tab.label}
              >
                <span className="tab-icon-large">{tab.icon}</span>
                {isLocked && <span className="tab-lock-indicator">🔒</span>}
                <span className="tooltip-text">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Logout & System Status */}
        <div className="sidebar-footer">
          <button className="sidebar-icon-btn profile-trigger-btn" onClick={() => setShowProfile(true)} title="Profile Settings">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="sidebar-avatar" />
            ) : (
              <span>👤</span>
            )}
          </button>
          <button className="sidebar-icon-btn logout-btn-sidebar" onClick={handleLogout} title="Log Out">
            🚪
          </button>
        </div>
      </aside>

      {/* MAIN RIGHT CONTAINER */}
      <main className="main-content-layout">
        
        {/* Top Navbar */}
        <nav className="navbar-top-integrated">
          <div className="navbar-top-brand">
            <span className="brand-text">BI Dashboard</span>
            {rawData && (
              <span className="brand-rows-badge">
                {filteredData ? filteredData.length : rawData.length} baris
              </span>
            )}
          </div>
          
          <div className="navbar-top-right">
            {rawData && activeTab !== 'adminhome' && activeTab !== 'monetization' && activeTab !== 'accounts' && (
              <div className="year-filter-mini">
                <span className="filter-label">Year:</span>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="filter-select-mini"
                >
                  <option value="all">All Years</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}

            {user.role === 'user' && (
              <div className="token-status-navbar" onClick={() => setShowAd(true)}>
                🪙 {tokens} Token
              </div>
            )}
            
            <div className="user-profile-badge" onClick={() => setShowProfile(true)}>
              <span className={`role-dot ${user.role}`}></span>
              <span>{user.username} ({user.role})</span>
            </div>
          </div>
        </nav>

        {/* Dynamic Inner Tab Content */}
        <div className="tab-content-area">
          
          {/* Admin Home Dashboard Command Center */}
          {activeTab === 'adminhome' && isAdmin && (
            <AdminHomeTab 
              revenue={revenue}
              rawData={rawData}
              cleanData={cleanData}
              tokens={tokens}
              accountsCount={accountsCount}
              withdrawHistory={withdrawHistory}
              onFileUpload={handleFileUpload}
              uploadError={uploadError}
              username={user.username}
              resetData={resetData}
            />
          )}

          {/* User Home Dashboard */}
          {activeTab === 'userhome' && !isAdmin && (
            <UserHomeTab 
              user={user}
              rawData={rawData}
              cleanData={cleanData}
              tokens={tokens}
              onFileUpload={handleFileUpload}
              uploadError={uploadError}
              resetData={resetData}
              setActiveTab={setActiveTab}
              setAdModalOpen={setShowAd}
            />
          )}

          {/* CSV Guide Tab (shown when admin has no data) */}
          {activeTab === 'csv-guide' && isAdmin && (
            <CsvGuideTab />
          )}

          {/* Integration Services Tab */}
          {activeTab === 'integration' && (
            <div className="section-block">
              <div className="section-header">
                <h2 className="section-title">Integration Services</h2>
                <div className="section-btns">
                  <button className="btn-algorithm" onClick={() => setActiveModal('integration')} disabled={!rawData}>
                    Lihat Logika & Proses ⚙️
                  </button>
                  <button className="btn-description" onClick={() => setActiveDescription('integration')} disabled={!rawData}>
                    📖 Cek Deskripsi
                  </button>
                </div>
              </div>
              {!rawData ? (
                <NoDataNotice />
              ) : isTabUnlocked('integration') ? (
                <IntegrationTab rawData={rawData} cleanData={filteredData} etlLogs={etlLogs} />
              ) : (
                <LockedTab tabKey="integration" tabName="Integration Services" />
              )}
            </div>
          )}
          
          {/* Analysis Services Tab */}
          {activeTab === 'analysis' && (
            <div className="section-block">
              <div className="section-header">
                <h2 className="section-title">Analysis Services</h2>
                <div className="section-btns">
                  <button className="btn-algorithm" onClick={() => setActiveModal('analysis')} disabled={!rawData}>
                    Lihat Logika & Proses ⚙️
                  </button>
                  <button className="btn-description" onClick={() => setActiveDescription('analysis')} disabled={!rawData}>
                    📖 Cek Deskripsi
                  </button>
                </div>
              </div>
              {!rawData ? (
                <NoDataNotice />
              ) : isTabUnlocked('analysis') ? (
                <AnalysisTab data={filteredData} />
              ) : (
                <LockedTab tabKey="analysis" tabName="Analysis Services" />
              )}
            </div>
          )}

          {/* Data Mining Tab */}
          {activeTab === 'mining' && (
            <div className="section-block">
              <div className="section-header">
                <h2 className="section-title">Data Mining</h2>
                <div className="section-btns">
                  <button className="btn-algorithm" onClick={() => setActiveModal('mining')} disabled={!rawData}>
                    Lihat Logika & Proses ⚙️
                  </button>
                  <button className="btn-description" onClick={() => setActiveDescription('mining')} disabled={!rawData}>
                    📖 Cek Deskripsi
                  </button>
                </div>
              </div>
              {!rawData ? (
                <NoDataNotice />
              ) : isTabUnlocked('mining') ? (
                <MiningTab data={filteredData} />
              ) : (
                <LockedTab tabKey="mining" tabName="Data Mining" />
              )}
            </div>
          )}

          {/* Reporting Services Tab */}
          {activeTab === 'reporting' && (
            <div className="section-block">
              <div className="section-header">
                <h2 className="section-title">Reporting Services</h2>
                <div className="section-btns">
                  <button className="btn-algorithm" onClick={() => setActiveModal('reporting')} disabled={!rawData}>
                    Lihat Logika & Proses ⚙️
                  </button>
                  <button className="btn-description" onClick={() => setActiveDescription('reporting')} disabled={!rawData}>
                    📖 Cek Deskripsi
                  </button>
                </div>
              </div>
              {!rawData ? (
                <NoDataNotice />
              ) : isTabUnlocked('reporting') ? (
                <ReportingTab data={filteredData} />
              ) : (
                <LockedTab tabKey="reporting" tabName="Reporting Services" />
              )}
            </div>
          )}

          {/* Clustering Support Tab */}
          {activeTab === 'clustering' && (
            <div className="section-block">
              <div className="section-header">
                <h2 className="section-title">Clustering Support</h2>
                <div className="section-btns">
                  <button className="btn-algorithm" onClick={() => setActiveModal('clustering')} disabled={!rawData}>
                    Lihat Logika & Proses ⚙️
                  </button>
                  <button className="btn-description" onClick={() => setActiveDescription('clustering')} disabled={!rawData}>
                    📖 Cek Deskripsi
                  </button>
                </div>
              </div>
              {!rawData ? (
                <NoDataNotice />
              ) : isTabUnlocked('clustering') ? (
                <ClusteringTab data={filteredData} />
              ) : (
                <LockedTab tabKey="clustering" tabName="Clustering Support" />
              )}
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'datamanagement' && isAdmin && (
            <DataManagementTab 
              data={rawData} 
              onUpdateData={handleUpdateData} 
              onDeleteData={handleDeleteData} 
            />
          )}

          {/* Admin Monetization Tab */}
          {activeTab === 'monetization' && isAdmin && (
            <div className="section-block">
              <div className="section-header">
                <h2 className="section-title">Monetisasi & Pendapatan Iklan</h2>
              </div>
              <RevenueTab 
                revenue={revenue} 
                onWithdraw={handleWithdraw} 
                withdrawHistory={withdrawHistory} 
              />
            </div>
          )}

          {/* Admin User Accounts Management Tab */}
          {activeTab === 'accounts' && isAdmin && (
            <div className="section-block">
              <div className="section-header">
                <h2 className="section-title">👥 Manajemen Akun & Hak Akses</h2>
              </div>
              <AccountManagementTab />
            </div>
          )}

        </div>

      </main>

      <AlgorithmModal tab={activeModal} isOpen={activeModal !== null} onClose={() => setActiveModal(null)} />
      <DescriptionModal tab={activeDescription} isOpen={activeDescription !== null} onClose={() => setActiveDescription(null)} />
      
      <ProfileModal 
        user={user} 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
        onUpdateUser={setUser} 
      />

      <AdModal 
        isOpen={showAd} 
        onClose={() => setShowAd(false)} 
        onAdFinished={handleAdFinished} 
      />
    </div>
  );
}

export default App;
