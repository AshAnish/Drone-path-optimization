import numpy as np
from scipy.spatial.distance import pdist, squareform
import networkx as nx
import heapq

def solve_prim(locations):
    """
    Use Prim's algorithm to find a Minimum Spanning Tree starting from
    CIT, Coimbatore. Since MST doesn't naturally define a traversal order,
    we'll perform a preorder traversal of the resulting tree.
    
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
    
    # Number of vertices
    n = len(locations)
    
    # Start from CIT, Coimbatore (first location)
    start_node = 0
    
    # Initialize a set to keep track of vertices in the MST
    mst_set = {start_node}
    
    # Initialize the MST as a networkx graph
    mst = nx.Graph()
    for i in range(n):
        mst.add_node(i)
    
    # Use a priority queue to get the minimum edge
    pq = []
    for i in range(1, n):
        heapq.heappush(pq, (dist_matrix[start_node][i], start_node, i))
    
    # While MST doesn't include all vertices
    while len(mst_set) < n and pq:
        weight, u, v = heapq.heappop(pq)
        
        # If v is not in MST, add edge u-v to MST
        if v not in mst_set:
            mst_set.add(v)
            mst.add_edge(u, v, weight=weight)
            
            # Add all edges connecting v to unvisited vertices to the priority queue
            for i in range(n):
                if i not in mst_set:
                    heapq.heappush(pq, (dist_matrix[v][i], v, i))
    
    # Perform a preorder traversal of the MST starting from the root
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