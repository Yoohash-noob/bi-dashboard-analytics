/**
 * Download utility helpers for CSV and chart PNG exports.
 */

/**
 * Download an array of objects as a CSV file.
 * @param {Array<Object>} rows  - data rows (each object = one row)
 * @param {string} filename     - output filename (without extension)
 */
export function downloadCSV(rows, filename = 'export') {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

/**
 * Download a Chart.js chart canvas as a PNG image.
 * Pass the chart instance (ref.current) from react-chartjs-2.
 * @param {Object} chartRef  - React ref pointing to the chart instance
 * @param {string} filename  - output filename (without extension)
 * @param {string} bgColor   - background fill color (default dark)
 */
export function downloadChartPNG(chartRef, filename = 'chart', bgColor = '#1e293b') {
  if (!chartRef || !chartRef.current) return;

  const chart = chartRef.current;
  const originalCanvas = chart.canvas;
  const width = originalCanvas.width;
  const height = originalCanvas.height;

  // Draw onto a temp canvas with solid background
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(originalCanvas, 0, 0);

  tempCanvas.toBlob((blob) => {
    triggerDownload(blob, `${filename}.png`);
  }, 'image/png');
}

/**
 * Trigger a file download in the browser.
 * @param {Blob} blob
 * @param {string} filename
 */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
