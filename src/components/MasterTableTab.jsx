import React, { useState, useMemo, useCallback } from 'react';
import './MasterTableTab.css';

const MasterTableTab = ({ cleanData, onUpdateCleanData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [editCell, setEditCell] = useState(null); // { rowIdx, col }
  const [editValue, setEditValue] = useState('');
  const ROWS_PER_PAGE = 15;

  const columns = useMemo(() => {
    if (!cleanData || cleanData.length === 0) return [];
    return Object.keys(cleanData[0]);
  }, [cleanData]);

  // Search filter
  const filteredData = useMemo(() => {
    if (!cleanData) return [];
    if (!searchTerm.trim()) return cleanData;
    const q = searchTerm.toLowerCase();
    return cleanData.filter(row =>
      Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [cleanData, searchTerm]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortCol) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      const va = a[sortCol] ?? '';
      const vb = b[sortCol] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return sorted;
  }, [filteredData, sortCol, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / ROWS_PER_PAGE));
  const pageData = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return sortedData.slice(start, start + ROWS_PER_PAGE);
  }, [sortedData, page]);

  // Reset page when search changes
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  }, []);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const startEdit = (globalIdx, col, value) => {
    setEditCell({ rowIdx: globalIdx, col });
    setEditValue(String(value ?? ''));
  };

  const saveEdit = () => {
    if (!editCell || !cleanData) return;
    const newData = [...cleanData];
    const originalRow = sortedData[editCell.rowIdx + (page - 1) * ROWS_PER_PAGE];
    const realIdx = cleanData.indexOf(originalRow);
    if (realIdx >= 0) {
      newData[realIdx] = { ...newData[realIdx], [editCell.col]: editValue };
      onUpdateCleanData(newData);
    }
    setEditCell(null);
  };

  const cancelEdit = () => {
    setEditCell(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const deleteRow = (pageIdx) => {
    const globalIdx = (page - 1) * ROWS_PER_PAGE + pageIdx;
    const row = sortedData[globalIdx];
    if (!row || !cleanData) return;
    if (!window.confirm('Yakin ingin menghapus baris ini?')) return;
    const realIdx = cleanData.indexOf(row);
    if (realIdx >= 0) {
      const newData = [...cleanData];
      newData.splice(realIdx, 1);
      onUpdateCleanData(newData);
      if (page > Math.ceil(newData.length / ROWS_PER_PAGE)) {
        setPage(Math.max(1, page - 1));
      }
    }
  };

  const addRow = () => {
    if (!cleanData || columns.length === 0) return;
    const emptyRow = {};
    columns.forEach(col => { emptyRow[col] = ''; });
    const newData = [...cleanData, emptyRow];
    onUpdateCleanData(newData);
    setPage(Math.ceil(newData.length / ROWS_PER_PAGE));
  };

  const exportCSV = () => {
    if (!filteredData || filteredData.length === 0) return;
    const header = columns.join(',');
    const rows = filteredData.map(row =>
      columns.map(col => {
        const val = String(row[col] ?? '');
        return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')
    );
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'master_data_export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!cleanData || cleanData.length === 0) {
    return (
      <div className="mt-empty">
        <div className="mt-empty-icon">📂</div>
        <h3>Belum Ada Data</h3>
        <p>Silakan unggah file CSV atau muat data sampel terlebih dahulu.</p>
      </div>
    );
  }

  // Page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxShow = 5;
    let start = Math.max(1, page - Math.floor(maxShow / 2));
    let end = Math.min(totalPages, start + maxShow - 1);
    if (end - start < maxShow - 1) start = Math.max(1, end - maxShow + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="mt-container">
      {/* Header */}
      <div className="mt-header">
        <div className="mt-title-area">
          <h2 className="mt-title">📋 Master Data Penjualan</h2>
          <span className="mt-count">
            {searchTerm ? `${filteredData.length} dari ${cleanData.length} baris` : `${cleanData.length} baris total`}
          </span>
        </div>
        <div className="mt-actions">
          <div className="mt-search-wrapper">
            <span className="mt-search-icon">🔍</span>
            <input
              type="text"
              className="mt-search"
              placeholder="Cari di semua kolom..."
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button className="mt-search-clear" onClick={() => { setSearchTerm(''); setPage(1); }}>✕</button>
            )}
          </div>
          <button className="mt-btn mt-btn-export" onClick={exportCSV}>
            📥 Export CSV
          </button>
          <button className="mt-btn mt-btn-add" onClick={addRow}>
            ➕ Tambah Baris
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-table-wrapper">
        <table className="mt-table">
          <thead>
            <tr>
              <th className="mt-th-num">#</th>
              {columns.map(col => (
                <th
                  key={col}
                  className={`mt-th-sortable ${sortCol === col ? 'mt-th-active' : ''}`}
                  onClick={() => handleSort(col)}
                >
                  {col.replace(/_/g, ' ')}
                  {sortCol === col && (
                    <span className="mt-sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
                  )}
                </th>
              ))}
              <th className="mt-th-actions">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, pageIdx) => {
              const globalIdx = (page - 1) * ROWS_PER_PAGE + pageIdx;
              return (
                <tr key={globalIdx} className={pageIdx % 2 === 0 ? 'mt-row-even' : 'mt-row-odd'}>
                  <td className="mt-td-num">{globalIdx + 1}</td>
                  {columns.map(col => {
                    const isEditing = editCell && editCell.rowIdx === globalIdx && editCell.col === col;
                    return (
                      <td
                        key={col}
                        className={`mt-td ${isEditing ? 'mt-td-editing' : ''}`}
                        onDoubleClick={() => startEdit(globalIdx, col, row[col])}
                      >
                        {isEditing ? (
                          <input
                            className="mt-edit-input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={saveEdit}
                            autoFocus
                          />
                        ) : (
                          <span className="mt-cell-text">{row[col] ?? ''}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="mt-td-actions">
                    <button className="mt-btn-delete" onClick={() => deleteRow(pageIdx)} title="Hapus baris">
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-pagination">
        <button
          className="mt-page-btn"
          disabled={page === 1}
          onClick={() => setPage(1)}
        >
          ⟨⟨
        </button>
        <button
          className="mt-page-btn"
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          ⟨ Prev
        </button>
        {getPageNumbers().map(p => (
          <button
            key={p}
            className={`mt-page-btn ${p === page ? 'mt-page-active' : ''}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="mt-page-btn"
          disabled={page === totalPages}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        >
          Next ⟩
        </button>
        <button
          className="mt-page-btn"
          disabled={page === totalPages}
          onClick={() => setPage(totalPages)}
        >
          ⟩⟩
        </button>
        <span className="mt-page-info">Halaman {page} dari {totalPages}</span>
      </div>

      {/* Edit hint */}
      <div className="mt-hint">
        💡 <strong>Tips:</strong> Double-klik sel untuk mengedit. Tekan Enter untuk menyimpan, Escape untuk membatalkan.
      </div>
    </div>
  );
};

export default MasterTableTab;
