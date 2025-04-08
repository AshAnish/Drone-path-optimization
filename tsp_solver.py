import numpy as np
from scipy.spatial.distance import pdist, squareform
import networkx as nx

def solve_tsp(locations):
    """
    Solve the Traveling Salesman Problem for the given locations.
    Always starts from the first location (CIT, Coimbatore).
    
    Args:
        locations: List of location dictionaries with 'lat', 'lng'
        
    Returns:
        List of indices representing the optimal visit order
    """
    if len(locations) <= 2:
        return list(range(len(locations)))
    
    # Create a distance matrix
    points = np.array([[loc['lat'], loc['lng']] for loc in locations])
    
    # Calculate pairwise distances (Euclidean for simplification)
    # In a real-world scenario, you might use the actual road distances
    dist_matrix = squareform(pdist(points))
    
    # Create a complete graph
    G = nx.complete_graph(len(locations))
    
    # Add edge weights based on distances
    for i in range(len(locations)):
        for j in range(i+1, len(locations)):
            G[i][j]['weight'] = dist_matrix[i, j]
    
    # Fix start location as CIT, Coimbatore (first location)
    start_node = 0
    
    # Use an approximation algorithm for TSP
    # For simplicity, we'll use the nearest neighbor algorithm
    path = [start_node]
    unvisited = set(range(1, len(locations)))
    
    current = start_node
    while unvisited:
        next_node = min(unvisited, key=lambda x: dist_matrix[current, x])
        path.append(next_node)
        unvisited.remove(next_node)
        current = next_node
    
    # Add the return to start for a complete cycle
    path.append(start_node)
    
    return path