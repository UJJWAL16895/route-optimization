import pandas as pd
from sklearn.cluster import KMeans
from scipy.spatial.distance import cdist
import numpy as np
import requests
import json

def solve_tsp_nearest_neighbor(points):
    """
    Simple Nearest Neighbor heuristic for TSP.
    points: List of dicts {'lat': ..., 'lon': ..., 'name': ...}
    Returns sorted list of points.
    """
    if not points:
        return []
    
    # Start at the first point (assumed Depot)
    path = [points[0]]
    unvisited = points[1:]
    
    current_node = points[0]
    
    while unvisited:
        # Find closest node to current_node
        best_dist = float('inf')
        nearest_node = None
        nearest_idx = -1
        
        for idx, node in enumerate(unvisited):
            dist = np.sqrt((current_node['lat'] - node['lat'])**2 + (current_node['lon'] - node['lon'])**2)
            if dist < best_dist:
                best_dist = dist
                nearest_node = node
                nearest_idx = idx
        
        path.append(nearest_node)
        current_node = nearest_node
        unvisited.pop(nearest_idx)
        
    return path

def get_osrm_route(waypoints):
    """
    Fetch road geometry from OSRM by querying leg-by-leg (A->B, B->C...)
    to avoid public API limits/timeouts with long URLs.
    """
    if len(waypoints) < 2:
        return []

    full_path_coords = []
    
    # Loop through consecutive pairs of waypoints
    for i in range(len(waypoints) - 1):
        start = waypoints[i]
        end = waypoints[i+1]
        
        # OSRM expects: lon,lat;lon,lat
        coords_str = f"{start['lon']},{start['lat']};{end['lon']},{end['lat']}"
        url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
        
        segment_coords = []
        try:
            # We use a short timeout but retry logic could be added if needed
            r = requests.get(url, timeout=2) 
            if r.status_code == 200:
                data = r.json()
                if data['code'] == 'Ok':
                    geojson_coords = data['routes'][0]['geometry']['coordinates']
                    # Convert [lon, lat] -> {'lat': lat, 'lon': lon}
                    segment_coords = [{'lat': p[1], 'lon': p[0]} for p in geojson_coords]
                else:
                    print(f"OSRM Error Code: {data['code']}")
            else:
                print(f"OSRM HTTP {r.status_code}")
                
        except Exception as e:
            print(f"OSRM Request failed for leg {i}: {e}")
            
        # If OSRM succeeded, add the detailed path. 
        # If it failed, just add the start/end (straight line fallback for this leg)
        if segment_coords:
            full_path_coords.extend(segment_coords)
        else:
            full_path_coords.append(start)
            full_path_coords.append(end)
            
    return full_path_coords

def get_optimized_routes(bins_data, n_trucks=2, depot_coords=None):
    """
    bins_data: List of dicts (from json)
    n_trucks: int
    depot_coords: dict {'lat': ..., 'lon': ...}
    """
    if depot_coords is None:
        # User defined Depot: Uni-Services
        depot_coords = {'lat': 31.260024, 'lon': 75.706270, 'name': 'UNI-SERVICES DEPOT', 'id': 'DEPOT'}

    # 1. Filter bins that need pickup
    pickup_bins = []
    for b in bins_data:
        threshold = 20 if b['type'] == 'Food Court' else 40
        if b['fill_level'] > threshold:
            pickup_bins.append(b)
            
    if not pickup_bins:
        return []

    # If fewer bins than trucks, reduce trucks
    n_trucks = min(n_trucks, len(pickup_bins))
    
    # 2. Clustering
    # We use K-Means on lat/lon
    coords = [[b['latitude'], b['longitude']] for b in pickup_bins]
    
    if n_trucks > 1:
        kmeans = KMeans(n_clusters=n_trucks, random_state=42, n_init=10)
        labels = kmeans.fit_predict(coords)
    else:
        labels = [0] * len(pickup_bins)
        
    routes = []
    
    # 3. Route Planning per Cluster
    for k in range(n_trucks):
        cluster_bins = [pickup_bins[i] for i in range(len(pickup_bins)) if labels[i] == k]
        
        # Prepare points for TSP: Depot + Cluster Bins
        route_points = []
        route_points.append(depot_coords)
        
        for b in cluster_bins:
            route_points.append({
                'lat': b['latitude'], 
                'lon': b['longitude'], 
                'name': b['bin_id'], 
                'fill_level': b['fill_level'],
                'type': b['type']
            })
            
        # Solve TSP (Order of stops)
        sorted_waypoints = solve_tsp_nearest_neighbor(route_points)
        
        # Add return to depot to complete the loop
        sorted_waypoints.append(depot_coords)
        
        # Get actual road path
        road_path = get_osrm_route(sorted_waypoints)
        
        routes.append(road_path)
        
    return routes

if __name__ == "__main__":
    # Test with generated json
    import json
    try:
        with open("current_bin_status.json", "r") as f:
            data = json.load(f)
        
        routes = get_optimized_routes(data, n_trucks=2)
        print(f"Generated {len(routes)} routes.")
        for i, r in enumerate(routes):
            print(f"Route {i+1}: {len(r)} stops")
            for stop in r:
                print(f"  -> {stop['name']}")
    except FileNotFoundError:
        print("current_bin_status.json not found. Run generator first.")
