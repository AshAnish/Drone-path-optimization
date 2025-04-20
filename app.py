from flask import Flask, render_template, request, jsonify
import json
import numpy as np
from geopy.distance import geodesic
import networkx as nx
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import base64
from io import BytesIO
import os

from algorithms.fractional_knapsack import fractional_knapsack
from algorithms.tsp import solve_tsp
from algorithms.prims import prims_algorithm
from algorithms.kruskals import kruskals_algorithm
from utils.distance_calculator import calculate_distances

app = Flask(__name__)

# CIT Coimbatore coordinates (fixed origin)
CIT_COORDS = {"lat": 11.0292, "lng": 77.0263}

@app.route('/')
def index():
    return render_template('index.html', cit_coords=CIT_COORDS)

@app.route('/optimize', methods=['POST'])
def optimize():
    data = request.get_json()
    
    # Extract medicines and locations
    medicines = data.get('medicines', [])
    drone_capacity = data.get('droneCapacity', 10.0)
    selected_algorithm = data.get('algorithm', 'tsp')
    
    # Create a list of weights and values for knapsack
    weights = [medicine.get('weight', 0) for medicine in medicines]
    values = [medicine.get('value', 0) for medicine in medicines]
    
    # Run fractional knapsack to select medicines
    selected_medicines, total_value = fractional_knapsack(weights, values, drone_capacity)
    
    # Filter selected medicines
    delivery_locations = []
    selected_med_details = []
    
    for i, fraction in enumerate(selected_medicines):
        if fraction > 0:  # If medicine is selected (partially or fully)
            med = medicines[i].copy()
            med['selected_fraction'] = fraction
            selected_med_details.append(med)
            
            if fraction > 0:  # Add location if medicine is selected
                location = {
                    'name': med.get('name', f"Medicine {i+1}"),
                    'lat': med.get('lat'),
                    'lng': med.get('lng'),
                    'fraction': fraction
                }
                delivery_locations.append(location)
    
    # Add origin (CIT Coimbatore)
    all_locations = [{'name': 'CIT Coimbatore (Origin)', 'lat': CIT_COORDS['lat'], 'lng': CIT_COORDS['lng']}] + delivery_locations
    
    # Calculate distance matrix
    distance_matrix = calculate_distances(all_locations)
    
    # Run the selected algorithm
    route = []
    if selected_algorithm == 'tsp':
        route = solve_tsp(distance_matrix)
    elif selected_algorithm == 'prims':
        route = prims_algorithm(distance_matrix)
    elif selected_algorithm == 'kruskals':
        route = kruskals_algorithm(distance_matrix)
    
    # Calculate total distance for the route
    total_distance = 0
    for i in range(len(route) - 1):
        from_idx = route[i]
        to_idx = route[i + 1]
        total_distance += distance_matrix[from_idx][to_idx]
    
    # Optional: Run all algorithms for comparison
    tsp_route = solve_tsp(distance_matrix)
    prims_route = prims_algorithm(distance_matrix)
    kruskals_route = kruskals_algorithm(distance_matrix)
    
    tsp_distance = sum(distance_matrix[tsp_route[i]][tsp_route[i+1]] for i in range(len(tsp_route)-1))
    prims_distance = sum(distance_matrix[prims_route[i]][prims_route[i+1]] for i in range(len(prims_route)-1))
    kruskals_distance = sum(distance_matrix[kruskals_route[i]][kruskals_route[i+1]] for i in range(len(kruskals_route)-1))
    
    # Generate comparison chart
    algorithm_distances = {
        'TSP': tsp_distance,
        "Prim's": prims_distance,
        "Kruskal's": kruskals_distance
    }
    
    # Create chart
    chart_img = create_comparison_chart(algorithm_distances)
    
    # Map route to actual locations
    route_coords = [all_locations[i] for i in route]
    
    # Prepare response
    response = {
        'selected_medicines': selected_med_details,
        'total_value': total_value,
        'route': route_coords,
        'total_distance': total_distance,
        'comparison': {
            'tsp': tsp_distance,
            'prims': prims_distance,
            'kruskals': kruskals_distance
        },
        'chart_image': chart_img
    }
    
    return jsonify(response)

def create_comparison_chart(algorithm_distances):
    # Create a bar chart comparing the algorithms
    algorithms = list(algorithm_distances.keys())
    distances = list(algorithm_distances.values())
    
    plt.figure(figsize=(10, 6))
    plt.bar(algorithms, distances, color=['#3498db', '#2ecc71', '#e74c3c'])
    plt.title('Algorithm Distance Comparison')
    plt.xlabel('Algorithm')
    plt.ylabel('Total Distance (km)')
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Convert plot to base64 string
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    image_png = buffer.getvalue()
    buffer.close()
    
    graphic = base64.b64encode(image_png).decode('utf-8')
    return graphic

if __name__ == '__main__':
    app.run(debug=True) 