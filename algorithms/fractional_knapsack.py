def fractional_knapsack(weights, values, capacity):
    """
    Implements the fractional knapsack algorithm for medicine selection
    
    Args:
        weights (list): List of medicine weights
        values (list): List of medicine values
        capacity (float): Maximum drone carrying capacity
        
    Returns:
        tuple: (selected_fractions, total_value)
            - selected_fractions: List of fractions (0-1) for each medicine
            - total_value: Total value of the selected medicines
    """
    # Create an array of (value/weight, index) pairs
    value_weight_ratio = [(values[i] / weights[i], i) for i in range(len(weights))]
    
    # Sort by value-to-weight ratio in descending order
    value_weight_ratio.sort(reverse=True)
    
    # Initialize result arrays
    selected_fractions = [0] * len(weights)
    total_value = 0
    remaining_capacity = capacity
    
    # Fill the knapsack
    for ratio, index in value_weight_ratio:
        if weights[index] <= remaining_capacity:
            # Take the whole item
            selected_fractions[index] = 1.0
            total_value += values[index]
            remaining_capacity -= weights[index]
        else:
            # Take a fraction of the item
            fraction = remaining_capacity / weights[index]
            selected_fractions[index] = fraction
            total_value += values[index] * fraction
            remaining_capacity = 0
            break
    
    return selected_fractions, total_value