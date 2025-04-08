import requests
import os
import polyline

def get_realistic_route(from_point, to_point):
    """
    Get a realistic route between two points using OpenRouteService API.
    
    Args:
        from_point: Dictionary with 'lat', 'lng' for starting point
        to_point: Dictionary with 'lat', 'lng' for ending point
        
    Returns:
        Dictionary with 'route' (list of coordinates) and 'distance' (in meters)
    """
    # Get API key from environment variable
    api_key = os.environ.get('ORS_API_KEY', 'your-api-key-here')
    
    # Base URL for the OpenRouteService API
    base_url = "https://api.openrouteservice.org/v2/directions/driving-car"
    
    # Prepare headers with API key
    headers = {
        'Accept': 'application/json',
        'Authorization': api_key
    }
    
    # Prepare the request parameters
    params = {
        'start': f"{from_point['lng']},{from_point['lat']}",
        'end': f"{to_point['lng']},{to_point['lat']}"
    }
    
    try:
        # Make the API request
        response = requests.get(base_url, headers=headers, params=params)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        data = response.json()
        
        # Extract the route geometry and distance
        route_geometry = data['features'][0]['geometry']['coordinates']
        total_distance = data['features'][0]['properties']['summary']['distance']
        
        # Convert to [lat, lng] format (OpenRouteService returns [lng, lat])
        route = [[coord[1], coord[0]] for coord in route_geometry]
        
        return {
            'route': route,
            'distance': total_distance
        }
    
    except requests.exceptions.RequestException as e:
        # Fallback to straight line if API fails
        print(f"Error accessing OpenRouteService API: {e}")
        
        # Create a straight line as fallback
        route = [
            [from_point['lat'], from_point['lng']],
            [to_point['lat'], to_point['lng']]
        ]
        
        # Calculate Euclidean distance as fallback (in meters)
        from math import sqrt, sin, cos, radians, asin
        
        def haversine(lat1, lon1, lat2, lon2):
            # Calculate the great circle distance between two points on the earth
            R = 6371000  # Radius of Earth in meters
            
            # Convert latitude and longitude from degrees to radians
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            
            # Haversine formula
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            distance = R * c
            
            return distance
        
        distance = haversine(
            from_point['lat'], from_point['lng'],
            to_point['lat'], to_point['lng']
        )
        
        return {
            'route': route,
            'distance': distance
        }