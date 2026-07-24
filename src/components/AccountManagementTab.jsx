import React, { useState, useEffect } from 'react';

const AccountManagementTab = () => {
  const [accounts, setAccounts] = useState([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    const data = localStorage.getItem('bi_accounts');
    if (data) {
      setAccounts(JSON.parse(data));
    }
  };

  const handleAddAdmin = (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newEmail) {
      setError('Harap isi semua kolom!');
      setSuccess('');
      return;
    }

    const currentAccounts = [...accounts];
    const exists = currentAccounts.some(
      (acc) => acc.username.toLowerCase() === newUsername.toLowerCase()
    );

    if (exists) {
      setError('Username sudah digunakan!');
      setSuccess('');
      return;
    }

    const newAdmin = {
      username: newUsername,
      password: newPassword,
      email: newEmail,
      role: 'admin',
      avatar: ''
    };

    const updated = [...currentAccounts, newAdmin];
    localStorage.setItem('bi_accounts', JSON.stringify(updated));
    setAccounts(updated);

    setSuccess('Admin baru berhasil didaftarkan!');
    setError('');
    
    // Clear inputs
    setNewUsername('');
    setNewPassword('');
    setNewEmail('');

    setTimeout(() => {
      setSuccess('');
      setShowAddAdmin(false);
    }, 2000);
  };

  const handleChangeRole = (username, newRole) => {
    // Prevent changing the role of 'admin' main account
    if (username.toLowerCase() === 'admin') {
      alert('Role akun admin utama tidak dapat diubah!');
      return;
    }

    const updated = accounts.map((acc) => {
      if (acc.username.toLowerCase() === username.toLowerCase()) {
        return { ...acc, role: newRole };
      }
      return acc;
    });

    localStorage.setItem('bi_accounts', JSON.stringify(updated));
    setAccounts(updated);
  };

  const handleDeleteAccount = (username) => {
    if (username.toLowerCase() === 'admin') {
      alert('Akun admin utama tidak dapat dihapus!');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun "${username}"?`)) {
      const updated = accounts.filter(
        (acc) => acc.username.toLowerCase() !== username.toLowerCase()
      );
      localStorage.setItem('bi_accounts', JSON.stringify(updated));
      setAccounts(updated);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="acct-action-bar">
        <button 
          className="btn-primary" 
          style={{ marginTop: 0 }}
          onClick={() => {
            setShowAddAdmin(!showAddAdmin);
            setError('');
            setSuccess('');
          }}
        >
          {showAddAdmin ? '❌ Batal Tambah Admin' : '➕ Tambah Akun Admin Baru'}
        </button>
        <span>Total Akun Terdaftar: <strong>{accounts.length} Pengguna</strong></span>
      </div>

      {showAddAdmin && (
        <form className="acct-add-form glass-card login-form" onSubmit={handleAddAdmin}>
          <h3>👥 Daftarkan Admin Baru</h3>
          
          <div className="login-input-group">
            <label className="login-label">Alamat Email</label>
            <input 
              type="email" 
              className="login-input" 
              placeholder="Contoh: admin.baru@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div className="login-input-group">
            <label className="login-label">Username</label>
            <input 
              type="text" 
              className="login-input" 
              placeholder="Masukkan username admin"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </div>

          <div className="login-input-group">
            <label className="login-label">Password</label>
            <input 
              type="password" 
              className="login-input" 
              placeholder="Masukkan password admin"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          {error && <div className="profile-error">{error}</div>}
          {success && <div className="profile-success">{success}</div>}

          <div className="profile-modal-actions">
            <button 
              type="button" 
              className="btn-reset" 
              onClick={() => {
                setShowAddAdmin(false);
                setError('');
                setSuccess('');
              }}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="login-btn" 
              style={{ flex: 2, marginTop: 0 }}
            >
              Daftarkan Admin
            </button>
          </div>
        </form>
      )}

      <div className="acct-table-wrapper glass-card">
        <h3>Daftar Pengguna Terdaftar</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className="font-semibold">{acc.username}</td>
                  <td>{acc.email || '-'}</td>
                  <td>
                    <span className={`acct-role-badge ${acc.role}`}>
                      {acc.role}
                    </span>
                  </td>
                  <td>
                    {acc.username.toLowerCase() === 'admin' ? (
                      <span className="text-slate-500" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                        Akun Utama (Proteksi)
                      </span>
                    ) : (
                      <div className="btn-group">
                        {acc.role === 'user' ? (
                          <button 
                            className="acct-btn-promote"
                            onClick={() => handleChangeRole(acc.username, 'admin')}
                          >
                            Jadikan Admin 👑
                          </button>
                        ) : (
                          <button 
                            className="acct-btn-demote"
                            onClick={() => handleChangeRole(acc.username, 'user')}
                          >
                            Turunkan ke User 👤
                          </button>
                        )}
                        <button 
                          className="acct-btn-delete"
                          onClick={() => handleDeleteAccount(acc.username)}
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountManagementTab;
