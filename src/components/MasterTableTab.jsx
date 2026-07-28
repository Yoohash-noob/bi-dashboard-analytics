import React, { useState, useMemo, useCallback } from 'react';
import './MasterTableTab.css';

const MasterTableTab = ({ cleanData, onUpdateCleanData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [editCell, setEditCell] = useState(null); // { rowIdx, col }
  const [editValue, setEditValue] = useState('');
  const [showGuide, setShowGuide] = useState(true);
  const ROWS_PER_PAGE = 15;

  const columns = useMemo(() => {
    if (!cleanData || cleanData.length === 0) return [];
    return Object.keys(cleanData[0]);
  }, [cleanData]);

  // Handle column filter change
  const handleColumnFilterChange = (col, val) => {
    setColumnFilters(prev => ({
      ...prev,
      [col]: val
    }));
    setPage(1);
  };

  // Filter Data by Global Search AND Column Filters
  const filteredData = useMemo(() => {
    if (!cleanData) return [];
    
    return cleanData.filter(row => {
      // Global Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesGlobal = Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q));
        if (!matchesGlobal) return false;
      }

      // Column Filters
      for (const [col, filterVal] of Object.entries(columnFilters)) {
        if (filterVal && filterVal.trim()) {
          const cellVal = String(row[col] ?? '').toLowerCase();
          if (!cellVal.includes(filterVal.toLowerCase())) {
            return false;
          }
        }
      }

      return true;
    });
  }, [cleanData, searchTerm, columnFilters]);

  // Compute Metrics Summary from Filtered Data
  const summaryMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { totalRevenue: 0, totalProfit: 0, totalQty: 0, avgRevenue: 0, totalRows: 0 };
    }
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalQty = 0;

    filteredData.forEach(row => {
      totalRevenue += Number(row.Revenue || row[' Revenue ']) || 0;
      totalProfit += Number(row.Profit || row[' Profit ']) || 0;
      totalQty += Number(row.Quantity || row['Quantity']) || 0;
    });

    const avgRevenue = filteredData.length > 0 ? totalRevenue / filteredData.length : 0;

    return {
      totalRevenue,
      totalProfit,
      totalQty,
      avgRevenue,
      totalRows: filteredData.length
    };
  }, [filteredData]);

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

  // Reset search
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
      // Auto convert numeric strings if applicable
      let valToSave = editValue;
      if (!isNaN(editValue) && editValue.trim() !== '') {
        valToSave = Number(editValue);
      }
      newData[realIdx] = { ...newData[realIdx], [editCell.col]: valToSave };
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
    if (!window.confirm('Yakin ingin menghapus baris ini dari Master Table?')) return;
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
    const newId = cleanData.length > 0 ? Math.max(...cleanData.map(d => Number(d.Order_ID) || 0)) + 1 : 1;
    const emptyRow = {};
    columns.forEach(col => {
      if (col === 'Order_ID') emptyRow[col] = newId;
      else if (col === 'Order_Date') emptyRow[col] = new Date().toISOString().substring(0, 10);
      else if (['Quantity', 'Unit_Price', 'Revenue', 'Profit'].includes(col)) emptyRow[col] = 0;
      else emptyRow[col] = '-';
    });
    const newData = [emptyRow, ...cleanData];
    onUpdateCleanData(newData);
    setSearchTerm('');
    setColumnFilters({});
    setPage(1);
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

  const clearAllFilters = () => {
    setSearchTerm('');
    setColumnFilters({});
    setPage(1);
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  if (!cleanData || cleanData.length === 0) {
    return (
      <div className="mt-empty">
        <div className="mt-empty-icon">📂</div>
        <h3>Belum Ada Data di Master Table</h3>
        <p>Silakan unggah file CSV atau muat data sampel 15K terlebih dahulu.</p>
      </div>
    );
  }

  // Page numbers helper
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
      {/* Top Academic Explanation / Guide Box */}
      <div className="mt-guide-box">
        <div className="mt-guide-header">
          <div className="mt-guide-title">
            <span className="mt-guide-icon">🎓</span>
            <div>
              <h3>Penjelasan Akademik: Fungsi Master Table & Manipulasi Data (CRUD)</h3>
              <p className="mt-guide-subtitle">Panduan Pemahaman untuk Penguji / Dosen Penguji</p>
            </div>
          </div>
          <button className="mt-guide-toggle" onClick={() => setShowGuide(!showGuide)}>
            {showGuide ? 'Sembunyikan Deskripsi ▲' : 'Tampilkan Deskripsi ▼'}
          </button>
        </div>

        {showGuide && (
          <div className="mt-guide-content">
            <div className="mt-guide-grid">
              <div className="mt-guide-card">
                <h4>📌 Apa itu Master Table dalam BI?</h4>
                <p>
                  Master Table adalah <strong>pusat penyimpanan data utama (Single Source of Truth)</strong> yang telah melewati proses pembersihan ETL (Extract-Transform-Load). Semua modul visualisasi, analisis OLAP, data mining, dan clustering pada aplikasi ini membaca data dasar yang bersumber dari Master Table ini.
                </p>
              </div>

              <div className="mt-guide-card">
                <h4>⚡ Fitur Operasi Data (CRUD & Filter)</h4>
                <p>
                  <strong>Create (Tambah)</strong>: Menambah baris data transaksi baru ke dalam sistem.<br/>
                  <strong>Read (Filter/Cari)</strong>: Fitur pencarian multi-kolom dan filter spesifik per kolom secara langsung (real-time).<br/>
                  <strong>Update (Edit)</strong>: Memungkinkan pengubahan nilai sel data dengan melakukan double-click.<br/>
                  <strong>Delete (Hapus)</strong>: Menghapus baris transaksi yang tidak valid.
                </p>
              </div>

              <div className="mt-guide-card">
                <h4>🛡️ Integritas Data & Re-Calculations</h4>
                <p>
                  Setiap kali terjadi perubahan data pada Master Table (tambah/edit/hapus), sistem secara otomatis mengupdate memori penyimpanan lokal (<code>localStorage</code>) dan melakukan kalkulasi ulang pada seluruh modul analisis BI secara konsisten.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metric Summary Cards Bar */}
      <div className="mt-stats-grid">
        <div className="mt-stat-card">
          <span className="mt-stat-label">TOTAL BARIS TERFILTER</span>
          <span className="mt-stat-value">{summaryMetrics.totalRows.toLocaleString('id-ID')} / {cleanData.length.toLocaleString('id-ID')}</span>
          <span className="mt-stat-subtext">Transaksi Terpilih</span>
        </div>
        <div className="mt-stat-card primary">
          <span className="mt-stat-label">TOTAL REVENUE (PENDAPATAN)</span>
          <span className="mt-stat-value">{formatIDR(summaryMetrics.totalRevenue)}</span>
          <span className="mt-stat-subtext">Akumulasi Penjualan</span>
        </div>
        <div className="mt-stat-card success">
          <span className="mt-stat-label">TOTAL PROFIT (KEUNTUNGAN)</span>
          <span className="mt-stat-value">{formatIDR(summaryMetrics.totalProfit)}</span>
          <span className="mt-stat-subtext">Laba Bersih</span>
        </div>
        <div className="mt-stat-card warning">
          <span className="mt-stat-label">RATA-RATA REVENUE / TRANSAKSI</span>
          <span className="mt-stat-value">{formatIDR(summaryMetrics.avgRevenue)}</span>
          <span className="mt-stat-subtext">Nilai Rata-rata Order</span>
        </div>
      </div>

      {/* Controls Header */}
      <div className="mt-header">
        <div className="mt-title-area">
          <h2 className="mt-title">📋 Tabel Utama Data Penjualan (15K Rows)</h2>
        </div>
        <div className="mt-actions">
          <div className="mt-search-wrapper">
            <span className="mt-search-icon">🔍</span>
            <input
              type="text"
              className="mt-search"
              placeholder="Cari kata kunci di semua kolom..."
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button className="mt-search-clear" onClick={() => { setSearchTerm(''); setPage(1); }}>✕</button>
            )}
          </div>
          {(searchTerm || Object.values(columnFilters).some(v => v)) && (
            <button className="mt-btn mt-btn-clear-filter" onClick={clearAllFilters}>
              🧹 Reset Filter
            </button>
          )}
          <button className="mt-btn mt-btn-export" onClick={exportCSV}>
            📥 Export CSV
          </button>
          <button className="mt-btn mt-btn-add" onClick={addRow}>
            ➕ Tambah Baris Transaksi
          </button>
        </div>
      </div>

      {/* Table Wrapper */}
      <div className="mt-table-wrapper">
        <table className="mt-table">
          <thead>
            <tr>
              <th className="mt-th-num">#</th>
              {columns.map(col => (
                <th
                  key={col}
                  className={`mt-th-sortable ${sortCol === col ? 'mt-th-active' : ''}`}
                >
                  <div className="mt-th-content" onClick={() => handleSort(col)}>
                    <span>{col.replace(/_/g, ' ')}</span>
                    {sortCol === col && (
                      <span className="mt-sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
                    )}
                  </div>
                  {/* Column-level Filter Input */}
                  <input
                    type="text"
                    className="mt-col-filter-input"
                    placeholder={`Filter ${col}...`}
                    value={columnFilters[col] || ''}
                    onChange={(e) => handleColumnFilterChange(col, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              ))}
              <th className="mt-th-actions">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Tidak ada data yang cocok dengan kriteria pencarian / filter Anda.
                </td>
              </tr>
            ) : (
              pageData.map((row, pageIdx) => {
                const globalIdx = (page - 1) * ROWS_PER_PAGE + pageIdx;
                return (
                  <tr key={globalIdx} className={pageIdx % 2 === 0 ? 'mt-row-even' : 'mt-row-odd'}>
                    <td className="mt-td-num">{globalIdx + 1}</td>
                    {columns.map(col => {
                      const isEditing = editCell && editCell.rowIdx === globalIdx && editCell.col === col;
                      const rawVal = row[col];
                      let displayVal = rawVal ?? '';
                      if (['Revenue', 'Profit'].includes(col) && typeof rawVal === 'number') {
                        displayVal = formatIDR(rawVal);
                      }

                      return (
                        <td
                          key={col}
                          className={`mt-td ${isEditing ? 'mt-td-editing' : ''}`}
                          onDoubleClick={() => startEdit(globalIdx, col, rawVal)}
                          title="Double-click untuk mengedit sel ini"
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
                            <span className="mt-cell-text">{displayVal}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="mt-td-actions">
                      <button className="mt-btn-delete" onClick={() => deleteRow(pageIdx)} title="Hapus baris ini">
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-pagination">
        <button
          className="mt-page-btn"
          disabled={page === 1}
          onClick={() => setPage(1)}
        >
          ⟨⟨ First
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
          Last ⟩⟩
        </button>
        <span className="mt-page-info">Halaman {page} dari {totalPages}</span>
      </div>

      {/* Footer Hints */}
      <div className="mt-hint">
        💡 <strong>Petunjuk Operasional:</strong> Lakukan <strong>Double-Click</strong> pada sel tabel untuk mengedit nilainya secara langsung. Tekan <strong>Enter</strong> untuk menyimpan atau <strong>Escape</strong> untuk membatalkan edit. Gunakan kotak filter kecil di bawah judul kolom untuk menyaring data spesifik.
      </div>
    </div>
  );
};

export default MasterTableTab;
