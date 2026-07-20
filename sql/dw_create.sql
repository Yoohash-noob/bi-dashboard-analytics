-- ==========================================
-- 2. Data Warehouse Design (Star Schema)
-- Target: Microsoft SQL Server / Azure SQL
-- Description: Analytical database structure (dimensional model)
-- ==========================================

-- Create Database if on-premise
-- CREATE DATABASE SalesDW;
-- GO
-- USE SalesDW;
-- GO

-- Drop tables if they exist
IF OBJECT_ID('dbo.FactSales', 'U') IS NOT NULL DROP TABLE dbo.FactSales;
IF OBJECT_ID('dbo.DimCustomer', 'U') IS NOT NULL DROP TABLE dbo.DimCustomer;
IF OBJECT_ID('dbo.DimProduct', 'U') IS NOT NULL DROP TABLE dbo.DimProduct;
IF OBJECT_ID('dbo.DimLocation', 'U') IS NOT NULL DROP TABLE dbo.DimLocation;
IF OBJECT_ID('dbo.DimDate', 'U') IS NOT NULL DROP TABLE dbo.DimDate;
GO

-- 1. Dimension Date (Conformed Dimension)
CREATE TABLE dbo.DimDate (
    DateKey INT PRIMARY KEY, -- Format: YYYYMMDD
    FullDate DATE NOT NULL,
    DayOfMonth INT NOT NULL,
    DayName NVARCHAR(15) NOT NULL,
    MonthNumberOfYear INT NOT NULL,
    MonthName NVARCHAR(15) NOT NULL,
    CalendarQuarter INT NOT NULL, -- 1, 2, 3, 4
    CalendarYear INT NOT NULL,
    IsWeekend BIT NOT NULL
);

-- 2. Dimension Customer
CREATE TABLE dbo.DimCustomer (
    CustomerKey INT IDENTITY(1,1) PRIMARY KEY, -- Surrogate Key
    CustomerID INT NOT NULL, -- Business Key from OLTP
    CustomerName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(255) NULL,
    Phone NVARCHAR(50) NULL,
    RowIsCurrent BIT NOT NULL DEFAULT 1, -- For SCD Type 2 tracking
    RowStartDate DATE NOT NULL DEFAULT GETDATE(),
    RowEndDate DATE NULL
);

-- 3. Dimension Location
CREATE TABLE dbo.DimLocation (
    LocationKey INT IDENTITY(1,1) PRIMARY KEY, -- Surrogate Key
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(100) NOT NULL,
    Region NVARCHAR(50) NOT NULL,
    Country NVARCHAR(100) NOT NULL,
    CONSTRAINT UQ_DW_Location UNIQUE (City, State, Region, Country)
);

-- 4. Dimension Product
CREATE TABLE dbo.DimProduct (
    ProductKey INT IDENTITY(1,1) PRIMARY KEY, -- Surrogate Key
    ProductID INT NOT NULL, -- Business Key
    ProductName NVARCHAR(255) NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    SubCategory NVARCHAR(100) NOT NULL
);
GO

-- 5. Fact Sales Table (Transactional Fact)
CREATE TABLE dbo.FactSales (
    SalesKey BIGINT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL, -- DD/Drill-through Key
    DateKey INT NOT NULL, -- FK to DimDate
    CustomerKey INT NOT NULL, -- FK to DimCustomer
    LocationKey INT NOT NULL, -- FK to DimLocation
    ProductKey INT NOT NULL, -- FK to DimProduct
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    Discount DECIMAL(4,2) NOT NULL,
    Revenue DECIMAL(18,2) NOT NULL, -- quantity * unitprice * (1 - discount)
    Profit DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_FactSales_DimDate FOREIGN KEY (DateKey) REFERENCES dbo.DimDate(DateKey),
    CONSTRAINT FK_FactSales_DimCustomer FOREIGN KEY (CustomerKey) REFERENCES dbo.DimCustomer(CustomerKey),
    CONSTRAINT FK_FactSales_DimLocation FOREIGN KEY (LocationKey) REFERENCES dbo.DimLocation(LocationKey),
    CONSTRAINT FK_FactSales_DimProduct FOREIGN KEY (ProductKey) REFERENCES dbo.DimProduct(ProductKey)
);
GO

-- Create Indexes on Foreign Keys for Query Optimization (Star Join optimization)
CREATE NONCLUSTERED INDEX IX_FactSales_DateKey ON dbo.FactSales(DateKey);
CREATE NONCLUSTERED INDEX IX_FactSales_CustomerKey ON dbo.FactSales(CustomerKey);
CREATE NONCLUSTERED INDEX IX_FactSales_LocationKey ON dbo.FactSales(LocationKey);
CREATE NONCLUSTERED INDEX IX_FactSales_ProductKey ON dbo.FactSales(ProductKey);
GO
