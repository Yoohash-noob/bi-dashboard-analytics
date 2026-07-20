#!/usr/bin/env python
"""
Automated Data Warehouse Star Schema Populator Helper
Description: Parses sales raw CSV, builds clean tables, generates surrogate keys,
             and exports to a portable SQLite database (or generates T-SQL statements).
"""

import os
import csv
import sqlite3
import sys
from datetime import datetime

# Force UTF-8 encoding for stdout on Windows to prevent UnicodeEncodeError
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def build_star_schema():
    print("[INFO] Initializing local Star Schema builder helper...")
    
    # Resolve CSV Path
    possible_paths = [
        "product_sales_dataset_15k.csv",
        "../product_sales_dataset_15k.csv",
        "public/product_sales_dataset_15k.csv"
    ]
    csv_file = None
    for p in possible_paths:
        if os.path.exists(p):
            csv_file = p
            break
            
    if not csv_file:
        print("[ERROR] 'product_sales_dataset_15k.csv' not found.")
        return

    db_file = "sales_dw.db"
    if os.path.exists(db_file):
        os.remove(db_file)
        
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    print("[BUILD] Creating dimension and fact tables in SQLite database...")
    
    # Create tables
    cursor.execute("""
    CREATE TABLE DimDate (
        DateKey INT PRIMARY KEY,
        FullDate TEXT NOT NULL,
        DayOfMonth INT,
        DayName TEXT,
        MonthNumberOfYear INT,
        MonthName TEXT,
        CalendarQuarter INT,
        CalendarYear INT,
        IsWeekend INT
    );
    """)
    
    cursor.execute("""
    CREATE TABLE DimCustomer (
        CustomerKey INTEGER PRIMARY KEY AUTOINCREMENT,
        CustomerName TEXT NOT NULL,
        City TEXT,
        State TEXT,
        Region TEXT,
        Country TEXT
    );
    """)
    
    cursor.execute("""
    CREATE TABLE DimProduct (
        ProductKey INTEGER PRIMARY KEY AUTOINCREMENT,
        ProductName TEXT NOT NULL,
        Category TEXT,
        SubCategory TEXT
    );
    """)
    
    cursor.execute("""
    CREATE TABLE FactSales (
        SalesKey INTEGER PRIMARY KEY AUTOINCREMENT,
        OrderID INT,
        DateKey INT,
        CustomerKey INT,
        ProductKey INT,
        Quantity INT,
        UnitPrice REAL,
        Discount REAL,
        Revenue REAL,
        Profit REAL,
        FOREIGN KEY(DateKey) REFERENCES DimDate(DateKey),
        FOREIGN KEY(CustomerKey) REFERENCES DimCustomer(CustomerKey),
        FOREIGN KEY(ProductKey) REFERENCES DimProduct(ProductKey)
    );
    """)
    
    print("[LOAD] Reading raw CSV records...")
    
    rows = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = {k: k.strip() for k in reader.fieldnames}
        for r in reader:
            rows.append({headers[k]: v for k, v in r.items()})
            
    # Sets for unique entries
    unique_customers = {} # (Name, City, State, Region) -> ID
    unique_products = {}  # (Name, Cat, SubCat) -> ID
    unique_dates = set()
    
    print("[TRANSFORM] Transforming & Populating Dimensions...")
    
    # Pre-parse dates and dimensions
    for r in rows:
        # Trim whitespace & clean data
        cust_name = r.get('Customer_Name', '').strip()
        city = r.get('City', '').strip()
        state = r.get('State', '').strip()
        region = r.get('Region', '').strip()
        country = r.get('Country', 'United States').strip()
        
        prod_name = r.get('Product_Name', '').strip()
        category = r.get('Category', '').strip()
        sub_cat = r.get('Sub_Category', '').strip()
        
        # Standardize date format MM-DD-YY or MM/DD/YY to YYYY-MM-DD
        raw_date = r.get('Order_Date', '').strip()
        date_obj = None
        for fmt in ('%m-%d-%y', '%m/%d/%y', '%m-%d-%Y', '%m/%d/%Y', '%Y-%m-%d'):
            try:
                date_obj = datetime.strptime(raw_date, fmt)
                break
            except ValueError:
                continue
                
        if not date_obj:
            continue
            
        date_key = int(date_obj.strftime("%Y%m%d"))
        unique_dates.add((date_key, date_obj))
        
        # Populate Customer dict
        cust_tuple = (cust_name, city, state, region, country)
        if cust_tuple not in unique_customers:
            cursor.execute("""
                INSERT INTO DimCustomer (CustomerName, City, State, Region, Country)
                VALUES (?, ?, ?, ?, ?)
            """, cust_tuple)
            unique_customers[cust_tuple] = cursor.lastrowid
            
        # Populate Product dict
        prod_tuple = (prod_name, category, sub_cat)
        if prod_tuple not in unique_products:
            cursor.execute("""
                INSERT INTO DimProduct (ProductName, Category, SubCategory)
                VALUES (?, ?, ?)
            """, prod_tuple)
            unique_products[prod_tuple] = cursor.lastrowid

    # Populate DimDate
    for date_key, date_obj in sorted(unique_dates):
        full_date_str = date_obj.strftime("%Y-%m-%d")
        day_of_month = date_obj.day
        day_name = date_obj.strftime("%A")
        month_num = date_obj.month
        month_name = date_obj.strftime("%B")
        quarter = (month_num - 1) // 3 + 1
        year = date_obj.year
        is_weekend = 1 if date_obj.weekday() >= 5 else 0
        
        cursor.execute("""
            INSERT INTO DimDate (DateKey, FullDate, DayOfMonth, DayName, MonthNumberOfYear, MonthName, CalendarQuarter, CalendarYear, IsWeekend)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (date_key, full_date_str, day_of_month, day_name, month_num, month_name, quarter, year, is_weekend))

    print("[LOAD] Populating Fact Table (FactSales)...")
    
    # Populate Fact table
    for r in rows:
        # Load dimension keys
        cust_name = r.get('Customer_Name', '').strip()
        city = r.get('City', '').strip()
        state = r.get('State', '').strip()
        region = r.get('Region', '').strip()
        country = r.get('Country', 'United States').strip()
        cust_tuple = (cust_name, city, state, region, country)
        cust_key = unique_customers.get(cust_tuple)
        
        prod_name = r.get('Product_Name', '').strip()
        category = r.get('Category', '').strip()
        sub_cat = r.get('Sub_Category', '').strip()
        prod_tuple = (prod_name, category, sub_cat)
        prod_key = unique_products.get(prod_tuple)
        
        raw_date = r.get('Order_Date', '').strip()
        date_obj = None
        for fmt in ('%m-%d-%y', '%m/%d/%y', '%m-%d-%Y', '%m/%d/%Y', '%Y-%m-%d'):
            try:
                date_obj = datetime.strptime(raw_date, fmt)
                break
            except ValueError:
                continue
                
        if not date_obj:
            continue
        date_key = int(date_obj.strftime("%Y%m%d"))
        
        # Measures
        try:
            order_id = int(r.get('Order_ID', 0))
            qty = int(r.get('Quantity', 0))
            price = float(r.get('Unit_Price', 0))
            disc = float(r.get('Discount', 0))
            rev = float(r.get('Revenue', 0))
            prof = float(r.get('Profit', 0))
        except ValueError:
            continue
            
        cursor.execute("""
            INSERT INTO FactSales (OrderID, DateKey, CustomerKey, ProductKey, Quantity, UnitPrice, Discount, Revenue, Profit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (order_id, date_key, cust_key, prod_key, qty, price, disc, rev, prof))
        
    conn.commit()
    conn.close()
    
    print(f"[SUCCESS] Star Schema database populated. File: {db_file}")

if __name__ == "__main__":
    build_star_schema()
