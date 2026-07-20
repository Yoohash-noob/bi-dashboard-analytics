import React, { useState, useMemo, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { getMonthlySales, forecastSales, correlationMatrix, marketBasketAnalysis } from '../utils/mining';
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

export default function MiningTab({ data }) {
  const [forecastMonths, setForecastMonths] = useState(6);

  const forecastRef = useRef(null);
  const basketRef   = useRef(null);

  // Forecasting
  const { historical, forecast, stats } = useMemo(() => {
    if (!data || data.length === 0) return { historical: [], forecast: [], stats: {} };
    const monthlySales = getMonthlySales(data);
    const forecastResult = forecastSales(monthlySales, forecastMonths);
    return {
      historical: monthlySales,
      forecast: forecastResult.forecast,
      stats: forecastResult.regression
    };
  }, [data, forecastMonths]);

  const forecastChartData = {
    labels: [...historical.map(d => d.month), ...forecast.map(d => d.month)],
    datasets: [
      {
        label: 'Historical Sales',
        data: [...historical.map(d => d.revenue), ...Array(forecast.length).fill(null)],
        borderColor: '#4ea8de',
        backgroundColor: 'rgba(78, 168, 222, 0.2)',
        fill: true,
        segment: {
          borderDash: []
        }
      },
      {
        label: 'Forecast',
        data: [...Array(historical.length - 1).fill(null), historical[historical.length - 1]?.revenue, ...forecast.map(d => d.predicted_revenue)],
        borderColor: '#7c3aed',
        borderDash: [5, 5],
        fill: false,
      }
    ]
  };

  // Correlation Matrix
  const correlations = useMemo(() => {
    if (!data || data.length === 0) return [];
    const result = correlationMatrix(data, ['Quantity', 'Unit_Price', 'Revenue', 'Profit']);
    return result.labels.map((label, i) => ({
      field: label,
      values: result.matrix[i]
    }));
  }, [data]);

  const getCellColor = (val) => {
    if (val > 0) return `rgba(45, 212, 191, ${Math.abs(val)})`;  // teal for positive
    if (val < 0) return `rgba(247, 37, 133, ${Math.abs(val)})`;  // pink for negative
    return 'transparent';
  };

  // Market Basket
  const basketRules = useMemo(() => {
    if (!data || data.length === 0) return [];
    const rules = marketBasketAnalysis(data).slice(0, 10);
    return rules.map(r => ({
      itemA: r.item1,
      itemB: r.item2,
      count: r.count,
      support: (r.support * 100).toFixed(2)
    }));
  }, [data]);

  const basketChartData = {
    labels: basketRules.map(r => `${r.itemA} + ${r.itemB}`),
    datasets: [{
      label: 'Count',
      data: basketRules.map(r => r.count),
      backgroundColor: colors.slice(0, 10),
    }]
  };

  // ── Download handlers ────────────────────────────────────────────────────
  const handleDownloadForecastCSV = () => {
    const rows = [
      ...historical.map(d => ({ Month: d.month, Revenue: d.revenue.toFixed(2), Type: 'Historical' })),
      ...forecast.map(d => ({ Month: d.month, Revenue: d.predicted_revenue.toFixed(2), Type: 'Forecast' })),
    ];
    downloadCSV(rows, 'sales_forecast');
  };

  const handleDownloadCorrelationCSV = () => {
    const fields = ['Quantity', 'Unit_Price', 'Revenue', 'Profit'];
    const rows = correlations.map(row => {
      const obj = { Field: row.field };
      row.values.forEach((v, j) => { obj[fields[j]] = v.toFixed(4); });
      return obj;
    });
    downloadCSV(rows, 'correlation_matrix');
  };

  const handleDownloadBasketCSV = () => {
    downloadCSV(
      basketRules.map(r => ({ Item_A: r.itemA, Item_B: r.itemB, Count: r.count, Support_pct: r.support })),
      'market_basket_rules'
    );
  };

  return (
    <div className="p-6 space-y-8 text-slate-200 font-inter">
      {/* Sales Forecasting */}
      <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <h2 className="text-xl font-semibold">Sales Forecasting</h2>
          <div className="flex items-center gap-3">
            <select 
              value={forecastMonths} 
              onChange={e => setForecastMonths(Number(e.target.value))}
              className="bg-slate-700 text-white rounded p-2 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {[3, 6, 9, 12].map(m => <option key={m} value={m}>{m} Months</option>)}
            </select>
            <DownloadBtn onClick={() => downloadChartPNG(forecastRef, 'sales_forecast_chart')} label="PNG" icon="🖼️" variant="png" />
            <DownloadBtn onClick={handleDownloadForecastCSV} label="CSV" icon="📥" variant="csv" />
          </div>
        </div>
        <div style={{ height: '300px' }}>
          <Line ref={forecastRef} data={forecastChartData} options={commonOptions} />
        </div>
        {stats && (
          <div className="mt-4 flex gap-6 text-sm text-slate-400">
            <div><span className="font-medium text-slate-300">Slope:</span> {stats.slope?.toFixed(2)}</div>
            <div><span className="font-medium text-slate-300">R²:</span> {stats.r2?.toFixed(4)}</div>
            <div><span className="font-medium text-slate-300">Trend:</span> {stats.slope > 0 ? '📈 Positive' : '📉 Negative'}</div>
          </div>
        )}
      </section>

      {/* Correlation Matrix */}
      <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Correlation Matrix</h2>
          <DownloadBtn onClick={handleDownloadCorrelationCSV} label="CSV" icon="📥" variant="csv" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr>
                <th className="p-3 border-b border-slate-700"></th>
                {['Quantity', 'Unit_Price', 'Revenue', 'Profit'].map(h => (
                  <th key={h} className="p-3 border-b border-slate-700 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlations.map((row, i) => (
                <tr key={row.field}>
                  <td className="p-3 border-b border-slate-700 font-medium text-left">{row.field}</td>
                  {row.values.map((val, j) => (
                    <td 
                      key={j} 
                      className="p-3 border-b border-slate-700"
                      style={{ backgroundColor: getCellColor(val), color: Math.abs(val) > 0.5 ? '#fff' : 'inherit' }}
                    >
                      {val.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Market Basket Analysis */}
      <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Market Basket Analysis (Top 10 Pairs)</h2>
          <div className="flex gap-2">
            <DownloadBtn onClick={() => downloadChartPNG(basketRef, 'market_basket_chart')} label="PNG" icon="🖼️" variant="png" />
            <DownloadBtn onClick={handleDownloadBasketCSV} label="CSV" icon="📥" variant="csv" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-3 border-b border-slate-700">Item A</th>
                  <th className="p-3 border-b border-slate-700">Item B</th>
                  <th className="p-3 border-b border-slate-700">Count</th>
                  <th className="p-3 border-b border-slate-700">Support</th>
                </tr>
              </thead>
              <tbody>
                {basketRules.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 border-b border-slate-700/50">{r.itemA}</td>
                    <td className="p-3 border-b border-slate-700/50">{r.itemB}</td>
                    <td className="p-3 border-b border-slate-700/50">{r.count}</td>
                    <td className="p-3 border-b border-slate-700/50">{r.support}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ height: '300px' }}>
            <Bar 
              ref={basketRef}
              data={basketChartData} 
              options={{ ...commonOptions, indexAxis: 'y' }} 
            />
          </div>
        </div>
      </section>
    </div>
  );
}
