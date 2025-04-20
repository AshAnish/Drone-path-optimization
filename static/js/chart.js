// This file contains code for rendering charts and visualizations for the SmartDroneMeds app
// It uses Chart.js for rendering comparisons between different routing algorithms

document.addEventListener('DOMContentLoaded', function() {
    // We'll initialize charts when results are received
    // The main chart creation is handled in the displayResults function in form_handler.js
    
    // This function can be called directly to create a comparison chart
    window.createAlgorithmComparisonChart = function(containerId, algorithms, distances) {
        const chartContainer = document.getElementById(containerId);
        
        if (!chartContainer) {
            console.error('Chart container not found:', containerId);
            return;
        }
        
        // If there's an existing chart, destroy it
        if (window.algorithmComparisonChart) {
            window.algorithmComparisonChart.destroy();
        }
        
        // Create a canvas element for the chart
        const canvas = document.createElement('canvas');
        chartContainer.innerHTML = '';
        chartContainer.appendChild(canvas);
        
        // Generate a color for each algorithm
        const colors = {
            'TSP': '#3498db',
            'Prim\'s': '#2ecc71',
            'Kruskal\'s': '#e74c3c'
        };
        
        const barColors = algorithms.map(algo => colors[algo] || '#7f8c8d');
        
        // Create the chart
        window.algorithmComparisonChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: algorithms,
                datasets: [{
                    label: 'Total Distance (km)',
                    data: distances,
                    backgroundColor: barColors,
                    borderColor: barColors.map(color => adjustColor(color, -20)),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Route Optimization Algorithm Comparison',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Distance: ${context.parsed.y.toFixed(2)} km`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Distance (km)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Algorithm'
                        }
                    }
                }
            }
        });
        
        return window.algorithmComparisonChart;
    };
    
    // This function can be used to create a delivery value chart
    window.createMedicineValueChart = function(containerId, medicines) {
        const chartContainer = document.getElementById(containerId);
        
        if (!chartContainer) {
            console.error('Chart container not found:', containerId);
            return;
        }
        
        // If there's an existing chart, destroy it
        if (window.medicineValueChart) {
            window.medicineValueChart.destroy();
        }
        
        // Create a canvas element for the chart
        const canvas = document.createElement('canvas');
        chartContainer.innerHTML = '';
        chartContainer.appendChild(canvas);
        
        // Prepare data for the chart
        const medicineNames = medicines.map(med => med.name);
        const medicineValues = medicines.map(med => med.value * med.selected_fraction);
        const medicineWeights = medicines.map(med => med.weight * med.selected_fraction);
        
        // Create the chart
        window.medicineValueChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: medicineNames,
                datasets: [
                    {
                        label: 'Value',
                        data: medicineValues,
                        backgroundColor: '#3498db',
                        borderColor: '#2980b9',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Weight (kg)',
                        data: medicineWeights,
                        backgroundColor: '#2ecc71',
                        borderColor: '#27ae60',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Selected Medicines: Value vs Weight',
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        },
                        title: {
                            display: true,
                            text: 'Weight (kg)'
                        }
                    }
                }
            }
        });
        
        return window.medicineValueChart;
    };
    
    // Function to create a route progress chart showing distance between each stop
    window.createRouteProgressChart = function(containerId, route, distances) {
        const chartContainer = document.getElementById(containerId);
        
        if (!chartContainer) {
            console.error('Chart container not found:', containerId);
            return;
        }
        
        // If there's an existing chart, destroy it
        if (window.routeProgressChart) {
            window.routeProgressChart.destroy();
        }
        
        // Create a canvas element for the chart
        const canvas = document.createElement('canvas');
        chartContainer.innerHTML = '';
        chartContainer.appendChild(canvas);
        
        // Prepare data for the chart
        const labels = [];
        const cumulativeDistances = [];
        let totalDistance = 0;
        
        for (let i = 0; i < route.length - 1; i++) {
            const from = route[i].name;
            const to = route[i+1].name;
            const distance = distances[i];
            
            labels.push(`${from} → ${to}`);
            totalDistance += distance;
            cumulativeDistances.push(totalDistance);
        }
        
        // Create the chart
        window.routeProgressChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cumulative Distance (km)',
                    data: cumulativeDistances,
                    fill: true,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: '#3498db',
                    tension: 0.1,
                    pointBackgroundColor: '#3498db',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Route Progress: Cumulative Distance',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Total distance: ${context.parsed.y.toFixed(2)} km`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cumulative Distance (km)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Route Segment'
                        }
                    }
                }
            }
        });
        
        return window.routeProgressChart;
    };
    
    // Helper function to adjust color brightness
    function adjustColor(hex, amount) {
        return '#' + hex.replace(/^#/, '')
            .match(/.{2}/g)
            .map(color => {
                const num = parseInt(color, 16);
                const newVal = Math.max(0, Math.min(255, num + amount));
                return newVal.toString(16).padStart(2, '0');
            })
            .join('');
    }
    
    // Function to update the form_handler.js displayResults function to use chart.js
    window.updateDisplayResultsWithCharts = function(result) {
        // Create algorithm comparison chart if the DOM is ready
        if (document.getElementById('chartContainer')) {
            const algorithms = ['TSP', 'Prim\'s', 'Kruskal\'s'];
            const distances = [
                result.comparison.tsp,
                result.comparison.prims,
                result.comparison.kruskals
            ];
            
            window.createAlgorithmComparisonChart('chartContainer', algorithms, distances);
            
            // If we have route segments distances, create a progress chart
            if (result.route && result.route.length > 1) {
                // Calculate segment distances
                const segmentDistances = [];
                for (let i = 0; i < result.route.length - 1; i++) {
                    const from = result.route[i];
                    const to = result.route[i+1];
                    const distance = calculateDistance(from, to);
                    segmentDistances.push(distance);
                }
                
                if (document.getElementById('routeProgressContainer')) {
                    window.createRouteProgressChart('routeProgressContainer', result.route, segmentDistances);
                }
            }
            
            // Create medicine value chart
            if (result.selected_medicines && result.selected_medicines.length > 0) {
                if (document.getElementById('medicineValueContainer')) {
                    window.createMedicineValueChart('medicineValueContainer', result.selected_medicines);
                }
            }
        }
    };
    
    // Helper function to calculate distance between two coordinates
    function calculateDistance(from, to) {
        // Simple Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = (to.lat - from.lat) * Math.PI / 180;
        const dLon = (to.lng - from.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
});