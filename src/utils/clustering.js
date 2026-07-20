export function kMeansClustering(data, k, maxIterations = 100) {
  if (data.length === 0) return { clusters: [], centroids: [], iterations: 0, k };

  // Determine min and max for normalization
  const keys = ['x', 'y'];
  const minMax = {};
  keys.forEach(key => {
    const values = data.map(d => d[key]);
    minMax[key] = { min: Math.min(...values), max: Math.max(...values) };
  });

  const normalize = (val, key) => {
    const { min, max } = minMax[key];
    return max === min ? 0 : (val - min) / (max - min);
  };
  const denormalize = (val, key) => {
    const { min, max } = minMax[key];
    return val * (max - min) + min;
  };

  const normData = data.map(d => ({
    ...d,
    nx: normalize(d.x, 'x'),
    ny: normalize(d.y, 'y')
  }));

  // k-means++ initialization
  let centroids = [];
  centroids.push({ nx: normData[0].nx, ny: normData[0].ny });
  
  for (let i = 1; i < k; i++) {
    let maxDist = -1;
    let nextCentroid = null;
    normData.forEach(p => {
      let minDist = Math.min(...centroids.map(c => Math.pow(p.nx - c.nx, 2) + Math.pow(p.ny - c.ny, 2)));
      if (minDist > maxDist) {
        maxDist = minDist;
        nextCentroid = { nx: p.nx, ny: p.ny };
      }
    });
    centroids.push(nextCentroid);
  }

  let clusters = new Array(k).fill(0).map(() => []);
  let iter = 0;

  for (; iter < maxIterations; iter++) {
    const newClusters = new Array(k).fill(0).map(() => []);
    
    normData.forEach(p => {
      let minDist = Infinity;
      let clusterIndex = 0;
      centroids.forEach((c, i) => {
        let dist = Math.pow(p.nx - c.nx, 2) + Math.pow(p.ny - c.ny, 2);
        if (dist < minDist) {
          minDist = dist;
          clusterIndex = i;
        }
      });
      newClusters[clusterIndex].push(p);
    });

    let changed = false;
    const newCentroids = newClusters.map((cluster, i) => {
      if (cluster.length === 0) return centroids[i];
      let sumNx = 0, sumNy = 0;
      cluster.forEach(p => { sumNx += p.nx; sumNy += p.ny; });
      let avgNx = sumNx / cluster.length;
      let avgNy = sumNy / cluster.length;
      if (Math.abs(centroids[i].nx - avgNx) > 0.0001 || Math.abs(centroids[i].ny - avgNy) > 0.0001) {
        changed = true;
      }
      return { nx: avgNx, ny: avgNy };
    });

    centroids = newCentroids;
    clusters = newClusters;
    if (!changed) break;
  }

  // Denormalize centroids and prepare return data
  const finalCentroids = centroids.map(c => ({
    x: denormalize(c.nx, 'x'),
    y: denormalize(c.ny, 'y')
  }));

  const finalClusters = clusters.map((cluster, i) => ({
    centroid: finalCentroids[i],
    points: cluster.map(p => {
      const { nx, ny, ...rest } = p;
      return { ...rest, cluster: i };
    })
  }));

  return { clusters: finalClusters, centroids: finalCentroids, iterations: iter, k };
}

export function prepareCustomerData(data) {
  const map = new Map();
  data.forEach(row => {
    if (!map.has(row.Customer_Name)) {
      map.set(row.Customer_Name, {
        label: row.Customer_Name,
        totalRevenue: 0,
        totalQuantity: 0,
        totalProfit: 0,
        orderCount: 0,
        sumUnitPrice: 0
      });
    }
    const c = map.get(row.Customer_Name);
    c.totalRevenue += row.Revenue;
    c.totalQuantity += row.Quantity;
    c.totalProfit += row.Profit;
    c.orderCount += 1;
    c.sumUnitPrice += row.Unit_Price;
  });

  return Array.from(map.values()).map(c => ({
    label: c.label,
    totalRevenue: c.totalRevenue,
    totalQuantity: c.totalQuantity,
    avgUnitPrice: c.sumUnitPrice / c.orderCount,
    totalProfit: c.totalProfit,
    orderCount: c.orderCount,
    profitMargin: c.totalRevenue > 0 ? c.totalProfit / c.totalRevenue : 0
  }));
}

export function prepareCityData(data) {
  const map = new Map();
  data.forEach(row => {
    if (!map.has(row.City)) {
      map.set(row.City, {
        label: row.City,
        totalRevenue: 0,
        totalQuantity: 0,
        totalProfit: 0,
        orderCount: 0,
        sumUnitPrice: 0
      });
    }
    const c = map.get(row.City);
    c.totalRevenue += row.Revenue;
    c.totalQuantity += row.Quantity;
    c.totalProfit += row.Profit;
    c.orderCount += 1;
    c.sumUnitPrice += row.Unit_Price;
  });

  return Array.from(map.values()).map(c => ({
    label: c.label,
    totalRevenue: c.totalRevenue,
    totalQuantity: c.totalQuantity,
    avgUnitPrice: c.sumUnitPrice / c.orderCount,
    totalProfit: c.totalProfit,
    orderCount: c.orderCount,
    profitMargin: c.totalRevenue > 0 ? c.totalProfit / c.totalRevenue : 0
  }));
}

export function getClusterProfiles(result) {
  const { centroids, clusters } = result;
  if (!centroids || centroids.length === 0) return result;

  const xs = centroids.map(c => c.x);
  const ys = centroids.map(c => c.y);
  
  const medianX = [...xs].sort((a,b) => a-b)[Math.floor(xs.length/2)];
  const medianY = [...ys].sort((a,b) => a-b)[Math.floor(ys.length/2)];

  return clusters.map((cluster, i) => {
    let name = "Kasual";
    const c = centroids[i];
    
    if (c.x >= medianX && c.y >= medianY) name = "Pembeli VIP";
    else if (c.x >= medianX && c.y < medianY) name = "Premium";
    else if (c.x < medianX && c.y >= medianY) name = "Grosir";

    return {
      ...cluster,
      profileName: name
    };
  });
}
