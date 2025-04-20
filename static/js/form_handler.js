// Global variables
let medicines = [];
let totalWeight = 0;

// DOM Elements
const medicineNameInput = document.getElementById('medicineName');
const medicineWeightInput = document.getElementById('medicineWeight');
const medicineValueInput = document.getElementById('medicineValue');
const locationStatusSpan = document.getElementById('locationStatus');
const medicineList = document.getElementById('medicineList');
const totalWeightSpan = document.getElementById('totalWeight');
const droneCapacityInput = document.getElementById('droneCapacity');
const algorithmSelect = document.getElementById('algorithm');
const addMedicineBtn = document.getElementById('addMedicine');
const optimizeDeliveryBtn = document.getElementById('optimizeDelivery');
const resultsContainer = document.getElementById('resultsContainer');

// Initialize tab functionality
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(`${tabId}Tab`).classList.add('active');
    });
});

// Add medicine to the list
addMedicineBtn.addEventListener('click', () => {
    const name = medicineNameInput.value.trim();
    const weight = parseFloat(medicineWeightInput.value);
    const value = parseInt(medicineValueInput.value);
    
    // Validate inputs
    if (!name) {
        alert('Please enter a medicine name');
        return;
    }
    
    if (isNaN(weight) || weight <= 0) {
        alert('Please enter a valid weight');
        return;
    }
    
    if (isNaN(value) || value < 1 || value > 100) {
        alert('Please enter a valid value between 1 and 100');
        return;
    }
    
    if (!selectedLocation) {
        alert('Please select a delivery location on the map');
        return;
    }
    
    // Add medicine to the list
    const medicine = {
        name,
        weight,
        value,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
    };
    
    medicines.push(medicine);
    totalWeight += weight;
    
    // Update UI
    updateMedicineList();
    
    // Reset form
    medicineNameInput.value = '';
    medicineWeightInput.value = '';
    medicineValueInput.value = '';
    locationStatusSpan.textContent = 'Click on map to select';
    selectedLocation = null;
    
    // Remove temporary marker
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
});

// Update the medicine list display
function updateMedicineList() {
    medicineList.innerHTML = '';
    totalWeightSpan.textContent = `Total Weight: ${totalWeight.toFixed(2)} kg`;
    
    medicines.forEach((medicine, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${medicine.name}</strong> - ${medicine.weight}kg (Value: ${medicine.value})
            </div>
            <button class="delete-medicine" data-index="${index}">×</button>
        `;
        medicineList.appendChild(li);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-medicine').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            totalWeight -= medicines[index].weight;
            medicines.splice(index, 1);
            updateMedicineList();
        });
    });
}

// Optimize delivery route
optimizeDeliveryBtn.addEventListener('click', async () => {
    // Validate inputs
    if (medicines.length === 0) {
        alert('Please add at least one medicine');
        return;
    }
    
    const droneCapacity = parseFloat(droneCapacityInput.value);
    if (isNaN(droneCapacity) || droneCapacity <= 0) {
        alert('Please enter a valid drone capacity');
        return;
    }
    
    // Show loading spinner
    resultsContainer.innerHTML = '<div class="spinner"></div>';
    resultsContainer.classList.remove('hidden');
    
    // Prepare data for backend
    const data = {
        medicines,
        droneCapacity,
        algorithm: algorithmSelect.value
    };
    
    try {
        // Send request to backend
        const response = await fetch('/optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        
        // Show results
        displayResults(result);
        
        // Visualize route on map
        visualizeRoute(result.route);
        
    } catch (error) {
        console.error('Error optimizing delivery:', error);
        alert('An error occurred while optimizing the delivery route');
        resultsContainer.classList.add('hidden');
    }
});

// Display optimization results
function displayResults(result) {
    // Reset results container
    resultsContainer.innerHTML = `
        <h2>Optimization Results</h2>
        
        <div class="results-tabs">
            <button class="tab-btn active" data-tab="route">Delivery Route</button>
            <button class="tab-btn" data-tab="comparison">Algorithm Comparison</button>
            <button class="tab-btn" data-tab="details">Medicine Details</button>
        </div>
        
        <div id="routeTab" class="tab-content active">
            <h3>Optimized Delivery Route</h3>
            <div id="routeDetails">
                <p>Total Distance: <span id="totalDistance">${result.total_distance.toFixed(2)}</span> km</p>
                <div id="routeList">
                    <ol>
                        ${result.route.map(loc => `<li>${loc.name}</li>`).join('')}
                    </ol>
                </div>
            </div>
        </div>
        
        <div id="comparisonTab" class="tab-content">
            <h3>Algorithm Performance Comparison</h3>
            <div class="chart-container">
                <img id="comparisonChart" src="data:image/png;base64,${result.chart_image}" alt="Algorithm Comparison Chart">
            </div>
            <table id="comparisonTable">
                <thead>
                    <tr>
                        <th>Algorithm</th>
                        <th>Distance (km)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>TSP</td>
                        <td id="tspDistance">${result.comparison.tsp.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Prim's Algorithm</td>
                        <td id="primsDistance">${result.comparison.prims.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Kruskal's Algorithm</td>
                        <td id="kruskalsDistance">${result.comparison.kruskals.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div id="detailsTab" class="tab-content">
            <h3>Selected Medicine Details</h3>
            <p>Total Value: <span id="totalValue">${result.total_value.toFixed(2)}</span></p>
            <table id="selectedMedicinesTable">
                <thead>
                    <tr>
                        <th>Medicine</th>
                        <th>Weight (kg)</th>
                        <th>Value</th>
                        <th>Fraction Selected</th>
                    </tr>
                </thead>
                <tbody id="selectedMedicinesBody">
                    ${result.selected_medicines.map(med => `
                        <tr>
                            <td>${med.name}</td>
                            <td>${med.weight}</td>
                            <td>${med.value}</td>
                            <td>${(med.selected_fraction * 100).toFixed(2)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // Reinitialize tab functionality
    const newTabButtons = document.querySelectorAll('.tab-btn');
    const newTabContents = document.querySelectorAll('.tab-content');
    
    newTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            newTabButtons.forEach(btn => btn.classList.remove('active'));
            newTabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

// Initialize medicine list display
updateMedicineList();