import numpy as np
import networkx as nx

def kruskals_algorithm(distance_matrix):
    """
    Finds a minimum spanning tree using Kruskal's algorithm and converts
    it to a route by performing a depth-first traversal.
    
    Args:
        distance_matrix (list): 2D matrix of distances between all locations
        
    Returns:
        list: List of node indices representing the route
    """
    n = len(distance_matrix)
    
    # Create a graph from the distance matrix
    G = nx.Graph()
    for i in range(n):
        for j in range(i+1, n):
            G.add_edge(i, j, weight=distance_matrix[i][j])
    
    # Find the minimum spanning tree (MST) using Kruskal's algorithm
    # Note: NetworkX uses Kruskal's by default for minimum_spanning_tree
    mst = nx.minimum_spanning_tree(G, algorithm='kruskal')
    
    # Perform DFS on the MST starting from node 0 (origin)
    route = []
    visited = set()
    
    def dfs(node):
        route.append(node)
        visited.add(node)
        
        # Visit all connected nodes that haven't been visited yet
        for neighbor in mst.neighbors(node):
            if neighbor not in visited:
                dfs(neighbor)
    
    # Start DFS from the origin (node 0)
    dfs(0)
    
    # Return to origin to complete the tour
    route.append(0)
    
    return route