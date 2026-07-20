-- ==========================================
-- 1. Database Design (OLTP) - 3NF
-- Target: Microsoft SQL Server / Azure SQL
-- Description: Operational database for transaction processing
-- ==========================================

-- Create Database if on-premise
-- CREATE DATABASE SalesOLTP;
-- GO
-- USE SalesOLTP;
-- GO

-- Drop tables if they exist (in reverse dependency order)
IF OBJECT_ID('dbo.OrderDetails', 'U') IS NOT NULL DROP TABLE dbo.OrderDetails;
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.Customers', 'U') IS NOT NULL DROP TABLE dbo.Customers;
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.Locations', 'U') IS NOT NULL DROP TABLE dbo.Locations;
GO

-- 1. Locations Table (Standardized Address Info)
CREATE TABLE dbo.Locations (
    LocationID INT IDENTITY(1,1) PRIMARY KEY,
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(100) NOT NULL,
    Region NVARCHAR(50) NOT NULL, -- East, West, South, Central
    Country NVARCHAR(100) NOT NULL DEFAULT 'United States',
    CONSTRAINT UQ_Location UNIQUE (City, State, Region, Country)
);

-- 2. Customers Table
CREATE TABLE dbo.Customers (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerName NVARCHAR(150) NOT NULL,
    LocationID INT NOT NULL,
    Email NVARCHAR(255) NULL,
    Phone NVARCHAR(50) NULL,
    CONSTRAINT FK_Customers_Locations FOREIGN KEY (LocationID) REFERENCES dbo.Locations(LocationID)
);

-- 3. Products Table
CREATE TABLE dbo.Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    ProductName NVARCHAR(255) NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    SubCategory NVARCHAR(100) NOT NULL,
    DefaultUnitPrice DECIMAL(18,2) NOT NULL DEFAULT 0.00
);

-- 4. Orders Table (Header info)
CREATE TABLE dbo.Orders (
    OrderID INT PRIMARY KEY, -- Using raw Order_ID as PK if unique
    CustomerID INT NOT NULL,
    OrderDate DATE NOT NULL,
    ShipDate DATE NULL,
    ShipMode NVARCHAR(50) NULL,
    CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerID) REFERENCES dbo.Customers(CustomerID)
);

-- 5. Order Details Table (Line Items)
CREATE TABLE dbo.OrderDetails (
    OrderDetailID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(18,2) NOT NULL CHECK (UnitPrice >= 0),
    Discount DECIMAL(4,2) NOT NULL DEFAULT 0.00 CHECK (Discount >= 0.00 AND Discount <= 1.00),
    Profit DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT FK_OrderDetails_Orders FOREIGN KEY (OrderID) REFERENCES dbo.Orders(OrderID) ON DELETE CASCADE,
    CONSTRAINT FK_OrderDetails_Products FOREIGN KEY (ProductID) REFERENCES dbo.Products(ProductID)
);
GO

-- Indexing for performance in Transactional Environment
CREATE INDEX IX_Orders_CustomerID ON dbo.Orders(CustomerID);
CREATE INDEX IX_OrderDetails_OrderID ON dbo.OrderDetails(OrderID);
CREATE INDEX IX_OrderDetails_ProductID ON dbo.OrderDetails(ProductID);
GO
