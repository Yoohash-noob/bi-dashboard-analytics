import React, { useMemo, useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { downloadCSV, downloadChartPNG } from '../utils/download';

ChartJS.register(...registerables);

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  color: 'rgba(241,245,249,0.7)',
  scales: {
    x: {
      ticks: { color: 'rgba(241,245,249,0.7)', font: { family: 'Inter' } },
      grid: { color: 'rgba(255,255,255,0.06)' },
    },
    y: {
      ticks: { color: 'rgba(241,245,249,0.7)', font: { family: 'Inter' } },
      grid: { color: 'rgba(255,255,255,0.06)' },
    },
  },
  plugins: {
    legend: {
      labels: { color: 'rgba(241,245,249,0.7)', font: { family: 'Inter' } }
    },
    tooltip: {
      bodyFont: { family: 'Inter' },
      titleFont: { family: 'Inter' }
    }
  }
};

const doughnutOptions = {
  ...commonOptions,
  scales: {} // Doughnut doesn't need axes
};

const colors = ['#4ea8de','#7c3aed','#f72585','#2dd4bf','#fbbf24','#06d6a0','#e76f51','#8338ec','#ff6b6b','#48cae4'];

function DownloadBtn({ onClick, label, icon = '⬇️', variant = 'csv' }) {
  return (
    <button onClick={onClick} className="btn-export-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} title={label}>
      {icon} {label}
    </button>
  );
}

function ChartCard({ title, children, onDownloadPNG, onDownloadCSV, explanation, height = 440 }) {
  return (
    <div className="glass-card" style={{ minHeight: `${height}px`, display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
      <div className="section-header" style={{ marginBottom: '12px' }}>
        <h3 className="chart-title" style={{ marginBottom: 0, fontSize: '1.05rem', color: '#f1f5f9' }}>{title}</h3>
        <div className="btn-group">
          {onDownloadCSV && <DownloadBtn onClick={onDownloadCSV} label="CSV" icon="📥" variant="csv" />}
          {onDownloadPNG && <DownloadBtn onClick={onDownloadPNG} label="PNG" icon="🖼️" variant="png" />}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: '260px', position: 'relative' }}>
        {children}
      </div>
      {explanation && (
        <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.45' }}>
          {explanation}
        </div>
      )}
    </div>
  );
}

export default function ReportingTab({ data }) {
  const monthlyRef = useRef(null);
  const categoryRef = useRef(null);
  const productRef  = useRef(null);
  const regionRef   = useRef(null);

  const { kpis, monthlyData, categoryData, productData, regionData, topCustomers } = useMemo(() => {
    if (!data || data.length === 0) return { kpis: {}, monthlyData: [], categoryData: [], productData: [], regionData: [], topCustomers: [] };

    let totalRevenue = 0, totalProfit = 0, totalQuantity = 0;
    const orders = new Set();
    const monthlyMap = new Map();
    const categoryMap = new Map();
    const productMap = new Map();
    const regionMap = new Map();
    const customerMap = new Map();

    data.forEach(row => {
      const rev = Number(row.Revenue) || 0;
      const prof = Number(row.Profit) || 0;
      const qty = Number(row.Quantity) || 0;
      
      totalRevenue += rev;
      totalProfit += prof;
      totalQuantity += qty;
      if (row.Order_ID) orders.add(row.Order_ID);

      const month = row.Order_Date ? row.Order_Date.substring(0, 7) : 'Unknown';
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + rev);

      const cat = row.Category || 'Unknown';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + rev);

      const prod = row.Product_Name || 'Unknown';
      productMap.set(prod, (productMap.get(prod) || 0) + rev);

      const reg = row.Region || row.Location || 'Unknown';
      regionMap.set(reg, (regionMap.get(reg) || 0) + rev);

      const cust = row.Customer_Name || 'Unknown';
      if (!customerMap.has(cust)) {
        customerMap.set(cust, { Revenue: 0, Orders: new Set() });
      }
      const cData = customerMap.get(cust);
      cData.Revenue += rev;
      if (row.Order_ID) cData.Orders.add(row.Order_ID);
    });

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgOrderValue = orders.size > 0 ? totalRevenue / orders.size : 0;

    return {
      kpis: {
        totalRevenue,
        totalProfit,
        profitMargin,
        totalQuantity,
        avgOrderValue,
        totalOrders: orders.size
      },
      monthlyData: Array.from(monthlyMap.entries()).sort().map(([k,v]) => ({ x: k, y: v })),
      categoryData: Array.from(categoryMap.entries()).sort((a,b) => b[1]-a[1]),
      productData: Array.from(productMap.entries()).sort((a,b) => b[1]-a[1]).slice(0, 10),
      regionData: Array.from(regionMap.entries()).sort((a,b) => b[1]-a[1]),
      topCustomers: Array.from(customerMap.entries())
        .map(([name, d]) => ({ name, revenue: d.Revenue, orders: d.Orders.size }))
        .sort((a,b) => b.revenue - a.revenue)
        .slice(0, 20)
    };
  }, [data]);

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const handleExportAllCSV = () => {
    if (!data || data.length === 0) return;
    downloadCSV(data, 'full_report_data');
  };

  const handleExportKPICSV = () => {
    const rows = [
      { Metric: 'Total Revenue', Value: kpis.totalRevenue?.toFixed(2) },
      { Metric: 'Total Profit',  Value: kpis.totalProfit?.toFixed(2) },
      { Metric: 'Profit Margin (%)', Value: kpis.profitMargin?.toFixed(2) },
      { Metric: 'Total Quantity', Value: kpis.totalQuantity },
      { Metric: 'Avg Order Value', Value: kpis.avgOrderValue?.toFixed(2) },
      { Metric: 'Total Orders', Value: kpis.totalOrders },
    ];
    downloadCSV(rows, 'kpi_summary');
  };

  const handleDownloadTopCustomers = () => {
    const rows = topCustomers.map((c, i) => ({
      Rank: i + 1,
      Customer_Name: c.name,
      Orders: c.orders,
      Total_Revenue: c.revenue.toFixed(2),
    }));
    downloadCSV(rows, 'top_customers');
  };

  return (
    <div className="tab-content">
      {/* Overview Explanation */}
      <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(78, 168, 222, 0.3)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#38bdf8', margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 'bold' }}>
          💡 Penjelasan Teknik: Reporting Services (Layanan Eksekutif Dashboard)
        </h4>
        <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
          Modul Reporting Services memberikan <strong>gambaran visual menyeluruh (Executive Summary)</strong> mengenai indikator kinerja utama (KPI), tren waktu, komposisi penjualan, peringkat produk terlaris, dan persebaran wilayah untuk membantu manajemen mengambil keputusan dengan cepat.
        </p>
      </div>

      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">Executive Reporting Dashboard</h1>
        <div className="btn-group">
          <DownloadBtn onClick={handleExportKPICSV} label="KPI Summary" icon="📊" variant="csv" />
          <DownloadBtn onClick={handleExportAllCSV} label="Full Data CSV" icon="📥" variant="csv" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {[
          { label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue) },
          { label: 'Total Profit', value: formatCurrency(kpis.totalProfit) },
          { label: 'Profit Margin', value: `${kpis.profitMargin?.toFixed(2)}%` },
          { label: 'Total Quantity', value: kpis.totalQuantity?.toLocaleString('id-ID') },
          { label: 'Avg Order Value', value: formatCurrency(kpis.avgOrderValue) },
          { label: 'Total Orders', value: kpis.totalOrders?.toLocaleString('id-ID') }
        ].map((kpi, i) => (
          <div key={i} className="kpi-card glass-card">
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="chart-grid">
        {/* 1. Monthly Revenue Trend */}
        <ChartCard
          title="1. Monthly Revenue Trend (Grafik Garis Tren Bulanan)"
          onDownloadPNG={() => downloadChartPNG(monthlyRef, 'monthly_trend')}
          onDownloadCSV={() => downloadCSV(monthlyData.map(d => ({ Month: d.x, Revenue: d.y.toFixed(2) })), 'monthly_revenue')}
          explanation={
            <>
              <strong style={{ color: '#4ea8de' }}>📊 Penjelasan Line Chart:</strong> Menggambarkan fluktuasi total pendapatan (Revenue) dari bulan ke bulan. <strong>Sumbu X</strong> menunjukkan kurun waktu bulan, <strong>Sumbu Y</strong> menunjukkan total omset dalam mata uang. Area biru berbayang menunjukkan volume performa omset.
            </>
          }
        >
          <Line
            ref={monthlyRef}
            options={commonOptions}
            data={{
              labels: monthlyData.map(d => d.x),
              datasets: [{
                label: 'Revenue (Rp)',
                data: monthlyData.map(d => d.y),
                borderColor: '#4ea8de',
                backgroundColor: 'rgba(78, 168, 222, 0.1)',
                fill: true,
                tension: 0.3
              }]
            }}
          />
        </ChartCard>

        {/* 2. Revenue by Category */}
        <ChartCard
          title="2. Revenue by Category (Grafik Donat Kontribusi Kategori)"
          onDownloadPNG={() => downloadChartPNG(categoryRef, 'revenue_by_category')}
          onDownloadCSV={() => downloadCSV(categoryData.map(d => ({ Category: d[0], Revenue: d[1].toFixed(2) })), 'revenue_by_category')}
          explanation={
            <>
              <strong style={{ color: '#7c3aed' }}>🍩 Penjelasan Doughnut Chart:</strong> Menampilkan proporsi persentase sumbangan pendapatan dari tiap kategori produk. Potongan warna terbesar menandakan kategori produk penopang bisnis utama (Revenue Driver).
            </>
          }
        >
          <Doughnut
            ref={categoryRef}
            options={doughnutOptions}
            data={{
              labels: categoryData.map(d => d[0]),
              datasets: [{
                data: categoryData.map(d => d[1]),
                backgroundColor: colors,
                borderWidth: 0
              }]
            }}
          />
        </ChartCard>

        {/* 3. Top 10 Products */}
        <ChartCard
          title="3. Top 10 Products (Grafik Batang Produk Terlaris)"
          onDownloadPNG={() => downloadChartPNG(productRef, 'top10_products')}
          onDownloadCSV={() => downloadCSV(productData.map(d => ({ Product: d[0], Revenue: d[1].toFixed(2) })), 'top10_products')}
          explanation={
            <>
              <strong style={{ color: '#ec4899' }}>📊 Penjelasan Horizontal Bar Chart:</strong> Peringkat 10 produk dengan total omset tertinggi (Prinsip Pareto 80/20). Batang terpanjang melambangkan produk paling diminati pasar.
            </>
          }
        >
          <Bar
            ref={productRef}
            options={{ ...commonOptions, indexAxis: 'y' }}
            data={{
              labels: productData.map(d => d[0]),
              datasets: [{
                label: 'Revenue (Rp)',
                data: productData.map(d => d[1]),
                backgroundColor: colors[1],
                borderRadius: 4
              }]
            }}
          />
        </ChartCard>

        {/* 4. Revenue by Region */}
        <ChartCard
          title="4. Revenue by Region (Grafik Batang Distribusi Wilayah)"
          onDownloadPNG={() => downloadChartPNG(regionRef, 'revenue_by_region')}
          onDownloadCSV={() => downloadCSV(regionData.map(d => ({ Region: d[0], Revenue: d[1].toFixed(2) })), 'revenue_by_region')}
          explanation={
            <>
              <strong style={{ color: '#f59e0b' }}>📊 Penjelasan Vertical Bar Chart:</strong> Membandingkan total penjualan antar wilayah geografis (Region). Membantu mengevaluasi wilayah mana yang membutuhkan dorongan ekspansi atau promosi tambahan.
            </>
          }
        >
          <Bar
            ref={regionRef}
            options={commonOptions}
            data={{
              labels: regionData.map(d => d[0]),
              datasets: [{
                label: 'Revenue (Rp)',
                data: regionData.map(d => d[1]),
                backgroundColor: colors[2],
                borderRadius: 4
              }]
            }}
          />
        </ChartCard>
      </div>

      {/* Top Customers Table */}
      <div className="glass-card section-block" style={{ marginTop: '2rem' }}>
        <div className="section-header">
          <h3 className="section-title" style={{ fontSize: '1.25rem', paddingLeft: 0, borderLeft: 'none', background: 'none', WebkitTextFillColor: 'initial', color: '#f1f5f9' }}>
            Top 20 Pelanggan Terbesar (Key Accounts)
          </h3>
          <DownloadBtn onClick={handleDownloadTopCustomers} label="CSV" icon="📥" variant="csv" />
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Peringkat</th>
                <th>Nama Pelanggan</th>
                <th>Total Transaksi</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, i) => (
                <tr key={i}>
                  <td>#{i + 1}</td>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.orders} order</td>
                  <td style={{ color: '#10b981', fontWeight: 'bold' }}>{formatCurrency(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
