import fs from 'fs';

const generateRandomData = () => {
    const categories = {
        'Electronics': ['Laptops', 'Smartphones', 'Audio', 'Monitors', 'Cameras'],
        'Furniture': ['Chairs', 'Tables', 'Storage', 'Sofas', 'Beds'],
        'Office Supplies': ['Paper', 'Binders', 'Pens', 'Envelopes', 'Staplers']
    };
    const regions = {
        'North': ['New York', 'Boston'],
        'South': ['Miami', 'Atlanta'],
        'West': ['Seattle', 'San Francisco', 'Los Angeles'],
        'East': ['Chicago', 'Detroit', 'Columbus']
    };
    const customers = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy', 'Kevin', 'Laura'];
    
    let csv = 'Order_ID,Order_Date,Customer_Name,City,State,Region,Country,Category,Sub_Category,Product_Name,Quantity,Unit_Price,Revenue,Profit\n';
    
    for (let i = 1; i <= 350; i++) {
        const orderId = `ORD-${3000 + i}`;
        
        // Random date in 2024
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        const date = `2024-${month}-${day}`;
        
        const customer = customers[Math.floor(Math.random() * customers.length)];
        
        const regionKeys = Object.keys(regions);
        const region = regionKeys[Math.floor(Math.random() * regionKeys.length)];
        const city = regions[region][Math.floor(Math.random() * regions[region].length)];
        
        const stateMap = {
            'New York': 'NY', 'Boston': 'MA', 
            'Miami': 'FL', 'Atlanta': 'GA', 
            'Seattle': 'WA', 'San Francisco': 'CA', 'Los Angeles': 'CA',
            'Chicago': 'IL', 'Detroit': 'MI', 'Columbus': 'OH'
        };
        const state = stateMap[city];
        const country = 'USA';
        
        const catKeys = Object.keys(categories);
        const category = catKeys[Math.floor(Math.random() * catKeys.length)];
        const subCat = categories[category][Math.floor(Math.random() * categories[category].length)];
        const product = `${subCat} Pro Max ${Math.floor(Math.random() * 5) + 1}`;
        
        const quantity = Math.floor(Math.random() * 10) + 1;
        const unitPrice = Math.floor(Math.random() * 500) + 50;
        const revenue = quantity * unitPrice;
        const profitMargin = Math.random() * 0.4 + 0.1; // 10% to 50%
        const profit = (revenue * profitMargin).toFixed(2);
        
        csv += `${orderId},${date},${customer},${city},${state},${region},${country},${category},${subCat},${product},${quantity},${unitPrice},${revenue},${profit}\n`;
    }
    
    fs.writeFileSync('c:/Users/Windows 10/Documents/Tugas/Semester 6/task/archive/demo_sales_dataset.csv', csv);
    console.log('demo_sales_dataset.csv created successfully with 350 rows.');
};

generateRandomData();
