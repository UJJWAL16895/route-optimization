import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from bin_locations import locations

def generate_data(days=30):
    data = []
    base_date = datetime.now() - timedelta(days=days)
    
    # Define personas and their fill characteristics (avg daily fill rate %, variance)
    personas = {
        "Food Court": {"rate": 40, "var": 15},   # Fills fast
        "Academic": {"rate": 15, "var": 5},      # Fills slow
        "Hostel": {"rate": 25, "var": 10},       # Moderate
        "Park": {"rate": 20, "var": 8},          # Moderate
        "Ground": {"rate": 10, "var": 5},        # Very slow
        "Default": {"rate": 15, "var": 5}
    }

    # Assign personas based on name keywords
    bin_personas = {}
    for loc in locations:
        name = loc["name"].lower()
        if "food court" in name or "oven" in name or "mess" in name:
            p = "Food Court"
        elif "bh" in name or "gh" in name or "block" in name:
            # Blocks/Hostels
            p = "Hostel" if "bh" in name or "gh" in name else "Academic"
        elif "park" in name:
            p = "Park"
        elif "ground" in name:
            p = "Ground"
        else:
            p = "Default"
        bin_personas[loc["name"]] = p

    for day in range(days):
        current_date = base_date + timedelta(days=day)
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Seasonality/Weekend effect
        is_weekend = current_date.weekday() >= 5
        weekend_factor = 1.5 if is_weekend else 1.0 # Maybe more trash on weekends in hostels?
        
        for loc in locations:
            persona_name = bin_personas[loc["name"]]
            stats = personas[persona_name]
            
            # Simulate daily fill
            daily_fill = np.random.normal(stats["rate"], stats["var"]) * weekend_factor
            daily_fill = max(0, min(100, daily_fill)) # Clamp 0-100
            
            # We can also simulate "current fill level" as a cumulative thing, 
            # but for optimization, we often just need a snapshot. 
            # Let's generate "Current Fill Level" as if we are taking a reading at end of day.
            # To make it interesting, let's say some bins weren't collected and accumulated.
            
            # Simple model: Random fill level between 0 and 100 weighted by persona
            # This represents "Snapshot" data for training or historical analysis
            
            # Let's try to be consistent: 
            # fill_level = random 0-100, but higher mean for Food Courts.
            
            mean_fill = stats["rate"] * 2 # Just an assumption that bins are emptied every 2-3 days
            fill_level = np.random.normal(mean_fill, stats["var"] * 2)
            fill_level = max(0, min(100, fill_level))
            
            data.append({
                "date": date_str,
                "bin_id": loc["name"],
                "latitude": loc["lat"],
                "longitude": loc["lon"],
                "fill_level": round(fill_level, 2),
                "type": persona_name
            })

    df = pd.DataFrame(data)
    
    # Save files if needed (for main.py usage)
    # We always save current status for the API to read
    last_date = df['date'].max()
    current_df = df[df['date'] == last_date]
    current_df.to_json("current_bin_status.json", orient="records")
    
    return df

if __name__ == "__main__":
    df = generate_data()
    print(f"Generated {len(df)} records.")
    df.to_csv("synthetic_bin_data.csv", index=False)
    print("Saved to synthetic_bin_data.csv and current_bin_status.json")
