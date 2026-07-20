import React from 'react';
import { generateSQL, exportCSV } from '../utils/etl';

const IntegrationTab = ({ rawData, cleanData, etlLogs }) => {
  const getLogClass = (log) => {
    if (log.includes('✅') || log.includes('🎉')) return 'log-success';
    if (log.includes('🔄') || log.includes('📦')) return 'log-info';
    if (log.includes('⚠')) return 'log-warning';
    return '';
  };

  const getUniqueCount = (field) => {
    if (!cleanData) return 0;
    const unique = new Set(cleanData.map(d => d[field]));
    return unique.size;
  };

  const handleDownloadSQL = () => {
    const sql = generateSQL();
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "schema.sql";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    exportCSV(cleanData, "product_sales_clean.csv");
  };

  return (
    <div className="integration-tab">
      <h3>ETL Pipeline & Star Schema</h3>
      
      <div className="etl-pipeline">
        <div className="etl-card">
          <div className="step-number">1</div>
          <h3>Extract</h3>
          <p>Raw Data Rows: {rawData ? rawData.length : 0}</p>
          <p>Columns: {rawData && rawData[0] ? Object.keys(rawData[0]).length : 0}</p>
        </div>
        <div className="etl-card">
          <div className="step-number">2</div>
          <h3>Transform</h3>
          <ul>
            <li>Trim headers</li>
            <li>Convert data types</li>
            <li>Standardize dates</li>
            <li>Remove invalid rows</li>
          </ul>
        </div>
        <div className="etl-card">
          <div className="step-number">3</div>
          <h3>Load</h3>
          <p>Clean Data Rows: {cleanData ? cleanData.length : 0}</p>
          <p>Dimension Tables: 4</p>
        </div>
      </div>

      <div className="etl-log">
        <h3>ETL Logs</h3>
        <div className="log-console">
          {etlLogs && etlLogs.map((log, i) => (
            <div key={i} className={`log-entry ${getLogClass(log)}`}>{log}</div>
          ))}
        </div>
      </div>

      <div className="schema-diagram">
        <h3>Star Schema</h3>
        <div className="schema-fact">
          <h4>Fact_Sales</h4>
          <ul>
            <li>Order_ID (PK)</li>
            <li>Date_ID (FK)</li>
            <li>Customer_Name (FK)</li>
            <li>Location_ID (FK)</li>
            <li>Product_Name (FK)</li>
            <li>Quantity</li>
            <li>Unit_Price</li>
            <li>Revenue</li>
            <li>Profit</li>
          </ul>
        </div>
        
        <div className="schema-arrow">⬇</div>
        
        <div className="schema-dimensions-row">
          <div className="schema-dim">
            <h4>Dim_Date</h4>
            <ul>
              <li>Date_ID (PK)</li>
              <li>Order_Date</li>
              <li>Year</li>
              <li>Month</li>
              <li>Quarter</li>
            </ul>
            <span className="count-badge">{getUniqueCount('Order_Date')} unique</span>
          </div>
          <div className="schema-dim">
            <h4>Dim_Customer</h4>
            <ul>
              <li>Customer_Name (PK)</li>
            </ul>
            <span className="count-badge">{getUniqueCount('Customer_Name')} unique</span>
          </div>
          <div className="schema-dim">
            <h4>Dim_Location</h4>
            <ul>
              <li>Location_ID (PK)</li>
              <li>City</li>
              <li>State</li>
              <li>Region</li>
              <li>Country</li>
            </ul>
            <span className="count-badge">{getUniqueCount('City')} unique</span>
          </div>
          <div className="schema-dim">
            <h4>Dim_Product</h4>
            <ul>
              <li>Product_Name (PK)</li>
              <li>Category</li>
              <li>Sub_Category</li>
              <li>Product_Name</li>
            </ul>
            <span className="count-badge">{getUniqueCount('Product_Name')} unique</span>
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn-export btn-export-primary" onClick={handleDownloadSQL}>Download SQL Schema</button>
        <button className="btn-export btn-export-secondary" onClick={handleDownloadCSV}>Download Data Bersih (CSV)</button>
      </div>
    </div>
  );
};

export default IntegrationTab;
