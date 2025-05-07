
// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeAgeDropdown();
  setupEventListeners();
});

// Populate age selection dropdown with options 18-100
function initializeAgeDropdown() {
  const ageSelect = document.getElementById('ageInput');
  // Generate age options dynamically
  for (let i = 18; i <= 100; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      ageSelect.appendChild(option);
  }
}

// Set up event listeners for interactive elements
function setupEventListeners() {
  // Save button click handler
  document.getElementById('savebtn').addEventListener('click', saveUserInfo);
  // Image upload change handler
  document.getElementById('fileInput').addEventListener('change', handleImageUpload);
}

// Enable form editing mode
function editUserInfo() {
  const fields = document.getElementById('personalInfoFields');
  fields.disabled = false; // Remove disabled state
  document.getElementById('savebtn').style.display = 'inline-block';
}

// Handle profile data submission
async function saveUserInfo() {
  // Collect form data
  const userData = {
      name: document.getElementById('nameInput').value,
      about: document.getElementById('aboutMeInput').value,
      location: document.getElementById('locationInput').value,
      age: document.getElementById('ageInput').value,
      gender: document.querySelector('input[name="gender"]:checked')?.value,
      profileImage: document.getElementById('uploadPhoto').src
  };

  // Validate before submission
  if (!validateForm(userData)) return;

  try {
      // Send PUT request to update profile
      const response = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(userData)
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      // Success handling
      showMessage('Profile updated successfully!', 'success');
      document.getElementById('personalInfoFields').disabled = true;
  } catch (error) {
      // Error handling
      showMessage(error.message, 'error');
  }
}

// Handle image file upload and preview
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Read and display image file
  const reader = new FileReader();
  reader.onload = (e) => {
      document.getElementById('uploadPhoto').src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Validate form input fields
function validateForm(data) {
  // Check required fields
  if (!data.name?.trim()) {
      showMessage('Name is required', 'error');
      return false;
  }
  // Validate age range
  if (data.age < 18 || data.age > 100) {
      showMessage('Please select a valid age', 'error');
      return false;
  }
  return true;
}

// Display temporary status messages
function showMessage(message, type) {
  const messageDiv = document.getElementById('saveMessage');
  messageDiv.textContent = message;
  // Apply appropriate styling based on message type
  messageDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
  messageDiv.style.display = 'block';

  // Auto-hide message after 3 seconds
  setTimeout(() => {
      messageDiv.style.display = 'none';
  }, 3000);
}