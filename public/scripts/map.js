// Map functionality 
let map;
let markers = [];
let heatmapLayer;

function initializeMap() {
    // Initialize the map centered on India
    map = L.map('map').setView([20.5937, 78.9629], 5);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add markers for all cities
    cities.forEach(city => {
        const aqiColor = getAQIColor(city.aqi);
        const marker = L.circleMarker([city.lat, city.lon], {
            radius: 8,
            fillColor: aqiColor,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        // Create popup content
        const popupContent = `
            <div class="map-popup">
                <h6>${city.name}</h6>
                <p class="mb-1">AQI: <strong style="color: ${aqiColor}">${city.aqi}</strong></p>
                <button class="btn btn-sm btn-primary" onclick="addCityFromMap('${city.name}')">
                    Add to Tracker
                </button>
            </div>
        `;

        // Add popup to marker
        marker.bindPopup(popupContent);
        markers.push(marker);
    });

    // Initialize heatmap if enabled
    if (document.getElementById('heatmapToggle').checked) {
        initializeHeatmap();
    }

    // Add heatmap toggle event listener
    document.getElementById('heatmapToggle').addEventListener('change', function() {
        if (this.checked) {
            initializeHeatmap();
        } else {
            if (heatmapLayer) {
                map.removeLayer(heatmapLayer);
            }
        }
    });
}

function initializeHeatmap() {
    // Remove existing heatmap layer if it exists
    if (heatmapLayer) {
        map.removeLayer(heatmapLayer);
    }

    // Create heatmap data points from cities
    const heatmapData = cities.map(city => [
        city.lat,
        city.lon,
        city.aqi / 500 // Normalize AQI value for heatmap intensity
    ]);

    // Create and add heatmap layer
    heatmapLayer = L.heatLayer(heatmapData, {
        radius: 20,
        blur: 15,
        maxZoom: 10,
        gradient: {
            0.4: '#00ff00',
            0.6: '#ffff00',
            0.7: '#ff9900',
            0.8: '#ff0000',
            0.9: '#990099',
            1.0: '#660000'
        }
    }).addTo(map);
}

// Helper function to get color based on AQI value
function getAQIColor(aqi) {
    if (aqi <= 50) return '#198754';  // Good - Green
    if (aqi <= 100) return '#ffc107'; // Moderate - Yellow
    if (aqi <= 150) return '#fd7e14'; // Unhealthy for Sensitive Groups - Orange
    if (aqi <= 200) return '#dc3545'; // Unhealthy - Red
    if (aqi <= 300) return '#6f42c1'; // Very Unhealthy - Purple
    return '#721c24';                 // Hazardous - Maroon
}

function searchMapLocation() {
    const locationInput = document.getElementById('mapLocationInput');
    const location = locationInput.value;
    
    if (!location) {
        showNotification('Please enter a location to search', 'warning');
        return;
    }

    const city = cities.find(c => c.name.toLowerCase() === location.toLowerCase());
    if (city) {
        map.setView([city.lat, city.lon], 10);
        markers.forEach(marker => {
            if (marker.getLatLng().lat === city.lat && marker.getLatLng().lng === city.lon) {
                marker.openPopup();
            }
        });
        showNotification(`Found ${city.name}!`, 'success');
    } else {
        showNotification(`Location "${location}" not found. Please try another city.`, 'warning');
    }

    // Clear the search input
    locationInput.value = '';
}

// Initialize map when map tab is clicked
document.getElementById('map-tab').addEventListener('shown.bs.tab', function () {
    if (!map) {
        initializeMap();
    }
});