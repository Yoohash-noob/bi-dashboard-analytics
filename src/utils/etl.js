function parseAndStandardizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleanStr = dateStr.trim();
  const parts = cleanStr.split(/[-/]/);
  if (parts.length !== 3) return cleanStr;
  
  let [part1, part2, part3] = parts;
  let y, m, d;
  
  if (part1.length === 4) {
    y = part1;
    m = part2;
    d = part3;
  } else if (part3.length === 4 || part3.length === 2) {
    let yearNum = parseInt(part3, 10);
    if (part3.length === 2) {
      y = yearNum < 50 ? `20${part3.padStart(2, '0')}` : `19${part3.padStart(2, '0')}`;
    } else {
      y = part3;
    }
    const p1 = parseInt(part1, 10);
    const p2 = parseInt(part2, 10);
    if (p1 > 12) {
      d = part1;
      m = part2;
    } else {
      m = part1;
      d = part2;
    }
  } else {
    return cleanStr;
  }
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function runETL(rawData) {
  const logs = [];
  logs.push("🔄 Starting ETL process...");

  const cleanedData = [];
  const dimDate = new Map();
  const dimCustomer = new Map();
  const dimLocation = new Map();
  const dimProduct = new Map();

  logs.push("📦 Processing rows...");
  
  for (const rawRow of rawData) {
    const row = {};
    // 1. Trim all key names
    for (const key in rawRow) {
      if (Object.prototype.hasOwnProperty.call(rawRow, key)) {
        row[key.trim()] = rawRow[key];
      }
    }

    // 2. Convert Quantity to int, Unit_Price/Revenue/Profit to float
    const parseNum = (val) => {
      if (typeof val === 'string') {
         return parseFloat(val.replace(/[^0-9.-]+/g,""));
      }
      return val;
    };
    
    row.Quantity = parseInt(row.Quantity, 10);
    row.Unit_Price = parseNum(row.Unit_Price);
    row.Revenue = parseNum(row.Revenue);
    row.Profit = parseNum(row.Profit);

    // 4. Remove rows with NaN Revenue or 0 Revenue
    if (isNaN(row.Revenue) || row.Revenue === 0) {
      continue;
    }

    // 3. Parse and standardize Order_Date
    row.Order_Date = parseAndStandardizeDate(row.Order_Date);

    cleanedData.push(row);

    // 5. Build star schema dimension lookups
    if (!dimDate.has(row.Order_Date)) dimDate.set(row.Order_Date, { date_id: dimDate.size + 1, date: row.Order_Date });
    if (!dimCustomer.has(row.Customer_Name)) dimCustomer.set(row.Customer_Name, { customer_id: dimCustomer.size + 1, name: row.Customer_Name });
    
    const locKey = `${row.City}|${row.State}|${row.Region}|${row.Country}`;
    if (!dimLocation.has(locKey)) dimLocation.set(locKey, { location_id: dimLocation.size + 1, city: row.City, state: row.State, region: row.Region, country: row.Country });

    const prodKey = `${row.Category}|${row.Sub_Category}|${row.Product_Name}`;
    if (!dimProduct.has(prodKey)) dimProduct.set(prodKey, { product_id: dimProduct.size + 1, category: row.Category, sub_category: row.Sub_Category, product_name: row.Product_Name });
  }

  logs.push("✅ Star schema dimensions generated.");
  logs.push(`🎉 ETL Complete. Kept ${cleanedData.length} valid rows.`);

  return {
    cleanedData,
    logs,
    starSchema: {
      dimDate: Array.from(dimDate.values()),
      dimCustomer: Array.from(dimCustomer.values()),
      dimLocation: Array.from(dimLocation.values()),
      dimProduct: Array.from(dimProduct.values()),
    }
  };
}

export function generateSQL(starSchema) {
  let sql = "";
  
  sql += "CREATE TABLE dim_date (\n  date_id INT PRIMARY KEY,\n  date DATE\n);\n\n";
  sql += "CREATE TABLE dim_customer (\n  customer_id INT PRIMARY KEY,\n  name VARCHAR(255)\n);\n\n";
  sql += "CREATE TABLE dim_location (\n  location_id INT PRIMARY KEY,\n  city VARCHAR(100),\n  state VARCHAR(100),\n  region VARCHAR(50),\n  country VARCHAR(50)\n);\n\n";
  sql += "CREATE TABLE dim_product (\n  product_id INT PRIMARY KEY,\n  category VARCHAR(100),\n  sub_category VARCHAR(100),\n  product_name VARCHAR(255)\n);\n\n";
  
  sql += `CREATE TABLE fact_sales (
  fact_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(50),
  date_id INT,
  customer_id INT,
  location_id INT,
  product_id INT,
  quantity INT,
  unit_price DECIMAL(10,2),
  revenue DECIMAL(10,2),
  profit DECIMAL(10,2),
  FOREIGN KEY (date_id) REFERENCES dim_date(date_id),
  FOREIGN KEY (customer_id) REFERENCES dim_customer(customer_id),
  FOREIGN KEY (location_id) REFERENCES dim_location(location_id),
  FOREIGN KEY (product_id) REFERENCES dim_product(product_id)
);`;

  return sql;
}

export function exportCSV(data, filename) {
  if (!data || !data.length) return;
  const keys = Object.keys(data[0]);
  const csvContent = [
    keys.join(","),
    ...data.map(row => keys.map(k => `"${row[k]}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
