import numpy as np

def solve_tsp(distance_matrix):
    """
    Solves the Traveling Salesman Problem to find the shortest route.
    
    This is a nearest neighbor implementation of TSP, which is a heuristic
    approach. It starts from the origin (index 0) and always visits the
    nearest unvisited location next.
    
    Args:
        distance_matrix (list): 2D matrix of distances between all locations
        
    Returns:
        list: Ordered indices representing the route
    """
    n = len(distance_matrix)
    
    # Start at the origin (index 0)
    current = 0
    route = [current]
    unvisited = set(range(1, n))
    
    # Visit all locations using nearest neighbor approach
    while unvisited:
        # Find the nearest unvisited location
        nearest = min(unvisited, key=lambda x: distance_matrix[current][x])
        route.append(nearest)
        unvisited.remove(nearest)
        current = nearest
    
    # Return to origin to complete the tour
    route.append(0)
    
    return route