import React, { useState, useMemo } from 'react';
import { downloadCSV } from '../utils/download';

const AnalysisTab = ({ data }) => {
  const [rowDim, setRowDim] = useState('Category');
  const [colDim, setColDim] = useState('Year');
  const [measure, setMeasure] = useState('Revenue');
  const [filters, setFilters] = useState({ Region: 'Semua', Category: 'Semua', Year: 'Semua' });
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (rowKey) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  };

  const processedData = useMemo(() => {
    if (!data) return [];
    return data.map(d => {
      const date = new Date(d.Order_Date);
      return {
        ...d,
        Year: date.getFullYear().toString(),
        Month: (date.getMonth() + 1).toString().padStart(2, '0'),
        Quarter: `Q${Math.ceil((date.getMonth() + 1) / 3)}`
      };
    });
  }, [data]);

  const filteredData = useMemo(() => {
    return processedData.filter(d => {
      if (filters.Region !== 'Semua' && d.Region !== filters.Region) return false;
      if (filters.Category !== 'Semua' && d.Category !== filters.Category) return false;
      if (filters.Year !== 'Semua' && d.Year !== filters.Year) return false;
      return true;
    });
  }, [processedData, filters]);

  const pivotData = useMemo(() => {
    const colSet = new Set();
    const rows = {};
    const grandTotals = {};

    filteredData.forEach(d => {
      const rowVal = d[rowDim] || 'Unknown';
      const colVal = d[colDim] || 'Unknown';
      colSet.add(colVal);
      
      const val = parseFloat(d[measure] || d.Quantity || 0);
      const qty = parseFloat(d.Quantity || 1);

      if (!rows[rowVal]) rows[rowVal] = { _total: 0, _totalQty: 0, _count: 0 };
      if (!rows[rowVal][colVal]) rows[rowVal][colVal] = { sum: 0, qty: 0, count: 0 };
      
      rows[rowVal][colVal].sum += val;
      rows[rowVal][colVal].qty += qty;
      rows[rowVal][colVal].count += 1;
      
      rows[rowVal]._total += val;
      rows[rowVal]._totalQty += qty;
      rows[rowVal]._count += 1;

      if (!grandTotals[colVal]) grandTotals[colVal] = { sum: 0, qty: 0, count: 0 };
      grandTotals[colVal].sum += val;
      grandTotals[colVal].qty += qty;
      grandTotals[colVal].count += 1;
      
      if (!grandTotals._total) grandTotals._total = { sum: 0, qty: 0, count: 0 };
      grandTotals._total.sum += val;
      grandTotals._total.qty += qty;
      grandTotals._total.count += 1;
    });

    const cols = Array.from(colSet).sort();

    const formatVal = (obj) => {
      if (!obj) return 0;
      if (measure === 'Avg_Unit_Price') return obj.sum / (obj.count || 1);
      if (measure === 'Profit_Margin') return (obj.sum / (obj.qty || 1)) * 100; // rough approx depending on measure
      return obj.sum;
    };

    const finalRows = Object.keys(rows).sort().map(r => {
      const rowData = { key: r, isSubRow: false };
      cols.forEach(c => {
        rowData[c] = formatVal(rows[r][c]);
      });
      rowData._total = formatVal({ sum: rows[r]._total, qty: rows[r]._totalQty, count: rows[r]._count });
      return rowData;
    });

    const gTotals = { key: 'Grand Total', isTotal: true };
    cols.forEach(c => {
      gTotals[c] = formatVal(grandTotals[c]);
    });
    gTotals._total = formatVal(grandTotals._total);

    return { cols, rows: finalRows, grandTotals: gTotals };
  }, [filteredData, rowDim, colDim, measure]);

  const uniqueValues = (field) => {
    return Array.from(new Set(processedData.map(d => d[field]))).filter(Boolean).sort();
  };

  const formatNumber = (num) => {
    return Number(num).toLocaleString('id-ID', { maximumFractionDigits: 2 });
  };

  const handleDownloadPivotCSV = () => {
    if (!pivotData || !pivotData.rows || pivotData.rows.length === 0) return;
    const rows = pivotData.rows.map(r => {
      const obj = { [rowDim]: r.key };
      pivotData.cols.forEach(c => { obj[c] = Number(r[c] || 0).toFixed(2); });
      obj['Total'] = Number(r._total || 0).toFixed(2);
      return obj;
    });
    // Also append grand total
    const gt = { [rowDim]: 'Grand Total' };
    pivotData.cols.forEach(c => { gt[c] = Number(pivotData.grandTotals[c] || 0).toFixed(2); });
    gt['Total'] = Number(pivotData.grandTotals._total || 0).toFixed(2);
    rows.push(gt);
    downloadCSV(rows, `pivot_${rowDim}_${colDim}_${measure}`);
  };

  return (
    <div className="analysis-tab">
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🧊</span> Slice & Dice Simulator (OLAP Cube)
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Pilih dimensi baris, kolom, dan metrik yang ingin dianalisis. Gunakan filter untuk memotong (slice) data.</p>
        <div className="controls-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '15px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem', color: '#cbd5e1' }}>
            Dimensi Baris (Row)
            <select value={rowDim} onChange={e => setRowDim(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px' }}>
            <option value="Category">Category</option>
            <option value="Region">Region</option>
            <option value="State">State</option>
            <option value="Year">Year</option>
            <option value="Month">Month</option>
            <option value="Sub_Category">Sub_Category</option>
            <option value="Product_Name">Product_Name</option>
          </select>
        </label>
        
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem', color: '#cbd5e1' }}>
            Dimensi Kolom (Column)
            <select value={colDim} onChange={e => setColDim(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px' }}>
            <option value="Year">Year</option>
            <option value="Month">Month</option>
            <option value="Quarter">Quarter</option>
            <option value="Region">Region</option>
            <option value="Category">Category</option>
          </select>
        </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem', color: '#cbd5e1' }}>
            Metrik (Measure)
            <select value={measure} onChange={e => setMeasure(e.target.value)} style={{ padding: '8px 12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', borderRadius: '6px', fontWeight: 'bold' }}>
            <option value="Revenue">Revenue</option>
            <option value="Profit">Profit</option>
            <option value="Quantity">Quantity</option>
            <option value="Unit_Price">Avg_Unit_Price</option>
            <option value="Profit">Profit_Margin</option>
          </select>
        </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem', color: '#cbd5e1' }}>
            Filter Region
            <select value={filters.Region} onChange={e => setFilters({...filters, Region: e.target.value})} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px' }}>
            <option value="Semua">Semua</option>
            {uniqueValues('Region').map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem', color: '#cbd5e1' }}>
            Filter Category
            <select value={filters.Category} onChange={e => setFilters({...filters, Category: e.target.value})} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px' }}>
            <option value="Semua">Semua</option>
            {uniqueValues('Category').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem', color: '#cbd5e1' }}>
            Filter Year
            <select value={filters.Year} onChange={e => setFilters({...filters, Year: e.target.value})} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px' }}>
            <option value="Semua">Semua</option>
            {uniqueValues('Year').map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
          <button
            onClick={handleDownloadPivotCSV}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem',
              fontWeight: 600, cursor: 'pointer', border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white',
              transition: 'all 0.2s', height: 'fit-content', marginBottom: '2px'
            }}
            title="Download Pivot Table as CSV"
          >
            ⬇️ Download CSV
          </button>
        </div>
      </div>

      <div className="pivot-table-container glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table className="pivot-table">
          <thead>
            <tr>
              <th>{rowDim}</th>
              {pivotData.cols.map(c => <th key={c}>{c}</th>)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {pivotData.rows.map(r => (
              <React.Fragment key={r.key}>
                <tr>
                  <td>
                    <button onClick={() => toggleRow(r.key)} style={{background:'none', border:'none', cursor:'pointer', marginRight: '5px'}}>
                      {expandedRows.has(r.key) ? '▼' : '▶'}
                    </button>
                    {r.key}
                  </td>
                  {pivotData.cols.map(c => <td key={c}>{formatNumber(r[c])}</td>)}
                  <td><strong>{formatNumber(r._total)}</strong></td>
                </tr>
                {/* Expanded drill down logic could go here, omitting complex subrows for simplicity unless requested */}
              </React.Fragment>
            ))}
            <tr className="total-row">
              <td><strong>{pivotData.grandTotals.key}</strong></td>
              {pivotData.cols.map(c => <td key={c}><strong>{formatNumber(pivotData.grandTotals[c])}</strong></td>)}
              <td><strong>{formatNumber(pivotData.grandTotals._total)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalysisTab;
