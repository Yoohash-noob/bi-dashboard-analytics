import React from 'react';

const ErrorBanner = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="error-banner glass-card" style={{
      borderLeft: '4px solid #f72585',
      background: 'rgba(247, 37, 133, 0.05)',
      padding: '16px 20px',
      margin: '20px auto',
      maxWidth: '600px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <span style={{ fontSize: '1.5rem' }}>⚠️</span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <h4 style={{ margin: 0, color: '#f72585', fontWeight: 600, fontSize: '0.95rem' }}>Gagal Memproses Data</h4>
        <p style={{ margin: '4px 0 0 0', color: 'rgba(241, 245, 249, 0.8)', fontSize: '0.85rem', lineHeight: '1.4' }}>
          {message}
        </p>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(241, 245, 249, 0.5)',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#f1f5f9'}
          onMouseLeave={(e) => e.target.style.color = 'rgba(241, 245, 249, 0.5)'}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
