#!/usr/bin/env python
"""
ETL and Data Mining: K-Means Clustering for Customer Segmentation
Description: Loads customer transactions, aggregates performance indicators, 
             performs K-Means clustering, and outputs segment profiles.
"""

import os
import json
import sys
import numpy as np

# Force UTF-8 encoding for stdout on Windows to prevent UnicodeEncodeError
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def run_kmeans_clustering():
    print("[INFO] Starting K-Means Clustering Data Mining Process...")
    
    # Try importing scientific libraries
    try:
        import pandas as pd
        from sklearn.cluster import KMeans
        from sklearn.preprocessing import MinMaxScaler
        use_sklearn = True
        print("[SUCCESS] Scientific stack (pandas, sklearn) detected.")
    except ImportError:
        use_sklearn = False
        print("[WARNING] pandas/scikit-learn not found. Running custom pure-Python fallback...")

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
        print("[ERROR] 'product_sales_dataset_15k.csv' not found. Please place the CSV in the same folder.")
        return

    print(f"[LOAD] Loading dataset: {csv_file}")
    
    if use_sklearn:
        # Load and Clean
        df = pd.read_csv(csv_file)
        
        # Clean headers
        df.columns = [c.strip() for c in df.columns]
        
        # Aggregation by Customer
        customer_data = df.groupby('Customer_Name').agg(
            total_revenue=('Revenue', 'sum'),
            total_quantity=('Quantity', 'sum'),
            total_profit=('Profit', 'sum'),
            avg_unit_price=('Unit_Price', 'mean'),
            order_count=('Order_ID', 'nunique')
        ).reset_index()
        
        # Normalize Features for Clustering
        features = ['total_revenue', 'total_quantity', 'total_profit']
        scaler = MinMaxScaler()
        scaled_features = scaler.fit_transform(customer_data[features])
        
        # Apply K-Means (k=4 segments)
        kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
        customer_data['Cluster'] = kmeans.fit_predict(scaled_features)
        
        # Profile Names Map
        # Sort centroids to map low-value to high-value clusters
        centroids = kmeans.cluster_centers_
        centroid_sums = centroids.sum(axis=1)
        sorted_indices = np.argsort(centroid_sums)
        
        profile_names = {
            sorted_indices[0]: "Kasual (Low Spending)",
            sorted_indices[1]: "Potensial (Average Spending)",
            sorted_indices[2]: "Premium (High Spending)",
            sorted_indices[3]: "VIP (Top Buyers & High Quantity)"
        }
        
        customer_data['Segment_Profile'] = customer_data['Cluster'].map(profile_names)
        
        # Output results
        output_file = "customer_segments.csv"
        customer_data.to_csv(output_file, index=False)
        print(f"[SUCCESS] Clustering complete! Output saved to: {output_file}")
        
        # Output centroids stats
        print("\n📊 Cluster Profiles summary:")
        summary = customer_data.groupby('Segment_Profile')[['total_revenue', 'total_quantity', 'total_profit']].mean()
        print(summary)
        
    else:
        # Pure-Python Custom K-Means Fallback
        import csv
        
        # Read CSV file using standard library
        rows = []
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            # Normalize headers
            headers = {k: k.strip() for k in reader.fieldnames}
            for row in reader:
                clean_row = {headers[k]: v for k, v in row.items()}
                rows.append(clean_row)
                
        # Group by Customer
        customers = {}
        for r in rows:
            name = r.get('Customer_Name')
            if not name:
                continue
            try:
                rev = float(r.get('Revenue', 0))
                qty = int(r.get('Quantity', 0))
                prof = float(r.get('Profit', 0))
            except ValueError:
                continue
                
            if name not in customers:
                customers[name] = {'rev': 0.0, 'qty': 0, 'prof': 0.0}
            customers[name]['rev'] += rev
            customers[name]['qty'] += qty
            customers[name]['prof'] += prof

        # Extract features matrix
        names_list = list(customers.keys())
        X = np.array([[customers[n]['rev'], customers[n]['qty'], customers[n]['prof']] for n in names_list])
        
        # Min-Max Normalization
        min_vals = X.min(axis=0)
        max_vals = X.max(axis=0)
        # Avoid division by zero
        max_vals[max_vals == min_vals] = min_vals[max_vals == min_vals] + 1e-8
        X_norm = (X - min_vals) / (max_vals - min_vals)
        
        # Custom K-Means ++ Initialization
        k = 4
        np.random.seed(42)
        centroids = X_norm[np.random.choice(range(len(X_norm)), k, replace=False)]
        
        for iteration in range(50):
            # Assignment
            distances = np.linalg.norm(X_norm[:, np.newaxis] - centroids, axis=2)
            labels = np.argmin(distances, axis=1)
            
            # Update Centroids
            new_centroids = np.array([X_norm[labels == i].mean(axis=0) if len(X_norm[labels == i]) > 0 else centroids[i] for i in range(k)])
            if np.allclose(centroids, new_centroids):
                break
            centroids = new_centroids
            
        # Segment Profiling
        centroid_sums = centroids.sum(axis=1)
        sorted_indices = np.argsort(centroid_sums)
        profile_names = {
            sorted_indices[0]: "Kasual (Low Spending)",
            sorted_indices[1]: "Potensial (Average Spending)",
            sorted_indices[2]: "Premium (High Spending)",
            sorted_indices[3]: "VIP (Top Buyers & High Quantity)"
        }
        
        # Write Output CSV
        output_file = "customer_segments.csv"
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Customer_Name', 'total_revenue', 'total_quantity', 'total_profit', 'Cluster', 'Segment_Profile'])
            for i, name in enumerate(names_list):
                cluster_id = labels[i]
                profile = profile_names[cluster_id]
                writer.writerow([
                    name, 
                    round(customers[name]['rev'], 2), 
                    customers[name]['qty'], 
                    round(customers[name]['prof'], 2),
                    cluster_id,
                    profile
                ])
                
        print(f"[SUCCESS] Clustering complete! Pure-Python Output saved to: {output_file}")

if __name__ == "__main__":
    run_kmeans_clustering()
