// Initialize map centered at CIT Coimbatore
const map = L.map('map').setView([CIT_COORDS.lat, CIT_COORDS.lng], 13);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
}).addTo(map);

// Add marker for CIT Coimbatore (origin)
const originIcon = L.divIcon({
    className: 'custom-marker-icon marker-origin',
    html: '<span>O</span>',
    iconSize: [30, 30]
});

const originMarker = L.marker([CIT_COORDS.lat, CIT_COORDS.lng], {
    icon: originIcon,
    draggable: false
}).addTo(map);

originMarker.bindPopup('<b>CIT Coimbatore</b><br>Origin Point').openPopup();

// Initialize variables for delivery locations
let deliveryMarkers = [];
let selectedLocation = null;
let tempMarker = null;
let routePolylines = [];

// Function to clear all delivery markers
function clearDeliveryMarkers() {
    deliveryMarkers.forEach(marker => map.removeLayer(marker));
    deliveryMarkers = [];
}

// Function to clear route lines
function clearRouteLines() {
    routePolylines.forEach(line => map.removeLayer(line));
    routePolylines = [];
}

// Function to add a delivery marker to the map
function addDeliveryMarker(lat, lng, name, index) {
    const deliveryIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: `<span>${index + 1}</span>`,
        iconSize: [24, 24]
    });
    
    const marker = L.marker([lat, lng], {
        icon: deliveryIcon,
        draggable: false
    }).addTo(map);
    
    marker.bindPopup(`<b>${name}</b>`);
    deliveryMarkers.push(marker);
    
    return marker;
}

// Handle map click events for selecting delivery locations
map.on('click', function(e) {
    // Only allow selection if medicine form is active
    if (document.getElementById('medicineName').value === '') {
        alert('Please enter medicine details first');
        return;
    }
    
    selectedLocation = e.latlng;
    
    // Update UI to show selected location
    document.getElementById('locationStatus').textContent = 
        `Selected: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`;
    
    // Remove previous temporary marker if exists
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }
    
    // Add temporary marker
    tempMarker = L.marker(selectedLocation).addTo(map);
    tempMarker.bindPopup('Delivery location for ' + document.getElementById('medicineName').value).openPopup();
});

// Function to visualize the delivery route
function visualizeRoute(route) {
    // Clear existing route lines
    clearRouteLines();
    
    // Create a polyline for the route
    const routeCoordinates = route.map(location => [location.lat, location.lng]);
    
    const routeLine = L.polyline(routeCoordinates, {
        color: '#3498db',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
        lineJoin: 'round'
    }).addTo(map);
    
    routePolylines.push(routeLine);
    
    // Add route markers
    clearDeliveryMarkers();
    
    // First is origin, skip it as we already have an origin marker
    for (let i = 1; i < route.length; i++) {
        const location = route[i];
        addDeliveryMarker(location.lat, location.lng, location.name, i - 1);
    }
    
    // Fit map to show all markers
    const bounds = routeLine.getBounds();
    map.fitBounds(bounds, { padding: [50, 50] });
}

// Function to reset the map view to origin
function resetMapView() {
    map.setView([CIT_COORDS.lat, CIT_COORDS.lng], 13);
    
    // Clear all markers and routes
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
    
    clearDeliveryMarkers();
    clearRouteLines();
    
    // Reset selected location
    selectedLocation = null;
    document.getElementById('locationStatus').textContent = 'Click on map to select';
}