def solve_knapsack(packages, weight_limit):
    """
    Solve the 0/1 Knapsack problem to select the optimal set of packages
    based on their weights and values.
    
    Args:
        packages: List of package dictionaries with 'id', 'weight', and 'value'
        weight_limit: Maximum weight capacity for the drone
        
    Returns:
        List of selected packages
    """
    n = len(packages)
    
    # Create a 2D table for dynamic programming
    # dp[i][w] represents the maximum value that can be obtained
    # using first i packages and with weight limit w
    dp = [[0 for _ in range(weight_limit + 1)] for _ in range(n + 1)]
    
    # Build the dp table bottom-up
    for i in range(1, n + 1):
        for w in range(1, weight_limit + 1):
            # Current package's weight and value
            current_weight = packages[i-1]['weight']
            current_value = packages[i-1]['value']
            
            # If current package's weight is more than the weight limit,
            # we can't include it, so take the value without it
            if current_weight > w:
                dp[i][w] = dp[i-1][w]
            else:
                # Maximum of (not taking the current package) or
                # (taking the current package + optimal value with remaining weight)
                dp[i][w] = max(dp[i-1][w], dp[i-1][w-current_weight] + current_value)
    
    # Backtrack to find the selected packages
    selected_packages = []
    w = weight_limit
    
    for i in range(n, 0, -1):
        # If the value came from including this package
        if dp[i][w] != dp[i-1][w]:
            selected_packages.append(packages[i-1])
            w -= packages[i-1]['weight']
    
    return selected_packages