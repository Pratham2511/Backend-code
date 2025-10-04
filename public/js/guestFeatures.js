// Function to set up guest restrictions
function setupGuestRestrictions() {
  // Hide features not available for guests
  const restrictedElements = [
    '.add-city-from-map',      // Map city selection
    '.save-preferences',        // Save user preferences
    '.detailed-analysis',       // Detailed city analysis
    '.export-data'             // Data export feature
  ];

  restrictedElements.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.style.display = 'none';
      // If it's a button/input, disable it
      if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
        el.disabled = true;
      }
    });
  });

  // Add guest badge to navbar
  const navbarBrand = document.querySelector('.navbar-brand');
  const guestBadge = document.createElement('span');
  guestBadge.className = 'badge bg-warning text-dark ms-2';
  guestBadge.textContent = 'Guest';
  navbarBrand.appendChild(guestBadge);

  // Add upgrade prompt
  const mainContent = document.querySelector('.main-content');
  const upgradePrompt = document.createElement('div');
  upgradePrompt.className = 'alert alert-info alert-dismissible fade show mb-3';
  upgradePrompt.innerHTML = `
    <strong>Welcome Guest!</strong> Create an account to unlock all features.
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    <div class="mt-2">
      <a href="/" class="btn btn-primary btn-sm">Register Now</a>
    </div>
  `;
  mainContent.insertBefore(upgradePrompt, mainContent.firstChild);

  // Modify the city refresh interval for guests
  if (typeof window.refreshInterval !== 'undefined') {
    clearInterval(window.refreshInterval);
  }
  window.refreshInterval = setInterval(refreshData, 300000); // 5 minutes for guests
}

// Add headers for API requests based on user type
function getRequestHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };

  const userType = localStorage.getItem('userType');
  const token = localStorage.getItem('token');

  if (userType === 'guest') {
    headers['User-Type'] = 'guest';
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// Modify the fetchData function to use appropriate headers
async function fetchData(endpoint) {
  try {
    const response = await fetch(endpoint, {
      headers: getRequestHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    showNotification('Error fetching data', 'error');
    return null;
  }
}

// Modify API calls to include headers
async function refreshData() {
  try {
    const cities = JSON.parse(localStorage.getItem('trackedCities') || '[]');
    const headers = getRequestHeaders();
    
    for (const city of cities) {
      const response = await fetch(`/api/pollution/latest?city=${encodeURIComponent(city)}`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        updateCityData(city, data.latestReading);
      }
    }
  } catch (error) {
    console.error('Error refreshing data:', error);
    showNotification('Error updating pollution data', 'error');
  }
}

// Modify addCity function for guest restrictions
async function addCity(city, fromMap = false) {
  const userType = localStorage.getItem('userType');
  
  // Prevent map selection for guests
  if (userType === 'guest' && fromMap) {
    showNotification('Please register to add cities from the map', 'warning');
    return;
  }

  const trackedCities = JSON.parse(localStorage.getItem('trackedCities') || '[]');
  
  // Limit number of cities for guests
  if (userType === 'guest' && trackedCities.length >= 3) {
    showNotification('Guests can only track up to 3 cities. Please register for unlimited tracking.', 'warning');
    return;
  }

  if (trackedCities.includes(city)) {
    showNotification('City is already being tracked', 'warning');
    return;
  }

  trackedCities.push(city);
  localStorage.setItem('trackedCities', JSON.stringify(trackedCities));
  await loadCityData(city);
  updateCityCount();
}