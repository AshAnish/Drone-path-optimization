from flask import Flask, render_template, request, jsonify
import json
import os
from knapsack_solver import solve_knapsack
from tsp_solver import solve_tsp
from prim_solver import solve_prim
from kruskal_solver import solve_kruskal
from routing import get_realistic_route
from comparison import compare_algorithms

app = Flask(__name__)

# OpenRouteService API key - In production, use environment variables
ORS_API_KEY = os.environ.get('ORS_API_KEY', '5b3ce3597851110001cf62483720d2590e274a468698438c36264bd9')

@app.route('/')
def index():
    return render_template('index.html', api_key=ORS_API_KEY)

@app.route('/optimize', methods=['POST'])
def optimize():
    data = request.get_json()
    
    # Extract data
    packages = data['packages']
    weight_limit = data['weightLimit']
    algorithm = data['algorithm']
    
    # CIT, Coimbatore coordinates
    start_location = {"lat": 11.0292, "lng": 77.0263, "name": "CIT, Coimbatore"}
    
    # Step 1: Use Knapsack algorithm to select packages based on weight limit
    selected_packages = solve_knapsack(packages, weight_limit)
    
    # Extract all delivery locations including the start point
    delivery_locations = [start_location]
    for package in selected_packages:
        delivery_locations.append({
            "lat": package["lat"],
            "lng": package["lng"],
            "name": f"Package {package['id']} - {package['weight']}kg"
        })
    
    # Step 2: Use selected algorithm to optimize the route
    route_order = []
    if algorithm == "tsp":
        route_order = solve_tsp(delivery_locations)
    elif algorithm == "prim":
        route_order = solve_prim(delivery_locations)
    elif algorithm == "kruskal":
        route_order = solve_kruskal(delivery_locations)
    else:
        return jsonify({"error": "Invalid algorithm selection"}), 400
    
    # Step 3: Get realistic routes between consecutive points
    realistic_routes = []
    total_distance = 0
    
    for i in range(len(route_order) - 1):
        from_point = delivery_locations[route_order[i]]
        to_point = delivery_locations[route_order[i + 1]]
        
        route_data = get_realistic_route(from_point, to_point)
        realistic_routes.append(route_data["route"])
        total_distance += route_data["distance"]
    
    # If we're using a cycle (TSP), add the route back to start
    if algorithm == "tsp" and route_order[0] != route_order[-1]:
        from_point = delivery_locations[route_order[-1]]
        to_point = delivery_locations[route_order[0]]
        
        route_data = get_realistic_route(from_point, to_point)
        realistic_routes.append(route_data["route"])
        total_distance += route_data["distance"]
    
    # Step 4: Compare all algorithms if requested
    comparison = None
    if data.get('compare', False):
        comparison = compare_algorithms(delivery_locations)
    
    return jsonify({
        "selectedPackages": selected_packages,
        "routeOrder": [delivery_locations[i] for i in route_order],
        "realisticRoutes": realistic_routes,
        "totalDistance": total_distance,
        "algorithm": algorithm,
        "comparison": comparison
    })

if __name__ == '__main__':
    app.run(debug=True)