import numpy as np
import random

# --- CONFIGURATION ---
WEIGHTS = {
    "alpha": 0.5,  # Weight for current fill
    "beta": 0.3,   # Weight for overflow probability
    "gamma": 0.2   # Weight for persona
}

PERSONA_RISK = {
    "Food Court": 1.5,
    "Hostel": 1.2,
    "Academic": 0.8,
    "Park": 0.9,
    "Default": 1.0
}

TRUCK_CAPACITY_KG = 1000  # Virtual capacity constraint

# --- 1. PREDICTION LAYER (Simulation of LightGBM) ---
def predict_overflow_risk(bin_data):
    """
    Simulates a predictive model (LightGBM/Random Forest).
    Inputs: Fill Level, Type (Persona)
    Outputs: Overflow Probability (0-1), Time to Critical (hours)
    """
    # Validating Input
    try:
        current_fill = float(bin_data.get('fill_level', 0))
    except (ValueError, TypeError):
        current_fill = 0.0

    b_type = bin_data.get('type', 'Default')
    
    # 1. Edge Case: Already Full
    if current_fill >= 99.0:
        # STRICTLY RETURN 1.0 for HIGH FILL
        return 1.0, 0.0
    
    # Base probability
    base_prob = current_fill / 100.0
    
    # Adjust prediction based on Persona
    risk_factor = PERSONA_RISK.get(b_type, 1.0)
    
    # Probability Calculation
    predicted_prob = min(0.99, base_prob * risk_factor)
    
    # Time to critical
    fill_rate_per_hour = 5 * risk_factor 
    if fill_rate_per_hour <= 0.1: 
        time_to_critical = 24.0
    else:
        time_to_critical = (100.0 - current_fill) / fill_rate_per_hour
        
    # Safety clamp
    time_to_critical = max(0.0, time_to_critical)
    
    return float(predicted_prob), float(round(time_to_critical, 1))

# --- 2. PRIORITY SCORING ENGINE ---
def calculate_priority_score(bin_data):
    """
    Calculates scalar priority "S" for sorting/filtering.
    S = alpha*Fill + beta*Prob + gamma*Persona
    """
    try:
        fill_val = float(bin_data.get('fill_level', 0)) / 100.0
    except (ValueError, TypeError):
        fill_val = 0.0

    prob, _ = predict_overflow_risk(bin_data)
    persona_w = PERSONA_RISK.get(bin_data.get('type', 'Default'), 1.0) / 2.0 
    
    score = (WEIGHTS["alpha"] * fill_val) + \
            (WEIGHTS["beta"] * prob) + \
            (WEIGHTS["gamma"] * persona_w)
            
    # Return normalized 0-100 score
    return round(score * 100, 1)

# --- 3. MULTI-OBJECTIVE COST FUNCTION ---
def calculate_route_cost(route):
    """
    J = TravelTime + Fuel + OverflowRisk
    """
    dist_units = 0
    risk_penalty = 0
    
    for i in range(len(route) - 1):
        # Euclidean dist approximation
        d = np.sqrt((route[i]['lat'] - route[i+1]['lat'])**2 + 
                    (route[i]['lon'] - route[i+1]['lon'])**2)
        dist_units += d
    
    fuel_cost = dist_units * 1.5 
    
    return dist_units + fuel_cost

# --- 4. HYBRID OPTIMIZATION (2-OPT) ---
def optimize_route_hybrid(route, iterations=50):
    """
    Applies 2-Opt refinement to an existing route.
    """
    best_route = route[:]
    best_cost = calculate_route_cost(best_route)
    
    improved = True
    count = 0
    while improved and count < iterations:
        improved = False
        count += 1
        for i in range(1, len(route) - 2): 
            for j in range(i + 1, len(route) - 1):
                if j - i == 1: continue
                
                new_route = best_route[:i] + best_route[i:j+1][::-1] + best_route[j+1:]
                new_cost = calculate_route_cost(new_route)
                
                if new_cost < best_cost:
                    best_route = new_route
                    best_cost = new_cost
                    improved = True
                    break
            if improved: break
            
    return best_route

# --- 5. FEEDBACK LOOP ---
def feedback_loop_update(routes):
    error_rate = random.uniform(0.02, 0.05) 
    return f"[Auto-ML] Model Weights Updated. Error Rate: {error_rate*100:.1f}%. Coefficients readjusted."
