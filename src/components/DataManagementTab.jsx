import React, { useState } from 'react';
import Papa from 'papaparse';

const DataManagementTab = ({ data, onUpdateData, onDeleteData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const [editingIndex, setEditingIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  if (!data || data.length === 0) {
    return (
      <div className="section-block">
        <h2 className="section-title">Data Management (CRUD)</h2>
        <div className="no-data-notice glass-card text-center p-8">
          Belum ada data. Silakan upload file CSV terlebih dahulu.
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  const handleEditClick = (index, row) => {
    setEditingIndex(index);
    setEditFormData(row);
  };

  const handleSaveClick = (index) => {
    onUpdateData(index, editFormData);
    setEditingIndex(null);
  };

  const handleCancelClick = () => {
    setEditingIndex(null);
  };

  const handleInputChange = (field, value) => {
    setEditFormData({
      ...editFormData,
      [field]: value
    });
  };

  const handleDownloadCSV = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'bi_data_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get headers from the first row of data
  const headers = Object.keys(data[0] || {});

  return (
    <div className="section-block">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">Data Management (In-Memory CRUD)</h2>
        <button 
          onClick={handleDownloadCSV}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ⬇️ Download CSV
        </button>
      </div>
      
      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '0.75rem', color: '#94a3b8' }}>Actions</th>
              {headers.map(header => (
                <th key={header} style={{ padding: '0.75rem', color: '#94a3b8' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, i) => {
              const actualIndex = startIndex + i;
              const isEditing = editingIndex === actualIndex;

              return (
                <tr key={actualIndex} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleSaveClick(actualIndex)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                        <button onClick={handleCancelClick} style={{ background: '#64748b', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleEditClick(actualIndex, row)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => onDeleteData(actualIndex)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Del</button>
                      </div>
                    )}
                  </td>
                  {headers.map(header => (
                    <td key={header} style={{ padding: '0.75rem', color: '#e2e8f0' }}>
                      {isEditing ? (
                        <input 
                          type={typeof row[header] === 'number' ? 'number' : 'text'}
                          value={editFormData[header] || ''}
                          onChange={(e) => {
                            const val = typeof row[header] === 'number' ? Number(e.target.value) : e.target.value;
                            handleInputChange(header, val);
                          }}
                          style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            padding: '0.25rem',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        row[header]
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, data.length)} of {data.length} entries
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span style={{ padding: '0.5rem 1rem', color: 'white' }}>Page {currentPage} / {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagementTab;
