import numpy as np
from scipy.spatial.distance import pdist, squareform
import networkx as nx

def solve_kruskal(locations):
    """
    Use Kruskal's algorithm to find a Minimum Spanning Tree.
    Similar to Prim's, we'll perform a preorder traversal to get a route.
    
    Args:
        locations: List of location dictionaries with 'lat', 'lng'
        
    Returns:
        List of indices representing a traversal order based on the MST
    """
    if len(locations) <= 2:
        return list(range(len(locations)))
    
    # Create a distance matrix
    points = np.array([[loc['lat'], loc['lng']] for loc in locations])
    dist_matrix = squareform(pdist(points))
    
    # Create a complete graph with weighted edges
    G = nx.Graph()
    for i in range(len(locations)):
        G.add_node(i)
        for j in range(i+1, len(locations)):
            G.add_edge(i, j, weight=dist_matrix[i, j])
    
    # Apply Kruskal's algorithm to find the MST
    mst = nx.minimum_spanning_tree(G)
    
    # Start from CIT, Coimbatore
    start_node = 0
    
    # Perform a preorder traversal of the MST
    def dfs_preorder(graph, start_node):
        visited = [start_node]
        stack = [iter(graph[start_node])]
        
        while stack:
            children = stack[-1]
            try:
                child = next(children)
                if child not in visited:
                    visited.append(child)
                    stack.append(iter(graph[child]))
            except StopIteration:
                stack.pop()
        
        return visited
    
    traversal_order = dfs_preorder(mst, start_node)
    
    # Add the start node at the end for a complete route
    if traversal_order[0] != traversal_order[-1]:
        traversal_order.append(start_node)
    
    return traversal_order