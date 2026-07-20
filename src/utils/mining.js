export function linearRegression(points) {
  let n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  points.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  });
  
  let slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  let intercept = (sumY - slope * sumX) / n;
  
  // calculate R2
  let meanY = sumY / n;
  let sst = 0;
  let ssr = 0;
  points.forEach(p => {
    sst += Math.pow(p.y - meanY, 2);
    let predY = slope * p.x + intercept;
    ssr += Math.pow(p.y - predY, 2);
  });
  let r2 = 1 - (ssr / sst);
  
  return {
    slope,
    intercept,
    r2,
    predict: (x) => slope * x + intercept
  };
}

export function pearsonCorrelation(x, y) {
  let n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  
  for(let i=0; i<n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }
  
  let num = n * sumXY - sumX * sumY;
  let den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (den === 0) return 0;
  return num / den;
}

export function correlationMatrix(data, fields) {
  let matrix = Array(fields.length).fill(0).map(() => Array(fields.length).fill(0));
  
  for (let i = 0; i < fields.length; i++) {
    for (let j = 0; j < fields.length; j++) {
      let x = data.map(row => row[fields[i]]);
      let y = data.map(row => row[fields[j]]);
      matrix[i][j] = pearsonCorrelation(x, y);
    }
  }
  
  return { matrix, labels: fields };
}

export function getMonthlySales(data) {
  const monthMap = new Map();
  
  data.forEach(row => {
    if (!row.Order_Date) return;
    const month = row.Order_Date.substring(0, 7);
    if (!monthMap.has(month)) {
      monthMap.set(month, { month, revenue: 0, profit: 0, quantity: 0 });
    }
    const current = monthMap.get(month);
    current.revenue += row.Revenue;
    current.profit += row.Profit;
    current.quantity += row.Quantity;
  });
  
  return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function forecastSales(monthlySales, monthsAhead) {
  const points = monthlySales.map((m, i) => ({ x: i, y: m.revenue }));
  const reg = linearRegression(points);
  
  const forecast = [];
  const lastIndex = points.length - 1;
  const lastMonth = new Date(`${monthlySales[lastIndex].month}-01`);
  
  for (let i = 1; i <= monthsAhead; i++) {
    let nextDate = new Date(lastMonth);
    nextDate.setMonth(nextDate.getMonth() + i);
    let yyyy = nextDate.getFullYear();
    let mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    forecast.push({
      month: `${yyyy}-${mm}`,
      predicted_revenue: reg.predict(lastIndex + i)
    });
  }
  
  return {
    historical: monthlySales,
    forecast,
    regression: reg
  };
}

export function marketBasketAnalysis(data) {
  const customerBaskets = new Map();
  
  data.forEach(row => {
    if (!customerBaskets.has(row.Customer_Name)) {
      customerBaskets.set(row.Customer_Name, new Set());
    }
    customerBaskets.get(row.Customer_Name).add(row.Category);
  });
  
  const pairCounts = new Map();
  let totalBaskets = customerBaskets.size;
  
  customerBaskets.forEach(basket => {
    const items = Array.from(basket).sort();
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const pair = `${items[i]}|${items[j]}`;
        pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
      }
    }
  });
  
  const pairs = Array.from(pairCounts.entries()).map(([pair, count]) => {
    const [item1, item2] = pair.split('|');
    return {
      item1, item2,
      count,
      support: count / totalBaskets
    };
  });
  
  return pairs.sort((a, b) => b.count - a.count).slice(0, 10);
}
