import React, { useState, useEffect } from 'react';

const LoginPage = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');

  // Initialize accounts in localStorage if they don't exist
  useEffect(() => {
    const existingAccounts = localStorage.getItem('bi_accounts');
    if (!existingAccounts) {
      const defaultAccounts = [
        { username: 'admin', password: 'admin123', email: 'admin@bi.com', role: 'admin', avatar: '' },
        { username: 'user', password: 'user123', email: 'user@bi.com', role: 'user', avatar: '' }
      ];
      localStorage.setItem('bi_accounts', JSON.stringify(defaultAccounts));
    }
  }, []);

  const getAccounts = () => {
    const data = localStorage.getItem('bi_accounts');
    return data ? JSON.parse(data) : [];
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Harap isi semua kolom!');
      return;
    }

    const accounts = getAccounts();
    const found = accounts.find(
      (acc) => acc.username.toLowerCase() === username.toLowerCase() && acc.password === password
    );

    if (found) {
      // Save current session
      localStorage.setItem('bi_current_user', JSON.stringify(found));
      onLogin(found);
    } else {
      setError('Username atau password salah!');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!username || !password || !email) {
      setError('Harap isi semua kolom!');
      return;
    }

    const accounts = getAccounts();
    const exists = accounts.some(
      (acc) => acc.username.toLowerCase() === username.toLowerCase()
    );

    if (exists) {
      setError('Username sudah digunakan!');
      return;
    }

    const newUser = {
      username,
      password,
      email,
      role: 'user', // New registers default to User role
      avatar: ''
    };

    const updated = [...accounts, newUser];
    localStorage.setItem('bi_accounts', JSON.stringify(updated));

    // Do NOT auto-login. Clear fields, switch to login mode and show success notice
    setIsRegister(false);
    setError('');
    setSuccessMessage('Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.');
    
    // Keep username filled for easy login, reset other fields
    setPassword('');
    setEmail('');
  };

  return (
    <div className="login-page">
      <div className="login-card glass-card">
        <div className="login-logo">📊</div>
        <h1 className="login-title">BI Dashboard</h1>
        <p className="login-subtitle">
          {isRegister ? 'Daftar akun baru untuk mengakses dashboard' : 'Masuk untuk mengakses dashboard analisis'}
        </p>
        
        <form className="login-form" onSubmit={isRegister ? handleRegister : handleLogin}>
          {successMessage && <div className="profile-success" style={{ margin: '0 0 1rem 0' }}>{successMessage}</div>}
          
          {isRegister && (
            <div className="login-input-group">
              <label className="login-label">Email</label>
              <input 
                type="email"
                className="login-input" 
                placeholder="Masukkan email Anda" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setSuccessMessage('');
                }}
              />
            </div>
          )}

          <div className="login-input-group">
            <label className="login-label">Username</label>
            <input 
              type="text"
              className="login-input" 
              placeholder="Masukkan username" 
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
                setSuccessMessage('');
              }}
            />
          </div>
          
          <div className="login-input-group">
            <label className="login-label">Password</label>
            <div className="login-password-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'}
                className="login-input" 
                placeholder="Masukkan password" 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                  setSuccessMessage('');
                }}
              />
              <button 
                type="button" 
                className="login-toggle-pw" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          
          {error && <div className="login-error">{error}</div>}
          
          <button type="submit" className="login-btn">
            {isRegister ? 'Daftar Sekarang' : 'Masuk'}
          </button>
        </form>

        <div className="login-switch-mode" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
          {isRegister ? (
            <p>
              Sudah punya akun?{' '}
              <span 
                style={{ color: '#4ea8de', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Masuk di sini
              </span>
            </p>
          ) : (
            <p>
              Belum punya akun?{' '}
              <span 
                style={{ color: '#2dd4bf', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Daftar baru
              </span>
            </p>
          )}
        </div>

        {/* Demo accounts removed for clean production look */}
        
        <div className="login-footer">© 2026 BI Dashboard Analytics</div>
      </div>
    </div>
  );
};

export default LoginPage;
