import React, { useState, useMemo, useCallback } from 'react';
import './MasterTableTab.css';

const MasterTableTab = ({ cleanData, onUpdateCleanData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [editCell, setEditCell] = useState(null); // { rowIdx, col }
  const [editValue, setEditValue] = useState('');
  const [showGuide, setShowGuide] = useState(true);
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRowIndexes, setSelectedRowIndexes] = useState(new Set());
  
  // State for Column Renaming (ALTER TABLE RENAME COLUMN)
  const [renameModal, setRenameModal] = useState(null); // { oldColName, newColName }
  const [renameError, setRenameError] = useState('');
  const [renameLog, setRenameLog] = useState('');

  const ROWS_PER_PAGE = 15;

  const allColumns = useMemo(() => {
    if (!cleanData || cleanData.length === 0) return [];
    return Object.keys(cleanData[0]);
  }, [cleanData]);

  // Column visibility state (default: all visible)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const init = {};
    allColumns.forEach(col => { init[col] = true; });
    return init;
  });

  useMemo(() => {
    if (allColumns.length > 0 && Object.keys(visibleColumns).length === 0) {
      const init = {};
      allColumns.forEach(col => { init[col] = true; });
      setVisibleColumns(init);
    }
  }, [allColumns]);

  const activeColumns = useMemo(() => {
    return allColumns.filter(col => visibleColumns[col] !== false);
  }, [allColumns, visibleColumns]);

  // Form State for Add New Transaction Modal
  const [formData, setFormData] = useState({
    Order_Date: new Date().toISOString().substring(0, 10),
    Customer_Name: '',
    City: '',
    State: '',
    Region: 'South',
    Country: 'United States',
    Category: 'Accessories',
    Sub_Category: 'Small Electronics',
    Product_Name: '',
    Quantity: 1,
    Unit_Price: 100,
    Profit: 20
  });

  // Handle column filter change
  const handleColumnFilterChange = (col, val) => {
    setColumnFilters(prev => ({ ...prev, [col]: val }));
    setPage(1);
  };

  // Filter Data by Global Search, Column Filters, AND Date Range
  const filteredData = useMemo(() => {
    if (!cleanData) return [];
    
    return cleanData.filter(row => {
      // Date Range Filter (checks any date field available)
      if (startDate || endDate) {
        const dateKey = Object.keys(row).find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('tanggal')) || 'Order_Date';
        const orderDateStr = String(row[dateKey] || '');
        if (orderDateStr) {
          if (startDate && orderDateStr < startDate) return false;
          if (endDate && orderDateStr > endDate) return false;
        }
      }

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
  }, [cleanData, searchTerm, columnFilters, startDate, endDate]);

  // Compute Metrics Summary
  const summaryMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { totalRevenue: 0, totalProfit: 0, totalQty: 0, avgRevenue: 0, totalRows: 0 };
    }
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalQty = 0;

    filteredData.forEach(row => {
      const revKey = Object.keys(row).find(k => k.toLowerCase().includes('revenue') || k.toLowerCase().includes('omset')) || 'Revenue';
      const profKey = Object.keys(row).find(k => k.toLowerCase().includes('profit') || k.toLowerCase().includes('laba')) || 'Profit';
      const qtyKey = Object.keys(row).find(k => k.toLowerCase().includes('quantity') || k.toLowerCase().includes('jumlah')) || 'Quantity';

      totalRevenue += Number(row[revKey]) || 0;
      totalProfit += Number(row[profKey]) || 0;
      totalQty += Number(row[qtyKey]) || 0;
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

  // Selection Logic
  const isAllPageSelected = useMemo(() => {
    if (pageData.length === 0) return false;
    return pageData.every(row => selectedRowIndexes.has(row));
  }, [pageData, selectedRowIndexes]);

  const toggleSelectAllPage = () => {
    const next = new Set(selectedRowIndexes);
    if (isAllPageSelected) {
      pageData.forEach(row => next.delete(row));
    } else {
      pageData.forEach(row => next.add(row));
    }
    setSelectedRowIndexes(next);
  };

  const toggleSelectRow = (row) => {
    const next = new Set(selectedRowIndexes);
    if (next.has(row)) next.delete(row);
    else next.add(row);
    setSelectedRowIndexes(next);
  };

  const deleteSelectedRows = () => {
    if (selectedRowIndexes.size === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedRowIndexes.size} baris transaksi yang dipilih?`)) return;
    const newData = cleanData.filter(row => !selectedRowIndexes.has(row));
    onUpdateCleanData(newData);
    setSelectedRowIndexes(new Set());
  };

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

  // ── RENAME COLUMN FUNCTION (ALTER TABLE RENAME COLUMN) ──
  const openRenameModal = (colName) => {
    setRenameModal({ oldColName: colName, newColName: colName });
    setRenameError('');
  };

  const handleRenameColumnSubmit = (e) => {
    e.preventDefault();
    if (!renameModal) return;
    const { oldColName, newColName } = renameModal;
    const trimmed = newColName.trim();

    if (!trimmed) {
      setRenameError('Nama kolom baru tidak boleh kosong!');
      return;
    }
    if (trimmed !== oldColName && allColumns.includes(trimmed)) {
      setRenameError(`Kolom dengan nama "${trimmed}" sudah ada! Gunakan nama unik lain.`);
      return;
    }

    if (trimmed === oldColName) {
      setRenameModal(null);
      return;
    }

    // Update dataset objects key from oldColName to trimmed
    const updatedData = cleanData.map(row => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        if (key === oldColName) {
          newRow[trimmed] = row[key];
        } else {
          newRow[key] = row[key];
        }
      });
      return newRow;
    });

    // Update columnFilters key if exists
    if (columnFilters[oldColName]) {
      const newFilters = { ...columnFilters };
      newFilters[trimmed] = newFilters[oldColName];
      delete newFilters[oldColName];
      setColumnFilters(newFilters);
    }

    // Update visibleColumns key
    const newVis = { ...visibleColumns };
    newVis[trimmed] = newVis[oldColName] !== false;
    delete newVis[oldColName];
    setVisibleColumns(newVis);

    // Update sortCol if active
    if (sortCol === oldColName) {
      setSortCol(trimmed);
    }

    // Execute update
    onUpdateCleanData(updatedData);

    const logMsg = `SQL ALTER TABLE: Kolom "${oldColName}" berhasil diubah namanya menjadi "${trimmed}" di seluruh dataset.`;
    setRenameLog(logMsg);
    setRenameModal(null);
    setTimeout(() => setRenameLog(''), 6000);
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
      let valToSave = editValue;
      if (!isNaN(editValue) && editValue.trim() !== '') {
        valToSave = Number(editValue);
      }
      newData[realIdx] = { ...newData[realIdx], [editCell.col]: valToSave };
      onUpdateCleanData(newData);
    }
    setEditCell(null);
  };

  const cancelEdit = () => setEditCell(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const deleteSingleRow = (row) => {
    if (!window.confirm('Yakin ingin menghapus baris transaksi ini?')) return;
    const realIdx = cleanData.indexOf(row);
    if (realIdx >= 0) {
      const newData = [...cleanData];
      newData.splice(realIdx, 1);
      onUpdateCleanData(newData);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const idKey = allColumns.find(k => k.toLowerCase().includes('id')) || allColumns[0] || 'Order_ID';
    const newId = cleanData.length > 0 ? Math.max(...cleanData.map(d => Number(d[idKey]) || 0)) + 1 : 1;
    const qty = Number(formData.Quantity) || 1;
    const price = Number(formData.Unit_Price) || 0;
    const rev = qty * price;
    const prof = Number(formData.Profit) || 0;

    const newRow = {};
    allColumns.forEach(col => {
      const cLow = col.toLowerCase();
      if (cLow.includes('id')) newRow[col] = newId;
      else if (cLow.includes('date') || cLow.includes('tanggal')) newRow[col] = formData.Order_Date;
      else if (cLow.includes('customer') || cLow.includes('pelanggan')) newRow[col] = formData.Customer_Name || 'Pelanggan Baru';
      else if (cLow.includes('city') || cLow.includes('kota')) newRow[col] = formData.City || 'Jakarta';
      else if (cLow.includes('state') || cLow.includes('provinsi')) newRow[col] = formData.State || 'DKI Jakarta';
      else if (cLow.includes('region') || cLow.includes('wilayah')) newRow[col] = formData.Region;
      else if (cLow.includes('country') || cLow.includes('negara')) newRow[col] = formData.Country;
      else if (cLow.includes('sub_category') || cLow.includes('sub')) newRow[col] = formData.Sub_Category;
      else if (cLow.includes('category') || cLow.includes('kategori')) newRow[col] = formData.Category;
      else if (cLow.includes('product') || cLow.includes('produk')) newRow[col] = formData.Product_Name || 'Produk Baru';
      else if (cLow.includes('quantity') || cLow.includes('jumlah')) newRow[col] = qty;
      else if (cLow.includes('price') || cLow.includes('harga')) newRow[col] = price;
      else if (cLow.includes('revenue') || cLow.includes('omset')) newRow[col] = rev;
      else if (cLow.includes('profit') || cLow.includes('laba')) newRow[col] = prof;
      else newRow[col] = '-';
    });

    const newData = [newRow, ...cleanData];
    onUpdateCleanData(newData);
    setShowAddModal(false);
    setSearchTerm('');
    setColumnFilters({});
    setPage(1);
  };

  const exportCSV = () => {
    if (!filteredData || filteredData.length === 0) return;
    const header = activeColumns.join(',');
    const rows = filteredData.map(row =>
      activeColumns.map(col => {
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
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const toggleColumnVisibility = (col) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
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
      {/* Toast Notification Log for Column Rename */}
      {renameLog && (
        <div className="mt-rename-log-toast">
          <span>✅ {renameLog}</span>
        </div>
      )}

      {/* System Integrity & Health Bar */}
      <div className="mt-health-bar">
        <div className="mt-health-item">
          <span className="mt-health-dot"></span>
          <span>STATUS DATABASE: <strong>ONLINE & SYNCHRONIZED</strong></span>
        </div>
        <div className="mt-health-item">
          <span>Integritas Skema: <strong>SQL DDL Ready (ALTER COLUMN Enabled)</strong></span>
        </div>
        <div className="mt-health-item">
          <span>Penyimpanan: <strong>localStorage Active</strong></span>
        </div>
        <div className="mt-health-item">
          <span>Kolom Terlihat: <strong>{activeColumns.length} / {allColumns.length}</strong></span>
        </div>
      </div>

      {/* Top Academic Explanation Box */}
      <div className="mt-guide-box">
        <div className="mt-guide-header">
          <div className="mt-guide-title">
            <span className="mt-guide-icon">🎓</span>
            <div>
              <h3>Penjelasan Akademik: Fungsi Master Table & Alter Column Schema</h3>
              <p className="mt-guide-subtitle">Pusat Pengelolaan Data Tunggal (Single Source of Truth) & Dynamic Schema Alteration</p>
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
                <h4>📌 Pusat Data Tunggal (Single Source of Truth)</h4>
                <p>
                  Master Table merupakan <strong>pusat penyimpanan data utama</strong> yang telah dibersihkan oleh pipeline ETL. Semua modul analisis (OLAP Cube, Sales Forecast, Market Basket, K-Means Clustering, dan Reporting) membaca data secara real-time dari tabel ini.
                </p>
              </div>

              <div className="mt-guide-card">
                <h4>✏️ Dynamic Schema Alteration (Rename Column)</h4>
                <p>
                  Mengimplementasikan fitur <strong><code>ALTER TABLE RENAME COLUMN</code></strong> seperti di database SQL. Klik tombol pensil ✏️ di judul header kolom mana saja untuk mengganti nama kolom (misal: <code>Order_Date</code> ➔ <code>Tanggal_Order</code>) secara real-time.
                </p>
              </div>

              <div className="mt-guide-card">
                <h4>⚡ Operasi CRUD & Batch Manipulation</h4>
                <p>
                  Mendukung <strong>Insert Modal</strong> (tambah data valid), <strong>Inline Double-Click Edit</strong> (ubah nilai sel), <strong>Single / Batch Delete</strong> (hapus baris pilihan sekaligus), serta <strong>Multi-Filter Search & Date Range Slicing</strong>.
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
          {/* Global Search */}
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

          {/* Date Range Filters */}
          <div className="mt-date-filter">
            <span className="mt-date-label">📅 Periode:</span>
            <input
              type="date"
              className="mt-date-input"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1); }}
              title="Tanggal Mulai"
            />
            <span className="mt-date-sep">s/d</span>
            <input
              type="date"
              className="mt-date-input"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPage(1); }}
              title="Tanggal Akhir"
            />
          </div>

          {/* Column Toggle Dropdown Trigger */}
          <div className="mt-col-toggle-wrapper">
            <button className="mt-btn mt-btn-toggle" onClick={() => setShowColumnToggle(!showColumnToggle)}>
              👁️ Kolom ({activeColumns.length}) {showColumnToggle ? '▲' : '▼'}
            </button>
            {showColumnToggle && (
              <div className="mt-col-toggle-menu">
                <div className="mt-col-toggle-header">Tampilkan / Sembunyikan Kolom</div>
                <div className="mt-col-toggle-list">
                  {allColumns.map(col => (
                    <label key={col} className="mt-col-toggle-item">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col] !== false}
                        onChange={() => toggleColumnVisibility(col)}
                      />
                      <span>{col}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bulk Delete Button */}
          {selectedRowIndexes.size > 0 && (
            <button className="mt-btn mt-btn-danger" onClick={deleteSelectedRows}>
              🗑️ Hapus ({selectedRowIndexes.size}) Baris
            </button>
          )}

          {/* Clear Filter Button */}
          {(searchTerm || startDate || endDate || Object.values(columnFilters).some(v => v)) && (
            <button className="mt-btn mt-btn-clear-filter" onClick={clearAllFilters}>
              🧹 Reset Filter
            </button>
          )}

          <button className="mt-btn mt-btn-export" onClick={exportCSV}>
            📥 Export CSV
          </button>
          <button className="mt-btn mt-btn-add" onClick={() => setShowAddModal(true)}>
            ➕ Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Table Wrapper */}
      <div className="mt-table-wrapper">
        <table className="mt-table">
          <thead>
            <tr>
              <th className="mt-th-check">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={toggleSelectAllPage}
                  title="Pilih Semua di Halaman Ini"
                />
              </th>
              <th className="mt-th-num">#</th>
              {activeColumns.map(col => (
                <th
                  key={col}
                  className={`mt-th-sortable ${sortCol === col ? 'mt-th-active' : ''}`}
                >
                  <div className="mt-th-content">
                    <span onClick={() => handleSort(col)} className="mt-th-label" title="Klik untuk mengurutkan (sort)">
                      {col}
                      {sortCol === col && (
                        <span className="mt-sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="mt-btn-rename-col"
                      onClick={(e) => { e.stopPropagation(); openRenameModal(col); }}
                      title={`Ubah nama kolom "${col}" (ALTER TABLE RENAME COLUMN)`}
                    >
                      ✏️
                    </button>
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
                <td colSpan={activeColumns.length + 3} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                  Tidak ada data transaksi yang cocok dengan kriteria pencarian / filter Anda.
                </td>
              </tr>
            ) : (
              pageData.map((row, pageIdx) => {
                const globalIdx = (page - 1) * ROWS_PER_PAGE + pageIdx;
                const isSelected = selectedRowIndexes.has(row);
                return (
                  <tr key={globalIdx} className={`${pageIdx % 2 === 0 ? 'mt-row-even' : 'mt-row-odd'} ${isSelected ? 'mt-row-selected' : ''}`}>
                    <td className="mt-td-check">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row)}
                      />
                    </td>
                    <td className="mt-td-num">{globalIdx + 1}</td>
                    {activeColumns.map(col => {
                      const isEditing = editCell && editCell.rowIdx === globalIdx && editCell.col === col;
                      const rawVal = row[col];
                      let displayVal = rawVal ?? '';
                      const isMoneyCol = ['revenue', 'profit', 'omset', 'laba', 'keuntungan'].some(k => col.toLowerCase().includes(k));
                      if (isMoneyCol && typeof rawVal === 'number') {
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
                      <button className="mt-btn-delete" onClick={() => deleteSingleRow(row)} title="Hapus baris ini">
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
        💡 <strong>Petunjuk Operasional:</strong> Klik <strong>✏️ ikon pensil di judul kolom</strong> untuk mengganti nama kolom (SQL ALTER TABLE). Lakukan <strong>Double-Click pada sel</strong> untuk mengedit nilainya. Centang kotak baris untuk <strong>Bulk Delete</strong>.
      </div>

      {/* ── MODAL: Rename Column (ALTER TABLE RENAME COLUMN) ── */}
      {renameModal && (
        <div className="mt-modal-overlay">
          <div className="mt-modal-content" style={{ maxWidth: '450px' }}>
            <div className="mt-modal-header">
              <h3>✏️ Ubah Nama Kolom (Rename Header)</h3>
              <button className="mt-modal-close" onClick={() => setRenameModal(null)}>✕</button>
            </div>
            <form onSubmit={handleRenameColumnSubmit} className="mt-modal-form">
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                Perubahan nama kolom ini akan mengeksekusi operasi <strong><code>ALTER TABLE RENAME COLUMN</code></strong> secara otomatis pada seluruh {cleanData.length.toLocaleString('id-ID')} baris data.
              </p>
              <div className="mt-form-group" style={{ marginBottom: '1rem' }}>
                <label>Nama Kolom Lama (Old Name)</label>
                <input
                  type="text"
                  disabled
                  value={renameModal.oldColName}
                  style={{ opacity: 0.6, background: 'rgba(255,255,255,0.02)' }}
                />
              </div>
              <div className="mt-form-group" style={{ marginBottom: '1rem' }}>
                <label>Nama Kolom Baru (New Name)</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Masukkan nama kolom baru..."
                  value={renameModal.newColName}
                  onChange={e => setRenameModal({ ...renameModal, newColName: e.target.value })}
                />
              </div>

              {renameError && (
                <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '6px' }}>
                  ⚠️ {renameError}
                </div>
              )}

              <div className="mt-modal-actions">
                <button type="button" className="mt-btn mt-btn-clear-filter" onClick={() => setRenameModal(null)}>
                  Batal
                </button>
                <button type="submit" className="mt-btn mt-btn-add">
                  💾 Simpan Perubahan Header
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Form Tambah Transaksi Baru ── */}
      {showAddModal && (
        <div className="mt-modal-overlay">
          <div className="mt-modal-content">
            <div className="mt-modal-header">
              <h3>➕ Tambah Transaksi Penjualan Baru</h3>
              <button className="mt-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleFormSubmit} className="mt-modal-form">
              <div className="mt-form-grid">
                <div className="mt-form-group">
                  <label>Tanggal Transaksi (Order Date)</label>
                  <input
                    type="date"
                    required
                    value={formData.Order_Date}
                    onChange={e => setFormData({ ...formData, Order_Date: e.target.value })}
                  />
                </div>
                <div className="mt-form-group">
                  <label>Nama Pelanggan (Customer Name)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: John Doe"
                    value={formData.Customer_Name}
                    onChange={e => setFormData({ ...formData, Customer_Name: e.target.value })}
                  />
                </div>
                <div className="mt-form-group">
                  <label>Kota (City)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jackson"
                    value={formData.City}
                    onChange={e => setFormData({ ...formData, City: e.target.value })}
                  />
                </div>
                <div className="mt-form-group">
                  <label>Negara Bagian / State</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Mississippi"
                    value={formData.State}
                    onChange={e => setFormData({ ...formData, State: e.target.value })}
                  />
                </div>
                <div className="mt-form-group">
                  <label>Wilayah (Region)</label>
                  <select
                    value={formData.Region}
                    onChange={e => setFormData({ ...formData, Region: e.target.value })}
                  >
                    <option value="South">South</option>
                    <option value="Centre">Centre</option>
                    <option value="West">West</option>
                    <option value="East">East</option>
                    <option value="North">North</option>
                  </select>
                </div>
                <div className="mt-form-group">
                  <label>Kategori Produk</label>
                  <select
                    value={formData.Category}
                    onChange={e => setFormData({ ...formData, Category: e.target.value })}
                  >
                    <option value="Accessories">Accessories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Furniture">Furniture</option>
                  </select>
                </div>
                <div className="mt-form-group">
                  <label>Nama Produk (Product Name)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Wireless Mouse"
                    value={formData.Product_Name}
                    onChange={e => setFormData({ ...formData, Product_Name: e.target.value })}
                  />
                </div>
                <div className="mt-form-group">
                  <label>Jumlah Unit (Quantity)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.Quantity}
                    onChange={e => setFormData({ ...formData, Quantity: e.target.value })}
                  />
                </div>
                <div className="mt-form-group">
                  <label>Harga per Unit (Unit Price in USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.Unit_Price}
                    onChange={e => setFormData({ ...formData, Unit_Price: e.target.value })}
                  />
                </div>
                <div className="mt-form-group">
                  <label>Estimasi Profit (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.Profit}
                    onChange={e => setFormData({ ...formData, Profit: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-form-summary">
                <span>Calculated Revenue: <strong>${(Number(formData.Quantity || 0) * Number(formData.Unit_Price || 0)).toFixed(2)}</strong></span>
              </div>

              <div className="mt-modal-actions">
                <button type="button" className="mt-btn mt-btn-clear-filter" onClick={() => setShowAddModal(false)}>
                  Batal
                </button>
                <button type="submit" className="mt-btn mt-btn-add">
                  💾 Simpan Transaksi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterTableTab;
