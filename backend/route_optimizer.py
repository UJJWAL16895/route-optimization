import pandas as pd
from sklearn.cluster import KMeans
from scipy.spatial.distance import cdist
import numpy as np
import requests
import json
import advanced_ai # Import our new Brain

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
    """
    if len(waypoints) < 2:
        return []

    full_path_coords = []
    
    for i in range(len(waypoints) - 1):
        start = waypoints[i]
        end = waypoints[i+1]
        
        coords_str = f"{start['lon']},{start['lat']};{end['lon']},{end['lat']}"
        url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
        
        segment_coords = []
        try:
            r = requests.get(url, timeout=2) 
            if r.status_code == 200:
                data = r.json()
                if data['code'] == 'Ok':
                    geojson_coords = data['routes'][0]['geometry']['coordinates']
                    segment_coords = [{'lat': p[1], 'lon': p[0]} for p in geojson_coords]
                else:
                    print(f"OSRM Error Code: {data['code']}")
            else:
                print(f"OSRM HTTP {r.status_code}")
                
        except Exception as e:
            print(f"OSRM Request failed for leg {i}: {e}")
            
        if segment_coords:
            full_path_coords.extend(segment_coords)
        else:
            full_path_coords.append(start)
            full_path_coords.append(end)
            
    return full_path_coords

def get_optimized_routes(bins_data, n_trucks=2, depot_coords=None):
    """
    Advanced AI Route Optimization
    """
    if depot_coords is None:
        depot_coords = {'lat': 31.260024, 'lon': 75.706270, 'name': 'UNI-SERVICES DEPOT', 'id': 'DEPOT'}

    # --- STEP 1 & 2: PREDICTION & PRIORITY SCORING ---
    pickup_bins = []
    for b in bins_data:
        # Calculate Priority Score (Fill + Prob + Persona)
        p_score = advanced_ai.calculate_priority_score(b)
        
        # Add score to bin data for tracking
        b['priority_score'] = round(p_score, 1)
        
        # Dynamic threshold based on Priority Score instead of raw Fill Level
        # This means a critical Food Court bin (High Score) gets picked even if fill is 40%
        if p_score > 35: # Arbitrary "AI" threshold
            pickup_bins.append(b)
            
    if not pickup_bins:
        return []

    n_trucks = min(n_trucks, len(pickup_bins))
    
    # --- STEP 3: CLUSTERING (K-Means) ---
    coords = [[b['latitude'], b['longitude']] for b in pickup_bins]
    
    if n_trucks > 1:
        kmeans = KMeans(n_clusters=n_trucks, random_state=42, n_init=10)
        labels = kmeans.fit_predict(coords)
    else:
        labels = [0] * len(pickup_bins)
        
    routes = []
    
    # --- STEP 4 & 5: SEQUENCING & OPTIMIZATION ---
    for k in range(n_trucks):
        cluster_bins = [pickup_bins[i] for i in range(len(pickup_bins)) if labels[i] == k]
        
        # Sort cluster bins by Priority Score (Highest First) for greedy consideration?
        # Actually TSP handles spatial. But we could use Priority to "drop" bins if capacity full.
        # For now, we route all.
        
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
            
        # A. Nearest Neighbor (Initial Solution)
        nn_route = solve_tsp_nearest_neighbor(route_points)
        nn_route.append(depot_coords) # Close loop
        
        # B. Hybrid Optimization (2-Opt)
        optimized_route = advanced_ai.optimize_route_hybrid(nn_route)
        
        # Get actual road path
        road_path = get_osrm_route(optimized_route)
        routes.append(road_path)
    
    # --- STEP 6: FEEDBACK LOOP ---
    log = advanced_ai.feedback_loop_update(routes)
    print(log) # Log to console for user to see "AI working"
        
    return routes

if __name__ == "__main__":
    import json
    try:
        with open("current_bin_status.json", "r") as f:
            data = json.load(f)
        routes = get_optimized_routes(data, n_trucks=2)
        print(f"Generated {len(routes)} routes.")
    except Exception as e:
        print(e)
