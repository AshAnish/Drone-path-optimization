from geopy.distance import geodesic

def calculate_distances(locations):
    """
    Calculate the distance matrix between all locations
    
    Args:
        locations (list): List of location dictionaries with 'lat' and 'lng' keys
        
    Returns:
        list: 2D matrix of distances between all locations in kilometers
    """
    n = len(locations)
    distance_matrix = [[0 for _ in range(n)] for _ in range(n)]
    
    for i in range(n):
        loc_i = (locations[i]['lat'], locations[i]['lng'])
        for j in range(n):
            if i != j:
                loc_j = (locations[j]['lat'], locations[j]['lng'])
                # Calculate geodesic distance in kilometers
                distance_matrix[i][j] = geodesic(loc_i, loc_j).kilometers
    
    return distance_matrix

def calculate_route_distance(route, distance_matrix):
    """
    Calculate the total distance of a route
    
    Args:
        route (list): List of location indices representing the route
        distance_matrix (list): 2D matrix of distances between all locations
        
    Returns:
        float: Total distance of the route in kilometers
    """
    total_distance = 0
    for i in range(len(route) - 1):
        total_distance += distance_matrix[route[i]][route[i+1]]
    return total_distance