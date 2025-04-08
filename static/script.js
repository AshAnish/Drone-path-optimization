// Global variables
let map;
let markers = [];
let packages = [];
let routePolylines = [];
let selectedLocation = null;
let comparisonChart = null;

// CIT, Coimbatore coordinates
const CIT_COORDINATES = [11.0292, 77.0263];

// Initialize the map on document ready
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupEventListeners();
});

// Initialize Leaflet map
function initMap() {
    // Create map centered at CIT, Coimbatore
    map = L.map('map').setView(CIT_COORDINATES, 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add marker for CIT, Coimbatore
    const citMarker = L.marker(CIT_COORDINATES, {
        icon: L.icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        })
    }).addTo(map);
    
    citMarker.bindPopup("<b>Starting Point</b><br>CIT, Coimbatore").openPopup();
    
    // Set up map click event for location selection
    map.on('click', onMapClick);
}

// Handle map click for location selection
function onMapClick(e) {
    // Remove previous temporary marker if exists
    if (selectedLocation) {
        map.removeLayer(selectedLocation);
    }
    
    // Add a new marker at the clicked location
    selectedLocation = L.marker(e.latlng).addTo(map);
    selectedLocation.bindPopup("Delivery Location").openPopup();
    
    // Update the location display in the form
    document.getElementById('locationSelected').textContent = 
        `Selected: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
    
    // Enable the "Add Package" button
    document.getElementById('addPackageBtn').disabled = false;
}

// Set up event listeners
function setupEventListeners() {
    // Add Package button
    document.getElementById('addPackageBtn').addEventListener('click', addPackage);
    
    // Optimize Route button
    document.getElementById('optimizeRouteBtn').addEventListener('click', optimizeRoute);
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetApplication);
}

// Add a package to the list
function addPackage() {
    // Get input values
    const weight = parseFloat(document.getElementById('packageWeight').value);
    const value = parseInt(document.getElementById('packageValue').value);
    
    if (!weight || !value || !selectedLocation) {
        alert('Please enter weight, value and select a location on the map.');
        return;
    }
    
    // Create a new package object
    const newPackage = {
        id: packages.length + 1,
        weight: weight,
        value: value,
        lat: selectedLocation.getLatLng().lat,
        lng: selectedLocation.getLatLng().lng
    };
    
    // Add to packages array
    packages.push(newPackage);
    
    // Add permanent marker on the map
    const packageMarker = L.marker([newPackage.lat, newPackage.lng], {
        icon: L.icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        })
    }).addTo(map);
    
    packageMarker.bindPopup(`<b>Package ${newPackage.id}</b><br>Weight: ${newPackage.weight}kg<br>Value: ${newPackage.value}/10`);
    markers.push(packageMarker);
    
    // Add to package list in sidebar
    const packageList = document.getElementById('packageList');
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item';
    listItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <strong>Package ${newPackage.id}</strong><br>
                Weight: ${newPackage.weight}kg | Value: ${newPackage.value}/10
            </div>
            <button class="btn btn-sm btn-outline-danger remove-package" data-id="${newPackage.id}">Remove</button>
        </div>
    `;
    packageList.appendChild(listItem);
    
    // Add remove event listener
    listItem.querySelector('.remove-package').addEventListener('click', function() {
        removePackage(newPackage.id);
    });
    
    // Clear input fields and selected location
    document.getElementById('packageWeight').value = '';
    document.getElementById('packageValue').value = '';
    document.getElementById('locationSelected').textContent = 'Click on the map to select a delivery location';
    
    // Remove temporary marker
    if (selectedLocation) {
        map.removeLayer(selectedLocation);
        selectedLocation = null;
    }
    
    // Enable Optimize button if at least one package is added
    document.getElementById('optimizeRouteBtn').disabled = packages.length === 0;
    
    // Disable Add Package button until a new location is selected
    document.getElementById('addPackageBtn').disabled = true;
}

// Remove a package from the list
function removePackage(id) {
    // Find index of package
    const index = packages.findIndex(p => p.id === id);
    
    if (index !== -1) {
        // Remove package from array
        packages.splice(index, 1);
        
        // Remove marker from map
        map.removeLayer(markers[index]);
        markers.splice(index, 1);
        
        // Rebuild package list
        refreshPackageList();
        
        // Disable Optimize button if no packages
        document.getElementById('optimizeRouteBtn').disabled = packages.length === 0;
    }
}

// Refresh the package list display
function refreshPackageList() {
    const packageList = document.getElementById('packageList');
    packageList.innerHTML = '';
    
    packages.forEach(pkg => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>Package ${pkg.id}</strong><br>
                    Weight: ${pkg.weight}kg | Value: ${pkg.value}/10
                </div>
                <button class="btn btn-sm btn-outline-danger remove-package" data-id="${pkg.id}">Remove</button>
            </div>
        `;
        packageList.appendChild(listItem);
        
        // Add remove event listener
        listItem.querySelector('.remove-package').addEventListener('click', function() {
            removePackage(pkg.id);
        });
    });
}

// Optimize the drone delivery route
function optimizeRoute() {
    // Clear previous routes
    clearRoutes();
    
    // Show loading indicator
    document.getElementById('optimizeRouteBtn').disabled = true;
    document.getElementById('optimizeRouteBtn').textContent = 'Optimizing...';
    
    // Get selected algorithm and weight limit
    const algorithm = document.getElementById('algorithmSelect').value;
    const weightLimit = parseFloat(document.getElementById('droneWeightLimit').value);
    const compareAlgorithms = document.getElementById('compareAlgorithms').checked;
    
    // Prepare data for the API request
    const data = {
        packages: packages,
        weightLimit: weightLimit,
        algorithm: algorithm,
        compare: compareAlgorithms
    };
    
    // Send API request to the backend
    fetch('/optimize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Display the results
        displayResults(data);
        
        // Display comparison if requested
        if (compareAlgorithms && data.comparison) {
            displayComparison(data.comparison);
        }
        
        // Reset button state
        document.getElementById('optimizeRouteBtn').disabled = false;
        document.getElementById('optimizeRouteBtn').textContent = 'Optimize Route';
    })
    .catch(error => {
        console.error('Error optimizing route:', error);
        alert('Error optimizing route. Please try again.');
        
        // Reset button state
        document.getElementById('optimizeRouteBtn').disabled = false;
        document.getElementById('optimizeRouteBtn').textContent = 'Optimize Route';
    });
}

// Display optimization results
function displayResults(data) {
    // Display selected packages information
    const resultsCard = document.getElementById('resultsCard');
    const resultsContent = document.getElementById('resultsContent');
    
    // Clear previous content
    resultsContent.innerHTML = '';
    
    // Create results information
    const selectedPackagesCount = data.selectedPackages.length;
    const totalWeight = data.selectedPackages.reduce((sum, pkg) => sum + pkg.weight, 0);
    const totalDistance = (data.totalDistance / 1000).toFixed(2); // Convert to km
    
    resultsContent.innerHTML = `
        <h5>Optimization Results</h5>
        <p>
            <strong>Algorithm:</strong> ${getAlgorithmFullName(data.algorithm)}<br>
            <strong>Selected Packages:</strong> ${selectedPackagesCount}<br>
            <strong>Total Weight:</strong> ${totalWeight.toFixed(2)} kg<br>
            <strong>Total Distance:</strong> ${totalDistance} km
        </p>
        <h6>Selected Packages</h6>
        <ul class="list-group">
            ${data.selectedPackages.map(pkg => `
                <li class="list-group-item">
                    Package ${pkg.id} - Weight: ${pkg.weight}kg, Value: ${pkg.value}/10
                </li>
            `).join('')}
        </ul>
    `;
    
    // Show results card
    resultsCard.style.display = 'block';
    
    // Draw the route on the map
    drawRouteOnMap(data.realisticRoutes);
    
    // Highlight selected package markers
    highlightSelectedPackages(data.selectedPackages);
}

// Draw route on the map
function drawRouteOnMap(routes) {
    // Clear any existing routes
    clearRoutes();
    
    // Draw each route segment
    routes.forEach(route => {
        const polyline = L.polyline(route, {
            color: 'blue',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(map);
        
        routePolylines.push(polyline);
    });
    
    // Fit the map to the route
    if (routes.length > 0) {
        const allPoints = routes.flat();
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Highlight selected packages on the map
function highlightSelectedPackages(selectedPackages) {
    // Reset all markers to blue
    markers.forEach(marker => {
        marker.setIcon(L.icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        }));
    });
    
    // Change selected package markers to green
    const selectedIds = selectedPackages.map(pkg => pkg.id);
    
    packages.forEach((pkg, index) => {
        if (selectedIds.includes(pkg.id)) {
            markers[index].setIcon(L.icon({
                iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
            }));
        }
    });
}

// Display algorithm comparison
function displayComparison(comparison) {
    const comparisonCard = document.getElementById('comparisonCard');
    const comparisonContent = document.getElementById('comparisonContent');
    
    // Clear previous content
    comparisonContent.innerHTML = '';
    
    // Create canvas for chart
    comparisonContent.innerHTML = `
        <h5>Algorithm Distance Comparison</h5>
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Algorithm</th>
                        <th>Distance (km)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>TSP</td>
                        <td>${(comparison.tsp.distance / 1000).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Prim's Algorithm</td>
                        <td>${(comparison.prim.distance / 1000).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Kruskal's Algorithm</td>
                        <td>${(comparison.kruskal.distance / 1000).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <canvas id="comparisonChart"></canvas>
    `;
    
    // Show comparison card
    comparisonCard.style.display = 'block';
    
    // Create chart
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    // Destroy previous chart if exists
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['TSP', 'Prim\'s', 'Kruskal\'s'],
            datasets: [{
                label: 'Distance (km)',
                data: [
                    comparison.tsp.distance / 1000,
                    comparison.prim.distance / 1000,
                    comparison.kruskal.distance / 1000
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Distance (km)'
                    }
                }
            }
        }
    });
}

// Clear routes from the map
function clearRoutes() {
    // Remove polylines
    routePolylines.forEach(polyline => {
        map.removeLayer(polyline);
    });
    
    routePolylines = [];
    
    // Reset marker colors
    markers.forEach(marker => {
        marker.setIcon(L.icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        }));
    });
    
    // Hide result cards
    document.getElementById('resultsCard').style.display = 'none';
    document.getElementById('comparisonCard').style.display = 'none';
}

// Reset the application
function resetApplication() {
    // Clear packages
    packages = [];
    
    // Remove all markers
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
    
    // Clear routes
    clearRoutes();
    
    // Clear package list
    document.getElementById('packageList').innerHTML = '';
    
    // Reset inputs
    document.getElementById('packageWeight').value = '';
    document.getElementById('packageValue').value = '';
    document.getElementById('locationSelected').textContent = 'Click on the map to select a delivery location';
    document.getElementById('droneWeightLimit').value = '10';
    document.getElementById('algorithmSelect').value = 'tsp';
    document.getElementById('compareAlgorithms').checked = false;
    
    // Remove temporary marker if exists
    if (selectedLocation) {
        map.removeLayer(selectedLocation);
        selectedLocation = null;
    }
    
    // Disable buttons
    document.getElementById('addPackageBtn').disabled = true;
    document.getElementById('optimizeRouteBtn').disabled = true;
    
    // Reset map view to CIT, Coimbatore
    map.setView(CIT_COORDINATES, 13);
}

// Get full algorithm name
function getAlgorithmFullName(algorithm) {
    switch (algorithm) {
        case 'tsp':
            return 'Travelling Salesman Problem (TSP)';
        case 'prim':
            return 'Prim\'s Algorithm';
        case 'kruskal':
            return 'Kruskal\'s Algorithm';
        default:
            return algorithm;
    }
}