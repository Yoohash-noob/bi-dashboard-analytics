# SSIS ETL Pipeline Design Document (ETL_DW)

This document outlines the step-by-step design of the SQL Server Integration Services (SSIS) package to run the ETL process from the OLTP Database (`SalesOLTP`) to the Data Warehouse (`SalesDW`).

---

## 1. Control Flow Architecture
The control flow determines the sequence of execution for the ETL pipeline.

```
       +---------------------------------------------+
       |   Execute SQL: Truncate Fact / Prep Tables  |
       +----------------------|----------------------+
                              v
       +---------------------------------------------+
       |           Sequence Container:               |
       |       Populate Dimension Tables             |
       |                                             |
       |   +------------------+  +----------------+  |
       |   | DFT: Load DimDate|  | DFT: Load DimC |  |
       |   +------------------+  +----------------+  |
       |   +------------------+  +----------------+  |
       |   | DFT: Load DimLoc |  | DFT: Load DimP |  |
       |   +------------------+  +----------------+  |
       +----------------------|----------------------+
                              v
       +---------------------------------------------+
       |         DFT: Populate FactSales             |
       +---------------------------------------------+
```

### Steps:
1. **Truncate Fact (Execute SQL Task)**: Run a SQL script on the DW destination to truncate the `FactSales` table to avoid duplicate records.
2. **Dimension Loading Container (Sequence Container)**:
   - **Load DimDate**: Populates time intelligence data.
   - **Load DimCustomer**: Loads unique customer list (handles SCD Type 1/2).
   - **Load DimLocation**: Loads unique locations.
   - **Load DimProduct**: Loads product attributes.
3. **Load FactSales (Data Flow Task)**: Perform final map and calculations.

---

## 2. Data Flow Tasks (DFT) Details

### DFT 1: Load DimLocation
* **Source**: OLE DB Source (`SalesOLTP`)
  ```sql
  SELECT DISTINCT City, State, Region, Country FROM dbo.Locations;
  ```
* **Transformation**: Character Map (optional, to trim spaces).
* **Destination**: OLE DB Destination (`SalesDW.dbo.DimLocation`) with "Keep Identity" unchecked.

### DFT 2: Load DimCustomer
* **Source**: OLE DB Source (`SalesOLTP`)
  ```sql
  SELECT CustomerID, CustomerName, Email, Phone, LocationID FROM dbo.Customers;
  ```
* **Transformation**: Lookup `LocationKey` from `SalesDW.dbo.DimLocation` matching by Location attributes.
* **Destination**: OLE DB Destination (`SalesDW.dbo.DimCustomer`).

### DFT 3: Load DimProduct
* **Source**: OLE DB Source (`SalesOLTP`)
  ```sql
  SELECT ProductID, ProductName, Category, SubCategory FROM dbo.Products;
  ```
* **Destination**: OLE DB Destination (`SalesDW.dbo.DimProduct`).

### DFT 4: Load FactSales (Core ETL)
* **Source**: OLE DB Source (`SalesOLTP`)
  ```sql
  SELECT 
      od.OrderID,
      o.OrderDate,
      o.CustomerID,
      c.LocationID,
      od.ProductID,
      od.Quantity,
      od.UnitPrice,
      od.Discount,
      od.Profit
  FROM dbo.OrderDetails od
  INNER JOIN dbo.Orders o ON od.OrderID = o.OrderID
  INNER JOIN dbo.Customers c ON o.CustomerID = c.CustomerID;
  ```
* **Transformations**:
  1. **Date Key Derivation (Derived Column)**:
     - Convert `OrderDate` to `YYYYMMDD` integer format.
     - Expression: `(DT_I4)((DT_WSTR, 4)YEAR(OrderDate) + RIGHT("0" + (DT_WSTR, 2)MONTH(OrderDate), 2) + RIGHT("0" + (DT_WSTR, 2)DAY(OrderDate), 2))`
  2. **Customer Key Lookup (Lookup)**:
     - Connect to `SalesDW.dbo.DimCustomer`.
     - Match `CustomerID`. Output `CustomerKey`.
  3. **Location Key Lookup (Lookup)**:
     - Connect to `SalesDW.dbo.DimLocation`.
     - Match `LocationID` (or City, State). Output `LocationKey`.
  4. **Product Key Lookup (Lookup)**:
     - Connect to `SalesDW.dbo.DimProduct`.
     - Match `ProductID`. Output `ProductKey`.
  5. **Derived Column (Revenue Calculation)**:
     - Calculate: `Quantity * UnitPrice * (1.0 - Discount)`
     - Add output field `Revenue`.
* **Destination**: OLE DB Destination (`SalesDW.dbo.FactSales`).

---

## 3. SQL Agent Job Scheduling
To automate this pipeline nightly:
1. Open SQL Server Management Studio (SSMS).
2. Expand **SQL Server Agent** > Right-click **Jobs** > **New Job**.
3. Under **Steps**, create a new step:
   - Type: `SQL Server Integration Services Package`
   - Package source: `File system` or `SSIS Catalog`
   - Path: Select the deployed `.dtsx` package.
4. Under **Schedules**, set to run daily at `01:00 AM`.
