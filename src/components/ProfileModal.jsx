import React, { useState } from 'react';

const ProfileModal = ({ user, isOpen, onClose, onUpdateUser }) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState(user.password || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal 10MB!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan Password wajib diisi!');
      return;
    }

    // Load accounts, update this user, save back
    const data = localStorage.getItem('bi_accounts');
    const accounts = data ? JSON.parse(data) : [];
    
    const updatedAccounts = accounts.map((acc) => {
      if (acc.username.toLowerCase() === user.username.toLowerCase()) {
        return { ...acc, email, password, avatar };
      }
      return acc;
    });

    localStorage.setItem('bi_accounts', JSON.stringify(updatedAccounts));

    const updatedUser = { ...user, email, password, avatar };
    localStorage.setItem('bi_current_user', JSON.stringify(updatedUser));
    
    onUpdateUser(updatedUser);
    setMessage('Profil berhasil diperbarui!');
    setError('');

    setTimeout(() => {
      setMessage('');
      onClose();
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2 className="profile-modal-title">⚙️ Pengaturan Profil</h2>
          <button className="btn-close-modal" onClick={onClose}>×</button>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-avatar-section">
            <div className="profile-avatar-preview">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <label className="btn-upload-avatar">
              📷 Pasang Foto
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
          </div>

          <div className="profile-fields">
            <div className="login-input-group">
              <label className="login-label">Username</label>
              <input 
                type="text" 
                className="login-input" 
                value={user.username} 
                disabled 
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                Username tidak dapat diubah.
              </span>
            </div>

            <div className="login-input-group">
              <label className="login-label">Role</label>
              <input 
                type="text" 
                className="login-input" 
                value={user.role.toUpperCase()} 
                disabled 
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <div className="login-input-group">
              <label className="login-label">Alamat Email (Gmail)</label>
              <input 
                type="email" 
                className="login-input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@gmail.com"
              />
            </div>

            <div className="login-input-group">
              <label className="login-label">Password Baru</label>
              <input 
                type="password" 
                className="login-input" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password baru"
              />
            </div>
          </div>

          {error && <div className="profile-error">{error}</div>}
          {message && <div className="profile-success">{message}</div>}

          <div className="profile-modal-actions">
            <button type="button" className="btn-reset" onClick={onClose} style={{ flex: 1 }}>
              Batal
            </button>
            <button type="submit" className="login-btn" style={{ flex: 2, marginTop: 0 }}>
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
