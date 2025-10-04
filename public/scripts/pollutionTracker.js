// Global variables
let trackedCities = [];
let allCities = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Check user type
  const userType = localStorage.getItem('userType');
  updateUserProfile(userType);
  setupFeatureRestrictions(userType);
  
  // Load cities
  loadCities();
  
  // Load city count
  loadCityCount();
  
  // Initialize with Delhi if no cities are tracked
  if (trackedCities.length === 0) {
    setTimeout(() => {
      const delhi = allCities.find(city => city.name === 'Delhi');
      if (delhi) {
        trackedCities.push(delhi);
        addCityCard(delhi);
        updateCityAnalysis();
        updateCompareDropdowns();
      }
    }, 1000);
  }
});

// Load city count from database
async function loadCityCount() {
  try {
    const response = await fetch('/api/cities/count');
    const data = await response.json();
    document.getElementById('cityCount').textContent = data.count;
  } catch (error) {
    console.error('Error loading city count:', error);
    document.getElementById('cityCount').textContent = '--';
  }
}

// Load all cities from database
async function loadCities() {
  try {
    const response = await fetch('/api/cities');
    allCities = await response.json();
  } catch (error) {
    console.error('Error loading cities:', error);
  }
}

// Add random city to tracker
function addRandomCity() {
  // Filter out cities that are already being tracked
  const availableCities = allCities.filter(city => 
    !trackedCities.some(tc => tc.name === city.name)
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
  
  // Update analysis section
  updateCityAnalysis();
  
  // Update compare dropdowns
  updateCompareDropdowns();
}

// Refresh all cities data
async function refreshAllCitiesData() {
  if (trackedCities.length === 0) {
    showNotification('No cities to refresh!', 'warning');
    return;
  }
  
  showNotification('Refreshing all city data...', 'info');
  
  try {
    // Call backend to refresh data
    await fetch('/api/refresh-data', { method: 'POST' });
    
    // Reload cities data
    const response = await fetch('/api/cities');
    allCities = await response.json();
    
    // Update tracked cities with fresh data
    const cityNames = trackedCities.map(city => city.name);
    trackedCities = allCities.filter(city => cityNames.includes(city.name));
    
    // Clear and rebuild city cards
    document.getElementById('pollutionCards').innerHTML = '';
    trackedCities.forEach(city => addCityCard(city));
    
    showNotification('All city data refreshed!', 'success');
    updateLastUpdatedTime();
    
    // Update analysis section
    updateCityAnalysis();
  } catch (error) {
    console.error('Error refreshing data:', error);
    showNotification('Failed to refresh data. Please try again.', 'danger');
  }
}

// Update city analysis section
function updateCityAnalysis() {
  if (trackedCities.length === 0) {
    document.getElementById('mostPollutedCity').textContent = '--';
    document.getElementById('mostPollutedAQI').textContent = '--';
    document.getElementById('leastPollutedCity').textContent = '--';
    document.getElementById('leastPollutedAQI').textContent = '--';
    return;
  }
  
  // Find most polluted city
  const mostPolluted = trackedCities.reduce((prev, current) => 
    (prev.aqi > current.aqi) ? prev : current
  );
  
  // Find least polluted city
  const leastPolluted = trackedCities.reduce((prev, current) => 
    (prev.aqi < current.aqi) ? prev : current
  );
  
  // Update UI
  document.getElementById('mostPollutedCity').textContent = mostPolluted.name;
  document.getElementById('mostPollutedAQI').textContent = mostPolluted.aqi;
  document.getElementById('leastPollutedCity').textContent = leastPolluted.name;
  document.getElementById('leastPollutedAQI').textContent = leastPolluted.aqi;
}

// Update user profile UI
function updateUserProfile(userType) {
  const userProfileSection = document.getElementById('userProfileSection');
  const userName = userType === 'guest' ? 'Guest User' : (JSON.parse(localStorage.getItem('user') || '{}').name || 'User');
  
  userProfileSection.innerHTML = `
    <div class="dropdown">
      <button class="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
        <i class="bi bi-person-circle me-1"></i> ${userName}
        ${userType === 'guest' ? '<span class="badge bg-warning ms-1">Guest</span>' : ''}
      </button>
      <ul class="dropdown-menu dropdown-menu-end">
        ${userType === 'guest' ? `
          <li><a class="dropdown-item text-primary" href="landing.html">
            <i class="bi bi-person-plus me-1"></i> Register Account
          </a></li>
        ` : ''}
        <li><a class="dropdown-item text-danger" href="#" onclick="logout()">
          <i class="bi bi-box-arrow-right me-1"></i> Logout
        </a></li>
      </ul>
    </div>
  `;
}

// Set up feature restrictions for guest users
function setupFeatureRestrictions(userType) {
  if (userType === 'guest') {
    // Disable "Add City" button
    const addCityBtn = document.querySelector('button[onclick="addRandomCity()"]');
    if (addCityBtn) {
      addCityBtn.disabled = true;
      addCityBtn.setAttribute('title', 'Register to add cities');
    }
    
    // Disable "City Analysis" tab
    const analysisTab = document.getElementById('analysis-tab');
    if (analysisTab) {
      analysisTab.classList.add('disabled');
      analysisTab.setAttribute('title', 'Register to access city analysis');
    }
    
    // Disable "Compare" detailed analysis
    const compareBtn = document.querySelector('button[onclick="compareCities()"]');
    if (compareBtn) {
      compareBtn.disabled = true;
      compareBtn.setAttribute('title', 'Register to compare cities');
    }
    
    // Add warning banner
    const mainTabsContent = document.getElementById('mainTabsContent');
    if (mainTabsContent) {
      const warningBanner = document.createElement('div');
      warningBanner.className = 'alert alert-warning alert-dismissible fade show mb-3';
      warningBanner.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        You are using a guest account with limited features. 
        <a href="landing.html" class="alert-link">Register now</a> to access all features.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      mainTabsContent.prepend(warningBanner);
    }
  }
}

// Update compare section dropdowns
function updateCompareDropdowns() {
  const city1Select = document.getElementById('city1Select');
  const city2Select = document.getElementById('city2Select');
  
  if (!city1Select || !city2Select) return;
  
  // Clear existing options
  city1Select.innerHTML = '<option value="">Select first city</option>';
  city2Select.innerHTML = '<option value="">Select second city</option>';
  
  // Add tracked cities to dropdowns
  trackedCities.forEach(city => {
    city1Select.innerHTML += `<option value="${city.name}">${city.name}</option>`;
    city2Select.innerHTML += `<option value="${city.name}">${city.name}</option>`;
  });
}

// Add city card to the UI
function addCityCard(city) {
  const pollutionCards = document.getElementById('pollutionCards');
  const card = document.createElement('div');
  card.className = 'card city-card h-100';
  card.id = `city-${city.name.replace(/\s+/g, '-').toLowerCase()}`;
  
  // Determine AQI status and color
  let aqiStatus, aqiClass;
  if (city.aqi <= 50) {
    aqiStatus = 'Good';
    aqiClass = 'aqi-good';
  } else if (city.aqi <= 100) {
    aqiStatus = 'Moderate';
    aqiClass = 'aqi-moderate';
  } else if (city.aqi <= 150) {
    aqiStatus = 'Unhealthy for Sensitive Groups';
    aqiClass = 'aqi-unhealthy-sensitive';
  } else if (city.aqi <= 200) {
    aqiStatus = 'Unhealthy';
    aqiClass = 'aqi-unhealthy';
  } else if (city.aqi <= 300) {
    aqiStatus = 'Very Unhealthy';
    aqiClass = 'aqi-very-unhealthy';
  } else {
    aqiStatus = 'Hazardous';
    aqiClass = 'aqi-hazardous';
  }
  
  card.innerHTML = `
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="card-title mb-0">${city.name}</h5>
        <div class="aqi-badge ${aqiClass} text-white">${city.aqi}</div>
      </div>
      <p class="card-text"><strong>Status:</strong> ${aqiStatus}</p>
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

// Remove city from tracker
function removeCity(cityName) {
  trackedCities = trackedCities.filter(city => city.name !== cityName);
  
  const cardId = `city-${cityName.replace(/\s+/g, '-').toLowerCase()}`;
  const card = document.getElementById(cardId);
  if (card) {
    card.remove();
  }
  
  showNotification(`Removed ${cityName} from tracker!`, 'info');
  
  // Update analysis section
  updateCityAnalysis();
  
  // Update compare dropdowns
  updateCompareDropdowns();
}

// Clear all cities
function clearAllCities() {
  if (trackedCities.length === 0) {
    showNotification('No cities to clear!', 'warning');
    return;
  }
  
  if (confirm('Are you sure you want to remove all tracked cities?')) {
    trackedCities = [];
    document.getElementById('pollutionCards').innerHTML = '';
    showNotification('All cities removed!', 'warning');
    
    // Update analysis section
    updateCityAnalysis();
    
    // Update compare dropdowns
    updateCompareDropdowns();
  }
}

// Refresh data for a single city
function refreshCityData(cityName) {
  // For now, we'll just show a notification
  showNotification(`Refreshing data for ${cityName}...`, 'info');
  
  // In a real implementation, you would fetch updated data for this city
  // For demo purposes, we'll just update the UI with a random value
  const cityIndex = trackedCities.findIndex(city => city.name === cityName);
  if (cityIndex !== -1) {
    // Generate random pollution data
    trackedCities[cityIndex] = {
      ...trackedCities[cityIndex],
      aqi: Math.floor(Math.random() * 300) + 50,
      pm25: Math.floor(Math.random() * 100) + 20,
      pm10: Math.floor(Math.random() * 150) + 30
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
    
    // Update analysis section
    updateCityAnalysis();
  }
}

// View city analysis
function viewCityAnalysis(cityName) {
  const userType = localStorage.getItem('userType');
  if (userType === 'guest') {
    showNotification('Please register to access city analysis', 'warning');
    return;
  }
  
  const city = trackedCities.find(c => c.name === cityName);
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
  
  // Update weather data
  document.getElementById('temperature').textContent = `${Math.round(20 + Math.random() * 15)}°C`;
  document.getElementById('humidity').textContent = `${Math.round(40 + Math.random() * 40)}%`;
  document.getElementById('windSpeed').textContent = `${Math.round(5 + Math.random() * 20)} km/h`;
  
  showNotification(`Showing analysis for ${cityName}`, 'info');
}

// Update health impact card
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

// Show all cities analysis
function showAllCitiesAnalysis() {
  document.getElementById('analysisCityName').textContent = 'All Cities Analysis';
  document.getElementById('singleCityPollutants').style.display = 'none';
  document.getElementById('allCitiesPollutants').style.display = 'block';
  showNotification('Showing all cities analysis', 'info');
}

// Compare cities
function compareCities() {
  const userType = localStorage.getItem('userType');
  if (userType === 'guest') {
    showNotification('Please register to compare cities', 'warning');
    return;
  }
  
  const city1 = document.getElementById('city1Select').value;
  const city2 = document.getElementById('city2Select').value;
  if (city1 && city2) {
    showNotification(`Comparing ${city1} and ${city2}...`, 'info');
    // Implementation would go here
  } else {
    showNotification('Please select two cities to compare', 'warning');
  }
}

// Update last updated time
function updateLastUpdatedTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  const updateTimeElement = document.getElementById('updateTime');
  if (updateTimeElement) {
    updateTimeElement.textContent = timeString;
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) return;
  
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show`;
  notification.setAttribute('role', 'alert');
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  notificationContainer.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 150);
  }, 3000);
}

// Logout
function logout() {
  localStorage.removeItem('userType');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = 'landing.html';
}
