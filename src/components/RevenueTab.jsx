import React, { useState } from 'react';

const RevenueTab = ({ revenue, onWithdraw, withdrawHistory }) => {
  const [showWdModal, setShowWdModal] = useState(false);
  const [method, setMethod] = useState('DANA');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');
  const [wdSuccess, setWdSuccess] = useState(false);
  const [error, setError] = useState('');

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount, 10);
    if (!account) {
      setError('Harap masukkan nomor HP / rekening tujuan!');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount < 10000) {
      setError('Minimal penarikan adalah Rp 10.000!');
      return;
    }
    if (parsedAmount > revenue) {
      setError('Saldo pendapatan Anda tidak mencukupi!');
      return;
    }

    setError('');
    setIsProcessing(true);
    setProcessStep('Menghubungkan ke Gateway Pembayaran...');

    // 2-second withdrawal simulation
    setTimeout(() => {
      setProcessStep(`Mentransfer ${formatRupiah(parsedAmount)} ke ${method} [${account}]...`);
      
      setTimeout(() => {
        setIsProcessing(false);
        setWdSuccess(true);
        onWithdraw(parsedAmount, method, account);
      }, 1000);

    }, 1000);
  };

  const closeWdFlow = () => {
    setShowWdModal(false);
    setWdSuccess(false);
    setAccount('');
    setAmount('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-sm text-center glass-card">
          <div className="text-sm text-slate-400 mb-1">Total Saldo Pendapatan</div>
          <div className="text-2xl font-bold text-emerald-400 mb-4">{formatRupiah(revenue)}</div>
          <button 
            className="login-btn" 
            style={{ width: '100%', marginTop: 0, background: 'linear-gradient(135deg, #10b981, #059669)' }}
            onClick={() => setShowWdModal(true)}
            disabled={revenue < 10000}
          >
            Tarik Saldo / Withdraw 💸
          </button>
          {revenue < 10000 && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', display: 'block', marginTop: '0.5rem' }}>
              Minimal penarikan saldo adalah Rp 10.000
            </span>
          )}
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-sm text-center">
          <div className="text-sm text-slate-400 mb-1">Total Tayangan Iklan</div>
          <div className="text-2xl font-bold text-white">{(revenue / 1500).toFixed(0)}x</div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', display: 'block', marginTop: '0.5rem' }}>
            Tarif Iklan: Rp 1.500 per tayang
          </span>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-sm text-center">
          <div className="text-sm text-slate-400 mb-1">Status Kemitraan</div>
          <div className="text-2xl font-bold text-sky-400">Penerbit Utama (Publisher)</div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', display: 'block', marginTop: '0.5rem' }}>
            Metode Pembayaran: DANA, GoPay, OVO, Bank
          </span>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Riwayat Penarikan Saldo (Withdrawal)</h3>
        <div className="overflow-x-auto">
          {withdrawHistory.length === 0 ? (
            <div className="text-center p-6 text-slate-400">
              Belum ada riwayat penarikan saldo.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800">
                  <th className="p-3 border-b border-slate-700 font-medium">Tanggal</th>
                  <th className="p-3 border-b border-slate-700 font-medium">No. Referensi</th>
                  <th className="p-3 border-b border-slate-700 font-medium">Metode</th>
                  <th className="p-3 border-b border-slate-700 font-medium">Tujuan</th>
                  <th className="p-3 border-b border-slate-700 font-medium">Jumlah</th>
                  <th className="p-3 border-b border-slate-700 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawHistory.map((wd, i) => (
                  <tr key={i} className="hover:bg-slate-700/50 transition-colors">
                    <td className="p-3 border-b border-slate-700/50 text-slate-400">{wd.date}</td>
                    <td className="p-3 border-b border-slate-700/50 text-slate-400">{wd.ref}</td>
                    <td className="p-3 border-b border-slate-700/50">{wd.method}</td>
                    <td className="p-3 border-b border-slate-700/50">{wd.account}</td>
                    <td className="p-3 border-b border-slate-700/50 text-emerald-400 font-bold">{formatRupiah(wd.amount)}</td>
                    <td className="p-3 border-b border-slate-700/50 text-emerald-400">Sukses ✅</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* WITHDRAW MODAL FLOW */}
      {showWdModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="profile-modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="profile-modal-header">
              <h2 className="profile-modal-title">💸 Cairkan Pendapatan Iklan</h2>
              {!isProcessing && !wdSuccess && (
                <button className="btn-close-modal" onClick={() => setShowWdModal(false)}>×</button>
              )}
            </div>

            {isProcessing ? (
              <div className="p-8 text-center space-y-4">
                <div className="spinner" style={{ margin: 'auto' }}></div>
                <p className="text-slate-300 font-medium animate-pulse">{processStep}</p>
              </div>
            ) : wdSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="text-5xl">🎉</div>
                <h3 className="text-xl font-bold text-emerald-400">Penarikan Berhasil!</h3>
                <p className="text-slate-300 text-sm">
                  Dana telah ditransfer ke akun {method} ({account}) Anda. Nomor Referensi transaksi disimpan di riwayat.
                </p>
                <button className="login-btn" style={{ width: '100%' }} onClick={closeWdFlow}>
                  Tutup
                </button>
              </div>
            ) : (
              <form className="p-6 space-y-4" onSubmit={handleWithdrawSubmit}>
                <div className="login-input-group">
                  <label className="login-label">Metode Pembayaran</label>
                  <select 
                    className="login-input" 
                    value={method} 
                    onChange={(e) => setMethod(e.target.value)}
                    style={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="DANA">DANA</option>
                    <option value="GoPay">GoPay</option>
                    <option value="OVO">OVO</option>
                    <option value="BCA">BCA (Transfer Bank)</option>
                    <option value="Mandiri">Mandiri (Transfer Bank)</option>
                  </select>
                </div>

                <div className="login-input-group">
                  <label className="login-label">Nomor Rekening / No. HP E-wallet</label>
                  <input 
                    type="text" 
                    className="login-input" 
                    placeholder="Contoh: 08123456789 atau 12345678"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                  />
                </div>

                <div className="login-input-group">
                  <label className="login-label">Nominal Penarikan (Saldo saat ini: {formatRupiah(revenue)})</label>
                  <input 
                    type="number" 
                    className="login-input" 
                    placeholder="Masukkan jumlah pencairan"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                {error && <div className="profile-error">{error}</div>}

                <div className="profile-modal-actions">
                  <button type="button" className="btn-reset" onClick={() => setShowWdModal(false)} style={{ flex: 1 }}>
                    Batal
                  </button>
                  <button type="submit" className="login-btn" style={{ flex: 2, marginTop: 0, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    Cairkan Sekarang
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueTab;
