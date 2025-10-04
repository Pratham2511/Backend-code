// City tracking and pollution data management
let trackedCities = [];

// Add a random city from the available cities
function addRandomCity() {
    // Filter out cities that are already being tracked
    const availableCities = cities.filter(city => 
        !trackedCities.some(tracked => tracked.name === city.name)
    );
    
    if (availableCities.length === 0) {
        showNotification('All cities are already being tracked!', 'warning');
        return;
    }
    
    const randomCity = availableCities[Math.floor(Math.random() * availableCities.length)];
    trackedCities.push(randomCity);
    
    addCityCard(randomCity);
    showNotification(`Added ${randomCity.name} to tracker!`, 'success');
    updateLastUpdatedTime();
}

// Add a city card to the tracker
function addCityCard(city) {
    const pollutionCards = document.getElementById('pollutionCards');
    const card = document.createElement('div');
    card.className = 'card city-card h-100';
    card.id = `city-${city.name.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Determine AQI status and color based on AQI value
    const { status, colorClass } = getAQIStatus(city.aqi);
    
    card.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="card-title mb-0">${city.name}</h5>
                <div class="aqi-badge ${colorClass} text-white">${city.aqi}</div>
            </div>
            <p class="card-text"><strong>Status:</strong> ${status}</p>
            <p class="card-text"><strong>PM2.5:</strong> ${city.pm25} µg/m³</p>
            <p class="card-text"><strong>PM10:</strong> ${city.pm10} µg/m³</p>
            <div class="d-flex gap-2 mt-3">
                <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="refreshCityData('${city.name}')">
                    <i class="bi bi-arrow-clockwise me-1"></i> Refresh
                </button>
                <button class="btn btn-sm btn-primary flex-grow-1" onclick="viewCityAnalysis('${city.name}')">
                    <i class="bi bi-graph-up me-1"></i> Analysis
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="removeCity('${city.name}')">
                    <i class="bi bi-trash me-1"></i>
                </button>
            </div>
        </div>
    `;
    
    pollutionCards.appendChild(card);
}

// Get AQI status and corresponding color class
function getAQIStatus(aqi) {
    if (aqi <= 50) {
        return { 
            status: 'Good',
            colorClass: 'aqi-good'
        };
    } else if (aqi <= 100) {
        return {
            status: 'Moderate',
            colorClass: 'aqi-moderate'
        };
    } else if (aqi <= 150) {
        return {
            status: 'Unhealthy for Sensitive Groups',
            colorClass: 'aqi-unhealthy-sensitive'
        };
    } else if (aqi <= 200) {
        return {
            status: 'Unhealthy',
            colorClass: 'aqi-unhealthy'
        };
    } else if (aqi <= 300) {
        return {
            status: 'Very Unhealthy',
            colorClass: 'aqi-very-unhealthy'
        };
    } else {
        return {
            status: 'Hazardous',
            colorClass: 'aqi-hazardous'
        };
    }
}

// Refresh data for a specific city
function refreshCityData(cityName) {
    const cityIndex = trackedCities.findIndex(city => city.name === cityName);
    if (cityIndex !== -1) {
        // Simulate data refresh with random variations
        const originalCity = cities.find(city => city.name === cityName);
        const variationFactor = 0.2; // 20% variation

        trackedCities[cityIndex] = {
            ...originalCity,
            aqi: Math.round(originalCity.aqi * (1 + (Math.random() - 0.5) * variationFactor)),
            pm25: Math.round(originalCity.pm25 * (1 + (Math.random() - 0.5) * variationFactor)),
            pm10: Math.round(originalCity.pm10 * (1 + (Math.random() - 0.5) * variationFactor)),
            no2: Math.round(originalCity.no2 * (1 + (Math.random() - 0.5) * variationFactor)),
            so2: Math.round(originalCity.so2 * (1 + (Math.random() - 0.5) * variationFactor)),
            co: Math.round(originalCity.co * (1 + (Math.random() - 0.5) * variationFactor) * 10) / 10,
            o3: Math.round(originalCity.o3 * (1 + (Math.random() - 0.5) * variationFactor))
        };
        
        // Update the card
        const cardId = `city-${cityName.replace(/\s+/g, '-').toLowerCase()}`;
        const card = document.getElementById(cardId);
        if (card) {
            card.remove();
            addCityCard(trackedCities[cityIndex]);
        }
        
        showNotification(`Refreshed data for ${cityName}!`, 'success');
        updateLastUpdatedTime();
    }
}

// Remove a city from tracking
function removeCity(cityName) {
    trackedCities = trackedCities.filter(city => city.name !== cityName);
    
    const cardId = `city-${cityName.replace(/\s+/g, '-').toLowerCase()}`;
    const card = document.getElementById(cardId);
    if (card) {
        card.remove();
    }
    
    showNotification(`Removed ${cityName} from tracker!`, 'info');
}

// Refresh all tracked cities data
function refreshAllCitiesData() {
    if (trackedCities.length === 0) {
        showNotification('No cities to refresh!', 'warning');
        return;
    }
    
    showNotification('Refreshing all city data...', 'info');
    
    // Clear all cards
    document.getElementById('pollutionCards').innerHTML = '';
    
    // Refresh each city's data
    trackedCities.forEach(city => {
        refreshCityData(city.name);
    });
    
    showNotification('All city data refreshed!', 'success');
    updateLastUpdatedTime();
}

// Clear all tracked cities
function clearAllCities() {
    if (trackedCities.length === 0) {
        showNotification('No cities to clear!', 'warning');
        return;
    }
    
    if (confirm('Are you sure you want to remove all tracked cities?')) {
        trackedCities = [];
        document.getElementById('pollutionCards').innerHTML = '';
        showNotification('All cities removed!', 'warning');
    }
}

// Update the last updated timestamp
function updateLastUpdatedTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('updateTime').textContent = timeString;
}

// Add a city from the map
function addCityFromMap(cityName) {
    const city = cities.find(c => c.name === cityName);
    if (city && !trackedCities.some(tc => tc.name === cityName)) {
        trackedCities.push(city);
        addCityCard(city);
        showNotification(`Added ${cityName} to tracker!`, 'success');
        updateLastUpdatedTime();
    } else if (trackedCities.some(tc => tc.name === cityName)) {
        showNotification(`${cityName} is already being tracked!`, 'warning');
    }
}

// View city analysis
function viewCityAnalysis(cityName) {
    const city = cities.find(c => c.name === cityName);
    if (!city) return;

    // Switch to analysis tab
    document.getElementById('analysis-tab').click();
    
    // Update city name in analysis view
    document.getElementById('analysisCityName').textContent = `${cityName} Analysis`;
    
    // Show single city analysis view, hide all cities view
    document.getElementById('singleCityPollutants').style.display = 'block';
    document.getElementById('allCitiesPollutants').style.display = 'none';
    
    // Update health impact card
    updateHealthImpact(city.aqi);
    
    // Update weather data (simulated)
    document.getElementById('temperature').textContent = `${Math.round(20 + Math.random() * 15)}°C`;
    document.getElementById('humidity').textContent = `${Math.round(40 + Math.random() * 40)}%`;
    document.getElementById('windSpeed').textContent = `${Math.round(5 + Math.random() * 20)} km/h`;
    
    // Update pollutant chart
    updatePollutantChart(city);
    
    showNotification(`Showing analysis for ${cityName}`, 'info');
}

// Update pollutant chart
function updatePollutantChart(city) {
    const ctx = document.getElementById('cityPollutantChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.pollutantChart) {
        window.pollutantChart.destroy();
    }
    
    window.pollutantChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['PM2.5', 'PM10', 'NO2', 'SO2', 'CO', 'O3'],
            datasets: [{
                label: 'Concentration',
                data: [city.pm25, city.pm10, city.no2, city.so2, city.co, city.o3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Pollutant Concentrations'
                }
            }
        }
    });
}

// Show all cities analysis
function showAllCitiesAnalysis() {
    document.getElementById('analysisCityName').textContent = 'All Cities Analysis';
    document.getElementById('singleCityPollutants').style.display = 'none';
    document.getElementById('allCitiesPollutants').style.display = 'block';
    showNotification('Showing all cities analysis', 'info');
    
    updateAllCitiesAnalysisCharts();
}

// Update charts for all cities analysis
function updateAllCitiesAnalysisCharts() {
    const cityNames = trackedCities.map(city => city.name);
    const pm25Data = trackedCities.map(city => city.pm25);
    const pm10Data = trackedCities.map(city => city.pm10);
    const no2Data = trackedCities.map(city => city.no2);
    const o3Data = trackedCities.map(city => city.o3);
    
    createTrendChart('pm25Chart', 'PM2.5 Trends', cityNames, pm25Data);
    createTrendChart('pm10Chart', 'PM10 Trends', cityNames, pm10Data);
    createTrendChart('no2Chart', 'NO₂ Trends', cityNames, no2Data);
    createTrendChart('o3Chart', 'O₃ Trends', cityNames, o3Data);
}

// Create a trend chart
function createTrendChart(canvasId, label, labels, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Destroy existing chart if it exists
    if (window[canvasId + 'Chart']) {
        window[canvasId + 'Chart'].destroy();
    }
    
    window[canvasId + 'Chart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: getRandomColor(),
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: label
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Helper function to generate random colors for charts
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Update health impact information
function updateHealthImpact(aqi) {
    const healthCard = document.getElementById('healthImpactCard');
    const healthTitle = document.getElementById('healthTitle');
    const healthDescription = document.getElementById('healthDescription');
    
    if (aqi <= 50) {
        healthCard.className = 'health-card health-good';
        healthTitle.textContent = 'Air quality is Good';
        healthDescription.textContent = 'Air quality is satisfactory, and air pollution poses little or no risk.';
    } else if (aqi <= 100) {
        healthCard.className = 'health-card health-moderate';
        healthTitle.textContent = 'Air quality is Moderate';
        healthDescription.textContent = 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.';
    } else if (aqi <= 150) {
        healthCard.className = 'health-card health-unhealthy-sensitive';
        healthTitle.textContent = 'Unhealthy for Sensitive Groups';
        healthDescription.textContent = 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
    } else if (aqi <= 200) {
        healthCard.className = 'health-card health-unhealthy';
        healthTitle.textContent = 'Air quality is Unhealthy';
        healthDescription.textContent = 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.';
    } else if (aqi <= 300) {
        healthCard.className = 'health-card health-very-unhealthy';
        healthTitle.textContent = 'Air quality is Very Unhealthy';
        healthDescription.textContent = 'Health alert: The risk of health effects is increased for everyone.';
    } else {
        healthCard.className = 'health-card health-hazardous';
        healthTitle.textContent = 'Air quality is Hazardous';
        healthDescription.textContent = 'Health warning of emergency conditions: everyone is more likely to be affected.';
    }
}