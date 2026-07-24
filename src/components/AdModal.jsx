import React, { useState, useEffect } from 'react';

const AdModal = ({ isOpen, onClose, onAdFinished }) => {
  if (!isOpen) return null;

  const [timeLeft, setTimeLeft] = useState(5);
  const [adFinished, setAdFinished] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setAdFinished(true);
    }
  }, [timeLeft]);

  const handleClaim = () => {
    onAdFinished();
    onClose();
  };

  // Mock static ads banners for aesthetic look
  const mockAds = [
    {
      title: 'Solusi Cloud BI untuk Korporasi',
      desc: 'Analisis data instan, integrasi multi-platform, dan laporan otomatis. Coba Gratis 30 Hari!',
      badge: 'SPONSORED',
      cta: 'Daftar Sekarang'
    },
    {
      title: 'Kursus Kilat Data Science & Big Data',
      desc: 'Pelajari Python, K-Means Clustering, dan SQL. Dapatkan sertifikat terakreditasi industri.',
      badge: 'IKLAN MITRA',
      cta: 'Gabung Kelas'
    },
    {
      title: 'Aplikasi Kasir Digital POS X',
      desc: 'Kelola penjualan retail Anda otomatis. Laporan omzet dan laba langsung masuk ke HP Anda.',
      badge: 'PROMOSI',
      cta: 'Unduh Aplikasi'
    }
  ];

  // Pick ad randomly based on current timestamp
  const ad = mockAds[new Date().getSeconds() % mockAds.length];

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="ad-modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="ad-modal-header">
          <span className="ad-badge">{ad.badge}</span>
          <span className="ad-timer">
            {timeLeft > 0 ? `Iklan selesai dalam ${timeLeft}s` : 'Iklan selesai'}
          </span>
        </div>

        <div className="ad-modal-body">
          <div className="ad-player-simulation">
            <div className="ad-video-mock">
              <div className="ad-video-icon">🎬</div>
              <div className="ad-video-playing-bar">
                <div 
                  className="ad-video-progress" 
                  style={{ width: `${((5 - timeLeft) / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="ad-info-section">
            <h3 className="ad-title">{ad.title}</h3>
            <p className="ad-desc">{ad.desc}</p>
            <button className="ad-cta-btn" disabled>
              {ad.cta}
            </button>
          </div>
        </div>

        <div className="ad-modal-footer">
          {adFinished ? (
            <button className="ad-claim-btn" onClick={handleClaim}>
              🎁 Klaim 1 Token Akses
            </button>
          ) : (
            <button className="ad-claim-btn disabled" disabled>
              Tonton Iklan ({timeLeft}s)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdModal;
