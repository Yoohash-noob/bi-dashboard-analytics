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

// ── Styled download button ────────────────────────────────────────────────────
function DownloadBtn({ onClick, label, icon = '⬇️', variant = 'csv' }) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border';
  const styles = {
    csv: 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border-emerald-600/40 hover:border-emerald-500',
    png: 'bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border-sky-600/40 hover:border-sky-500',
  };
  return (
    <button onClick={onClick} className={`${base} ${styles[variant]}`} title={label}>
      {icon} {label}
    </button>
  );
}

// ── Chart card wrapper with download button ───────────────────────────────────
function ChartCard({ title, children, onDownloadPNG, onDownloadCSV, height = 350 }) {
  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-sm" style={{ height: `${height}px` }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex gap-1.5">
          {onDownloadCSV && <DownloadBtn onClick={onDownloadCSV} label="CSV" icon="📥" variant="csv" />}
          {onDownloadPNG && <DownloadBtn onClick={onDownloadPNG} label="PNG" icon="🖼️" variant="png" />}
        </div>
      </div>
      <div style={{ height: `${height - 80}px` }}>
        {children}
      </div>
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

      const reg = row.Region || 'Unknown';
      regionMap.set(reg, (regionMap.get(reg) || 0) + rev);

      const cust = row.Customer_Name || 'Unknown';
      const custData = customerMap.get(cust) || { Revenue: 0, Orders: new Set() };
      custData.Revenue += rev;
      custData.Orders.add(row.Order_ID);
      customerMap.set(cust, custData);
    });

    return {
      kpis: {
        totalRevenue,
        totalProfit,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        totalQuantity,
        avgOrderValue: orders.size > 0 ? totalRevenue / orders.size : 0,
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

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // ── Download handlers ────────────────────────────────────────────────────
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
    <div className="p-6 space-y-8 text-slate-200 font-inter">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-bold">Reporting Dashboard</h1>
        <div className="flex gap-2">
          <DownloadBtn onClick={handleExportKPICSV} label="KPI Summary" icon="📊" variant="csv" />
          <DownloadBtn onClick={handleExportAllCSV} label="Full Data CSV" icon="📥" variant="csv" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue) },
          { label: 'Total Profit', value: formatCurrency(kpis.totalProfit) },
          { label: 'Profit Margin', value: `${kpis.profitMargin?.toFixed(2)}%` },
          { label: 'Total Quantity', value: kpis.totalQuantity?.toLocaleString() },
          { label: 'Avg Order Value', value: formatCurrency(kpis.avgOrderValue) },
          { label: 'Total Orders', value: kpis.totalOrders?.toLocaleString() }
        ].map((kpi, i) => (
          <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-sm text-center">
            <div className="text-sm text-slate-400 mb-1">{kpi.label}</div>
            <div className="text-xl font-bold text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Revenue Trend"
          onDownloadPNG={() => downloadChartPNG(monthlyRef, 'monthly_trend')}
          onDownloadCSV={() => downloadCSV(monthlyData.map(d => ({ Month: d.x, Revenue: d.y.toFixed(2) })), 'monthly_revenue')}
        >
          <Line
            ref={monthlyRef}
            options={commonOptions}
            data={{
              labels: monthlyData.map(d => d.x),
              datasets: [{
                label: 'Revenue',
                data: monthlyData.map(d => d.y),
                borderColor: '#4ea8de',
                backgroundColor: 'rgba(78, 168, 222, 0.1)',
                fill: true,
                tension: 0.3
              }]
            }}
          />
        </ChartCard>

        <ChartCard
          title="Revenue by Category"
          onDownloadPNG={() => downloadChartPNG(categoryRef, 'revenue_by_category')}
          onDownloadCSV={() => downloadCSV(categoryData.map(d => ({ Category: d[0], Revenue: d[1].toFixed(2) })), 'revenue_by_category')}
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

        <ChartCard
          title="Top 10 Products"
          onDownloadPNG={() => downloadChartPNG(productRef, 'top10_products')}
          onDownloadCSV={() => downloadCSV(productData.map(d => ({ Product: d[0], Revenue: d[1].toFixed(2) })), 'top10_products')}
        >
          <Bar
            ref={productRef}
            options={{ ...commonOptions, indexAxis: 'y' }}
            data={{
              labels: productData.map(d => d[0]),
              datasets: [{
                label: 'Revenue',
                data: productData.map(d => d[1]),
                backgroundColor: colors[1],
                borderRadius: 4
              }]
            }}
          />
        </ChartCard>

        <ChartCard
          title="Revenue by Region"
          onDownloadPNG={() => downloadChartPNG(regionRef, 'revenue_by_region')}
          onDownloadCSV={() => downloadCSV(regionData.map(d => ({ Region: d[0], Revenue: d[1].toFixed(2) })), 'revenue_by_region')}
        >
          <Bar
            ref={regionRef}
            options={commonOptions}
            data={{
              labels: regionData.map(d => d[0]),
              datasets: [{
                label: 'Revenue',
                data: regionData.map(d => d[1]),
                backgroundColor: colors[2],
                borderRadius: 4
              }]
            }}
          />
        </ChartCard>
      </div>

      {/* Top Customers Table */}
      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Top 20 Customers</h3>
          <DownloadBtn onClick={handleDownloadTopCustomers} label="CSV" icon="📥" variant="csv" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800">
                <th className="p-3 border-b border-slate-700 font-medium">#</th>
                <th className="p-3 border-b border-slate-700 font-medium">Customer Name</th>
                <th className="p-3 border-b border-slate-700 font-medium">Orders</th>
                <th className="p-3 border-b border-slate-700 font-medium">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, i) => (
                <tr key={i} className="hover:bg-slate-700/50 transition-colors">
                  <td className="p-3 border-b border-slate-700/50 text-slate-400">{i + 1}</td>
                  <td className="p-3 border-b border-slate-700/50">{c.name}</td>
                  <td className="p-3 border-b border-slate-700/50">{c.orders}</td>
                  <td className="p-3 border-b border-slate-700/50">{formatCurrency(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
